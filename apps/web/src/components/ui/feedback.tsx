import type { HTMLAttributes, ReactNode } from "react";

import { classNames } from "./class-names";
import styles from "./ui.module.css";

type FeedbackTone = "neutral" | "info" | "success" | "warning" | "danger";
type BadgeTone = "neutral" | "accent";
type SkeletonVariant = "text" | "block" | "circle";

const toneClass: Record<FeedbackTone, string | undefined> = {
  neutral: styles.toneNeutral,
  info: styles.toneInfo,
  success: styles.toneSuccess,
  warning: styles.toneWarning,
  danger: styles.toneDanger,
};

export interface StatusProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: FeedbackTone;
}

export function Status({ tone = "neutral", className, ...props }: StatusProps) {
  return <span className={classNames(styles.status, toneClass[tone], className)} {...props} />;
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={classNames(styles.badge, tone === "accent" && styles.badgeAccent, className)}
      {...props}
    />
  );
}

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  tone?: Exclude<FeedbackTone, "neutral">;
  title: ReactNode;
}

export function Alert({ tone = "info", title, className, children, role, ...props }: AlertProps) {
  const semanticRole = role ?? (tone === "danger" ? "alert" : "status");

  return (
    <div
      className={classNames(styles.alert, toneClass[tone], className)}
      role={semanticRole}
      {...props}
    >
      <p className={styles.alertTitle}>{title}</p>
      {children === undefined ? null : <div className={styles.alertBody}>{children}</div>}
    </div>
  );
}

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode;
  description: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  align?: "start" | "center";
  headingLevel?: 2 | 3 | 4;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  align = "start",
  headingLevel,
  className,
  ...props
}: EmptyStateProps) {
  const Title =
    headingLevel === 2 ? "h2" : headingLevel === 3 ? "h3" : headingLevel === 4 ? "h4" : "p";

  return (
    <div
      className={classNames(
        styles.emptyState,
        align === "center" && styles.emptyStateCentered,
        className,
      )}
      {...props}
    >
      {icon === undefined ? null : <div className={styles.emptyStateIcon}>{icon}</div>}
      <Title className={styles.emptyStateTitle}>{title}</Title>
      <p className={styles.emptyStateDescription}>{description}</p>
      {action === undefined ? null : <div className={styles.emptyStateAction}>{action}</div>}
    </div>
  );
}

export interface LoadingStateProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "role" | "aria-live"
> {
  label?: ReactNode;
}

export function LoadingState({ label = "Carregando…", className, ...props }: LoadingStateProps) {
  return (
    <div
      {...props}
      className={classNames(styles.loadingState, className)}
      role="status"
      aria-live="polite"
    >
      <span className={styles.spinner} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export interface SkeletonProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  "aria-hidden" | "children"
> {
  variant?: SkeletonVariant;
}

const skeletonVariantClass: Record<SkeletonVariant, string | undefined> = {
  text: styles.skeletonText,
  block: styles.skeletonBlock,
  circle: styles.skeletonCircle,
};

export function Skeleton({ variant = "text", className, ...props }: SkeletonProps) {
  return (
    <span
      {...props}
      className={classNames(styles.skeleton, skeletonVariantClass[variant], className)}
      aria-hidden="true"
    />
  );
}
