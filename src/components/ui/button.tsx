import { cn } from "@/lib/utils";
import * as React from "react";
export function Button({ className, variant="default", size="default", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & {variant?: "default"|"outline"|"ghost", size?: "default"|"sm"}) {
  const base = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<string,string> = {
    default: "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900",
    outline: "border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900",
    ghost: "hover:bg-zinc-100 dark:hover:bg-zinc-800",
  };
  const sizes: Record<string,string> = { default: "h-9 px-4 py-2", sm: "h-8 px-3" };
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}
