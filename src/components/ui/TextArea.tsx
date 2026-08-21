import React from "react";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  maxLength?: number;
  required?: boolean;
}

export function TextArea({
  label,
  error,
  maxLength,
  required,
  id,
  value,
  className = "",
  ...rest
}: TextAreaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  const length = typeof value === "string" ? value.length : 0;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-gray-800 dark:text-gray-200">
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
          "w-full resize-none rounded-lg border bg-white dark:bg-gray-900 p-3 text-sm text-gray-900 dark:text-gray-100 outline-none transition-all duration-200",
          "placeholder:text-gray-400 dark:placeholder:text-gray-500",
          "focus:border-brand focus:ring-2 focus:ring-brand/20 dark:focus:ring-brand/10",
          error ? "border-red-400" : "border-gray-300 dark:border-gray-800",
          className,
        ].join(" ")}
        {...rest}
      />
      <div className="mt-1.5 flex items-center justify-between">
        {error ? (
          <p id={`${inputId}-error`} role="alert" className="text-xs font-medium text-red-500">
            {error}
          </p>
        ) : (
          <span />
        )}
        {maxLength && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}
