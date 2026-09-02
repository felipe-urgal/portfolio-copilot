const FOCUSABLE_SELECTOR = [
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "button:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function focusFirstInvalidField(form: HTMLFormElement): void {
  requestAnimationFrame(() => {
    const invalid = form.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]');
    if (invalid === null) return;

    const target = invalid.matches(FOCUSABLE_SELECTOR)
      ? invalid
      : invalid.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);

    target?.focus();
  });
}
