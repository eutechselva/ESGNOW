import React, { useContext, useEffect, useRef, useState } from "react";
import { BaseTag, BaseWidgetProps, Tag } from "@types";
import { ActionResponse, CRUDComponent, ExtendedTreeNode, FormSectionProps, generateTreeNodesFromFlatList, IFormData, TreeNode, TreeView, useAlert, useToast, WidgetWrapper } from 'uxp/components'
import { createTag, deleteByTagType, deleteTag, getAllTags, groupTagsByType, updateTag } from "@ums-service";
import { hasValue } from "widget-designer/components";
import { LabelIcons } from "@components/common/Icons";
import { BaselineValueEditor } from "@components/common/BaselineValueEditor";
import { getChangedValues, hasAnyFieldChanged } from "@utils";

interface TagConfigurationUIProps extends BaseWidgetProps {

}

const reservedTypes = ['location', 'metergroup']
export const TagConfigurationUI: React.FunctionComponent<TagConfigurationUIProps> = (props) => {

    const { uxpContext } = props
    const [tagGroups, setTagGroups] = useState<{ [type: string]: Tag[] }>({})

    const crudUIRef = useRef(null)
    const toast = useToast()
    const alerts = useAlert()

    useEffect(() => {
        loadAllTags()
    }, [])

    useEffect(() => {
        console.log('tags', tagGroups)
    }, [tagGroups])

    async function loadAllTags() {
        const { data, error } = await getAllTags(uxpContext)
        if (error) {
            setTagGroups({})
            toast.error(error)
            return
        }

        const { grouped } = groupTagsByType(data)
        setTagGroups(grouped)
    }

    async function handleCreateTagType(formdata: IFormData): Promise<ActionResponse> {

        const tag: BaseTag = {
            name: '' + formdata.tag,
            type: '' + formdata.type,
            path: '' + formdata.tag,
            parentTagId: null
        }

        const { data, error } = await createTag(uxpContext, tag, formdata.baselines);

        loadAllTags()

        return {
            status: !!error ? 'error' : 'done',
            message: !!error ? `Unable to create the tag. ${error}` : 'Tag created!',
        }
    }

    async function handleAddTag(parent: any, type: string) {
        try {
            const formData = await alerts.form({
                title: '',
                formStructure: [
                    {
                        title: '',
                        columns: 1,
                        fields: [
                            {
                                name: 'name',
                                label: 'Name',
                                type: 'text',
                                validate: {
                                    required: true
                                }
                            }
                        ]
                    },
                    {
                        title: '',
                        columns: 1,
                        fields: [
                            {
                                name: 'baselines',
                                label: 'Baseline Configuration',
                                type: 'json',
                                icon: LabelIcons.Baseline,
                                value: {},
                                renderField: (data, onValueChange) => {
                                    return <BaselineValueEditor
                                        context={props.uxpContext}
                                        utilityType={null}
                                        onChange={val => onValueChange(val)}
                                        baselineConfiguration={{}}
                                    />

                                }
                            }
                        ]
                    }
                ] as FormSectionProps[]
            })

            if (!formData) return

            const tagName = formData.name
            const isParentTag = !parent

            const _tag: BaseTag = {
                name: tagName,
                type: type,
                path: isParentTag ? tagName : `${(parent as ExtendedTreeNode).path}/${tagName}`,
                parentTagId: isParentTag ? null : parent.id
            }

            const { data, error } = await createTag(uxpContext, _tag, formData.baselines)
            console.log('METAG2', data);

            loadAllTags()

            if (error) toast.error(`Unable to create the tag. Error: ${error}`)
            else toast.success('Tag created!')

        }
        catch (e) {
            toast.error('Unble to create the tag something went wrong')
            console.error(e)
        }
    }

    async function handleEditTag(tag: ExtendedTreeNode, type: string) {
        try {
            const formData = await alerts.form({
                title: 'Edit Tag',
                formStructure: [
                    {
                        title: '',
                        columns: 1,
                        fields: [
                            {
                                name: 'name',
                                label: 'Name',
                                type: 'text',
                                value: tag?.original?.name || '',
                                validate: {
                                    required: true,
                                    // customValidateFunction: (value, data) => {
                                    //     if ((value as string).toLowerCase() == tag?.original?.name) return { valid: false, error: 'Please change the name to update' }
                                    //     return { valid: true }
                                    // }
                                }
                            }
                        ]
                    },
                    {
                        title: '',
                        columns: 1,
                        fields: [
                            {
                                name: 'baselines',
                                label: 'Baseline Configuration',
                                type: 'json',
                                icon: LabelIcons.Baseline,
                                value: tag?.original?.baselines || {},
                                renderField: (data, onValueChange) => {
                                    return <BaselineValueEditor
                                        context={props.uxpContext}
                                        utilityType={null}
                                        onChange={val => onValueChange(val)}
                                        baselineConfiguration={tag?.original?.baselines}
                                    />

                                }
                            }
                        ]
                    }
                ] as FormSectionProps[]
            })

            if (!formData) return
            const hasChanged = hasAnyFieldChanged(tag?.original, formData, ['name', 'baselines'])
            if (!hasChanged) { toast.info('No changes detected!'); return; }
            const { data, error } = await updateTag(uxpContext, tag?.original?.id, { ...getChangedValues(tag?.original, formData, ['name', 'baselines']) })

            loadAllTags()

            if (error) toast.error(`Unable to update the tag. Error: ${error}`)
            else toast.success('Tag updated!')

        }
        catch (e) {
            toast.error('Unble to update the tag something went wrong')
            console.error(e)
        }
    }

    async function handleDeleteTag(id: string) {
        try {
            const confirmed = await alerts.confirm({
                title: 'Are you sure?',
                content: 'you are about to delete a tag. This cannot be undone. Do you wish to continue?'
            })

            if (!confirmed) return
            const { data, error } = await deleteTag(uxpContext, id)

            loadAllTags()

            if (error) toast.error(`Unable to delete the tag. Error: ${error}`)
            else toast.success('Tag deleted!')

        }
        catch (e) {
            toast.error('Unble to delete the tag something went wrong')
            console.error(e)
        }
    }


    async function handleDeleteTagType(item: any): Promise<ActionResponse> {

        const { data, error } = await deleteByTagType(uxpContext, item.type)

        loadAllTags()

        return {
            status: (!!error) ? 'error' : 'done',
            message: (!!error) ? `Unable to delete the tag. Error: ${error}` : 'Tags deleted!',
            data: (!!error) ? null : data
        }
    }




    return <WidgetWrapper>
        <CRUDComponent
            ref={crudUIRef}
            list={{
                title: 'Tags',
                columns: [
                    {
                        id: 'type',
                        label: 'Type',
                        maxWidth: 100
                    },
                    {
                        id: 'tags',
                        label: 'Tags',
                        renderColumn: (item) => {
                            return <TreeView
                                items={generateTreeNodesFromFlatList((tagGroups[item.type] || []), '', 'id', 'name', 'parentTagId', 'path')}
                                expandAllNodes={true}
                                enableAdd={true}
                                onAdd={(parent) => handleAddTag(parent, item.type)}
                                enableEdit={true}
                                onEdit={(tag) => handleEditTag(tag, item.type)}
                                enableDelete={true}
                                onDelete={(id) => handleDeleteTag(id)}
                                showActionButtonOnlyOnHover={true}
                            />
                        }
                    }
                ],
                defaultPageSize: 25,
                data: {
                    isPaginated: false,
                    getData: Object.keys(tagGroups).map(t => ({ type: t, tags: tagGroups[t] }))
                },
                search: {
                    enabled: false,
                    // fields: ['name']
                },
                addButton: {
                    label: 'Add Tag Type'
                },
                onDeleteItem: handleDeleteTagType
            }}

            add={{
                title: 'Add Tag Type',
                formStructure: [
                    {
                        title: '',
                        columns: 1,
                        fields: [
                            {
                                name: 'type',
                                label: 'Type',
                                type: 'text',
                                validate: {
                                    required: true,
                                    customValidateFunction: (value, data) => {
                                        if (!hasValue(value)) return { valid: false, error: 'Field is rewuired' }
                                        if (reservedTypes.includes((value as string).toLowerCase())) return { valid: false, error: 'Type is reserved for internal use. Please use a different type' }
                                        return { valid: true }
                                    }
                                }
                            },
                            {
                                name: 'tag',
                                label: 'Parent Tag',
                                type: 'text',
                                validate: {
                                    required: true
                                }
                            }
                        ]
                    },
                    {
                        title: '',
                        columns: 1,
                        fields: [
                            {
                                name: 'baselines',
                                label: 'Baseline Configuration',
                                type: 'json',
                                icon: LabelIcons.Baseline,
                                value: {},
                                renderField: (data, onValueChange) => {
                                    return <BaselineValueEditor
                                        context={props.uxpContext}
                                        utilityType={null}
                                        onChange={val => onValueChange(val)}
                                        baselineConfiguration={data?.baselines}
                                    />

                                }
                            }
                        ]
                    }
                ],
                onSubmit: handleCreateTagType
            }}
        />
    </WidgetWrapper>
}

