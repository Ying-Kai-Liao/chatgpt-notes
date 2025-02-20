import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ShareLinkCardProps {
  url: string;
}

export function ShareLinkCard({ url }: ShareLinkCardProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    toast.success('Share link copied to clipboard');
  };

  const handleSelect = (e: React.MouseEvent<HTMLElement>) => {
    const range = document.createRange();
    range.selectNodeContents(e.currentTarget);
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  return (
    <Card className="border-none shadow-none">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground mb-1">Share Link</p>
            <code 
              className="block bg-muted p-2 rounded text-sm break-all cursor-pointer overflow-hidden text-ellipsis"
              onClick={handleSelect}
            >
              {url}
            </code>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="shrink-0"
            onClick={handleCopy}
          >
            Copy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
