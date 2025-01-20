import { ILocation, MemberMeter, MeterGroup, Tag, UtilityMeter, VirtualMeter } from "@types";
import { groupTagsByType } from "@ums-service";
import React, { useEffect, useState } from "react";
import { Button, findTreeNodeById, findTreeNodeByPath, FormSectionProps, generateTreeNodesFromFlatList, hasValue, IconButton, Input, ToggleFilter, toStr, TreeNode, TreeViewSelectInput, useAlert, useToast } from "uxp/components";
import { SimpleTable } from "./SimpleTable";
import classNames from "classnames";
import './CustomInputs.scss'

interface LocationTreeInputProps {
    locations: ILocation[],
    selected: string,
    onChange: (value: string, node: TreeNode) => void,
    generatePathFromKey?: boolean,
    includeLeadingSlash?: boolean
    returnPathOnSelect?: boolean
}

export const LocationTreeInput: React.FC<LocationTreeInputProps> = (props) => {

    const { locations, selected, onChange, generatePathFromKey, includeLeadingSlash, returnPathOnSelect } = props

    const [locationNodes, setLocationNodes] = useState<TreeNode[]>([])
    const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)
    const [query, setQuery] = useState('')


    useEffect(() => {
        const nodes = generateTreeNodesFromFlatList(locations, query, 'LocationKey', 'LocationName', 'ParentLocationKey', generatePathFromKey ? 'LocationKey' : 'LocationName', true, { leadingSlash: includeLeadingSlash })
        setLocationNodes(nodes)
    }, [locations, query])

    useEffect(() => {
        if (hasValue(selected)) {
            ((returnPathOnSelect) ? findTreeNodeByPath : findTreeNodeById)(locationNodes, selected).then(setSelectedNode)
        }
        else setSelectedNode(null)
    }, [locationNodes, selected])

    return <TreeViewSelectInput
        items={locationNodes}
        selected={selectedNode}
        onSelect={(newlySelected) => {
            const id = (returnPathOnSelect) ? (newlySelected as TreeNode)?.path : (newlySelected as TreeNode)?.id || null
            onChange(id, (newlySelected as TreeNode));
        }}
        showHeader={true}
        title='Locations'
        enableSearch={true}
        onSearch={setQuery}
        expandAllNodes={false}
    />
}

export function removeReservedTags(tags: { [type: string]: string }, showLocationTag?: boolean) {
    const result = { ...tags };

    Object.keys(result).forEach(key => {

        if ((showLocationTag ? ['metergroup'] : ['location', 'metergroup']).includes(key.toLowerCase())) {
            delete result[key];
        }
    });

    return result || {};
}
interface TagInput {
    tags: Tag[],
    selected: string,
    onChange: (value: string) => void,
    returnPathOnSelect?: boolean
}

export const TagInput: React.FC<TagInput> = (props) => {
    const { tags, selected, onChange, returnPathOnSelect } = props

    const [tagNodes, setTagNodes] = useState<TreeNode[]>([])
    const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)
    const [query, setQuery] = useState('')

    useEffect(() => {
        const _tagNodes = generateTreeNodesFromFlatList(tags, query, 'id', 'name', 'parentTagId', 'path')
        setTagNodes(_tagNodes)
    }, [tags, query])

    useEffect(() => {
        (returnPathOnSelect ? findTreeNodeByPath : findTreeNodeById)(tagNodes, selected).then(setSelectedNode)
    }, [tagNodes, selected])

    return <TreeViewSelectInput
        items={tagNodes}
        selected={selectedNode}
        onSelect={(updated) => {
            const val = returnPathOnSelect ? (updated as TreeNode).path : (updated as TreeNode).id
            onChange(val)
        }}

        showHeader={true}
        title='Tags'
        enableSearch={true}
        onSearch={setQuery}

        showSelectedNodePath={true}

        expandAllNodes={true}
        showPath={true}
    />
}


type IMultipleTagConfig = { [type: string]: string }

