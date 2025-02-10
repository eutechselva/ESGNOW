import { BaselineType } from "@types";
import { IContextProvider, IWidgetObject } from "@uxp";
import { addDays, addHours, addSeconds, differenceInHours, eachDayOfInterval, eachHourOfInterval, endOfDay, formatDate, formatDistanceToNow, getDate, getDay, getHours, isValid, startOfDay } from "date-fns";
import _ from 'lodash'
import pluralize from 'pluralize'
import { hasValue, isRelativeDate, toDate, toNum } from "uxp/components";
import axios from "axios";

export function getRegisteredWidgets(): IWidgetObject[] {
    return (window as any).Widgets || []
}

export async function wait(time: number) {

    return new Promise<any>((done, nope) => {
        setTimeout(() => {
            done('time is up')
        }, time);
    })
}

export function camelCaseToSentenceCase(text: string) {
    return text.replace(/([a-z])([A-Z])/g, '$1 $2')
}

export function generateLabelValuePairsFromEnum<T extends { [key: string]: string }>(enumType: T) {
    return Object.keys(enumType)
        .map((key) => ({
            // Convert camel case to separate words
            label: camelCaseToSentenceCase(key), // key.replace(/([a-z])([A-Z])/g, '$1 $2'),
            value: enumType[key]
        }));
}

export function getLabelFonmEnum<T extends { [key: string]: string }>(value: string, enumType: T) {
    const type = Object.entries(enumType).find(([key, val]) => {
        return value == val
    })
    if (!type) return ''
    return camelCaseToSentenceCase(type[0])
}

