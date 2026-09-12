import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "darkPill"
    | "lightPill"
    | "inactiveToggle"
    | "circleDark"
    | "circleLight"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon" | "pill";
  asChild?: boolean;
}

const variantStyles: Record<string, string> = {
  default: "bg-[#08080D] text-white hover:bg-[#1A1F2B] rounded-full shadow-sm",
  darkPill: "bg-[#08080D] text-white hover:bg-[#1A1F2B] rounded-full shadow-sm",
  lightPill: "bg-white text-[#08080D] hover:bg-[#F3F6F7] rounded-full border border-black/5 shadow-xs",
  inactiveToggle: "bg-[#E5E7EB] text-[#08080D]/70 hover:text-[#08080D] hover:bg-[#D1D5DB] rounded-full",
  circleDark: "bg-[#08080D] text-white hover:bg-[#1A1F2B] rounded-full shadow-sm p-0 flex items-center justify-center",
  circleLight: "bg-white text-[#08080D] hover:bg-[#F3F6F7] rounded-full border border-black/10 shadow-xs p-0 flex items-center justify-center",
  destructive: "bg-red-600 text-white hover:bg-red-500 rounded-full",
  outline: "border border-[#08080D]/20 bg-transparent text-[#08080D] hover:bg-[#F3F6F7] rounded-full",
  secondary: "bg-[#1A1F2B] text-white hover:bg-[#08080D] rounded-full",
  ghost: "text-[#08080D] hover:bg-black/5 rounded-full",
  link: "text-[#08080D] underline-offset-4 hover:underline",
};

const sizeStyles: Record<string, string> = {
  default: "h-10 px-5 py-2 text-sm",
  sm: "h-8 px-3.5 text-xs",
  lg: "h-12 px-8 text-base font-semibold",
  pill: "h-10 px-6 py-2.5 text-sm font-medium",
  icon: "h-10 w-10 min-w-10 min-h-10",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#08080D] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          variantStyles[variant] || variantStyles.default,
          sizeStyles[size] || sizeStyles.default,
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
