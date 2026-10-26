import { createContext, useContext, } from "react";
import { Group as AriaGroup, Input as AriaInput, TextField as AriaTextField, useLocale, } from "react-aria-components";
import { Label } from "./label";
import { HintText } from "./hint-text";
import { cx, sortCx } from "@/utils/cx";
export const TextFieldContext = createContext({});
export function TextField({ size = "medium", fieldClassName, inputClassName, className, children, ...props }) {
    return (<TextFieldContext.Provider value={{ size, fieldClassName, inputClassName }}>
      <AriaTextField {...props} data-input-size={size} className={cx("group flex h-max w-full flex-col items-start gap-1", className)}>
        {children}
      </AriaTextField>
    </TextFieldContext.Provider>);
}
TextField.displayName = "TextField";
const inputStyles = sortCx({
    field: [
        "relative flex w-full items-center",
        "rounded-2lg",
        "bg-background-tertiary-default text-foreground-icon-tertiary",
        "ring-2 ring-inset ring-transparent",
        "transition-[background-color,box-shadow,color] duration-[var(--input-transition-ms)] ease",
    ].join(" "),
    fieldSize: {
        medium: "p-2",
        small: "h-8 px-1.5 py-2",
    },
    fieldWithAddonSize: {
        medium: "h-9 ps-1 pe-2 py-2",
        small: "h-8 ps-1 pe-1.5 py-2",
    },
    content: "flex w-full items-center gap-2 min-w-0",
    leftSection: "flex flex-1 items-center gap-0.5 min-w-0",
    input: [
        "min-w-0 flex-1 bg-transparent border-0 outline-none p-0 m-0",
        "font-sans text-body-regular text-text-primary",
        "placeholder:text-text-tertiary",
        "focus:placeholder:text-text-primary",
        "disabled:text-input-disabled-text disabled:placeholder:text-input-disabled-text",
        "disabled:cursor-not-allowed",
        "aria-invalid:placeholder:text-text-error-placeholder",
    ].join(" "),
    icon: "size-5 shrink-0",
});
export function InputBase({ size: sizeProp, leadingIcon: Leading, trailingIcon: Trailing, leadingAddon, fieldClassName, className, ref, groupRef, ...inputProps }) {
    const { direction } = useLocale();
    const ctx = useContext(TextFieldContext);
    const size = sizeProp ?? ctx.size ?? "medium";
    const hasAddon = leadingAddon !== undefined && leadingAddon !== null;
    return (<AriaGroup ref={groupRef} className={({ isFocusWithin, isHovered, isDisabled, isInvalid }) => cx(inputStyles.field, hasAddon
            ? inputStyles.fieldWithAddonSize[size]
            : inputStyles.fieldSize[size], isHovered &&
            !isFocusWithin &&
            !isDisabled &&
            !isInvalid &&
            "ring-border-button-hover", isFocusWithin &&
            !isDisabled &&
            !isInvalid &&
            "ring-border-button-active", isDisabled &&
            "bg-input-disabled-background text-input-disabled-foreground", isInvalid && "bg-background-tertiary-error text-foreground-icon-error", ctx.fieldClassName, fieldClassName)}>
      <div className={inputStyles.content}>
        <div className={inputStyles.leftSection}>
          {hasAddon ? (leadingAddon) : Leading ? (<Leading className={inputStyles.icon} aria-hidden/>) : null}
          <AriaInput ref={ref} {...inputProps} className={cx(inputStyles.input, direction === "rtl" ? "pr-1 text-right" : "pl-1 text-left", ctx.inputClassName, className)}/>
        </div>
        {Trailing ? (<Trailing className={inputStyles.icon} aria-hidden/>) : null}
      </div>
    </AriaGroup>);
}
InputBase.displayName = "InputBase";
export function Input({ label, hint, tooltip, placeholder, inputDir, leadingIcon, trailingIcon, leadingAddon, fieldClassName, ref, groupRef, className, ...textFieldProps }) {
    return (<TextField {...textFieldProps} className={className} aria-label={textFieldProps["aria-label"] ??
            (!label && typeof placeholder === "string" ? placeholder : undefined)}>
      {({ isRequired, isInvalid }) => (<>
          {label && (<Label isRequired={isRequired} isInvalid={isInvalid} tooltip={tooltip}>
              {label}
            </Label>)}
          <InputBase dir={inputDir ?? (["email", "url", "tel"].includes(textFieldProps.type ?? "") ? "ltr" : undefined)} ref={ref} groupRef={groupRef} placeholder={placeholder} leadingIcon={leadingIcon} trailingIcon={trailingIcon} leadingAddon={leadingAddon} fieldClassName={fieldClassName}/>
          {hint && <HintText isInvalid={isInvalid}>{hint}</HintText>}
        </>)}
    </TextField>);
}
Input.displayName = "Input";
