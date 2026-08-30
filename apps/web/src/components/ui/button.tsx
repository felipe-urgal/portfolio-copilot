import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";

import { classNames } from "./class-names";
import styles from "./ui.module.css";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variantClass: Record<ButtonVariant, string | undefined> = {
  primary: styles.buttonPrimary,
  secondary: styles.buttonSecondary,
  ghost: styles.buttonGhost,
  danger: styles.buttonDanger,
};

const sizeClass: Record<ButtonSize, string | undefined> = {
  sm: styles.buttonSm,
  md: styles.buttonMd,
  lg: styles.buttonLg,
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  "aria-busy": ariaBusy,
  ...props
}: ButtonProps) {
  const isDisabled = disabled === true || loading;

  return (
    <button
      {...props}
      type={type}
      className={classNames(styles.button, variantClass[variant], sizeClass[size], className)}
      disabled={isDisabled}
      aria-busy={loading ? true : ariaBusy}
    >
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : null}
      <span className={styles.buttonContent}>{children}</span>
    </button>
  );
}

export interface LinkButtonProps extends Omit<
  ComponentProps<typeof Link>,
  "children" | "className"
> {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
}

export function LinkButton({
  variant = "primary",
  size = "md",
  disabled = false,
  className,
  children,
  href,
  id,
  title,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  ...props
}: LinkButtonProps) {
  const classes = classNames(
    styles.button,
    variantClass[variant],
    sizeClass[size],
    disabled && styles.buttonDisabled,
    className,
  );

  if (disabled) {
    return (
      <span
        id={id}
        title={title}
        className={classes}
        aria-disabled="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
      >
        <span className={styles.buttonContent}>{children}</span>
      </span>
    );
  }

  return (
    <Link
      {...props}
      id={id}
      title={title}
      className={classes}
      href={href}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
    >
      <span className={styles.buttonContent}>{children}</span>
    </Link>
  );
}
