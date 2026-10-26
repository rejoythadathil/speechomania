import { cx, sortCx } from "@/utils/cx";
const styles = sortCx({
    base: "inline-flex items-center justify-center rounded-md px-1.5 whitespace-nowrap transition-[padding,font-size] duration-200 ease",
    variant: {
        bold: "py-0.5 text-body-medium",
        subtle: "py-1 text-body-medium",
        caption: "py-1 text-caption-1-medium",
    },
    color: {
        orange: "bg-status-orange-background text-status-orange-text",
        lime: "bg-status-lime-background text-status-lime-text",
        rose: "bg-status-rose-background text-status-rose-text",
        yellow: "bg-status-yellow-background text-status-yellow-text",
        cyan: "bg-status-cyan-background text-status-cyan-text",
        blue: "bg-status-blue-background text-status-blue-text",
        purple: "bg-status-purple-background text-status-purple-text",
        neutral: "bg-background-tertiary-default text-text-secondary",
        gray: "bg-background-secondary-default text-text-primary",
        soft: "bg-background-secondary-default text-text-secondary",
    },
});
export function Chip({ variant = "bold", color = "neutral", className, ref, ...props }) {
    return (<span ref={ref} className={cx(styles.base, styles.variant[variant], styles.color[color], className)} {...props}/>);
}
