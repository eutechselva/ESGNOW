export const LabelIcons = {
    Baseline:'far analytics',
    MeterName:'far tachometer-alt',
    Description: 'far sticky-note',
    Unit: 'far ruler-vertical',
    Location: 'far map-marker',
    Tags: 'far tag',
    Metadata: 'far info',
};

const colorList:string[] = [
    '#FF9F9F',
    '#FFC39B',
    '#C8EAA6',
    '#EAF0F2',
 ];
export function nextColor(i?:number) {
    if (!i) i = Math.floor(Math.random()*colorList.length);
    return colorList[i % colorList.length];
}