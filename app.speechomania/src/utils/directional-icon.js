import { RiArrowLeftLine, RiArrowLeftSLine, RiArrowRightLine, RiArrowRightSLine, RiSidebarFoldLine, RiSidebarUnfoldLine, } from "@remixicon/react";
const directionalIcons = new Set([
    RiArrowLeftLine, RiArrowLeftSLine, RiArrowRightLine, RiArrowRightSLine,
    RiSidebarFoldLine, RiSidebarUnfoldLine,
]);
export function directionalIconClass(icon) {
    return directionalIcons.has(icon) ? "rtl:rotate-180" : undefined;
}
