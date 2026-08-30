import type { HTMLAttributes } from "react";

import { classNames } from "./class-names";
import styles from "./ui.module.css";

type ContainerSize = "narrow" | "content" | "wide";
type Space = "none" | "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
type Alignment = "start" | "center" | "end" | "baseline";
type Justification = "start" | "center" | "end" | "between";
type GridMinimum = "sm" | "md" | "lg" | "xl";

const containerSizeClass: Record<ContainerSize, string | undefined> = {
  narrow: styles.containerNarrow,
  content: styles.containerContent,
  wide: styles.containerWide,
};

const spaceClass: Record<Space, string | undefined> = {
  none: styles.spaceNone,
  "2xs": styles.space2xs,
  xs: styles.spaceXs,
  sm: styles.spaceSm,
  md: styles.spaceMd,
  lg: styles.spaceLg,
  xl: styles.spaceXl,
  "2xl": styles.space2xl,
  "3xl": styles.space3xl,
};

const alignmentClass: Record<Alignment, string | undefined> = {
  start: styles.alignStart,
  center: styles.alignCenter,
  end: styles.alignEnd,
  baseline: styles.alignBaseline,
};

const justificationClass: Record<Justification, string | undefined> = {
  start: styles.justifyStart,
  center: styles.justifyCenter,
  end: styles.justifyEnd,
  between: styles.justifyBetween,
};

const gridMinimumClass: Record<GridMinimum, string | undefined> = {
  sm: styles.gridSm,
  md: styles.gridMd,
  lg: styles.gridLg,
  xl: styles.gridXl,
};

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize;
}

export function Container({ size = "wide", className, ...props }: ContainerProps) {
  return (
    <div className={classNames(styles.container, containerSizeClass[size], className)} {...props} />
  );
}

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  space?: Space;
}

export function Stack({ space = "md", className, ...props }: StackProps) {
  return <div className={classNames(styles.stack, spaceClass[space], className)} {...props} />;
}

export interface ClusterProps extends HTMLAttributes<HTMLDivElement> {
  space?: Space;
  align?: Alignment;
  justify?: Justification;
}

export function Cluster({
  space = "sm",
  align = "center",
  justify = "start",
  className,
  ...props
}: ClusterProps) {
  return (
    <div
      className={classNames(
        styles.cluster,
        spaceClass[space],
        alignmentClass[align],
        justificationClass[justify],
        className,
      )}
      {...props}
    />
  );
}

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  minimum?: GridMinimum;
  space?: Space;
}

export function Grid({ minimum = "md", space = "md", className, ...props }: GridProps) {
  return (
    <div
      className={classNames(styles.grid, gridMinimumClass[minimum], spaceClass[space], className)}
      {...props}
    />
  );
}
