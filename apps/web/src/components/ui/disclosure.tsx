import type { DetailsHTMLAttributes, ReactNode } from "react";

import { classNames } from "./class-names";
import styles from "./disclosure.module.css";

export interface DisclosureProps
  extends Omit<DetailsHTMLAttributes<HTMLDetailsElement>, "children"> {
  summary: ReactNode;
  summaryAside?: ReactNode;
  children: ReactNode;
}

export function Disclosure({
  summary,
  summaryAside,
  children,
  className,
  ...props
}: DisclosureProps) {
  return (
    <details {...props} className={classNames(styles.disclosure, className)}>
      <summary className={styles.summary}>
        <span className={styles.summaryLabel}>{summary}</span>
        {summaryAside === undefined ? null : (
          <span className={styles.summaryAside}>{summaryAside}</span>
        )}
      </summary>
      <div className={styles.body}>{children}</div>
    </details>
  );
}
