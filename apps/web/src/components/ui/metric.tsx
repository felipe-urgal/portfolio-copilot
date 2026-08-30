import type { HTMLAttributes, ReactNode } from "react";

import { classNames } from "./class-names";
import styles from "./ui.module.css";

type FinancialValueSize = "sm" | "md" | "lg";
type FinancialValueTone = "default" | "positive" | "negative" | "muted";

const sizeClass: Record<FinancialValueSize, string> = {
  sm: styles.financialValueSm,
  md: styles.financialValueMd,
  lg: styles.financialValueLg,
};

const toneClass: Record<FinancialValueTone, string | undefined> = {
  default: undefined,
  positive: styles.financialValuePositive,
  negative: styles.financialValueNegative,
  muted: styles.financialValueMuted,
};

export interface FinancialValueProps extends HTMLAttributes<HTMLSpanElement> {
  size?: FinancialValueSize;
  tone?: FinancialValueTone;
}

export function FinancialValue({
  size = "md",
  tone = "default",
  className,
  ...props
}: FinancialValueProps) {
  return (
    <span
      className={classNames(styles.financialValue, sizeClass[size], toneClass[tone], className)}
      {...props}
    />
  );
}

export interface MetricProps extends HTMLAttributes<HTMLDivElement> {
  label: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
  valueSize?: FinancialValueSize;
  valueTone?: FinancialValueTone;
}

export function Metric({
  label,
  value,
  detail,
  valueSize = "md",
  valueTone = "default",
  className,
  ...props
}: MetricProps) {
  return (
    <div className={classNames(styles.metric, className)} {...props}>
      <span className={styles.metricLabel}>{label}</span>
      <FinancialValue size={valueSize} tone={valueTone}>
        {value}
      </FinancialValue>
      {detail === undefined ? null : <span className={styles.metricDetail}>{detail}</span>}
    </div>
  );
}
