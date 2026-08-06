import React from "react";

interface TextInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  error?: string;
  helperText?: string;
  prefix?: React.ReactNode;
  actionButton?: React.ReactNode;
  required?: boolean;
}

export function TextInput({
  label,
  error,
  helperText,
  prefix,
  actionButton,
  required,
  id,
  className = "",
  ...rest
}: TextInputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-gray-800">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="pointer-events-none absolute left-3 text-gray-500">{prefix}</span>
        )}
        <input
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={[
            "h-11 w-full rounded-lg border bg-white text-sm text-gray-900 outline-none transition-colors",
            "placeholder:text-gray-400",
            "focus:border-brand focus:ring-2 focus:ring-brand/20",
            prefix ? "pl-8" : "pl-3",
            actionButton ? "pr-10" : "pr-3",
            error ? "border-red-400" : "border-gray-300",
            className,
          ].join(" ")}
          {...rest}
        />
        {actionButton && (
          <div className="absolute right-2 flex items-center justify-center">
            {actionButton}
          </div>
        )}
      </div>
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="mt-1.5 text-xs font-medium text-red-500">
          {error}
        </p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-gray-500">{helperText}</p>
      ) : null}
    </div>
  );
}
