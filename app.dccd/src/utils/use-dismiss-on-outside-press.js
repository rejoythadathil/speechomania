import { useEffect, useRef } from "react";
export function useDismissOnOutsidePress(isOpen, onDismiss, refs) {
    useEffect(() => {
        if (!isOpen)
            return;
        const handlePointerDown = (event) => {
            const target = event.target;
            if (refs.some((ref) => ref.current?.contains(target)))
                return;
            onDismiss();
        };
        document.addEventListener("pointerdown", handlePointerDown, true);
        return () => document.removeEventListener("pointerdown", handlePointerDown, true);
    }, [isOpen, onDismiss, refs]);
}
export function useTriggerToggle(isOpen, triggerRef) {
    const suppressReopenRef = useRef(false);
    useEffect(() => {
        if (!isOpen)
            return;
        const handlePointerDown = (event) => {
            if (!triggerRef.current?.contains(event.target))
                return;
            suppressReopenRef.current = true;
            setTimeout(() => {
                suppressReopenRef.current = false;
            }, 400);
        };
        document.addEventListener("pointerdown", handlePointerDown, true);
        return () => document.removeEventListener("pointerdown", handlePointerDown, true);
    }, [isOpen, triggerRef]);
    return (next) => {
        if (next && suppressReopenRef.current) {
            suppressReopenRef.current = false;
            return false;
        }
        return true;
    };
}
