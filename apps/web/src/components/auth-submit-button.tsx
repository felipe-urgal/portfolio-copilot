"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "./ui";
import styles from "./auth-surface.module.css";

export function AuthSubmitButton({ children }: Readonly<{ children: ReactNode }>) {
  const { pending } = useFormStatus();

  return (
    <Button
      className={styles.fullAction}
      type="submit"
      size="lg"
      loading={pending}
      disabled={pending}
    >
      {children}
    </Button>
  );
}
