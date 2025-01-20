import React, { useRef } from "react";
import { BaseWidgetProps, UtilityMeterType } from "@types";
import { createUtilityMeterType, deleteUtilityMeterType, getAllUtilityMeterTypes, updateUtilityMeterType } from "@ums-service";
import { ActionResponse, CRUDComponent, toJSON, WidgetWrapper } from 'uxp/components'
import { UnitConversionInput } from "@components/common/CustomInputs";
import { TagList } from "@components/common/TagList";

interface MeterTypeCRUDComponentProps extends BaseWidgetProps {

}

export const MeterTypeCRUDComponent: React.FunctionComponent<MeterTypeCRUDComponentProps> = (props) => {
    const { uxpContext } = props
    const crudUIRef = useRef(null)

    async function getMeterTypes() {
        const { data, error } = await getAllUtilityMeterTypes(uxpContext)
        if (!!error) return { items: [] }
        return { items: data }
    }

    async function handleCreate(formData: any): Promise<ActionResponse> {
        const newMerterType = {
            name: formData.name,
            unitConversion: toJSON(formData.unitConversion, {})
        }
        const { data, error } = await createUtilityMeterType(uxpContext, newMerterType)
        crudUIRef?.current?.refreshList()
        return {
            status: !!error ? 'error' : 'done',
            message: !!error ? `Unable to create the meter type. ${error}` : 'Meter type created!'
        }
    }

    async function handleUpdate(formData: any, item: UtilityMeterType): Promise<ActionResponse> {
        const toUpdate = {
            unitConversion: toJSON(formData.unitConversion, {})
        }
        const { data, error } = await updateUtilityMeterType(uxpContext, item.name, toUpdate)
        crudUIRef?.current?.refreshList()
        return {
            status: !!error ? 'error' : 'done',
            message: !!error ? `Unable to update the meter type. ${error}` : 'Meter type updated!',
        }
    }

    async function handleDelete(item: UtilityMeterType): Promise<ActionResponse> {
        const { data, error } = await deleteUtilityMeterType(uxpContext, item.name)

        setTimeout(() => {
            window.location.reload()
        }, 500)
        return {
            status: !!error ? 'error' : 'done',
            message: !!error ? `Unable to delete the meter type. ${error}` : 'Meter type deleted!'
        }
    }


    return <WidgetWrapper>
        <CRUDComponent
            ref={crudUIRef}
            list={{
                title: 'Meter Types',
                columns: [
                    {
                        id: 'name',
                        label: 'Name'
                    },
                    {
                        id: 'displayName',
                        label: 'DisplayName'
                    },
                    {
                        id: 'unitConversion',
                        label: 'Unit Conversions',
                        renderColumn: (item) => {
                            return <TagList tags={Object.keys(item?.unitConversion || {}).map((u) => ({
                                label: u,
                                tooltip: `${u} - ${item?.unitConversion?.[u]}x`,
                            }))} />;

                        }
                    }
                ],
                defaultPageSize: 25,
                data: {
                    isPaginated: false,
                    getData: getMeterTypes
                },
                search: {
                    enabled: true,
                    fields: ['name']
                },
                onDeleteItem: handleDelete
            }}

            add={{
                title: 'Add new meter type',
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
                            {
                                name: 'unitConversion',
                                label: 'Unit Conversions',
                                type: 'json',
                                validate: {
                                    required: true,
                                    customValidateFunction: (value, data) => {
                                        const v = toJSON(value, null)
                                        if (!v) return { valid: false, error: 'Invalid JSON' }
                                        return { valid: true }
                                    }
                                },
                                renderField: (data, onValueChange) => {
                                    return <UnitConversionInput
                                        value={toJSON(data.unitConversion, {})}
                                        onChange={(val) => onValueChange(val)}
                                    />
                                }
                            }
                        ]
                    }
                ],
                onSubmit: handleCreate,
                onCancel: () => { crudUIRef?.current?.refreshList() },
                afterSave: () => { window.location.reload() }
            }}

            edit={{
                title: 'Update meter type',
                formStructure: [
                    {
                        title: '',
                        columns: 1,
                        fields: [
                            {
                                name: 'name',
                                label: 'Name',
                                type: 'readonly',
                            },
                            {
                                name: 'unitConversion',
                                label: 'Unit Conversions',
                                type: 'json',
                                validate: {
                                    required: true,
                                    customValidateFunction: (value, data) => {
                                        const v = toJSON(value, null)
                                        if (!v) return { valid: false, error: 'Invalid JSON' }
                                        return { valid: true }
                                    }
                                },
                                renderField: (data, onValueChange) => {
                                    return <UnitConversionInput
                                        value={toJSON(data.unitConversion, {})}
                                        onChange={(val) => onValueChange(val)}
                                    />
                                }
                            }
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