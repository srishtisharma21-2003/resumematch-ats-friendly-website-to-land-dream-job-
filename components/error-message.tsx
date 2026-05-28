import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type ErrorMessageProps = {
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorMessage({
  title = "Something went wrong",
  message,
  retryLabel = "Retry",
  onRetry,
  className,
}: ErrorMessageProps) {
  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{message}</p>
        {onRetry && (
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
