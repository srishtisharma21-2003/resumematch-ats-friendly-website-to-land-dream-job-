import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function LoadingSpinner({
  label = "Loading...",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-40 flex-col items-center justify-center gap-3 text-muted-foreground", className)}>
      <Spinner className="h-8 w-8 text-primary" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
