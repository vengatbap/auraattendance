import * as React from "react";
import { Controller, FieldValues, UseFormReturn, FormProvider, useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";

// Provider component that supplies RHF context to children.
// Do not render a <form> element here to avoid nested <form> issues.
export const Form = ({
  children,
  form,
}: React.PropsWithChildren<{
  form?: UseFormReturn<any>;
}>) => {
  // If a form instance is provided, wrap with FormProvider so children can use RHF hooks via context.
  if (form) {
    return <FormProvider {...form}>{children}</FormProvider>;
  }

  // If no form instance is provided, assume consumers use useFormContext() themselves.
  return <>{children}</>;
};

export const FormField = <T extends FieldValues>({
  control,
  name,
  render,
}: {
  control: any;
  name: keyof T;
  render: (props: { field: any }) => React.ReactElement;
}) => {
  return (
    <Controller
      control={control}
      name={name as string}
      render={({ field }) => render({ field })}
    />
  );
};

export const FormItem = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("space-y-2", className)} {...props}>
    {children}
  </div>
);

export const FormLabel = ({
  children,
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn("text-sm font-medium text-foreground", className)} {...props}>
    {children}
  </label>
);

export const FormControl = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex w-full flex-col space-y-1", className)} {...props}>
    {children}
  </div>
);

export const FormMessage = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-destructive", className)} {...props}>
    {children}
  </p>
);

// Export a type that matches the usage in the login page
export type FormComponents = {
  Form: typeof Form;
  FormField: typeof FormField;
  FormItem: typeof FormItem;
  FormLabel: typeof FormLabel;
  FormControl: typeof FormControl;
  FormMessage: typeof FormMessage;
};
