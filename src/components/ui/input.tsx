import * as React from "react"
import { cn } from "@/src/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-[rgba(255,255,255,0.4)] bg-[rgba(255,255,255,0.4)] px-4 py-2 text-sm shadow-[0_4px_16px_0_rgba(31,38,135,0.05)] backdrop-blur-md outline-none transition-all placeholder:text-gray-500 focus-visible:outline-none focus:border-[#9BAE96] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
