import * as React from "react";
import { cn } from "@/lib/utils";

const RadioGroup = React.forwardRef(({ className, ...props }, ref) => {
  return <div className={cn("grid gap-2", className)} ref={ref} {...props} />;
});
RadioGroup.displayName = "RadioGroup";

const RadioGroupItem = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <input
      type="radio"
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-slate-300 text-red-600 focus:ring-red-500 dark:border-slate-700",
        className
      )}
      {...props}
    />
  );
});
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