interface MultipleTagInputProps {
    value: IMultipleTagConfig,
    onChange: (updated: IMultipleTagConfig) => void
    tags: Tag[],
    locations?: {
        enable: boolean,
        locations?: ILocation[],
        generatePathFromKey?: boolean,
        includeLeadingSlash?: boolean
    }
    label?: string,
    returnPathOnSelect?: boolean
}

export const MultipleTagInput: React.FC<MultipleTagInputProps> = (props) => {
    const { value, onChange, tags, locations } = props

    const editableTags = removeReservedTags(value, locations?.enable)

    const alerts = useAlert()
    const toast = useToast()

    const [tagGroups, setTagGroups] = useState<{ [type: string]: (Tag | ILocation)[] }>({})
    const [tagTypes, setTagTypes] = useState<string[]>([])

    useEffect(() => {
        const { grouped, types } = groupTagsByType(tags)
        const _tagGroups: { [type: string]: (Tag | ILocation)[] } = { ...grouped }

        if (!!locations && locations.enable) {
            types.push('Location')
            _tagGroups['Location'] = locations.locations || []
        }

        setTagGroups(_tagGroups)
        setTagTypes(types)
    }, [tags, locations])


    function findLocation(selected: string) {
        if (locations?.generatePathFromKey) {
            const parts = selected?.split('/')
            selected = parts[parts.length - 1]
        }
        const inst = (locations?.locations || []).find(l => l.LocationKey == selected)
        console.log('parts ', inst, selected)

        return inst
    }

    async function addTagType() {

        const usedTagTypes = Object.keys(value)
        const avaialbleTagTypes = (tagTypes || []).filter(t => !usedTagTypes.includes(t)).map(t => ({ label: t, value: t }))

        try {
            const data = await alerts.form({
                title: '',
                formStructure: [
                    {
                        title: '',
                        columns: 1,
                        fields: [
                            {
                                name: 'type',
                                label: 'Type',
                                type: 'select',
                                options: avaialbleTagTypes,
                                validate: {
                                    required: true,
                                    customValidateFunction: (value, data) => {

                                        if (Object.keys(value)?.includes(value)) return { valid: false, error: 'This tag type is already configured. Please select a different tag type' }
                                        return { valid: true }
                                    }
                                }

                            },
                            {
                                name: 'tag',
                                label: 'Tag',
                                type: 'text',
                                show: (data) => (hasValue(data?.type)),
                                validate: {
                                    required: true,
                                    customValidateFunction: (value, data) => {
                                        const tagType = ((data?.type)?.toLowerCase())
                                        const tag = tagType == 'location'
                                            ? findLocation(value)
                                            : (tags || []).find(t => (props?.returnPathOnSelect ? (t.path == value) : t.id == value))

                                        if (!tag) return { valid: false, error: 'Unable to find a tag for given id' }
                                        if (tagType !== 'location' && (tag as Tag).type !== data.type) return { valid: false, error: 'Select a tag from the selected tag type' }
                                        return { valid: true }

                                    }
                                },
                                renderField: (data, onValueChange) => {

                                    const tags = tagGroups[toStr(data.type)] || []

                                    if ((data?.type)?.toLowerCase() == 'location') {
                                        return <LocationTreeInput
                                            selected={toStr(data.tag)}
                                            onChange={val => onValueChange(val)}
                                            locations={tags as ILocation[]}
                                            generatePathFromKey={locations?.generatePathFromKey}
                                            includeLeadingSlash={locations?.includeLeadingSlash}
                                            returnPathOnSelect={true}
                                        />
                                    }

                                    return <TagInput
                                        tags={tags as Tag[]}
                                        selected={toStr(data.tag)}
                                        onChange={val => onValueChange(val)}
                                        returnPathOnSelect={props.returnPathOnSelect}
                                    />
                                }
                            }
                        ]
                    }
                ] as FormSectionProps[]
            })

            if (!data) return
            if (!hasValue(data.type) || !hasValue(data.tag)) {
                toast.error('Tag type and tag are required')
                return
            }

            editableTags[data.type] = data.tag
            onChange(editableTags)
        }
        catch (e) {

        }
    }

    async function removeTag(key: string) {
        delete editableTags[key]
        onChange(editableTags)
    }

    return <div className="ums_tag_input__container">
        <div className="ums_tag_input__header">
            <div className="ums_tag_input__title">{hasValue(props?.label) ? props.label : ''}</div>
            <div className="ums_tag_input__actions">
                <Button
                    icon="fas plus"
                    title={hasValue(props?.label) ? props.label : 'Add Tag'}
                    onClick={addTagType}
                />
            </div>
        </div>
        <div className="ums_tag_input__body">
            <SimpleTable
            // showBordersUnderRows={true}
            >
                {Object.entries(editableTags).map(([type, tagId]) => {
                    const tags = tagGroups[type] || []
                    return <tr>
                        <td> {type} </td>
                        <td>
                            {
                                type?.toLowerCase() == 'location'
                                    ? <LocationTreeInput
                                        selected={toStr(tagId)}
                                        onChange={v => {
                                            editableTags[type] = v
                                            onChange(editableTags)
                                        }}
                                        locations={tags as ILocation[]}
                                        generatePathFromKey={locations?.generatePathFromKey}
                                        includeLeadingSlash={locations?.includeLeadingSlash}
                                        returnPathOnSelect={true}
                                    />
                                    : <TagInput
                                        tags={tags as Tag[]}
                                        selected={tagId}
                                        onChange={(v) => {
                                            editableTags[type] = v
                                            onChange(editableTags)
                                        }}
                                        returnPathOnSelect={true}
                                    />
                            }
                        </td>
                        <td> <IconButton type='delete' size='small' onClick={() => { removeTag(type) }} /> </td>
                    </tr>
                })}
            </SimpleTable>
        </div>
    </div>
}


