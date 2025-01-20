import React, { useEffect, useState } from "react";
import './TagList.scss';
import { Button, DynamicFormFieldProps, IAlertFormField, IconButton, IFormAlertProps, useAlert, useToast } from "uxp/components";
import { SimpleTable } from "./SimpleTable";
import "./MetadataList.scss";
import { getAllMetadataTypes } from "@ums-service";
import { BaseWidgetProps, MetadataType } from "@types";
import { IContextProvider } from "@uxp";

interface Metadata {
    [key: string]: string | number | boolean;
}

interface MetadataForType {
    type: string;
    metadata: Metadata;
}

interface MetadataListProps {
    uxpContext: IContextProvider;
    metadataList: Array<MetadataForType>;
    onChangeMetadataList: (newMetadataList: Array<MetadataForType>) => void;
    editable?: boolean;
}

const MetadataList: React.FC<MetadataListProps> = ({ metadataList, onChangeMetadataList, editable = true, uxpContext }) => {
    const [metadataItems, setMetadataItems] = useState<MetadataForType[]>([]);
    const [metadataTypes, setMetadataTypes] = useState<MetadataType[]>([]);

    const toast = useToast();
    const alerts = useAlert();

    useEffect(() => {
        setMetadataItems(metadataList);
    }, [metadataList]);

    useEffect(() => {
        const fetchMetadataTypes = async () => {
            try {
                const types = await getAllMetadataTypes(uxpContext).then(({ data, error }) => {
                    if (error) {
                        setMetadataTypes([])
                        toast.error(`Unable to get metadata types. Error: ${error}`)
                        return
                    }

                    setMetadataTypes(data);
                })

            } catch (e) {
                console.error("Failed to fetch metadata types", e);
            }
        };

        fetchMetadataTypes();
    }, []);

    const addMetadataType = async () => {
        try {
            const data = await alerts.form({
                title: 'Add New Metadata',
                formStructure: [
                    {
                        title: '',
                        columns: 1,
                        fields: [
                            {
                                name: 'type',
                                label: 'Type',
                                type: 'select',
                                options: metadataTypes?.map((type) => ({
                                    value: type.type,
                                    label: type.type,
                                })),
                                validate: { required: true },
                            },
                        ] as DynamicFormFieldProps[],
                    } as IAlertFormField,
                ],
            });

            if (!data || !data.type) {
                toast.error('Type is required.');
                return;
            }

            if (metadataItems.some((item) => item.type === data.type)) {
                toast.error('Type already exists.');
                return;
            }

            const newItem: MetadataForType = { type: data.type, metadata: {} };
            const updatedItems = [...metadataItems, newItem];
            setMetadataItems(updatedItems);
            onChangeMetadataList(updatedItems);
        } catch (e) {
            console.error(e);
        }
    };
    const addMetadataKeyValue = async (index: number) => {
        try {
            const selectedMetadataType = metadataTypes.find(
                (type) => type.type === metadataItems[index].type
            );

            if (!selectedMetadataType) {
                toast.error('Unable to find metadata type fields.');
                return;
            }

            const data = await alerts.form({
                title: 'Add Metadata Field',
                formStructure: [
                    {
                        title: '',
                        columns: 2,
                        fields: [
                            {
                                name: 'key',
                                label: 'Key',
                                type: 'select',
                                options: selectedMetadataType.fields.map((field) => ({
                                    value: field.id,
                                    label: field.label,
                                })),
                                validate: { required: true },
                            },
                            {
                                name: 'value',
                                label: 'Value',
                                type: 'text',
                                validate: { required: true },
                            },
                        ],
                    },
                ],
            });

            if (!data || !data.key || !data.value) {
                toast.error('Key and Value are required.');
                return;
            }

            const updatedItems = [...metadataItems];
            const existingMetadata = updatedItems[index].metadata;

            if (existingMetadata[data.key] !== undefined) {
                toast.error('Key already exists in this metadata type.');
                return;
            }

            existingMetadata[data.key] = data.value;
            setMetadataItems(updatedItems);
            onChangeMetadataList(updatedItems);
        } catch (e) {
            console.error(e);
        }
    };

    const removeMetadataType = (index: number) => {
        const updatedItems = metadataItems.filter((_, i) => i !== index);
        setMetadataItems(updatedItems);
        onChangeMetadataList(updatedItems);
    };

    const removeMetadataKey = (index: number, key: string) => {
        const updatedItems = [...metadataItems];
        delete updatedItems[index].metadata[key];
        setMetadataItems(updatedItems);
        onChangeMetadataList(updatedItems);
    };

    return (
        <div className="metadata_input__container">
            {editable && (<div className="metadata_input__header">
                <div className="metadata_input__actions">
                    <Button icon="fas plus" title="Add Metadata" onClick={addMetadataType} />
                </div>

            </div>
            )}
            <div className="metadata_input__body">
                {metadataItems.length === 0 ? (
                    <div className="metadata_input__no_data">No metadata available.</div>
                ) : (
                    <SimpleTable className="metadata_input__outer_table" showBordersUnderRows={true}>
                        {metadataItems.map((item, index) => (
                            <tr key={index}>
                                <td>{item.type}</td>
                                <td>
                                    <SimpleTable className="metadata_input__inner_table" showBordersUnderRows={true}>
                                        {Object.entries(item.metadata).map(([key, value]) => (
                                            <tr key={key}>
                                                <td>{key}&nbsp;&nbsp; {':'} </td>
                                                <td>{value}</td>
                                                {editable && (
                                                    <td style={{ width: '50px' }}>
                                                        <IconButton
                                                            type="delete"
                                                            size="small"
                                                            onClick={() => removeMetadataKey(index, key)}
                                                        />
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </SimpleTable>
                                    {editable && (
                                        <Button
                                            styles={{ fontSize: '12px' }}
                                            icon="fas plus"
                                            title="Add New Record"
                                            onClick={() => addMetadataKeyValue(index)}
                                        />
                                    )}
                                </td>
                                {editable && (
                                    <>
                                        <td>
                                            <IconButton
                                                type="delete"
                                                size="small"
                                                onClick={() => removeMetadataType(index)}
                                            />
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </SimpleTable>
                )}
            </div>
        </div>
    );
};

export default MetadataList;
