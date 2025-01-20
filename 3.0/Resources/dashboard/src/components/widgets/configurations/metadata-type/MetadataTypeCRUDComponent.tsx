import React, { useEffect, useRef, useState } from "react";
import { BaseWidgetProps, UtilityMeter } from "@types";
import { createMetadataType, deleteMetadataType, getAllMetadataTypes, updateMetadataType } from "@ums-service";
import { ActionResponse, Button, CRUDComponent, DynamicForm, FormSectionProps, IconButton, Input, Modal, toJSON, useToast, WidgetWrapper } from 'uxp/components';
import { SimpleTable } from "@components/common/SimpleTable";
import "./MetadataTypeCRUDComponent.scss";
import { hasAnyFieldChanged } from "@utils";

interface MetadataTypeCRUDComponentProps extends BaseWidgetProps { }

export const MetadataTypeCRUDComponent: React.FunctionComponent<MetadataTypeCRUDComponentProps> = (props) => {
    const { uxpContext } = props;
    const crudUIRef = useRef(null);

    async function getMetadataTypes() {
        const { data, error } = await getAllMetadataTypes(uxpContext);
        if (!!error) return { items: [] };
        return { items: data };
    }

    async function handleDelete(item: MetadataType): Promise<ActionResponse> {
        const { data, error } = await deleteMetadataType(uxpContext, item.id);
        crudUIRef?.current?.refreshList();
        return {
            status: !!error ? 'error' : 'done',
            message: !!error ? `Unable to delete the metadata. ${error}` : 'Metadata deleted!'
        };
    }

    function renderCustomForm(show: boolean, onClose: () => void, editInstance?: MetadataType) {
        return (
            <MetadataTypeModal
                show={show}
                onClose={onClose}
                editInstance={editInstance}
                uxpContext={props.uxpContext}
            />
        )
    }

    return (
        <WidgetWrapper>
            <CRUDComponent
                ref={crudUIRef}
                list={{
                    title: 'Metadata Configuration',
                    columns: [
                        { id: 'type', label: 'Metadata Type', maxWidth: 270, minWidth: 270 },
                        {
                            id: 'fields',
                            label: 'Fields',
                            renderColumn: (metadataType: MetadataType) => (
                                <MetadataFieldEditor metadataTypeFields={metadataType?.fields ?? []} editable={false} />
                            ),
                        },
                    ],
                    defaultPageSize: 25,
                    data: {
                        isPaginated: false,
                        getData: getMetadataTypes,
                    },
                    search: {
                        enabled: true,
                        fields: ['type'],
                    },
                    onDeleteItem: handleDelete,
                }}
                renderCustomAddView={renderCustomForm}
                renderCustomEditView={renderCustomForm}
            />
        </WidgetWrapper>
    );
};

export interface MetadataType {
    id: string;
    type: string;
    fields: MetadataTypeField[];
}

export interface MetadataTypeField {
    id: string;
    label: string;
    type: string;
}

interface MetadataListProps {
    metadataTypeFields: MetadataTypeField[];
    editable?: boolean;
    onSetMetadataTypeFields?: (updatedFields: MetadataTypeField[]) => void;
    onSave?: (updatedFields: MetadataTypeField[]) => void;
}

