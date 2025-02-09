import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export interface ChatGPTTextDoc {
  id: string;
  version: number;
  content: string;
  title?: string;
  created_at: string;
  updated_at: string;
  metadata?: {
    model_slug?: string;
    shared_conversation_id?: string;
  };
}

import * as cheerio from "cheerio";
import fs from "node:fs";
import path from "node:path";
import cfCheck from "@/utils/cfCheck";
import {
  localExecutablePath,
  isDev,
  userAgent,
  remoteExecutablePath,
} from "@/utils/utils";

const chromium = require("@sparticuz/chromium-min");
const puppeteer = require("puppeteer-core");

interface Message {
  role: string;
  content: string;
}

interface ChatGPTMessage {
  id?: string;
  message: {
    author: {
      role: string;
    };
    content: {
      content_type: string;
      parts: (
        | string
        | {
            type: string;
            asset_pointer: string;
            size?: {
              width: number;
              height: number;
            };
          }
      )[];
    };
  };
  parent?: string;
  children?: string[];
}

function buildMessageChain(mapping: {
  [key: string]: ChatGPTMessage;
}): Message[] {
  const messages: Message[] = [];
  let currentId = Object.keys(mapping)[0];

  while (currentId && mapping[currentId]) {
    const currentMessage = mapping[currentId];

    if (currentMessage.message?.content?.parts?.length > 0) {
      const parts = currentMessage.message.content.parts;
      const role = currentMessage.message.author.role;

      // Convert each part to string safely
      const content = parts
        .map((part) => {
          if (typeof part === "string") {
            return part;
          }
          if (typeof part === "object" && part !== null) {
            if (part.type === "image") {
              return `[Image${
                part.size ? ` (${part.size.width}x${part.size.height})` : ""
              }]`;
            }
            return JSON.stringify(part);
          }
          return "";
        })
        .join("\n");

      messages.push({ role, content });
    }

    // Move to the next message in the chain
    const nextId = mapping[currentId].children?.[0] || "";
    currentId = nextId;
  }

  return messages;
}

export const maxDuration = 60;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

async function scrapeConversation(url: string): Promise<string> {
  const match = url.match(/\/share\/([\w-]+)/);
  if (!match) {
    throw new Error("Invalid ChatGPT share link format");
  }

  const conversationId = match[1];
  console.log("Converting conversation:", conversationId);

  const apiUrl = `https://chatgpt.com/backend-api/share/${conversationId}`;

  let browser = null;
  try {
    browser = await puppeteer.launch({
      ignoreDefaultArgs: ["--enable-automation"],
      args: isDev
        ? [
            "--disable-blink-features=AutomationControlled",
            "--disable-features=site-per-process",
            "-disable-site-isolation-trials",
          ]
        : [...chromium.args, "--disable-blink-features=AutomationControlled"],
      defaultViewport: { width: 1920, height: 1080 },
      executablePath: isDev
        ? localExecutablePath
        : await chromium.executablePath(remoteExecutablePath),
      headless: isDev ? false : "new",
      debuggingPort: isDev ? 9222 : undefined,
      timeout: 60000,
    });

    console.log("Browser launched");
    const pages = await browser.pages();
    const page = pages[0];
    await page.setUserAgent(userAgent);
    await page.setDefaultTimeout(60000);
    await page.setDefaultNavigationTimeout(60000);

    const preloadFile = fs.readFileSync(
      path.join(process.cwd(), "/utils/preload.js"),
      "utf8"
    );
    await page.evaluateOnNewDocument(preloadFile);

    console.log("Navigating to URL:", apiUrl);

    let response = null;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        await page.waitForNetworkIdle({ timeout: 10000 }).catch(() => {
          console.log("Network not completely idle, proceeding anyway");
        });

        response = await page.goto(apiUrl, {
          waitUntil: ["load", "domcontentloaded", "networkidle2"],
          timeout: 30000,
        });

        if (response && response.ok()) {
          console.log("Navigation successful");
          break;
        } else {
          throw new Error("Invalid response");
        }
      } catch (error) {
        console.error(`Navigation attempt ${retryCount + 1} failed:`, error);
        retryCount++;

        if (retryCount === maxRetries) {
          throw new Error("Failed to navigate after maximum retries");
        }

        await new Promise((resolve) => setTimeout(resolve, 5000));
        await page.setCacheEnabled(false);
        const client = await page.target().createCDPSession();
        await client.send("Network.clearBrowserCookies");
        await client.send("Network.clearBrowserCache");

        console.log("Retrying navigation...");
      }
    }

    await cfCheck(page);
    console.log("Navigation complete");

    const responseText = await response?.text();
    //   console.log('Raw response:', responseText);

    const jsonContent = JSON.parse(responseText || "{}");
    //   console.log('Parsed JSON:', jsonContent);

    // Extract data from the nested structure
    const data = jsonContent.data || jsonContent;

    if (!data?.mapping) {
      console.error("Invalid data structure:", data);
      return (
        "Invalid conversation data: missing mapping" 
      );
    }

    const messages = buildMessageChain(data.mapping);
    //   console.log('Built message chain:', messages);

    // Convert to markdown format
    const lines: string[] = [];
    lines.push(`# ${data.title || "Untitled Conversation"}\n`);

    for (const message of messages) {
      const role = message.role === "assistant" ? "ChatGPT" : "User";
      lines.push(`## ${role}\n`);
      lines.push(message.content);
      lines.push(""); // Empty line for spacing
    }

    const markdown = lines.join("\n");
    console.log("Generated markdown length:", markdown.length);
    return markdown;
  } finally {
    if (browser) {
      await browser?.close();
    }
  }
}

