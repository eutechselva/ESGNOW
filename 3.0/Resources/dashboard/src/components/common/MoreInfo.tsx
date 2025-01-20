import React from "react";
import { Popover } from "uxp/components";
import './MoreInfo.scss';
interface MoreInfoProps<T> {
    items: T[];
    renderItem:(item:T)=>React.ReactElement;
    title:string;
}
export function MoreInfo<T>(props:MoreInfoProps<T>) {
    return <div className='ums-more-info'>
        {
            <Popover
            content={()=><div className='more-content'>
                {props.items.map((x)=>props.renderItem(x))}
            </div>}
            title={props.title}
            >
                <div className='content'>{`${props.items.length} item${props.items.length==1 ? '':'s'}`}</div>
            </Popover>
        }
    </div>
}
