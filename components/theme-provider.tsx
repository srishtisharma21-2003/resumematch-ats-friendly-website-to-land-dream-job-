"use client";

import * as React from "react";

type ThemeProviderProps = {
  children: React.ReactNode;
  [key: string]: unknown;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  return <>{children}</>;
}
