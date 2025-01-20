import React from 'react';
import MetadataList from '@components/common/MetadataList';
import _ from 'lodash'
import { BaseUXPProps, ILocation, MemberMeter, MeterGroup, MeterType, Tag, UtilityMeter, UtilityMeterType, VirtualMeter } from '@types';
import { DynamicForm, FormSectionProps, hasValue, IFormData, Modal, toJSON, toStr, useToast } from 'uxp/components';
import { LabelIcons } from '@components/common/Icons';
import { LocationTreeInput, MeterGroupMemberConfiguration, MultipleTagInput, UtilityMeterConfiguration } from '@components/common/CustomInputs';
import { getChangedValues, getLabelFonmEnum, hasAnyFieldChanged, toSingular, } from '@utils';
import { BaselineValueEditor } from '@components/common/BaselineValueEditor';
import { createMeter, createMeterGroup, createVirtualMeter, updateMeter, updateMeterGroup, updateVirtualMeter } from '@ums-service';
import './MeterConfigForm.scss';


interface MeterConfigFormProps extends BaseUXPProps {
    show: boolean,
    meterType: MeterType,
    onClose: () => void,
    utilityTypes: UtilityMeterType[]
    utilityMeters: UtilityMeter[],
    virtualMeters: VirtualMeter[],
    meterGroups: MeterGroup[],
    locations: ILocation[],
    tags: Tag[],
    editInstance?: UtilityMeter | VirtualMeter | MeterGroup,
    utilityType?: string,
    afterSave?: () => void
}


