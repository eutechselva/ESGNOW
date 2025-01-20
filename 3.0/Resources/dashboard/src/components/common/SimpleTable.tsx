import React from "react";
import './SimpleTable.scss'
import classNames from "classnames";

interface SimpleTableProps {
    className?: string;
    showBordersUnderRows?: boolean
}

export const SimpleTable: React.FC<SimpleTableProps> = (props) => {
    const { showBordersUnderRows, children } = props

    return <table className={classNames("ums_simple_table", props.className, { 'ums_simple_table--bordered': showBordersUnderRows })}>
        {children}
    </table>
}