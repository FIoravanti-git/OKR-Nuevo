import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border px-2.5 py-0 text-[0.6875rem] font-semibold tracking-wide whitespace-nowrap transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "border-primary/15 bg-primary text-primary-foreground [a]:hover:bg-primary/90",
        secondary:
          "border-border/60 bg-secondary/90 text-secondary-foreground [a]:hover:bg-secondary",
        destructive:
          "border-destructive/20 bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:border-destructive/25 dark:bg-destructive/15 dark:focus-visible:ring-destructive/30 [a]:hover:bg-destructive/15",
        outline:
          "border-border/80 bg-background text-foreground [a]:hover:bg-muted/60 [a]:hover:text-foreground",
        ghost:
          "border-transparent hover:bg-muted/70 hover:text-foreground dark:hover:bg-muted/40",
        link: "border-transparent font-medium text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
