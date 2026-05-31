import * as React from "react";

// In React Native with NativeWind, we don't need a next-themes provider.
// This is a simple pass-through stub to prevent bundler errors.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
