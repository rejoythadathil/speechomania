import { Text as AriaText } from "react-aria-components";
import { cx } from "@/utils/cx";
export function HintText({ isInvalid = false, className, ...props }) {
    return (<AriaText slot={isInvalid ? "errorMessage" : "description"} {...props} className={cx("pt-px text-caption-1-medium text-text-secondary", isInvalid && "text-text-error-primary", className)}/>);
}
