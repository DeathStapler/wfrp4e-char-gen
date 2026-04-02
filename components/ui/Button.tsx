"use client";

import Link from "next/link";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface BaseProps {
  variant?: ButtonVariant;
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

interface ButtonAsButton extends BaseProps {
  href?: undefined;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
}

interface ButtonAsLink extends BaseProps {
  href: string;
  onClick?: undefined;
  type?: undefined;
}

type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-amber-500 text-gray-950 font-semibold hover:bg-amber-400 active:bg-amber-600 disabled:bg-amber-900 disabled:text-amber-700",
  secondary:
    "border border-amber-500 text-amber-500 hover:bg-amber-500/10 active:bg-amber-500/20 disabled:border-gray-700 disabled:text-gray-500",
  ghost:
    "text-gray-400 hover:text-gray-100 hover:bg-white/5 active:bg-white/10 disabled:text-gray-500",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded px-5 py-2.5 text-sm transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950";

export function Button(props: ButtonProps) {
  const { variant = "primary", className = "", disabled, children } = props;
  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

  if (props.href !== undefined) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? "button"}
      onClick={props.onClick}
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  );
}
