"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/api";

type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

type UseAutoSaveOptions<T> = {
  id: string;
  data: T;
  enabled?: boolean;
  delayMs?: number;
  buildBody?: (data: T, version: number) => unknown;
};

export function useAutoSave<T>({
  id,
  data,
  enabled = true,
  delayMs = 1500,
  buildBody,
}: UseAutoSaveOptions<T>) {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const versionRef = useRef(0);
  const savedVersionRef = useRef(0);
  const latestDataRef = useRef(data);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  latestDataRef.current = data;

  const saveVersion = useCallback(
    async (version: number, payload: T) => {
      setStatus("saving");
      setError(null);

      try {
        await apiClient(`/api/resume/${id}`, {
          method: "PATCH",
          body: buildBody ? buildBody(payload, version) : { updated_resume: payload, version },
        });

        if (versionRef.current === version) {
          savedVersionRef.current = version;
          setStatus("saved");
        }
      } catch (saveError) {
        if (versionRef.current === version) {
          setStatus("error");
          setError(saveError instanceof Error ? saveError.message : "Autosave failed.");
        }
      }
    },
    [buildBody, id],
  );

  const flush = useCallback(async () => {
    if (!enabled || !id) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const version = versionRef.current;
    if (version === savedVersionRef.current) return;
    await saveVersion(version, latestDataRef.current);
  }, [enabled, id, saveVersion]);

  useEffect(() => {
    if (!enabled || !id) return;

    versionRef.current += 1;
    const version = versionRef.current;
    setStatus("idle");

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      void saveVersion(version, latestDataRef.current);
    }, delayMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [data, delayMs, enabled, id, saveVersion]);

  return {
    status,
    error,
    flush,
    version: versionRef.current,
    savedVersion: savedVersionRef.current,
  };
}
