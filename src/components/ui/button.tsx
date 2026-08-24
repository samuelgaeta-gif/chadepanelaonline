import * as React from "react"
import { cn } from "@/src/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-[0_4px_16px_0_rgba(31,38,135,0.05)]",
          {
            "bg-rose-500 text-rose-950 hover:bg-rose-600 shadow-sm": variant === "default",
            "bg-rose-100/80 text-rose-800 hover:bg-rose-200": variant === "secondary",
            "border border-rose-300 bg-white/70 text-rose-700 hover:bg-white hover:text-rose-800 shadow-sm": variant === "outline",
            "hover:bg-rose-100/50 hover:text-rose-700 text-slate-700": variant === "ghost",
            "text-rose-600 underline-offset-4 hover:underline": variant === "link",
            "h-11 px-6 py-2": size === "default",
            "h-9 rounded-lg px-4": size === "sm",
            "h-12 rounded-xl px-8": size === "lg",
            "h-11 w-11": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
