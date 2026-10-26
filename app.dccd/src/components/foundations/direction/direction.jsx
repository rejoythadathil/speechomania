import { I18nProvider, useLocale } from "react-aria-components";
import { cx } from "@/utils/cx";
export function DirectionProvider({ locale, ...props }) {
    return (<I18nProvider locale={locale}>
      <DirectionBoundary {...props}/>
    </I18nProvider>);
}
function DirectionBoundary({ children, className, ...props }) {
    const { locale, direction } = useLocale();
    return <div {...props} lang={locale} dir={direction} className={cx("contents", className)}>{children}</div>;
}
export function useDirection() {
    return useLocale().direction;
}
