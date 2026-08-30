import type { HTMLAttributes } from "react";

import { classNames } from "./class-names";
import styles from "./ui.module.css";

type SurfaceTone = "default" | "subtle" | "elevated";
type SurfacePadding = "none" | "sm" | "md" | "lg";

const toneClass: Record<SurfaceTone, string> = {
  default: styles.surfaceDefault,
  subtle: styles.surfaceSubtle,
  elevated: styles.surfaceElevated,
};

const paddingClass: Record<SurfacePadding, string> = {
  none: styles.surfacePaddingNone,
  sm: styles.surfacePaddingSm,
  md: styles.surfacePaddingMd,
  lg: styles.surfacePaddingLg,
};

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  tone?: SurfaceTone;
  padding?: SurfacePadding;
}

export function Surface({ tone = "default", padding = "md", className, ...props }: SurfaceProps) {
  return (
    <div
      className={classNames(styles.surface, toneClass[tone], paddingClass[padding], className)}
      {...props}
    />
  );
}
