import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-transparent text-sm font-medium whitespace-nowrap transition-[background-color,border-color,color,opacity] duration-[var(--dur-fast)] outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)] active:opacity-70 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-[var(--ink)] text-[var(--paper)] hover:opacity-85",
        outline:
          "border-[var(--control)] bg-transparent text-[var(--ink)] hover:border-[var(--ink)] hover:bg-[var(--sunk)] aria-expanded:bg-[var(--sunk)]",
        secondary:
          "border-[var(--control)] bg-transparent text-[var(--ink)] hover:border-[var(--ink)] hover:bg-[var(--sunk)] aria-expanded:bg-[var(--sunk)]",
        ghost:
          "text-[var(--ink)] hover:bg-[var(--sunk)] aria-expanded:bg-[var(--sunk)]",
        destructive:
          "border-[var(--danger)] bg-transparent text-[var(--danger)] hover:bg-[var(--sunk)]",
        link: "text-[var(--ink)] underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-[var(--control-height)] gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "h-6 gap-1 px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 px-2.5 text-[0.8125rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-[var(--control-height)]",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
