"use client";

import { ReactNode, ButtonHTMLAttributes } from "react";

interface BrutalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "yellow" | "pink" | "blue" | "green" | "orange" | "red" | "white";
  size?: "small" | "normal" | "large";
}

export function BrutalButton({ 
  children, 
  variant = "white", 
  size = "normal",
  className = "",
  ...props 
}: BrutalButtonProps) {
  const sizeClasses = {
    small: "px-3 py-2 text-xs",
    normal: "px-6 py-3 text-sm",
    large: "px-8 py-4 text-base"
  };

  const variantClasses = {
    yellow: "brutal-btn-yellow",
    pink: "brutal-btn-pink", 
    blue: "brutal-btn-blue",
    green: "brutal-btn-green",
    orange: "brutal-btn-orange",
    red: "brutal-btn-red",
    white: ""
  };

  return (
    <button
      className={`brutal-btn ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default BrutalButton;