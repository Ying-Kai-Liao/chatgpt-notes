"use client";

import React, { useEffect, useRef, useState, memo } from "react";
import mermaid from "mermaid";
import { Download, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";

// Initialize mermaid with specific config
mermaid.initialize({
  startOnLoad: false,
  theme: "neutral",
  securityLevel: "loose",
  fontFamily: "monospace",
  flowchart: {
    htmlLabels: true,
    curve: "basis",
    padding: 15,
    nodeSpacing: 50,
    rankSpacing: 80,
    diagramPadding: 8,
    useMaxWidth: true,
  },
  themeVariables: {
    primaryColor: "#E9D5FF",
    primaryTextColor: "#000000",
    primaryBorderColor: "#4B5563",
    lineColor: "#4B5563",
    secondaryColor: "#F3E8FF",
    tertiaryColor: "#FFFFFF",
    fontSize: "14px",
    nodeBorder: "#4B5563",
    clusterBkg: "#F3E8FF",
    clusterBorder: "#4B5563",
    labelBackground: "#F3E8FF",
  },
});

interface MermaidRendererProps {
  chart: string;
}

const MermaidRenderer: React.FC<MermaidRendererProps> = memo(({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const absoluteContainerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  const adjustScale = (delta: number) => {
    setScale((prev) => {
      const newScale = prev + delta;
      const finalScale = Math.min(Math.max(0.1, newScale), 4);
      
      // Center after scale change, especially important for small scales
      setTimeout(() => {
        if (absoluteContainerRef.current && containerRef.current) {
          const container = absoluteContainerRef.current;
          const content = containerRef.current;
          const svg = content.querySelector('svg');
          if (svg) {
            const svgRect = svg.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            // For small scales, ensure we can see the entire diagram
            if (finalScale < 1) {
              const scrollX = Math.max(0, (svgRect.width * finalScale - containerRect.width) / 2);
              container.scrollLeft = scrollX;
            }
          }
        }
      }, 50);

      return finalScale;
    });
  };

  const fitToView = () => {
    if (containerRef.current && absoluteContainerRef.current) {
      const container = absoluteContainerRef.current;
      const svg = container.querySelector('svg');
      if (svg) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const svgWidth = svg.getBoundingClientRect().width / scale;
        const svgHeight = svg.getBoundingClientRect().height / scale;
        
        const scaleX = containerWidth / svgWidth;
        const scaleY = containerHeight / svgHeight;
        const newScale = Math.min(scaleX, scaleY, 2) * 0.96;
        
        setScale(Math.max(0.1, newScale));

        // Center after fitting
        setTimeout(() => {
          if (container && containerRef.current) {
            const contentRect = containerRef.current.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const scrollX = (contentRect.width - containerRect.width) / 2;
            container.scrollLeft = scrollX;
          }
        }, 50);
      }
    }
  };

  useEffect(() => {
    const renderDiagram = async () => {
      try {
        setRenderError(null);
        const id = `mermaid-${Math.random().toString(36).substring(2, 10)}`;
        const { svg } = await mermaid.render(id, chart);
        setSvgContent(svg);
        // Add a small delay to ensure the SVG is in the DOM
        setTimeout(() => {
          fitToView();
          if (absoluteContainerRef.current && containerRef.current) {
            const container = absoluteContainerRef.current;
            const content = containerRef.current;
            const contentRect = content.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const scrollX = (contentRect.width - containerRect.width) / 2;
            container.scrollLeft = scrollX;
          }
        }, 100);
      } catch (error) {
        console.error("Mermaid rendering error:", error);
        setRenderError(
          error instanceof Error ? error.message : "Error rendering diagram"
        );
      }
    };

    renderDiagram();
  }, [chart]);

  // Apply styles to SVG whenever content changes
  useEffect(() => {
    if (!containerRef.current || !svgContent) return;

    containerRef.current.innerHTML = svgContent;
    const svgElement = containerRef.current.querySelector("svg");

    if (svgElement) {
      svgElement.style.backgroundColor = "#FFFFFF";
      svgElement.style.borderRadius = "0.5rem";
      svgElement.style.padding = "1.5rem";
      svgElement.style.width = "100%";
      svgElement.style.maxWidth = "100%";
      svgElement.style.height = "auto";
      svgElement.setAttribute("preserveAspectRatio", "xMinYMin meet");

      // Adjust styles for subgraphs and labels
      const clusters = containerRef.current.querySelectorAll(".cluster");
      clusters.forEach((cluster) => {
        if (cluster instanceof HTMLElement) {
          cluster.style.padding = "1rem";
          cluster.style.margin = "0.5rem 0";
        }
      });

      const labels = containerRef.current.querySelectorAll(
        ".label, .nodeLabel, .edgeLabel"
      );
      labels.forEach((label) => {
        if (label instanceof HTMLElement) {
          label.style.whiteSpace = "pre-wrap";
          label.style.maxWidth = "150px";
          label.style.wordBreak = "break-word";
          label.style.lineHeight = "1.3";
        }
      });

      const clusterLabels = containerRef.current.querySelectorAll(".cluster-label");
      clusterLabels.forEach((label) => {
        if (label instanceof HTMLElement) {
          label.style.padding = "0.25rem";
          label.style.marginBottom = "0.5rem";
          label.style.fontSize = "1em";
          label.style.fontWeight = "500";
        }
      });
    }
  }, [svgContent]);

  const handleDownload = async () => {
    if (containerRef.current && !isDownloading && !renderError) {
      try {
        setIsDownloading(true);

        // Get the SVG element
        const svgElement = containerRef.current.querySelector("svg");
        if (!svgElement) return;

        // Get the actual dimensions of the SVG
        const { width, height } = svgElement.getBoundingClientRect();

        // Create a temporary container with exact dimensions
        const tempContainer = document.createElement("div");
        tempContainer.style.position = "absolute";
        tempContainer.style.left = "-9999px";
        tempContainer.style.width = `${width}px`;
        tempContainer.style.height = `${height}px`;
        tempContainer.style.backgroundColor = "#FFFFFF";
        tempContainer.style.padding = "1rem";
        tempContainer.innerHTML = svgContent;
        document.body.appendChild(tempContainer);

        // Take screenshot
        const canvas = await html2canvas(tempContainer, {
          backgroundColor: "#FFFFFF",
          scale: 2,
          logging: false,
          width: width + 32,
          height: height + 32,
          x: 0,
          y: 0,
          windowWidth: width + 32,
          windowHeight: height + 32,
        });

        // Cleanup temporary container
        document.body.removeChild(tempContainer);

        // Convert to PNG and download
        const image = canvas.toDataURL("image/png", 1.0);
        const link = document.createElement("a");
        link.href = image;
        link.download = "mermaid-diagram.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error("Error downloading diagram:", error);
      } finally {
        setIsDownloading(false);
      }
    }
  };

  return (
    <div className="my-4 space-y-2 ">
      <div
        className="relative mx-auto"
        style={{ maxWidth: "100%", height: "80vh", overflow: "hidden" }}
      >
        <div
          ref={absoluteContainerRef} 
          className="absolute inset-0 overflow-auto flex items-center justify-center">
          <div
            ref={containerRef}
            className="rounded-lg bg-zinc-50 dark:bg-zinc-900 w-full h-full flex items-center justify-center p-4"
            style={{
              minHeight: "100%",
              transform: `scale(${scale})`,
              transformOrigin: scale < 1 ? "center center" : "0 center",
              transition: "transform 0.1s ease-out",
            }}
          />
        </div>
      </div>
      <div className="flex flex-wrap justify-end items-center gap-2 max-w-full mx-auto px-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => adjustScale(-0.3)}
            className="text-xs bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-200"
          >
            <ZoomOut className="h-3 w-3" />
          </Button>
          <span className="text-xs mx-2 text-zinc-900 dark:text-zinc-200 min-w-[3rem] text-center">{Math.round(scale * 100)}%</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => adjustScale(0.3)}
            className="text-xs bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-200"
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fitToView}
            className="text-xs bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-200 ml-2"
          >
            Fit
          </Button>
        </div>
        {svgContent && !renderError && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isDownloading}
            className="text-xs bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-200"
          >
            <Download className="h-3 w-3 mr-1" />
            {isDownloading ? "..." : "PNG"}
          </Button>
        )}
      </div>
      {renderError && (
        <div className="text-red-500 text-sm mt-2">
          Error rendering diagram: {renderError}
        </div>
      )}
    </div>
  );
});

MermaidRenderer.displayName = "MermaidRenderer";

export default MermaidRenderer;
