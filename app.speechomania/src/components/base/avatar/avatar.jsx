import { cx, sortCx } from "@/utils/cx";
const styles = sortCx({
    base: "inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full text-center align-middle transition-[width,height,font-size] duration-200 ease",
    size: {
        xs: "size-5 text-[10px] leading-[15px] font-semibold",
        sm: "size-6 text-caption-1-semibold tracking-normal",
        md: "size-8 text-headline-semibold",
        lg: "size-9 text-[18px] leading-6 font-semibold",
    },
    color: {
        neutral: "bg-avatar-neutral-background text-text-secondary",
        blue: "bg-blue-300 text-blue-900",
        lime: "bg-lime-200 text-lime-700",
        pink: "bg-pink-200 text-pink-500",
    },
});
export function Avatar({ size = "md", color = "neutral", src, alt, initials, className, ref, ...props }) {
    return (<span ref={ref} className={cx(styles.base, styles.size[size], styles.color[color], className)} {...props}>
      {src ? (<img src={src} alt={alt ?? ""} loading="lazy" decoding="async" className="size-full object-cover"/>) : (initials)}
    </span>);
}
