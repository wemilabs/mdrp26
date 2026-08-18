import { cn } from "@/lib/utils";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type { VariantProps } from "class-variance-authority";
import { badgeVariants } from "./badge-variants";

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    render?: React.ReactElement;
  }) {
  return useRender({
    defaultTagName: "span",
    render,
    props: mergeProps<"span">(
      {
        "data-slot": "badge",
        "data-variant": variant,
        className: cn(badgeVariants({ variant }), className),
      } as React.ComponentProps<"span">,
      props,
    ),
  });
}

export { Badge };
