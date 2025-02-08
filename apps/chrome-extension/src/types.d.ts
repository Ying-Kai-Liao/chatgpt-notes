/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ChromeTab {
  id?: number;
  url?: string;
}

export interface ChromeQueryInfo {
  active?: boolean;
  currentWindow?: boolean;
}

export interface ChromeTabs {
  query(queryInfo: ChromeQueryInfo): Promise<ChromeTab[]>;
}

export interface RequestDetails {
  url: string;
  method: string;
  requestHeaders?: { name: string; value: string }[];
}

export interface WebRequestListener {
  addListener: (
    callback: (details: RequestDetails) => void,
    filter: { urls: string[] },
    extraInfoSpec: string[]
  ) => void;
  removeListener: (
    callback: (details: RequestDetails) => void
  ) => void;
}

export interface MessageListener {
  addListener: (
    callback: (
      message: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => void | boolean
  ) => void;
  removeListener: (
    callback: (
      message: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => void
  ) => void;
}

export interface ChromeRuntime {
  sendMessage: (
    message: any,
    responseCallback?: (response: any) => void
  ) => void;
  onMessage: MessageListener;
}

export interface Chrome {
  tabs: ChromeTabs;
  webRequest: {
    onBeforeSendHeaders: WebRequestListener;
  };
  runtime: ChromeRuntime;
}

declare global {
  interface Window {
    chrome: Chrome;
  }
}

export {};
