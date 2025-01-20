import React, { useRef } from "react";
import { BaselineType, BaseWidgetProps } from "@types";
import { createBaselineType, deleteBaselineType, getAllBaselineTypes, updateBaselineType } from "@ums-service";
import { ActionResponse, CRUDComponent, WidgetWrapper } from 'uxp/components'

interface BaselineTypeCRUDComponentProps extends BaseWidgetProps {

}

export const BaselineTypeCRUDComponent: React.FunctionComponent<BaselineTypeCRUDComponentProps> = (props) => {
    const { uxpContext } = props
    const crudUIRef = useRef(null)

    async function getBaselineTypes() {
        const { data, error } = await getAllBaselineTypes(uxpContext)
        if (!!error) return { items: [] }
        return { items: data }
    }

    async function handleCreate(formData: any): Promise<ActionResponse> {
        const { data, error } = await createBaselineType(uxpContext, formData.name)
        crudUIRef?.current?.refreshList()
        return {
            status: !!error ? 'error' : 'done',
            message: !!error ? `Unable to create the baseline. ${error}` : 'Baseline created!'
        }
    }

    async function handleUpdate(formData: any, item: BaselineType): Promise<ActionResponse> {

        const { data, error } = await updateBaselineType(uxpContext, item.id, formData.name)
        crudUIRef?.current?.refreshList()
        return {
            status: !!error ? 'error' : 'done',
            message: !!error ? `Unable to update the baseline. ${error}` : 'Baseline updated!',
        }
    }

    async function handleDelete(item: BaselineType): Promise<ActionResponse> {
        const { data, error } = await deleteBaselineType(uxpContext, item.id)

        crudUIRef?.current?.refreshList()
        return {
            status: !!error ? 'error' : 'done',
            message: !!error ? `Unable to delete the baseline. ${error}` : 'Baseline deleted!'
        }
    }


    return <WidgetWrapper>
        <CRUDComponent
            ref={crudUIRef}
            list={{
                title: 'Baseline Configuration',
                columns: [
                    {
                        id: 'name',
                        label: 'Name'
                    }
                ],
                defaultPageSize: 25,
                data: {
                    isPaginated: false,
                    getData: getBaselineTypes
                },
                search: {
                    enabled: true,
                    fields: ['name']
                },
                onDeleteItem: handleDelete
            }}

            add={{
                title: 'Add new baseline',
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
                            },

                        ]
                    }
                ],
                onSubmit: handleCreate,
                onCancel: () => { crudUIRef?.current?.refreshList() },
                afterSave: () => { }
            }}

            edit={{
                title: 'Update baseline name',
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
                                },
                            },

                        ]
                    }
                ],
                onSubmit: handleUpdate,
                onCancel: () => { crudUIRef?.current?.refreshList() },
                afterSave: () => { }
            }}
        />
    </WidgetWrapper>
}