interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabel: string;
}

export function StepIndicator({ currentStep, totalSteps, stepLabel }: StepIndicatorProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-1 mb-2">
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1;
          const isActive = step === currentStep;
          const isPast = step < currentStep;
          return (
            <div key={step} className="flex items-center gap-1">
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-amber-500 text-gray-950"
                    : isPast
                    ? "bg-amber-900 text-amber-400"
                    : "bg-gray-800 text-gray-400"
                }`}
              >
                {step}
              </div>
              {step < totalSteps && (
                <div
                  className={`h-px w-5 ${isPast ? "bg-amber-700" : "bg-gray-800"}`}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400">
        Step {currentStep} of {totalSteps}:{" "}
        <span className="text-amber-400">{stepLabel}</span>
      </p>
    </div>
  );
}