const MetadataFieldEditor: React.FC<MetadataListProps> = ({ metadataTypeFields, editable = false, onSave, onSetMetadataTypeFields }) => {
    const [fields, setFields] = useState<MetadataTypeField[]>(metadataTypeFields);

    const handleFieldChange = (index: number, key: keyof MetadataTypeField, value: string) => {
        const updatedFields = [...fields];
        updatedFields[index] = { ...updatedFields[index], [key]: value };
        setFields(updatedFields);
        if (onSetMetadataTypeFields) {
            onSetMetadataTypeFields(updatedFields);
        }
    };

    const handleAddField = () => {
        const newField: MetadataTypeField = {
            id: "",
            label: "",
            type: ""
        };
        const updatedFields = [...fields, newField];
        setFields(updatedFields);
        if (onSetMetadataTypeFields) {
            onSetMetadataTypeFields(updatedFields);
        }
    };

    return (
        <div className="ums_metadatacrud_fields_editor__container">
            <div className="ums_metadatacrud_fields_editor__body">
                <SimpleTable className="ums_metadatacrud_fields_editor__inner_table" showBordersUnderRows={true}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Label</th>
                            <th>Type</th>
                            {editable && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {fields.map((field, index) => (
                            <tr key={field.id}>
                                <td>
                                    {editable ? (
                                        <Input
                                            type="text"
                                            value={field.id}
                                            onChange={(value) => handleFieldChange(index, "id", value)}
                                        />
                                    ) : (
                                        field.id
                                    )}
                                </td>
                                <td>
                                    {editable ? (
                                        <Input
                                            type="text"
                                            value={field.label}
                                            onChange={(value) => handleFieldChange(index, "label", value)}
                                        />
                                    ) : (
                                        field.label
                                    )}
                                </td>
                                <td>
                                    {editable ? (
                                        <Input
                                            type="text"
                                            value={field.type}
                                            onChange={(value) => handleFieldChange(index, "type", value)}
                                        />
                                    ) : (
                                        field.type
                                    )}
                                </td>
                                {editable && (
                                    <td>
                                        <IconButton onClick={() => {
                                            const updatedFields = fields.filter((_, i) => i !== index);
                                            setFields(updatedFields);
                                            if (onSetMetadataTypeFields) {
                                                onSetMetadataTypeFields(updatedFields);
                                            }
                                        }} type="delete" />
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </SimpleTable>
                {editable && (
                    <div className="ums_metadatacrud_fields_editor__actions">
                        <Button onClick={handleAddField} className="add-field-button" title="Add New Field" icon="fas plus" />
                    </div>
                )}
            </div>
        </div>
    );
};



export interface MetadataType {
    id: string;
    type: string;
    fields: MetadataTypeField[];
}

export interface MetadataTypeField {
    id: string;
    label: string;
    type: string;
}



export interface MetadataTypeModalProps {
    show: boolean;
    onClose: () => void;
    editInstance?: MetadataType;
    afterSave?: () => void;
    uxpContext: any;
}


export const MetadataTypeModal: React.FunctionComponent<MetadataTypeModalProps> = (props) => {
    const { show, onClose, editInstance, afterSave } = props;
    const toast = useToast();

    const [metadataFields, setMetadataFields] = useState<MetadataTypeField[]>(editInstance?.fields || []);

    const handleSaveMetadata = async (updatedFields: MetadataTypeField[]) => {
        try {
            setMetadataFields(updatedFields);
            const isEditing = !!editInstance;
            const hasChanged = !isEditing || (isEditing && hasAnyFieldChanged(editInstance, { fields: updatedFields }, ['fields']));

            if (!hasChanged) {
                toast.info('No changes detected.');
                return;
            }

            let serviceResult;
            if (isEditing) {
                serviceResult = await updateMetadataType(props.uxpContext, editInstance.id, { ...editInstance, fields: updatedFields })
            } else {
                serviceResult = await createMetadataType(props.uxpContext, { ...editInstance, fields: updatedFields })
            }

            const { data, error } = serviceResult

            if (error) {
                toast.error(`Unable to ${isEditing ? 'edit' : 'add'} metadata: ${error}`);
                return;
            }

            toast.success(isEditing ? 'Metadata type updated!' : 'Metadata type created!');
            return data;
        } finally {
            onClose();
            afterSave?.();
        }
    };

    const formStructure: FormSectionProps[] = [
        {
            title: '',
            columns: 1,
            fields: [
                {
                    name: 'type',
                    label: 'Metadata/Integration Type',
                    type: 'text',
                    value: editInstance?.type || '',
                    validate: { required: true },
                },
                {
                    name: 'fields',
                    label: 'Metadata Fields',
                    type: 'json',
                    value: editInstance?.fields || [],
                    validate: {
                        required: true,
                        customValidateFunction: (value, data) => {
                            const v = toJSON(value, null) as MetadataTypeField[]
                            if(v.every(_ => !_.label?.trim() && !_.type?.trim())) {
                                return { valid: false, error: 'Every field must contain valid label and type' }
                            }

                            return { valid: true }
                        }
                    },
                    renderField: (data, onValueChange) => { 
                        return <MetadataFieldEditor
                            metadataTypeFields={data?.fields as MetadataTypeField[] || []}
                            editable={true}
                            onSetMetadataTypeFields={onValueChange}
                            onSave={handleSaveMetadata}
                        />
                    },
                },
            ],
        },
    ];

    return (
        <Modal show={show} onClose={onClose} title={!!editInstance ? 'Edit Metadata' : 'Add Metadata'} className="metadata-type-modal">
            <DynamicForm
                formStructure={formStructure}
                onSubmit={(data) => handleSaveMetadata(data.metadata || [])}  // On submit, save the metadata
                onCancel={onClose}
            />
        </Modal>
    );
};
