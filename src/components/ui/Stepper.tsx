import React from "react";

export interface Step {
  label: string;
  index: number;
}

interface StepperProps {
  steps: Step[];
  currentIndex: number;
}

export function Stepper({ steps, currentIndex }: StepperProps) {
  return (
    <nav aria-label="Listing creation progress" className="w-full">
      <ol className="flex items-center justify-between">
        {steps.map((step, i) => {
          const isComplete = step.index < currentIndex;
          const isCurrent = step.index === currentIndex;
          return (
            <li key={step.label} className="flex flex-1 items-center last:flex-none">
              <div className="flex items-center gap-2">
                <span
                  className={[
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    isComplete
                      ? "bg-success text-white"
                      : isCurrent
                      ? "bg-brand text-white"
                      : "bg-gray-200 text-gray-500",
                  ].join(" ")}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isComplete ? (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 11.586l6.293-6.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    step.index
                  )}
                </span>
                <span
                  className={[
                    "hidden text-sm font-medium sm:inline",
                    isCurrent ? "text-brand" : isComplete ? "text-gray-700" : "text-gray-400",
                  ].join(" ")}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <span
                  className={[
                    "mx-3 h-0.5 flex-1",
                    isComplete ? "bg-success" : "bg-gray-200",
                  ].join(" ")}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
