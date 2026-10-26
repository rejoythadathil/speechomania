import { createContext, useContext, useRef, useState } from "react";
import { Button as AriaButton, ListBox as AriaListBox, ListBoxItem as AriaListBoxItem, Popover as AriaPopover, Select as AriaSelect, SelectValue as AriaSelectValue, } from "react-aria-components";
import { MENU_ITEM, MENU_ITEM_ACTIVE, MENU_ITEMS_CONTAINER, MENU_POPOVER_SURFACE, MENU_POPOVER_WIDTH, } from "@/components/base/dropdown/menu-styles";
import { ChevronDownSmall } from "@/components/foundations/icons/chevrons";
import { cx } from "@/utils/cx";
import { useDismissOnOutsidePress, useTriggerToggle } from "@/utils/use-dismiss-on-outside-press";
const SelectSizeContext = createContext("md");
export function Select({ className, triggerClassName, popoverClassName, size = "md", children, items, renderValue, ref, ...props }) {
    const triggerRef = useRef(null);
    const popoverRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);
    useDismissOnOutsidePress(isOpen, () => setIsOpen(false), [triggerRef, popoverRef]);
    const allowOpenChange = useTriggerToggle(isOpen, triggerRef);
    return (<AriaSelect ref={ref} {...props} isOpen={isOpen} onOpenChange={(o) => allowOpenChange(o) && setIsOpen(o)} className={cx("group flex flex-col", className)}>
      {({ isOpen }) => (<>
          <AriaButton ref={triggerRef} className={cx("flex w-full cursor-pointer items-center justify-between rounded-2lg", "border border-border-button-default bg-background-primary-default shadow-xs", "text-text-primary", "transition-[background-color,border-color,box-shadow,padding,font-size] duration-200 ease", "hover:bg-background-primary-hover hover:border-border-button-hover", "outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-border-focus-ring", "disabled:cursor-not-allowed disabled:bg-background-primary-disabled disabled:text-text-tertiary disabled:shadow-none", size === "sm"
                ? "gap-1 px-[7px] py-1 text-body-2-medium"
                : "gap-1.5 px-2.5 py-2 text-body-medium", triggerClassName)}>
            <AriaSelectValue className={cx("flex min-w-0 items-center truncate", size === "sm" ? "gap-1" : "gap-[5px]")}>
              {renderValue}
            </AriaSelectValue>
            <ChevronDownSmall className={cx("shrink-0 text-text-secondary transition-transform duration-200 ease", size === "sm" ? "size-3.5" : "size-4", isOpen && "rotate-180")}/>
          </AriaButton>
          <AriaPopover ref={popoverRef} isNonModal offset={4} className={cx(MENU_POPOVER_WIDTH, MENU_POPOVER_SURFACE, "p-2", popoverClassName)}>
            <AriaListBox items={items} className={cx(MENU_ITEMS_CONTAINER, "max-h-[240px] overflow-auto")}>
              <SelectSizeContext.Provider value={size}>{children}</SelectSizeContext.Provider>
            </AriaListBox>
          </AriaPopover>
        </>)}
    </AriaSelect>);
}
export function SelectItem({ className, children, ...props }) {
    const size = useContext(SelectSizeContext);
    return (<AriaListBoxItem {...props} className={(state) => cx(MENU_ITEM, size === "sm" ? "px-2 py-1.5 text-body-2-medium" : "text-body-medium", (state.isFocused || state.isSelected) && MENU_ITEM_ACTIVE, state.isDisabled && "cursor-not-allowed text-text-disabled", typeof className === "function" ? className(state) : className)}>
      {children}
    </AriaListBoxItem>);
}
