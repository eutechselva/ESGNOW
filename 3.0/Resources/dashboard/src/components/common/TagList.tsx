import React from "react";
import { Tag } from "@types";
import { removeReservedTags } from "./CustomInputs";
import './TagList.scss'

interface UITag {
    label: string,
    tooltip: string,
    color?: string
}
interface TagListProps {
    tags: UITag[]
    colors?: string[];
}

const TagColorList: string[] = [
    '#FF9F9F',
    '#FFC39B',
    '#C8EAA6',
    '#EAF0F2',
]

export function generateUITagsFromTags(selectedTags: { [type: string]: string }, tags: Tag[]): UITag[] {
    const tagsToShow = Object.entries(removeReservedTags(selectedTags)).map(([type, path], i) => {
        const tag = (tags || []).find(t => t.path == path)
        if (!tag) return null
        return {
            label: tag.path,
            tooltip: `${tag.type} ${tag.path}`
        }
    }).filter(t => !!t)

    return tagsToShow
}

export const TagList: React.FC<TagListProps> = (props) => {
    function pickColor(i: number) {
        let colorList = props.colors || TagColorList;
        return colorList[i % colorList.length];
    }

    return <div className="ums_tag_list">
        {
            (props.tags || []).map((tag, i) => <div
                style={{ backgroundColor: tag.color || pickColor(i) }}
                className='ums_tag_list__item'
                title={`${tag.tooltip} `}
            >
                {tag.label}
            </div>)
        }
    </div>

}