type UnitConversion = { [unit: string]: string }

interface UnitConversionInputProps {
    value: UnitConversion,
    onChange: (updated: UnitConversion) => void
}

export const UnitConversionInput: React.FC<UnitConversionInputProps> = (props) => {
    const { value, onChange } = props

    const alerts = useAlert()
    const toast = useToast()

    async function addUnit() {
        try {
            const data = await alerts.form({
                title: 'Add Unit',
                formStructure: [
                    {
                        title: '',
                        columns: 1,
                        fields: [
                            {
                                name: 'unit',
                                label: 'Unit',
                                type: 'text',
                                validate: {
                                    required: true
                                }

                            },
                            {
                                name: 'conversion',
                                label: 'Conversion Factor',
                                type: 'number',
                                allowZero: false,
                                allowNegative: true,
                                validate: {
                                    required: true,
                                    allowZero: false,
                                    allowNegative: true,
                                }
                            }
                        ]
                    }
                ] as FormSectionProps[]
            })

            if (!data) return
            if (!hasValue(data.unit) || !hasValue(data.conversion, false, true)) {
                toast.error('Unit and conversion factor are required')
                return
            }

            value[data.unit] = data.conversion
            onChange(value)
        }
        catch (e) {

        }
    }

    async function removeUnit(unit: string) {
        delete value[unit]
        onChange(value)
    }

    return <div className="ums_tag_input__container">
        <div className="ums_tag_input__header">
            <div className="ums_tag_input__title">Add Unit</div>
            <div className="ums_tag_input__actions">
                <Button title="Add Unit" onClick={addUnit} icon="fas plus" />
            </div>
        </div>
        <div className="ums_tag_input__body">
            <SimpleTable
            // showBordersUnderRows={true} 
            >
                {Object.entries(value).map(([unit, conversion]) => {
                    return <tr>
                        <td> {unit} </td>
                        <td>
                            <Input
                                value={conversion}
                                onChange={(v) => {
                                    value[unit] = v
                                    onChange(value)
                                }}
                            />
                        </td>
                        <td> <IconButton type='delete' size='small' onClick={() => { removeUnit(unit) }} /> </td>
                    </tr>
                })}
            </SimpleTable>
        </div>
    </div>
}

type UtilityMeterConfiguration = { [meter: string]: string }

interface UtilityMeterConfigurationInputProps {
    value: UtilityMeterConfiguration,
    onChange: (updated: UtilityMeterConfiguration) => void,
    meters: UtilityMeter[]
}

