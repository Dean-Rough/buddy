"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface BrutalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const BrutalInput = forwardRef<HTMLInputElement, BrutalInputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="font-sink text-sm uppercase tracking-wide">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`brutal-input ${error ? 'border-red-500' : ''} ${className}`}
          {...props}
        />
        {error && (
          <span className="text-red-600 font-sink text-sm uppercase">
            {error}
          </span>
        )}
      </div>
    );
  }
);

BrutalInput.displayName = "BrutalInput";

export default BrutalInput;