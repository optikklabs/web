import { Drawer, DrawerContent } from "@shared/components/primitives/ui/drawer";
import { cn } from "@shared/lib/utils";
import type React from "react";
import { memo, useCallback, useEffect, useRef } from "react";

interface SidePanelProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly mode?: "modal" | "aside";
  readonly width?: number | string;
  readonly resizable?: boolean;
  readonly minWidth?: number;
  readonly maxWidth?: number;
  readonly onResize?: (width: number) => void;
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly style?: React.CSSProperties;
}

function SidePanelComponent({
  open,
  onClose,
  mode = "modal",
  width = 640,
  resizable = false,
  minWidth = 320,
  maxWidth = 1200,
  onResize,
  children,
  className,
  style,
}: SidePanelProps) {
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const delta = startXRef.current - e.clientX;
      const next = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + delta));

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => onResize?.(next));
    },
    [maxWidth, minWidth, onResize]
  );

  const onPointerUp = useCallback(() => {
    draggingRef.current = false;
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  }, [onPointerMove]);

  const onHandlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    startXRef.current = e.clientX;

    const currentWidth =
      typeof width === "number" ? width : Number.parseInt(String(width), 10) || 640;
    startWidthRef.current = currentWidth;

    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const t = e.target;
      if (t instanceof HTMLElement) {
        const tag = t.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || t.isContentEditable) return;
      }
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  if (mode === "modal") {
    return (
      <Drawer
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) onClose();
        }}
        direction="right"
      >
        <DrawerContent
          className={cn("top-0 right-0 left-auto h-full overflow-auto", className)}
          style={{ width, ...style }}
        >
          {children}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <aside
      aria-label="Detail panel"
      style={{ width, ...style }}
      className={cn(
        "absolute top-0 right-0 bottom-0 z-30 flex flex-col border-border border-l bg-background shadow-[-4px_0_16px_rgba(0,0,0,0.25)]",
        className
      )}
    >
      {resizable && onResize && (
        <div
          role="separator"
          tabIndex={-1}
          aria-orientation="vertical"
          aria-label="Resize panel"
          onPointerDown={onHandlePointerDown}
          className="-translate-x-[2px] absolute top-0 bottom-0 left-0 z-10 w-[5px] cursor-col-resize hover:bg-[var(--color-primary,#648FFF)]/30 active:bg-[var(--color-primary,#648FFF)]/50"
        />
      )}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </aside>
  );
}

export const SidePanel = memo(SidePanelComponent);
export type { SidePanelProps };
