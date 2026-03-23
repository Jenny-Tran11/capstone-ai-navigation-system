import * as React from "react";
import { Pressable, Text, type PressableProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "flex flex-row items-center justify-center rounded-md web:cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-blue-600 active:opacity-90",
        outline: "border border-neutral-300 bg-white active:bg-neutral-100",
        ghost: "active:bg-neutral-100",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 px-3",
        lg: "h-12 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const buttonTextVariants = cva("text-center font-medium", {
  variants: {
    variant: {
      default: "text-white",
      outline: "text-neutral-900",
      ghost: "text-neutral-900",
    },
    size: {
      default: "text-base",
      sm: "text-sm",
      lg: "text-lg",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface ButtonProps
  extends PressableProps,
    VariantProps<typeof buttonVariants> {
  label: string;
  className?: string;
  textClassName?: string;
}

export function Button({
  label,
  variant,
  size,
  className,
  textClassName,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      className={cn(
        buttonVariants({ variant, size }),
        disabled && "opacity-50",
        className
      )}
      disabled={disabled}
      {...props}
    >
      <Text className={cn(buttonTextVariants({ variant, size }), textClassName)}>
        {label}
      </Text>
    </Pressable>
  );
}
