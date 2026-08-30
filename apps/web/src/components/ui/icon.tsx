import { cloneElement, type HTMLAttributes, type ReactElement, type SVGProps } from "react";

import { classNames } from "./class-names";
import styles from "./ui.module.css";

type IconSize = "sm" | "md" | "lg";

const sizeClass: Record<IconSize, string | undefined> = {
  sm: styles.iconSm,
  md: styles.iconMd,
  lg: styles.iconLg,
};

export interface IconProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  "children" | "role" | "aria-label" | "aria-hidden"
> {
  children: ReactElement<SVGProps<SVGSVGElement>>;
  size?: IconSize;
  label?: string;
}

export function Icon({ children, size = "md", label, className, ...props }: IconProps) {
  const svg = cloneElement(children, {
    "aria-hidden": true,
    focusable: "false",
  });

  return (
    <span
      {...props}
      className={classNames(styles.icon, sizeClass[size], className)}
      role={label === undefined ? undefined : "img"}
      aria-label={label}
      aria-hidden={label === undefined ? true : undefined}
    >
      {svg}
    </span>
  );
}
