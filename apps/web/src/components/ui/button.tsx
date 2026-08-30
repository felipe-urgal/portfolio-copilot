import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import { classNames } from "./class-names";
import styles from "./ui.module.css";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variantClass: Record<ButtonVariant, string> = {
  primary: styles.buttonPrimary,
  secondary: styles.buttonSecondary,
  ghost: styles.buttonGhost,
  danger: styles.buttonDanger,
};

const sizeClass: Record<ButtonSize, string> = {
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
  ...props
}: ButtonProps) {
  const isDisabled = disabled === true || loading;

  return (
    <button
      type={type}
      className={classNames(styles.button, variantClass[variant], sizeClass[size], className)}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : null}
      <span className={styles.buttonContent}>{children}</span>
    </button>
  );
}

export interface LinkButtonProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children">,
    LinkProps {
  children: ReactNode;
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
      <span className={classes} aria-disabled="true">
        <span className={styles.buttonContent}>{children}</span>
      </span>
    );
  }

  return (
    <Link className={classes} href={href} {...props}>
      <span className={styles.buttonContent}>{children}</span>
    </Link>
  );
}
