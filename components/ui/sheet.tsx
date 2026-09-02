"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";

type SheetPointerEvent = Parameters<NonNullable<SheetPrimitive.Popup.Props["onPointerDown"]>>[0];

function Sheet({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/10 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs",
        className,
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  dragDismiss = false,
  dragHandleClassName,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: "top" | "right" | "bottom" | "left";
  showCloseButton?: boolean;
  dragDismiss?: boolean;
  dragHandleClassName?: string;
}) {
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const dragRef = React.useRef<{ pointerId: number; startY: number; lastY: number; lastTime: number; velocity: number } | null>(null);
  const popupRef = React.useRef<HTMLDivElement>(null);
  const frameRef = React.useRef<number | null>(null);
  const dragOffsetRef = React.useRef(0);
  const { style, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, ...popupProps } = props;

  function handlePointerDown(event: SheetPointerEvent) {
    onPointerDown?.(event);
    if (!dragDismiss || side !== "bottom" || !(event.target instanceof Element) || !event.target.closest("[data-sheet-drag-handle]")) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, startY: event.clientY, lastY: event.clientY, lastTime: performance.now(), velocity: 0 };
    popupRef.current?.style.setProperty("transition", "none");
    popupRef.current?.style.setProperty("will-change", "transform");
  }

  function handlePointerMove(event: SheetPointerEvent) {
    onPointerMove?.(event);
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const now = performance.now();
    drag.velocity = Math.max(0, event.clientY - drag.lastY) / Math.max(1, now - drag.lastTime);
    drag.lastY = event.clientY;
    drag.lastTime = now;
    dragOffsetRef.current = Math.min(Math.max(0, event.clientY - drag.startY), window.innerHeight * 0.8);
    if (frameRef.current === null) {
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        popupRef.current?.style.setProperty("transform", `translate3d(0, ${dragOffsetRef.current}px, 0)`);
      });
    }
  }

  function finishDrag(event: SheetPointerEvent) {
    onPointerUp?.(event);
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const distance = Math.max(0, event.clientY - drag.startY);
    dragRef.current = null;
    if (distance >= 72 || drag.velocity >= 0.11) {
      resetDragStyles();
      closeRef.current?.click();
    } else {
      settleDragStyles();
    }
  }

  function cancelDrag(event: SheetPointerEvent) {
    onPointerCancel?.(event);
    dragRef.current = null;
    settleDragStyles();
  }

  function resetDragStyles() {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    dragOffsetRef.current = 0;
    if (popupRef.current) {
      popupRef.current.style.removeProperty("transform");
      popupRef.current.style.removeProperty("transition");
      popupRef.current.style.removeProperty("will-change");
    }
  }

  function settleDragStyles() {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    dragOffsetRef.current = 0;
    if (!popupRef.current) return;
    popupRef.current.style.setProperty("transition", "transform 200ms cubic-bezier(0.32, 0.72, 0, 1)");
    popupRef.current.style.setProperty("transform", "translate3d(0, 0, 0)");
    window.setTimeout(resetDragStyles, 220);
  }

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        ref={popupRef}
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-popover bg-clip-padding text-sm text-popover-foreground shadow-lg transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0 data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=bottom]:data-ending-style:translate-y-[2.5rem] data-[side=bottom]:data-starting-style:translate-y-[2.5rem] data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=left]:data-ending-style:translate-x-[-2.5rem] data-[side=left]:data-starting-style:translate-x-[-2.5rem] data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=right]:data-ending-style:translate-x-[2.5rem] data-[side=right]:data-starting-style:translate-x-[2.5rem] data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=top]:data-ending-style:translate-y-[-2.5rem] data-[side=top]:data-starting-style:translate-y-[-2.5rem] data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm",
          className,
        )}
        {...popupProps}
        style={dragOffset ? { ...style, transform: `translateY(${dragOffset}px)`, transition: "none" } : style}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={cancelDrag}
      >
        {dragDismiss && side === "bottom" ? (
          <>
            <SheetPrimitive.Close render={<button ref={closeRef} type="button" className="sr-only" tabIndex={-1} aria-hidden="true" />} />
            <button
              type="button"
              data-sheet-drag-handle
              className={cn("mx-auto mt-2 h-10 w-20 cursor-grab rounded-full border-0 bg-transparent p-0 active:cursor-grabbing", dragHandleClassName)}
              aria-label="Swipe down to close"
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") closeRef.current?.click();
              }}
            />
          </>
        ) : null}
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-3 right-3"
                size="icon-sm"
              />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-0.5 p-4", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "font-heading text-base font-medium text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
