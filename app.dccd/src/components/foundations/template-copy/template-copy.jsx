import { cloneElement, createContext, isValidElement, useContext, useMemo } from "react";
const CopyContext = createContext(null);
const MenuContext = createContext(null);
export function TemplateMenuProvider({ languageSelector, children }) {
    return <MenuContext.Provider value={languageSelector ?? null}>{children}</MenuContext.Provider>;
}
export function useTemplateLanguageSelector() {
    return useContext(MenuContext);
}
export function TemplateCopyProvider({ translate, render, children }) {
    const settings = useMemo(() => ({ translate, render }), [translate, render]);
    return <CopyContext.Provider value={settings}>{children}</CopyContext.Provider>;
}
const textProps = new Set([
    "children", "title", "subtitle", "description", "label", "textValue", "placeholder", "alt",
    "aria-label", "aria-description", "metricLabel", "emptyMessage", "caption", "heading", "text", "content", "renderValue",
]);
const dataProps = new Set(["items", "options", "tabs", "columns", "series", "ranges", "stats", "data", "nodes", "bar", "line"]);
const dataText = new Set(["label", "title", "description", "subtitle", "header", "role", "joined"]);
const renderProps = new Set(["children", "cell", "header", "formatter", "tickFormatter", "labelFormatter", "renderItem", "node", "link", "tick", "label", "content", "renderValue"]);
export function translateTemplateCopy(value, translate) {
    function visit(value, data = false) {
        if (typeof value === "string")
            return data ? value : translate(value);
        if (Array.isArray(value)) {
            const result = value.map(item => visit(item, data));
            return result.every((item, index) => item === value[index]) ? value : result;
        }
        if (isValidElement(value)) {
            if (typeof value.type === "string" && ["pre", "code", "kbd", "script", "style"].includes(value.type))
                return value;
            const updates = {};
            for (const [key, original] of Object.entries(value.props)) {
                if (textProps.has(key))
                    updates[key] = renderProps.has(key) && typeof original === "function"
                        ? (...args) => visit(original(...args)) : visit(original);
                else if (dataProps.has(key))
                    updates[key] = visit(original, true);
                else if (renderProps.has(key) && typeof original === "function")
                    updates[key] = (...args) => visit(original(...args));
            }
            return Object.entries(updates).some(([key, result]) => result !== value.props[key]) ? cloneElement(value, updates) : value;
        }
        if (data && value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
            const result = { ...value };
            for (const [key, original] of Object.entries(result)) {
                if (renderProps.has(key) && typeof original === "function")
                    result[key] = (...args) => visit(original(...args));
                else if (dataText.has(key))
                    result[key] = visit(original);
                else if (original && typeof original === "object")
                    result[key] = visit(original, true);
            }
            return Object.entries(result).some(([key, item]) => item !== value[key]) ? result : value;
        }
        return value;
    }
    return visit(value);
}
export function useTemplateCopy() {
    const settings = useContext(CopyContext);
    return useMemo(() => (node) => settings?.render ? settings.render(node) : settings ? translateTemplateCopy(node, settings.translate) : node, [settings]);
}