export const UtilityMeterConfiguration: React.FC<UtilityMeterConfigurationInputProps> = (props) => {
    const { value, onChange, meters } = props

    const alerts = useAlert()
    const toast = useToast()

    const usedMeters = Object.keys(value)
    const availableMeters = (meters || []).filter(m => !usedMeters.includes(m.id)).map(m => ({ label: m.name, value: m.meterId }))

    async function addMeter() {
        try {
            const data = await alerts.form({
                title: 'Add Meter',
                formStructure: [
                    {
                        title: '',
                        columns: 1,
                        fields: [
                            {
                                name: 'meter',
                                label: 'Meter',
                                type: 'select',
                                options: availableMeters,
                                validate: {
                                    required: true
                                }

                            },
                            {
                                name: 'scalingFactor',
                                label: 'Scaling Factor',
                                type: 'number',
                                allowNegative: true,
                                allowZero: false,
                                validate: {
                                    required: true,
                                    allowNegative: true,
                                    allowZero: false,
                                }
                            }
                        ]
                    }
                ] as FormSectionProps[]
            })

            if (!data) return
            if (!hasValue(data.meter) || !hasValue(data.scalingFactor, false, true)) {
                toast.error('Meter and scalling factor are required')
                return
            }

            value[data.meter] = data.scalingFactor
            onChange(value)
        }
        catch (e) {

        }
    }

    async function removeMeter(meterId: string) {
        delete value[meterId]
        onChange(value)
    }

    return <div className="ums_tag_input__container">
        <div className="ums_tag_input__header">
            <div className="ums_tag_input__title"></div>
            <div className="ums_tag_input__actions">
                <Button title="Add Meter" onClick={addMeter} icon="fas plus" />
            </div>
        </div>
        <div className="ums_tag_input__body">
            <SimpleTable
            // showBordersUnderRows={true} 
            >
                <tr className="ums_tag_input__table_header_row">
                    <td>Meter</td>
                    <td>Scaling Factor</td>
                </tr>
                {Object.entries(value).map(([meterId, scalingFactor]) => {
                    const meter = (meters || []).find(m => m.meterId == meterId)
                    return <tr>
                        <td> {meter?.name || 'N/A'} </td>
                        <td>
                            <Input
                                value={scalingFactor}
                                onChange={(v) => {
                                    value[meterId] = v
                                    onChange(value)
                                }}
                            />
                        </td>
                        <td> <IconButton type='delete' size='small' onClick={() => { removeMeter(meterId) }} /> </td>
                    </tr>
                })}
            </SimpleTable>
        </div>
    </div>
}



interface MeterGroupMemberConfigurationProps {
    value: MemberMeter[],
    onChange: (updated: MemberMeter[]) => void,
    meters: UtilityMeter[],
    virtualMeters: VirtualMeter[],
    meterGroups: MeterGroup[],
    groupId?: string
}

