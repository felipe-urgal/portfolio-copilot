import {
  Children,
  cloneElement,
  isValidElement,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";

import { classNames } from "./class-names";
import styles from "./ui.module.css";

type DescribedControlProps = Readonly<{
  "aria-describedby"?: string;
}>;

function isHelpTextElement(child: ReactNode): child is ReactElement<HelpTextProps> {
  return isValidElement(child) && child.type === HelpText;
}

function isDescribedControlElement(child: ReactNode): child is ReactElement<DescribedControlProps> {
  return isValidElement(child) && (child.type === TextInput || child.type === Select);
}

function mergeDescribedBy(helpIds: readonly string[], describedBy: string | undefined): string {
  const existingIds = describedBy?.trim().split(/\s+/u).filter(Boolean) ?? [];
  return [...new Set([...helpIds, ...existingIds])].join(" ");
}

export type FieldProps = HTMLAttributes<HTMLDivElement>;

export function Field({ className, children, ...props }: FieldProps) {
  const childArray = Children.toArray(children);
  const helpIds = childArray.flatMap((child) =>
    isHelpTextElement(child) && typeof child.props.id === "string" ? [child.props.id] : [],
  );
  const describedControlCount = childArray.filter((child) =>
    isDescribedControlElement(child),
  ).length;
  const canAssociateHelp = helpIds.length > 0 && describedControlCount === 1;

  const describedChildren = Children.map(children, (child) => {
    if (!canAssociateHelp || !isDescribedControlElement(child)) return child;

    return cloneElement(child, {
      "aria-describedby": mergeDescribedBy(helpIds, child.props["aria-describedby"]),
    });
  });

  return (
    <div className={classNames(styles.field, className)} {...props}>
      {describedChildren}
    </div>
  );
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

export function TextInput({
  invalid = false,
  className,
  "aria-invalid": ariaInvalid,
  ...props
}: TextInputProps) {
  return (
    <input
      className={classNames(styles.control, invalid && styles.controlInvalid, className)}
      aria-invalid={invalid ? true : ariaInvalid}
      {...props}
    />
  );
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export function Select({
  invalid = false,
  className,
  "aria-invalid": ariaInvalid,
  ...props
}: SelectProps) {
  return (
    <select
      className={classNames(
        styles.control,
        styles.selectControl,
        invalid && styles.controlInvalid,
        className,
      )}
      aria-invalid={invalid ? true : ariaInvalid}
      {...props}
    />
  );
}