export const MeterConfigForm: React.FunctionComponent<MeterConfigFormProps> = (props) => {

    const { uxpContext, show, onClose, utilityTypes, utilityMeters, virtualMeters, meterGroups, utilityType, meterType, locations, tags, afterSave } = props

    const editInstance = _.cloneDeep(props.editInstance)

    const toast = useToast()

    const selectedTypeLabel = getLabelFonmEnum(meterType, MeterType)

    const fieldsToValidateForChanges: string[] = ['name', 'description', 'meterType', 'unit', 'servingLocation', 'tags', 'baselines', 'metadata'];

    const basicDetails: FormSectionProps = {
        title: 'Basic Details',
        columns: 2,
        fields: [
            {
                name: 'name',
                label: 'Name',
                type: 'text',
                icon: LabelIcons.MeterName,
                value: editInstance?.name || '',
                validate: {
                    required: true
                }
            },
            {
                name: 'description',
                label: 'Description',
                type: 'text',
                icon: LabelIcons.Description,
                value: editInstance?.description || '',
                show: (data) => meterType !== MeterType.MeterGroups,
                validate: {
                    required: meterType != MeterType.MeterGroups
                }
            },
            {
                name: 'meterType',
                label: 'Meter Type',
                type: hasValue(utilityType) ? 'readonly' : 'select',
                value: editInstance?.meterType || utilityType || '',
                options: (utilityTypes || []).map(t => ({ label: t.name, value: t.name })),
                validate: {
                    required: true
                }
            },
            {
                name: 'unit',
                label: 'Unit',
                icon: LabelIcons.Unit,
                type: 'select',
                value: editInstance?.unit || '',
                getOptions: (data) => {
                    const meterType = (utilityTypes || []).find(mt => mt.name === data.meterType)
                    if (!meterType) return []
                    return (Object.keys(meterType.unitConversion) || []).map(u => ({ label: u, value: u }))
                },
                show: (data) => meterType !== MeterType.MeterGroups,
                validate: {
                    required: meterType != MeterType.MeterGroups
                }
            },
            {
                name: 'servingLocation',
                label: 'Serving Location',
                icon: LabelIcons.Location,
                type: 'text',
                value: editInstance?.servingLocation || '',
                validate: {
                    required: true
                },
                renderField: (data, onValueChange) => {
                    return <LocationTreeInput
                        locations={locations}
                        selected={toStr(data?.servingLocation || '')}
                        onChange={onValueChange}
                    />
                },
            },
        ]
    }

    const tagDetails: FormSectionProps = {
        title: 'Tags',
        columns: 1,
        fields: [
            {
                name: 'tags',
                label: 'Tags',
                icon: LabelIcons.Tags,
                type: 'json',
                value: editInstance?.tags || {},
                validate: {
                    // required: true,
                    customValidateFunction: (value, data) => {
                        const v = toJSON(value, null)
                        if (!v) return { valid: false, error: 'Invalid JSON' }
                        return { valid: true }
                    }
                },
                renderField: (data, onValueChange) => {

                    return <MultipleTagInput
                        value={toJSON(data?.tags, {})}
                        onChange={val => onValueChange(val)}
                        tags={tags}
                        returnPathOnSelect={true}
                    />
                }
            }
        ]
    }

    const metadata: FormSectionProps = {
        title: 'Metadata',
        columns: 1,
        fields: [
            {
                name: 'metadata',
                label: 'Metadata',
                icon: LabelIcons.Metadata,
                type: 'json',
                value: editInstance?.metadata || [],
                validate: {
                    // required: true,
                    customValidateFunction: (value, data) => {
                        const v = toJSON(value, null)
                        if (!v) return { valid: false, error: 'Invalid JSON' }
                        return { valid: true }
                    }
                },
                renderField: (data, onValueChange) => {
                    return <MetadataList
                        uxpContext={props.uxpContext}
                        metadataList={data.metadata}
                        onChangeMetadataList={val => onValueChange(val)}
                        editable={true}
                    />
                }
            }
        ]
    }

    const scalingFactorDetails: FormSectionProps = {
        title: 'Scaling Factors',
        columns: 1,
        fields: [
            {
                name: 'scalingFactor',
                label: 'Meters',
                type: 'json',
                value: (editInstance as VirtualMeter)?.scalingFactor || {},
                show: (data) => hasValue(data.meterType),
                validate: {
                    required: true,
                    customValidateFunction: (value, data) => {
                        const v = toJSON(value, null)
                        if (!v || Object.keys(v).length == 0) return { valid: false, error: 'At least one meter is required' }
                        return { valid: true }
                    }
                },
                renderField: (data, onValueChange) => {

                    return <UtilityMeterConfiguration
                        meters={(utilityMeters || []).filter(m => m.meterType == data.meterType)}
                        value={toJSON(data?.scalingFactor, {})}
                        onChange={v => {
                            onValueChange(v)
                        }}
                    />
                }
            }
        ]
    }
    const membersDetails: FormSectionProps = {
        title: 'Members',
        columns: 1,
        fields: [
            {
                name: 'members',
                label: 'Members',
                type: 'json',
                value: (editInstance as MeterGroup)?.members || [],
                validate: {
                    required: true,
                    customValidateFunction: (value, data) => {
                        const members: MemberMeter[] = toJSON(value, null)
                        if (!members || members.length == 0) return { valid: false, error: 'At least one member is required' }
                        return { valid: true }
                    }
                },
                renderField: (data, onValueChange) => {
                    return <MeterGroupMemberConfiguration
                        value={toJSON(data?.members, [])}
                        onChange={val => { onValueChange(val) }}
                        meters={(utilityMeters || []).filter(m => m.meterType == data?.meterType)}
                        virtualMeters={(virtualMeters || []).filter(m => m.meterType == data?.meterType)}
                        meterGroups={(meterGroups || []).filter(m => m.meterType == data?.meterType)}
                        groupId={null}
                    />
                },
            },
        ]
    }
    const canRegenerateSection: FormSectionProps = {
        title: '',
        seperator: true,
        columns: 1,
        fields: []
    }
    const regenerateSection: FormSectionProps = {
        title: 'Re-Generate Data',
        columns: 1,
        fields: [
            {
                name: 'canRegenerateData',
                label: 'Regenerate Data',
                type: 'checkbox',
                value: false,

            },
            {
                name: 'dataRegenerationDate',
                label: 'Regenerate data from',
                type: 'datetime',
                value: new Date(Number(new Date()) - 24 * 3600 * 1000),
                show: (data) => data.canRegenerateData,

            }
        ],

    }

    const baselines: FormSectionProps = {
        title: 'Baselines',
        columns: 1,
        fields: [
            {
                name: 'baselines',
                label: 'Baseline Configuration',
                type: 'json',
                icon: LabelIcons.Baseline,
                value: editInstance?.baselines || {},
                renderField: (data, onValueChange) => {
                    return <BaselineValueEditor
                        context={props.uxpContext}
                        utilityType={utilityType || editInstance?.meterType}
                        onChange={val => onValueChange(val)}
                        baselineConfiguration={data?.baselines}
                    />

                }
            }
        ]
    }

    const formStructure: FormSectionProps[] = [basicDetails]


    if (meterType == MeterType.Meters) {
        formStructure.push(tagDetails)
    }
    if (meterType == MeterType.VirtualMeters) {
        formStructure.push(scalingFactorDetails, tagDetails);
        fieldsToValidateForChanges.push('scalingFactor')
    }
    if (meterType == MeterType.MeterGroups) {
        formStructure.push(membersDetails, tagDetails);
        fieldsToValidateForChanges.push('members')
    }

    formStructure.push(baselines);

    if (meterType == MeterType.Meters || meterType == MeterType.VirtualMeters) {
        formStructure.push(metadata);
    }
    // formStructure.push(canRegenerateSection);
    if (!!editInstance) formStructure.push(regenerateSection);

    async function saveConfiguration(formData: IFormData, editInstance?: UtilityMeter | VirtualMeter | MeterGroup, fields?: string[], onClose?: () => void) {

        const isEditing = !!editInstance
        const hasChanged = !isEditing || (!!isEditing && hasAnyFieldChanged(editInstance, formData, fields || []))
        if (!hasChanged) {
            toast.info('There is nothing to updated. No changes detected')
            return null
        }

        const service: Function = (!!isEditing)
            ? (meterType == MeterType.MeterGroups ? updateMeterGroup : (meterType == MeterType.VirtualMeters ? updateVirtualMeter : updateMeter))
            : (meterType == MeterType.MeterGroups ? createMeterGroup : (meterType == MeterType.VirtualMeters ? createVirtualMeter : createMeter))
        const params: any[] = (!!isEditing) ? [
            editInstance.meterId || editInstance.id,
            getChangedValues(editInstance, formData, fields || []),
            formData.canRegenerateData ? formData.dataRegenerationDate : undefined
        ] : [formData]

        const { data, error } = await service(uxpContext, ...params)

        if (!!error) {
            toast.error(`Unable to ${!!isEditing ? 'update' : 'creat'} ${toSingular(selectedTypeLabel)}. Error: ${error}`)
            return null
        }

        // close form 
        onClose?.()
        // callback after save 
        afterSave?.();

        toast.success(`${toSingular(selectedTypeLabel)} ${isEditing ? 'updated!' : 'created!'}`)
        return data

    }

    return <Modal
        show={show}
        onClose={onClose}
        className="ums_meters__form_modal"
        title={`Configure ${toSingular(selectedTypeLabel)}`}
    >
        <DynamicForm
            formStructure={formStructure}
            onSubmit={(data) => saveConfiguration(data, props.editInstance, fieldsToValidateForChanges, onClose)}
            onCancel={onClose}
            renderOptions={{
                renderStyle: !!props.editInstance ? 'tabs' : 'wizard',
            }}
        />
    </Modal>

}