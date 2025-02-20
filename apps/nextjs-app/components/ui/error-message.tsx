import Link from "next/link";

interface ErrorMessageProps {
  title: string;
  showHomeLink?: boolean;
}

export function ErrorMessage({ title, showHomeLink = true }: ErrorMessageProps) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="text-lg font-semibold text-destructive">{title}</div>
        {showHomeLink && (
          <Link href="/" className="text-sm hover:underline">
            Return to Home
          </Link>
        )}
      </div>
    </div>
  );
}
