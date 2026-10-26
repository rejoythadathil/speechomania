import { Cell, Column, Row, Table as AriaTable, TableBody, TableHeader, } from "react-aria-components";
import { cx } from "@/utils/cx";
export function Table({ size = "md", className, containerClassName, ref, ...props }) {
    return (<div className={cx("w-full overflow-x-auto", containerClassName)}>
      <AriaTable ref={ref} {...props} className={cx("bui-table", size === "sm" && "bui-table-sm", className)}/>
    </div>);
}
export { TableHeader, Column as TableColumn, TableBody, Row as TableRow, Cell as TableCell, };
