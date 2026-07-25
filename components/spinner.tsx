import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Spinner({ className, ...props }: ComponentProps<"svg">) {
  return (
    <svg
      role="status"
      aria-label="Loading"
      viewBox="0 0 24 24"
      className={cn("spinner", className)}
      {...props}
    >
      <circle className="spinner-track" cx="12" cy="12" r="9" />
      <path className="spinner-head" d="M21 12a9 9 0 0 0-9-9" />
    </svg>
  );
}
