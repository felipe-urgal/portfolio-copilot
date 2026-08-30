import type { FieldsetHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

import { classNames } from "./class-names";
import styles from "./ui.module.css";

export interface ChoiceCardProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "title" | "className"
> {
  type?: "radio" | "checkbox";
  title: ReactNode;
  description?: ReactNode;
  className?: string;
}

export function ChoiceCard({
  type = "radio",
  title,
  description,
  className,
  ...inputProps
}: ChoiceCardProps) {
  return (
    <label className={classNames(styles.choiceCard, className)}>
      <input className={styles.choiceInput} type={type} {...inputProps} />
      <span className={styles.choiceIndicator} aria-hidden="true" />
      <span className={styles.choiceBody}>
        <span className={styles.choiceTitle}>{title}</span>
        {description === undefined ? null : (
          <span className={styles.choiceDescription}>{description}</span>
        )}
      </span>
    </label>
  );
}

export interface SegmentedControlProps extends FieldsetHTMLAttributes<HTMLFieldSetElement> {
  legend: ReactNode;
  hideLegend?: boolean;
  children: ReactNode;
}

export function SegmentedControl({
  legend,
  hideLegend = false,
  className,
  children,
  ...props
}: SegmentedControlProps) {
  return (
    <fieldset className={classNames(styles.segmented, className)} {...props}>
      <legend className={classNames(styles.segmentedLegend, hideLegend && styles.srOnly)}>
        {legend}
      </legend>
      <div className={styles.segmentedTrack}>{children}</div>
    </fieldset>
  );
}

export interface SegmentedControlOptionProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "className"
> {
  children: ReactNode;
  className?: string;
}

export function SegmentedControlOption({
  children,
  className,
  ...inputProps
}: SegmentedControlOptionProps) {
  return (
    <label className={classNames(styles.segmentedOption, className)}>
      <input className={styles.segmentedInput} type="radio" {...inputProps} />
      <span className={styles.segmentedLabel}>{children}</span>
    </label>
  );
}
