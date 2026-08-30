import { cloneElement, type HTMLAttributes, type ReactElement, type SVGProps } from "react";

import { classNames } from "./class-names";
import styles from "./ui.module.css";

type IconSize = "sm" | "md" | "lg";

const sizeClass: Record<IconSize, string> = {
  sm: styles.iconSm,
  md: styles.iconMd,
  lg: styles.iconLg,
};

export interface IconProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
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
      className={classNames(styles.icon, sizeClass[size], className)}
      role={label === undefined ? undefined : "img"}
      aria-label={label}
      aria-hidden={label === undefined ? true : undefined}
      {...props}
    >
      {svg}
    </span>
  );
}