async function scrapeCanvas(url: string): Promise<string> {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      ignoreDefaultArgs: ["--enable-automation"],
      args: isDev
        ? [
            "--disable-blink-features=AutomationControlled",
            "--disable-features=site-per-process",
            "-disable-site-isolation-trials",
          ]
        : [...chromium.args, "--disable-blink-features=AutomationControlled"],
      defaultViewport: { width: 1920, height: 1080 },
      executablePath: isDev
        ? localExecutablePath
        : await chromium.executablePath(remoteExecutablePath),
      headless: isDev ? false : "new",
      debuggingPort: isDev ? 9222 : undefined,
      timeout: 60000,
    });

    console.log("Browser launched");
    const pages = await browser.pages();
    const page = pages[0];
    await page.setUserAgent(userAgent);
    await page.setDefaultTimeout(60000);
    await page.setDefaultNavigationTimeout(60000);

    const preloadFile = fs.readFileSync(
      path.join(process.cwd(), "/utils/preload.js"),
      "utf8"
    );
    await page.evaluateOnNewDocument(preloadFile);

    console.log("Navigating to URL:", url);

    let response = null;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        await page.waitForNetworkIdle({ timeout: 10000 }).catch(() => {
          console.log("Network not completely idle, proceeding anyway");
        });

        response = await page.goto(url, {
          waitUntil: ["load", "domcontentloaded", "networkidle2"],
          timeout: 30000,
        });

        if (response && response.ok()) {
          console.log("Navigation successful");
          break;
        } else {
          throw new Error("Invalid response");
        }
      } catch (error) {
        console.error(`Navigation attempt ${retryCount + 1} failed:`, error);
        retryCount++;

        if (retryCount === maxRetries) {
          throw new Error("Failed to navigate after maximum retries");
        }

        await new Promise((resolve) => setTimeout(resolve, 5000));
        await page.setCacheEnabled(false);
        const client = await page.target().createCDPSession();
        await client.send("Network.clearBrowserCookies");
        await client.send("Network.clearBrowserCache");

        console.log("Retrying navigation...");
      }
    }

    await cfCheck(page);
    console.log("Navigation complete");

    await page.waitForSelector('div[class*="markdown prose"]', {
      timeout: 10000,
    });

    const title = await page.evaluate(() => {
      const element = document.querySelector('h1');
      return element ? element.innerHTML : null;
    });

    const content = await page.evaluate(() => {
      const element = document.querySelector('div[class*="markdown prose"]');
      return element ? element.innerHTML : null;
    });

    if (!content) {
      throw new Error("No content found in the canvas");
    }

    let markdown = content
      .replace(/<h1.*?>(.*?)<\/h1>/g, "# $1\n\n")
      .replace(/<h2.*?>(.*?)<\/h2>/g, "## $1\n\n")
      .replace(/<h3.*?>(.*?)<\/h3>/g, "### $1\n\n")
      .replace(/<p.*?>(.*?)<\/p>/g, "$1\n\n")
      .replace(/<br\s*\/?>/g, "\n")
      .replace(/<code.*?>(.*?)<\/code>/g, "`$1`")
      .replace(/<pre.*?>(.*?)<\/pre>/g, "```\n$1\n```")
      .replace(/<.*?>/g, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/\n\s*\n\s*\n/g, "\n\n")
      .trim();

    markdown = '# ' + (title || 'Untitled Canvas') + '\n\n' + markdown;

    return markdown;
  } finally {
    if (browser) {
      await browser?.close();
    }
  }
}

export async function POST(request: Request) {
  console.log("Received POST request");
  console.log("isDev:", isDev);
  console.log("localExecutablePath:", localExecutablePath);
  console.log("remoteExecutablePath:", remoteExecutablePath);

  try {
    let { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "ChatGPT share link is required" },
        { status: 400 }
      );
    }

    let markdown: string;

    try {
      if (url.includes("chatgpt.com/canvas/shared")) {
        markdown = await scrapeCanvas(url);
      } else if (
        url.includes("chat.openai.com/share") ||
        url.includes("chatgpt.com/share")
      ) {
        markdown = await scrapeConversation(url);
      } else {
        return NextResponse.json(
          { error: "Invalid ChatGPT share link format" },
          { status: 400 }
        );
      }

      return NextResponse.json({ content: markdown });
    } catch (conversionError) {
      console.error("Conversion error:", conversionError);
      const errorMessage =
        conversionError instanceof Error
          ? conversionError.message
          : "Unknown error occurred";

      // Check for specific error cases
      if (errorMessage.includes("no longer accessible")) {
        return NextResponse.json(
          {
            error:
              "This conversation is no longer available. The share link might have expired.",
          },
          { status: 404 }
        );
      }

      throw conversionError; // Re-throw to be caught by outer try-catch
    }
  } catch (error) {
    console.error("Request error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process request",
      },
      { status: 500 }
    );
  }
}