export function toSentenceCase(text: string) {
    if (!text || typeof text !== 'string') return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function toSingular(word: string) {
    return pluralize.singular(word);
}

export function toPlural(word: string) {
    return pluralize.plural(word);
}

export function formatToDateString(d: string | number | Date, format: string) {
    const date = toDate(d)
    if (!!date) return formatDate(date, format);
    return null
}

export function formatToISOString(d: string | number | Date) {
    const date = toDate(d)
    if (!!date) return date.toISOString()
    return null
}

export function getRelativeTime(d: string | number | Date) {
    const date = toDate(d)
    if (!!date) return formatDistanceToNow(date) + ' ago'
    return null
}

export interface IRoundOffProperty {
    integer?: boolean,
    decimalPoints?: number,
}

export function roundOffValue(value: string | number, options: IRoundOffProperty) {
    const numberVal = toNum(value)
    if (!numberVal) return numberVal

    if (options?.integer) return (Math.round(numberVal + Number.EPSILON))
    else {
        const numOfDecimals = hasValue(options?.decimalPoints, true) ? options?.decimalPoints : 2
        const base = Math.pow(10, numOfDecimals)
        return Math.round((numberVal + Number.EPSILON) * base) / base
    }
}

export function joinParts(items: (string | number)[], joinBy: string, ignoreEmptyOrNullValues?: boolean) {
    if (!(items instanceof Array)) return ''

    if (ignoreEmptyOrNullValues) return (items || []).filter(t => hasValue(t, true, true)).join(joinBy)
    return (items || []).join(joinBy)
}

export function hasAnyFieldChanged(obj1: Record<string, any>, obj2: Record<string, any>, fields: string[]): boolean {
    return fields.some((field) => !_.isEqual(_.get(obj1, field), _.get(obj2, field)));
}

export function getChangedValues(obj1: Record<string, any>, obj2: Record<string, any>, fields: string[]): Record<string, any> {
    return fields.reduce((changes, field) => {
        const value1 = _.get(obj1, field);
        const value2 = _.get(obj2, field);

        if (!_.isEqual(value1, value2)) {
            changes[field] = value2;
        }

        return changes;
    }, {} as Record<string, any>);
}


export function convertJSONToLowercase(obj: any): any {
    // If obj is not an object or is null, return it directly (base case for recursion)
    if (typeof obj !== 'object' || obj === null) {
        return (typeof obj === 'string' ? obj.toLowerCase() : obj);
    }

    // If it's an array, map each element through the function recursively
    if (Array.isArray(obj)) {
        return obj.map(item => convertJSONToLowercase(item));
    }

    // If it's an object, process each key-value pair
    return Object.entries(obj).reduce((acc, [key, value]) => {
        const lowerKey = key.toLowerCase();
        const lowerValue = typeof value === 'string' ? value.toLowerCase() : convertJSONToLowercase(value);
        (acc as any)[lowerKey] = lowerValue;
        return acc;
    }, {});
}

export function getStartDate(d: string | Date) {
    const date = toDate(d)
    if (!date) return null
    return (startOfDay(date)).toISOString()
}

export function getEndDate(d: string | Date) {
    const date = toDate(d)
    if (!date) return null
    return (endOfDay(date)).toISOString()
}
export function getPreviousRangeFromRelativeDates(startDate: any, endDate: any, numOfRange: number) {

    if (!isRelativeDate(startDate) || !isRelativeDate(endDate)) return null

    const sd = getStartDate(startDate)
    const ed = getEndDate(endDate)

    if (!sd || !ed) return null
    if (!hasValue(numOfRange)) return { startDate: sd, endDate: ed }

    const durationInHours = differenceInHours(ed, sd)

    const prevRangeEndDate = getEndDate(addHours(addDays(sd, -1), -((numOfRange - 1) * durationInHours)))
    const prevRangeStartDate = getStartDate(addHours(prevRangeEndDate, -durationInHours))

    return { startDate: prevRangeStartDate, endDate: prevRangeEndDate }
}

// export function formatNumber(d: number | string | null | undefined, unit: string) {

//     const n = Number(d);
//     unit = unit || '';
//     if (isNaN(n)) return d;
//     if (n == 0) return '0' + unit;
//     if (n > 999) {
//         return new Intl.NumberFormat().format(n) + unit;
//     }
//     if (n > 99) {
//         return n.toFixed(1) + unit;
//     }
//     return n.toFixed(2) + unit;
// }

export function formatNumber(value: any, def = 0, unit?: string): number | string {
    const number = toNum(value, def);

    // Determine decimal points based on total 6 digits (integer + decimal)
    let decimalPoints = 0;
    if (number % 1 !== 0) {
        const intDigits = Math.floor(number).toString().length;
        decimalPoints = Math.max(0, 6 - intDigits);
    }

    const roundedValue = roundOffValue(number, { decimalPoints });
    const roundedValueFormatted = (new Intl.NumberFormat().format(roundedValue));

    // Append unit if provided
    return hasValue(unit) ? `${roundedValueFormatted}${unit}` : roundedValueFormatted;
}


export function removeDuplicates<T>(array: T[], keys: keyof T | (keyof T)[]): T[] {
    if (!Array.isArray(array) || !array.length) return array;

    // Convert keys into an array if it's a single key
    const keyArray = Array.isArray(keys) ? keys : [keys];

    return _.uniqBy(array, (item) => {
        // Create a unique identifier by joining the values of the specified keys
        return keyArray.map((key) => item[key]).join('|');
    });
}


export async function checkFileExists(path: string): Promise<boolean> {
    try {
        const response = await fetch(path, { method: 'HEAD' });
        return response.ok; // Check if the request succeeded
    } catch (error) {
        console.log(`Error checking icon at path "${path}":`, error);
        return false;
    }
}

export function sortByKeys<T>(array: T[], sortKeys: Partial<Record<keyof T, 'asc' | 'desc'>>): T[] {
    const keys = Object.keys(sortKeys) as (keyof T)[];
    const orders = keys.map((key) => sortKeys[key]);
    return _.orderBy(array, keys, orders);
}

type ServiceMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export async function executeComponent(context: IContextProvider, component: string, route: string, method: ServiceMethod, parameters: any, body?: any) {
    if (!route.startsWith('/')) route = '/' + route;
    try {

        let config: any = {
            url: `/components/${component}${route}`,
            method: method,
            headers: {
                'Authorization': `APIKEY ${context.apiKey}`,
                'Content-Type': 'application/json',
            }
        }

        if (['patch', 'post', 'put'].includes(method)) {
            config.data = body || {}
        }
        else {
            config.params = parameters
        }

        let resp = await axios(config)
        return resp.data
    } catch (e) {
        let obj = e?.response?.data || e;
        throw obj;
    }
}