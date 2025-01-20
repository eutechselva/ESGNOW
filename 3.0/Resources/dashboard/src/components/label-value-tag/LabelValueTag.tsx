import React from "react";
import './LabelValueTag.scss'

interface LabelValueTagProps {
    label: string,
    value: string
}

export const LabelValueTagProps: React.FunctionComponent<LabelValueTagProps> = (props) => {

    return <div className="ums-tag__container">
        <div className="ums-tag__label">{props.label}</div>
        <div className="ums-tag__value">{props.value}</div>
    </div>

}