"use client";

interface CardProps {
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

export function Card({ selected = false, onClick, className = "", children }: CardProps) {
  const selectedClasses = selected
    ? "border-amber-500 shadow-lg shadow-amber-500/20 bg-gray-900"
    : "border-gray-700 bg-gray-900/60 hover:border-gray-500 hover:bg-gray-900";

  const interactiveClasses = onClick
    ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
    : "";

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`rounded-lg border p-5 transition-all duration-150 ${selectedClasses} ${interactiveClasses} ${className}`}
    >
      {children}
    </div>
  );
}
