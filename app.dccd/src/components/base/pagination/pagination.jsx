import { useTemplateCopy } from "@/components/foundations/template-copy/template-copy";
import { useEffect, useRef, useState } from "react";
import { RiArrowLeftLine, RiArrowRightLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
const DOTS = "dots";
function range(start, end) {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
function paginationRange(current, total, sibling) {
    const totalPageNumbers = sibling * 2 + 5;
    if (totalPageNumbers >= total)
        return range(1, total);
    const leftSibling = Math.max(current - sibling, 1);
    const rightSibling = Math.min(current + sibling, total);
    const showLeftDots = leftSibling > 2;
    const showRightDots = rightSibling < total - 2;
    if (!showLeftDots && showRightDots) {
        return [...range(1, 3 + 2 * sibling), DOTS, total];
    }
    if (showLeftDots && !showRightDots) {
        return [1, DOTS, ...range(total - (2 + 2 * sibling), total)];
    }
    return [1, DOTS, ...range(leftSibling, rightSibling), DOTS, total];
}
const cell = "flex size-8 shrink-0 items-center justify-center rounded-lg text-body-medium";
const COMPACT_WIDTH = 420;
function useIsCompact() {
    const ref = useRef(null);
    const [isCompact, setIsCompact] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el)
            return;
        const observer = new ResizeObserver(([entry]) => {
            setIsCompact(entry.contentRect.width < COMPACT_WIDTH);
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return [ref, isCompact];
}
export function Pagination({ page, totalPages, onChange, siblingCount = 1, className, previousLabel = "Previous", nextLabel = "Next", "aria-label": ariaLabel = "Pagination", }) {
    const localize = useTemplateCopy();
    const [navRef, isCompact] = useIsCompact();
    if (totalPages <= 1)
        return null;
    const pages = paginationRange(page, totalPages, isCompact ? 0 : siblingCount);
    return localize((<nav ref={navRef} aria-label={ariaLabel} className={cx("flex w-full items-center justify-between gap-2", className)}>
      <Button variant="secondary" size="small" iconOnly={isCompact} leadingIcon={RiArrowLeftLine} aria-label={isCompact ? previousLabel : undefined} disabled={page <= 1} onClick={() => onChange(page - 1)}>
        {isCompact ? undefined : previousLabel}
      </Button>

      <ul className="flex min-w-0 items-center gap-0.5">
        {pages.map((item, i) => item === DOTS ? (<li key={`dots-${i}`} aria-hidden className={cx(cell, "text-text-tertiary")}>
              …
            </li>) : (<li key={item}>
              <button type="button" aria-label={`Go to page ${item}`} aria-current={item === page ? "page" : undefined} onClick={() => onChange(item)} className={cx(cell, "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-border-focus-ring", item === page
                ? "border border-border-button-default bg-background-primary-default text-text-primary shadow-xs"
                : "text-text-secondary hover:bg-background-secondary-hover hover:text-text-primary")}>
                {item}
              </button>
            </li>))}
      </ul>

      <Button variant="secondary" size="small" iconOnly={isCompact} leadingIcon={isCompact ? RiArrowRightLine : undefined} trailingIcon={isCompact ? undefined : RiArrowRightLine} aria-label={isCompact ? nextLabel : undefined} disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        {isCompact ? undefined : nextLabel}
      </Button>
    </nav>));
}
