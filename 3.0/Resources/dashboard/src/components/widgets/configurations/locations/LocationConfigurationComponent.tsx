import React, { useEffect, useRef, useState } from "react";
import { BaselineType, BaseWidgetProps, UtilityMeterType } from "@types";
import { createBaselineType, deleteBaselineType, getAllBaselineTypes, getAllUtilityMeterTypes, getLocationData, updateBaselineType, updateLocationData } from "@ums-service";
import { ActionResponse, AsyncButton, CRUDComponent, DefaultLoader, FormField, generateTreeNodesFromFlatList, Label, TitleBar, TreeNode, TreeView, useAlert, useToast, WidgetWrapper } from 'uxp/components'
import { LocationTreeInput } from "@components/common/CustomInputs";
import { getAllLocations } from "@other-services";
import './LocationConfigurationComponent.scss';
import { BaselineValueEditor } from "@components/common/BaselineValueEditor";
import { LabelIcons } from "@components/common/Icons";
interface LocationConfigurationComponentProps extends BaseWidgetProps {

}

export const LocationConfigurationComponent: React.FunctionComponent<LocationConfigurationComponentProps> = (props) => {
    const { uxpContext } = props
    const [locations, setLocations] = useState<TreeNode[]>([])
    const [selectedNode,setSelectedNode] = useState<TreeNode>(null);
    const [locationData,setLocationData] = React.useState<any>();
    const [utilityTypes,setUtilityTypes] = useState<UtilityMeterType[]>([]);
    const [loading,setLoading] = React.useState(false);
    const toast = useToast()
    const alerts = useAlert()

    useEffect(() => {
        getLocations()
        getUtilityTypes()

    }, [])
    async function getLocations() {
        const { data, error } = await getAllLocations(uxpContext)
        if (!!error) {
            toast.error('Unable to get meter types. ' + error)
            
        }
        let nodes = generateTreeNodesFromFlatList(data || [], '', 'LocationKey', 'LocationName', 'ParentLocationKey', 'LocationKey', true, { leadingSlash: true })
        setLocations(nodes);

    }
    async function getUtilityTypes() {
        let {data,error} = await getAllUtilityMeterTypes(props.uxpContext);
        if (error) {
            toast.error('Error loading utility types: ' + error);
        }
        setUtilityTypes(data);
    }
    async function saveLocationConfig() {
        await updateLocationData(props.uxpContext,selectedNode?.original?.LocationKey,locationData);
    }
    useEffect(()=>{
        setLoading(true);
        getLocationData(props.uxpContext,selectedNode?.original?.LocationKey)
        .then(({data,error})=>{
            setLoading(false);
            setLocationData(data);
        }).catch(()=>{
            setLoading(false);
            setLocationData({});
        });
    },[selectedNode]);
    console.log('CURRENT BASELINE',locationData);
    return <WidgetWrapper
    
    >
        <TitleBar title={"Location Configuration"}></TitleBar>
    <div className='ums_location_config'>
        <TreeView
            items={locations}
            expandAllNodes={false}
            selected={selectedNode}
            onSelect={(val: TreeNode) => {
                setSelectedNode(val);
            }}
        />
        {selectedNode && <div className='ums_location_config-sidebar'>
            <div className='ums_location_config-sidebar-header'>
                <h3>{selectedNode?.label||''}</h3>
                <h6>{(selectedNode?.original?.FullName == selectedNode?.label) ? '' : selectedNode?.original?.FullName||''}</h6>
            </div>
            <div className='ums_location_config-sidebar-body'>
                {loading? <DefaultLoader />
                        : <>
                            {
                                utilityTypes.map((ut) => {
                                    return <div className='ums_location_config-sidebar-body-utility-type'>
                                        <div className='ums_location_config-sidebar-body-utility-type-header'>{ut.displayName}</div>
                                        <div className='ums_location_config-sidebar-body-utility-type-body'>
                                            <FormField>
                                                <Label icon={LabelIcons.Baseline}>Baseline Configuration</Label>
                                                <BaselineValueEditor utilityType={ut.name} key={selectedNode?.original?.LocationKey} baselineConfiguration={locationData?.baselines?.[ut.name]||{}} context={props.uxpContext} onChange={(bd)=>{
                                                    let ld = {...(locationData||{})};
                                                    if (!ld) ld = {};
                                                    if (!ld.baselines) ld.baselines = {};
                                                    ld.baselines[ut.name] = bd;
                                                    setLocationData(ld);
                                                }} />
                                            </FormField>
                                        </div>

                                    </div>
                                })
                            }

                            <AsyncButton title="Update" onClick={saveLocationConfig} />
                        </>
                }
              
            </div>
        </div>}
        </div>
    </WidgetWrapper>;
}