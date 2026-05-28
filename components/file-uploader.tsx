"use client";

import * as React from "react";
import { CloudUpload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
export const ALLOWED_UPLOAD_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export type UploadedFileInfo = {
  name: string;
  size: number;
  file?: File;
};

type FileUploaderProps = {
  id: string;
  label: string;
  value: UploadedFileInfo | null;
  onChange: (file: UploadedFileInfo | null) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
  className?: string;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file: File) {
  const lowerName = file.name.toLowerCase();
  const hasAllowedExtension = lowerName.endsWith(".pdf") || lowerName.endsWith(".docx");
  const hasAllowedMime = ALLOWED_UPLOAD_TYPES.includes(file.type);

  if (!hasAllowedExtension && !hasAllowedMime) {
    return "Only PDF and DOCX files are supported.";
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return "File is too large. Please upload a file under 5MB.";
  }

  return null;
}

export function FileUploader({
  id,
  label,
  value,
  onChange,
  onError,
  disabled,
  className,
}: FileUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const setFile = React.useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        onChange(null);
        onError?.(validationError);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }

      onError?.("");
      onChange({ name: file.name, size: file.size, file });
    },
    [onChange, onError],
  );

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) setFile(file);
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) setFile(file);
        }}
        className="hidden"
      />

      {value ? (
        <div className="flex items-center justify-between rounded-xl border-2 border-emerald-500 bg-emerald-500/5 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
              <FileText className="h-6 w-6 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium">{value.name}</p>
              <p className="text-sm text-muted-foreground">{formatFileSize(value.size)}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            onClick={() => {
              onChange(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          className={cn(
            "cursor-pointer rounded-xl border-2 border-dashed border-border p-8 text-center transition-all hover:border-primary/50 hover:bg-muted/50",
            disabled && "pointer-events-none opacity-60",
          )}
        >
          <CloudUpload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="mb-1 font-medium">{label}</p>
          <p className="mb-4 text-sm text-muted-foreground">Drag and drop or click to browse</p>
          <div className="flex justify-center gap-2">
            {["PDF", "DOCX", "5MB max"].map((format) => (
              <span key={format} className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                {format}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
