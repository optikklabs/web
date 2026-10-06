import type { ReactNode } from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "@shared/lib/utils";

interface DrawerShellProps {
  readonly open: boolean;
  readonly onClose: () => void;
  /** Accessible name of the drawer; screen readers announce it on open. */
  readonly title: string;
  readonly width?: number | string;
  readonly children: ReactNode;
  /** Optional sticky footer (action bar) pinned below the scroll region. */
  readonly footer?: ReactNode;
}

/** Escape closes the drawer, except while the user is typing in a field. */
function keepOpenWhileTyping(event: KeyboardEvent): void {
  const t = event.target;
  if (
    t instanceof HTMLElement &&
    (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)
  ) {
    event.preventDefault();
  }
}

/** The right-hand detail drawer shared by spans, logs, services and dashboards. */
export function DrawerShell({
  open,
  onClose,
  title,
  width = 560,
  children,
  footer,
}: DrawerShellProps) {
  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      direction="right"
      shouldScaleBackground
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <DrawerPrimitive.Content
          onEscapeKeyDown={keepOpenWhileTyping}
          aria-describedby={undefined}
          className={cn(
            "fixed top-0 right-0 bottom-0 left-auto z-[1100] flex h-full select-text flex-col overflow-hidden",
            "border-[var(--line)] border-l bg-[var(--bg-canvas)] text-[var(--fg-1)] shadow-[-2px_0_8px_rgba(0,0,0,0.12)]"
          )}
          style={{ width }}
        >
          <DrawerPrimitive.Title className="sr-only">{title}</DrawerPrimitive.Title>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
          {footer ? (
            <div className="flex shrink-0 items-center gap-2 border-[var(--line)] border-t bg-[var(--bg-card)] px-[18px] py-2.5">
              {footer}
            </div>
          ) : null}
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}
