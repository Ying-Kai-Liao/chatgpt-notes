"use client";

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import html2canvas from 'html2canvas';

// Initialize mermaid with specific config
mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose',
  fontFamily: 'monospace',
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
    padding: 15,
    nodeSpacing: 50,
    rankSpacing: 80,
    diagramPadding: 8,
    useMaxWidth: true,
  },
  themeVariables: {
    'primaryColor': '#E9D5FF',
    'primaryTextColor': '#000000',
    'primaryBorderColor': '#4B5563',
    'lineColor': '#4B5563',
    'secondaryColor': '#F3E8FF',
    'tertiaryColor': '#FFFFFF',
    'fontSize': '14px',
    'nodeBorder': '#4B5563',
    'clusterBkg': '#F3E8FF',
    'clusterBorder': '#4B5563',
    'labelBackground': '#F3E8FF',
  }
});

interface MermaidRendererProps {
  chart: string;
}

const MermaidRenderer: React.FC<MermaidRendererProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (containerRef.current && !isDownloading && !renderError) {
      try {
        setIsDownloading(true);
        
        // Get the SVG element
        const svgElement = containerRef.current.querySelector('svg');
        if (!svgElement) return;
        
        // Get the actual dimensions of the SVG
        const { width, height } = svgElement.getBoundingClientRect();
        
        // Create a temporary container with exact dimensions
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = `${width}px`;
        tempContainer.style.height = `${height}px`;
        tempContainer.style.backgroundColor = '#FFFFFF';
        tempContainer.style.padding = '1rem';
        tempContainer.innerHTML = svgContent;
        document.body.appendChild(tempContainer);
        
        // Take screenshot
        const canvas = await html2canvas(tempContainer, {
          backgroundColor: '#FFFFFF',
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
        const image = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.href = image;
        link.download = 'mermaid-diagram.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Error downloading diagram:', error);
      } finally {
        setIsDownloading(false);
      }
    }
  };

  useEffect(() => {
    let mounted = true;
    const container = containerRef.current;

    const renderDiagram = async () => {
      if (!container || !mounted) return;
      
      try {
        setRenderError(null);
        
        // Generate unique id
        const id = `mermaid-${Math.random().toString(36).substring(2, 10)}`;
        
        // Use mermaid.render instead of init
        const { svg } = await mermaid.render(id, chart);
        
        if (!mounted) return;

        // Store SVG content for download
        setSvgContent(svg);
        
        // Set the rendered SVG
        if (container && mounted) {
          container.innerHTML = svg;

          // Add background color to the SVG
          const svgElement = container.querySelector('svg');
          if (svgElement) {
            svgElement.style.backgroundColor = '#FFFFFF';
            svgElement.style.borderRadius = '0.5rem';
            svgElement.style.padding = '1.5rem';
            svgElement.style.width = '100%';
            svgElement.style.maxWidth = '100%';
            svgElement.style.height = 'auto';
            svgElement.setAttribute('preserveAspectRatio', 'xMinYMin meet');
          }

          // Adjust styles for subgraphs and labels
          const clusters = container.querySelectorAll('.cluster');
          clusters.forEach(cluster => {
            if (cluster instanceof HTMLElement) {
              cluster.style.padding = '1rem';
              cluster.style.margin = '0.5rem 0';
            }
          });

          // Adjust text wrapping for all labels
          const labels = container.querySelectorAll('.label, .nodeLabel, .edgeLabel');
          labels.forEach(label => {
            if (label instanceof HTMLElement) {
              label.style.whiteSpace = 'pre-wrap';
              label.style.maxWidth = '150px';
              label.style.wordBreak = 'break-word';
              label.style.lineHeight = '1.3';
            }
          });

          // Adjust cluster labels specifically
          const clusterLabels = container.querySelectorAll('.cluster-label');
          clusterLabels.forEach(label => {
            if (label instanceof HTMLElement) {
              label.style.padding = '0.25rem';
              label.style.marginBottom = '0.5rem';
              label.style.fontSize = '1em';
              label.style.fontWeight = '500';
            }
          });
        }
      } catch (error) {
        console.error('Mermaid rendering error:', error);
        if (mounted) {
          setRenderError(error instanceof Error ? error.message : 'Error rendering diagram');
          if (container) {
            container.innerHTML = `<pre><code>${chart}</code></pre>`;
          }
        }
      }
    };

    // Clear previous content before rendering
    if (container) {
      container.innerHTML = '';
    }
    
    renderDiagram();
    
    // Cleanup function
    return () => {
      mounted = false;
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [chart]);

  return (
    <div className="not-prose my-8 space-y-2">
      <div 
        ref={containerRef} 
        className="overflow-visible rounded-lg shadow-sm bg-white min-w-[600px] max-w-[800px] mx-auto"
      />
      {svgContent && !renderError && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isDownloading}
            className="text-xs"
          >
            <Download className="h-3 w-3 mr-1" />
            {isDownloading ? 'Downloading...' : 'Download PNG'}
          </Button>
        </div>
      )}
      {renderError && (
        <div className="text-red-500 text-sm mt-2">
          Error rendering diagram: {renderError}
        </div>
      )}
    </div>
  );
};

export default MermaidRenderer;
