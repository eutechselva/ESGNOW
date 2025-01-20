import { Consumption, ILocation, MeterGroup, MeterType, Tag, UtilityMeter, VirtualMeter } from "@types";
import { hasValue } from "uxp/components";

export function getConsmptionAndBaselineValue(meter: UtilityMeter | VirtualMeter | MeterGroup, selectedBaseline?: string, baselineRange?: number): { consumption: Consumption, baselineValue: number } {

    if (!meter) return { consumption: [], baselineValue: 0 }
    if (!hasValue(selectedBaseline)) return { consumption: meter?.hourlyConsumption || [], baselineValue: 0 }

    if (!baselineRange) baselineRange = 1
    const consumption = (baselineRange == 1 ? meter.hourlyConsumption : meter.dailyConsumption) || [];

    const bv = meter?.baselines?.[selectedBaseline] || 0
    if (!bv) return { consumption: consumption, baselineValue: 0 }

    const baselineValue = (baselineRange == 1) ? bv / 24 : bv
    return { consumption, baselineValue }
}
export function hasDeviated(meter: UtilityMeter | VirtualMeter | MeterGroup, selectedBaseline?: string, baselineRange?: number) {
    const { consumption, baselineValue } = getConsmptionAndBaselineValue(meter, selectedBaseline, baselineRange)
    if (consumption?.length == 0 || !hasValue(baselineValue)) return false
    return consumption.some((c) => (c.value >= baselineValue))
}

export function calculateTotalConsumptionAndBaselinValue(meter: UtilityMeter | VirtualMeter | MeterGroup, selectedBaseline?: string, baselineRange?: number): { totalConsumption: number, totalBaselineValue: number } {

    const { consumption, baselineValue } = getConsmptionAndBaselineValue(meter, selectedBaseline, baselineRange)
    const total = (consumption || []).reduce((a, b) => (a + b.value), 0)

    const totalBaselineValue = (baselineRange == 1) ? (24 * baselineValue) : (baselineValue * baselineRange)

    return { totalConsumption: total, totalBaselineValue: totalBaselineValue }
}


export function findMeterDetails(id: string, utilityMeters: UtilityMeter[], virtualmeters: VirtualMeter[], meterGroups: MeterGroup[], meterType?: MeterType) {

    if (hasValue(meterType)) {
        return ((meterType == MeterType.MeterGroups ? meterGroups : (meterType == MeterType.VirtualMeters ? virtualmeters : utilityMeters)) || []).find(m => (m.meterId == id || m.id == id))
    }

    let inst: UtilityMeter | VirtualMeter | MeterGroup = (meterGroups || []).find(m => (m.id == id))
    if (inst) return inst
    inst = (virtualmeters || []).find(m => m.meterId == id)
    if (inst) return inst
    return (utilityMeters || []).find(m => m.meterId == id)
}

export function getMeterType(meter: UtilityMeter | VirtualMeter | MeterGroup): MeterType {
    if ('scalingFactor' in meter) return MeterType.VirtualMeters
    else if ('members' in meter) return MeterType.MeterGroups
    return MeterType.Meters
}

export function findLocation(path: string, locations: ILocation[]) {
    const parts = path?.split('/')
    const locationKey = parts[parts.length - 1]
    const inst = (locations || []).find(l => l.LocationKey == locationKey)
    return inst
}


export function findTagDetails(path: string, tags: Tag[], locations: ILocation[]): Tag | ILocation {
    let _p = path.toLowerCase();
    if (_p.startsWith('/')) _p = _p.substring(1);
    if (_p.endsWith('/')) _p = _p.substring(0,_p.length-1);
    const tag = tags.find(t => t.path.toLowerCase() == _p)
    if (tag) return tag
    return findLocation(path, locations)
}