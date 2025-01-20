import { BaselineType, UtilityMeterType } from "@types";
import { getAllBaselineTypes, getAllUtilityMeterTypes, getBaseUnit } from "@ums-service";
import { IContextProvider } from "@uxp";
import React, { useEffect, useState } from "react";
import { Input, Loading } from "uxp/components";
import './BaselineValueEditor.scss';
interface IBaselineValueEditor {
    context:IContextProvider;
    baselineConfiguration:any;
    onChange:(newConfig:any)=>void;
    utilityType:string|null;
}
export const BaselineValueEditor: React.FC<IBaselineValueEditor> = (props) => {
    let [loading,setLoading] = React.useState(true);
    let [baselines,setBaselines] = React.useState<BaselineType[]>([]);
    let [updatedBaselineConfig,setUpdatedBaselineConfig] = React.useState(props.baselineConfiguration||{});
    let [allUtilityTypes,setAllUtilityTypes] = React.useState<UtilityMeterType[]>([]);
    React.useEffect(()=>{
        getAllBaselineTypes(props.context).then(({data,error})=>{
            if (error) throw error;
            setBaselines(data);
        }).catch((e)=>alert(e))
        .finally(()=>setLoading(false));

        getAllUtilityMeterTypes(props.context).then(({data,error})=>{
            if (error) throw error;
            setAllUtilityTypes(data);
        }).catch((e)=>alert(e))

    },[]);
    useEffect(()=>{
        setUpdatedBaselineConfig(props.baselineConfiguration);
    },[props.baselineConfiguration])


   

    if (loading) return <Loading />;

    return <div className='baseline_value_editor'>
        {
            baselines.map((b)=>{
                let value = updatedBaselineConfig?.[b.id] || '';
                return <div className='baseline_value_editor__item'>
                    <div className='baseline_value_editor__item__label'>{b.name}</div>
                    <div className='baseline_value_editor__item__value'>
                        <Input type="number" onChange={(v) => {
                            setUpdatedBaselineConfig((ov: any) => ({ ...ov, [b.id]: v }));
                        }}
                            onBlur={() => {
                                let x:any = {};
                                for(let k in updatedBaselineConfig) {

                                    // skip baselines that do not exist
                                    if (!baselines.find((bl)=>bl.id==k)) {
                                        continue;
                                    }
                                    if (!isNaN(Number(updatedBaselineConfig[k]))) {
                                        x[k] = Number(updatedBaselineConfig[k]);
                                    }
                                }
                                console.log('new update', x);
                                props.onChange(x);
                            }}
                            value={value} 
                            />
                            {
                            props.utilityType  && 
                            <div className='baseline_value_editor__item__value__unit'>{getBaseUnit(allUtilityTypes.find((mt)=>mt.name==props.utilityType))}</div>
                            }
                    </div>
                </div>;
            })
        }
    </div>
}