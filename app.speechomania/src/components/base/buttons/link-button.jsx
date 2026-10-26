import { cx, sortCx } from "@/utils/cx";
import { directionalIconClass } from "@/utils/directional-icon";
const styles = sortCx({
    base: [
        "inline-flex items-center justify-center gap-1 whitespace-nowrap",
        "font-sans select-none cursor-pointer rounded-sm",
        "underline-offset-3 hover:underline",
        "transition-colors duration-150 ease",
        "outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-border-focus-ring",
        "disabled:cursor-not-allowed disabled:no-underline aria-disabled:cursor-not-allowed aria-disabled:no-underline",
    ].join(" "),
    size: {
        medium: "text-body-medium",
        small: "text-body-medium",
        xs: "text-caption-1-semibold",
    },
    icon: {
        medium: "size-5 shrink-0",
        small: "size-[18px] shrink-0",
        xs: "size-3.5 shrink-0",
    },
    variant: {
        primary: [
            "text-accent-600 active:text-accent-800",
            "disabled:text-text-tertiary aria-disabled:text-text-tertiary",
        ].join(" "),
        secondary: [
            "text-text-secondary active:text-text-primary",
            "disabled:text-text-tertiary aria-disabled:text-text-tertiary",
        ].join(" "),
    },
});
export function LinkButton({ variant = "primary", size = "medium", leadingIcon: Leading, trailingIcon: Trailing, children, className, disabled = false, ...props }) {
    const classes = cx(styles.base, styles.size[size], styles.variant[variant], className);
    const content = (<>
      {Leading ? <Leading className={cx(styles.icon[size], directionalIconClass(Leading))} aria-hidden/> : null}
      {children !== undefined && children !== null && <span>{children}</span>}
      {Trailing ? <Trailing className={cx(styles.icon[size], directionalIconClass(Trailing))} aria-hidden/> : null}
    </>);
    if (props.href !== undefined) {
        const { ref, href, ...anchorProps } = props;
        return (<a ref={ref} href={disabled ? undefined : href} aria-disabled={disabled || undefined} className={classes} {...anchorProps}>
        {content}
      </a>);
    }
    const { ref, type = "button", ...buttonProps } = props;
    return (<button ref={ref} type={type} disabled={disabled} className={classes} {...buttonProps}>
      {content}
    </button>);
}
export const linkButtonStyles = styles;