export const MeterGroupMemberConfiguration: React.FC<MeterGroupMemberConfigurationProps> = (props) => {
    const { value, onChange, meters, virtualMeters, meterGroups, groupId } = props

    const alerts = useAlert()
    const toast = useToast()

    const usedMeters = (value || []).map(m => m.id)
    const availableMeters = (meters || []).filter(m => !usedMeters.includes(m.id)).map(m => ({ label: m.name, value: m.meterId }))
    const availableVirtualMeters = (virtualMeters || []).filter(m => !usedMeters.includes(m.id)).map(m => ({ label: m.name, value: m.meterId }))
    const availableMeterGroups = (meterGroups || []).filter(m => !usedMeters.includes(m.id) && (!groupId || (!!groupId && m.id !== groupId))).map(m => ({ label: m.name, value: m.id }))

    async function addMeter() {
        try {
            const data = await alerts.form({
                title: 'Add Meter',
                formStructure: [
                    {
                        title: '',
                        columns: 2,
                        fields: [
                            {
                                name: 'type',
                                label: 'Meter Type',
                                type: 'select',
                                value: 'meter',
                                options: [
                                    { label: 'Utility Meter', value: 'meter' },
                                    { label: 'Virtual Meter', value: 'virtual_meter' },
                                    { label: 'Meter Group', value: 'meter_group' }
                                ],
                                validate: {
                                    required: true
                                },
                            },
                            {
                                name: 'meter',
                                label: 'Meter',
                                type: 'select',
                                getOptions: (data) => {
                                    if (data?.type == 'virtual_meter') return availableVirtualMeters
                                    if (data?.type == 'meter_group') return availableMeterGroups
                                    return availableMeters
                                },
                                validate: {
                                    required: true,
                                    customValidateFunction: (value, data) => {

                                        if ((data.type == 'virtual_meter' && !availableVirtualMeters.find(m => m.value == data.meter))) return { valid: false, error: 'Field is required' }

                                        if ((data.type == 'meter_group' && !availableMeterGroups.find(m => m.value == data.meter))) return { valid: false, error: 'Field is required' }

                                        if ((data.type == 'meter' && !availableMeters.find(m => m.value == data.meter))) return { valid: false, error: 'Field is required' }

                                        return { valid: true }
                                    }
                                }

                            },
                        ]
                    },
                    {
                        title: '',
                        columns: 2,
                        fields: [{
                            name: 'scalingFactor',
                            label: 'Scaling Factor',
                            type: 'number',
                            allowNegative: true,
                            allowZero: false,
                            validate: {
                                required: true,
                                allowNegative: true,
                                allowZero: false,
                            }
                        }
                        ]
                    }
                ] as FormSectionProps[]
            })

            if (!data) return
            if (!hasValue(data.meter) || !hasValue(data.scalingFactor, false, true)) {
                toast.error('Meter and scalling factor are required')
                return
            }

            value.push({
                id: data.meter,
                factor: data.scalingFactor,
                isMeterGroup: data.type == 'meter_group'
            })
            onChange(value)
        }
        catch (e) {

        }
    }

    async function removeMeter(meterId: string) {
        const updated = (value || []).filter(m => m.id !== meterId)
        onChange(updated)
    }

    return <div className="ums_tag_input__container">
        <div className="ums_tag_input__header">
            <div className="ums_tag_input__title"> </div>
            <div className="ums_tag_input__actions">
                <Button title="Add Memeber" onClick={addMeter} icon="fas plus" />
            </div>
        </div>
        <div className="ums_tag_input__body">
            <SimpleTable
            // showBordersUnderRows={true}
            >
                {(value || []).map((member: MemberMeter) => {
                    let type = 'Meter Group'
                    let meter: MeterGroup | UtilityMeter | VirtualMeter = member?.isMeterGroup ? (meterGroups || []).find(m => m.id == member.id) : null
                    if (!member?.isMeterGroup) {
                        const um = (meters || []).find(m => m.meterId == member.id)
                        if (um) { type = 'Utility Meter'; meter = um; }
                        else {
                            const vm = (virtualMeters || []).find(m => m.meterId == member.id)
                            if (vm) { type = 'Virtual Meter'; meter = vm }
                        }
                    }
                    return <tr>
                        <td>{meter?.displayName || 'N/A'}</td>
                        <td>{type}</td>
                        <td>{member?.factor}</td>
                        <td> <IconButton type='delete' size='small' onClick={() => { removeMeter(member.id) }} /> </td>
                    </tr>
                })}
            </SimpleTable>
        </div>
    </div>
}


interface FilterSectionProps {
    title: string,
    subTitle?: string
    error?: string,
    hide?: boolean
}

export const FilterSection: React.FunctionComponent<FilterSectionProps> = (props) => {

    const { title, subTitle, error, children, hide } = props
    const hasError = hasValue(error)
    if (!!hide) return null
    return <div className={classNames("ums_filter_section__container", { 'ums_filter_section__container--error': hasError })}>
        <div className="ums_filter_section__title">{title}</div>
        {hasValue(subTitle) ? <div className="ums_filter_section__sub_title">{subTitle}</div> : null}

        {children}

        {hasError ? <div className="ums_filter_section__feedback">{error}</div> : null}

    </div>
}