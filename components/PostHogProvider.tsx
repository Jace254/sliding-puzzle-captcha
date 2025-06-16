"use client"

import type React from "react"

// Simple placeholder provider without any analytics for now
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  // No analytics tracking for now
  return <>{children}</>
}
