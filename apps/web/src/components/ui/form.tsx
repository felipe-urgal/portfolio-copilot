import type {
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
} from "react";

import { classNames } from "./class-names";
import styles from "./ui.module.css";

export type FieldProps = HTMLAttributes<HTMLDivElement>;

export function Field({ className, ...props }: FieldProps) {
  return <div className={classNames(styles.field, className)} {...props} />;
}

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ required = false, className, children, ...props }: LabelProps) {
  return (
    <label className={classNames(styles.label, className)} {...props}>
      {children}
      {required ? (
        <span className={styles.requiredMark} aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
}

export type HelpTextProps = HTMLAttributes<HTMLParagraphElement>;

export function HelpText({ className, ...props }: HelpTextProps) {
  return <p className={classNames(styles.helpText, className)} {...props} />;
}

export type FieldErrorProps = HTMLAttributes<HTMLParagraphElement>;

export function FieldError({ className, role = "alert", ...props }: FieldErrorProps) {
  return <p className={classNames(styles.fieldError, className)} role={role} {...props} />;
}

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function TextInput({ invalid = false, className, ...props }: TextInputProps) {
  return (
    <input
      className={classNames(styles.control, invalid && styles.controlInvalid, className)}
      aria-invalid={invalid || props["aria-invalid"] || undefined}
      {...props}
    />
  );
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export function Select({ invalid = false, className, ...props }: SelectProps) {
  return (
    <select
      className={classNames(
        styles.control,
        styles.selectControl,
        invalid && styles.controlInvalid,
        className,
      )}
      aria-invalid={invalid || props["aria-invalid"] || undefined}
      {...props}
    />
  );
}
