import React from "react";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  maxLength?: number;
  required?: boolean;
}

export function TextArea({
  label,
  error,
  helperText,
  maxLength,
  required,
  id,
  value,
  className = "",
  ...rest
}: TextAreaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  const length = typeof value === "string" ? value.length : 0;
  const nearLimit = maxLength && length >= maxLength * 0.85;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200"
        >
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        value={value}
        maxLength={maxLength}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={[
          "w-full resize-none rounded-xl border-2 bg-white dark:bg-gray-900 p-3.5 text-sm font-medium text-gray-900 dark:text-gray-100 outline-none transition-all duration-200",
          "placeholder:text-gray-400 dark:placeholder:text-gray-600",
          "focus:border-brand focus:ring-4 focus:ring-brand/10 dark:focus:ring-brand/10",
          "hover:border-gray-300 dark:hover:border-gray-700",
          error
            ? "border-red-400 dark:border-red-600 bg-red-50/30 dark:bg-red-950/10"
            : "border-gray-200 dark:border-gray-800",
          className,
        ].join(" ")}
        {...rest}
      />
      <div className="mt-1.5 flex items-center justify-between gap-2">
        {error ? (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="flex items-center gap-1 text-xs font-semibold text-red-500"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 shrink-0">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-gray-400 dark:text-gray-500">{helperText}</p>
        ) : (
          <span />
        )}
        {maxLength && (
          <span
            className={`shrink-0 text-xs font-semibold tabular-nums transition-colors ${
              nearLimit
                ? "text-red-500 dark:text-red-400"
                : "text-gray-400 dark:text-gray-500"
            }`}
          >
            {length}
            <span className="text-gray-300 dark:text-gray-700">/</span>
            {maxLength}
          </span>
        )}
      </div>
    </div>
  );
}
