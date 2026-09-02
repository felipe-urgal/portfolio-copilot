import type { ReactNode } from "react";

import styles from "./reason-code-list.module.css";

export type ReasonCodePresentation = Readonly<{
  code: string;
  title: ReactNode;
  description: ReactNode;
}>;

type ReasonCodeListProps = Readonly<{
  reasons: readonly ReasonCodePresentation[];
  emptyMessage?: ReactNode;
  ariaLabel?: string;
}>;

export function ReasonCodeList({
  reasons,
  emptyMessage = "Nenhum motivo adicional.",
  ariaLabel = "Motivos estruturados",
}: ReasonCodeListProps) {
  if (reasons.length === 0) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  return (
    <ul className={styles.list} aria-label={ariaLabel}>
      {reasons.map((reason, index) => (
        <li className={styles.item} key={`${reason.code}-${index}`}>
          <div className={styles.meta}>
            <strong>{reason.title}</strong>
            <code>{reason.code}</code>
          </div>
          <p>{reason.description}</p>
        </li>
      ))}
    </ul>
  );
}
