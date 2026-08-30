import type { HTMLAttributes, ReactNode } from "react";

import { classNames } from "./class-names";
import styles from "./ui.module.css";

export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions, className, ...props }: PageHeaderProps) {
  return (
    <header className={classNames(styles.pageHeader, className)} {...props}>
      <div className={styles.pageHeaderText}>
        <h1 className={styles.pageHeaderTitle}>{title}</h1>
        {description === undefined ? null : (
          <p className={styles.pageHeaderDescription}>{description}</p>
        )}
      </div>
      {actions === undefined ? null : <div className={styles.pageHeaderActions}>{actions}</div>}
    </header>
  );
}
