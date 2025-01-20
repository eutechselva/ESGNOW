import React, { useEffect, useRef, useState } from "react";
import { BaseWidgetProps, ILocation, MeterType, Tag, UtilityMeter, UtilityMeterType } from "@types";
import { deleteMeter, getAllMeters, getAllUtilityMeterTypes, getAllTags } from "@ums-service";
import { ActionResponse, CRUDComponent, useToast, WidgetWrapper, Modal, Button, IconButton } from 'uxp/components';
import { getAllLocations } from "@other-services";
import { generateUITagsFromTags, TagList } from "@components/common/TagList";
import { MeterConfigForm } from "@components/widgets/meters/MeterConfigForm";
import MetadataList from "@components/common/MetadataList";
import './MeterCRUDComponent.scss'

interface MeterCRUDComponentProps extends BaseWidgetProps { }

export const MeterCRUDComponent: React.FunctionComponent<MeterCRUDComponentProps> = (props) => {

    const { uxpContext } = props;

    const [meterTypes, setMeterTypes] = useState<UtilityMeterType[]>([]);
    const [locations, setLocations] = useState<ILocation[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [selectedMetadata, setSelectedMetadata] = useState<any[]>(null);

    const crudUIRef = useRef(null);
    const toast = useToast();

    useEffect(() => {
        getMeterTypes();
        getLocations();
        getTags();
    }, []);

    async function getMeterTypes() {
        const { data, error } = await getAllUtilityMeterTypes(uxpContext);
        if (!!error) {
            setMeterTypes([]);
            toast.error('Unable to get meter types. ' + error);
            return;
        }
        setMeterTypes(data);
    }

    async function getLocations() {
        const { data, error } = await getAllLocations(uxpContext);
        if (!!error) {
            setLocations([]);
            toast.error('Unable to get locations. ' + error);
            return;
        }
        setLocations(data);
    }

    async function getTags() {
        const { data, error } = await getAllTags(uxpContext);
        if (!!error) {
            setTags([]);
            toast.error('Unable to get tags. ' + error);
            return;
        }

        setTags(data);
    }

    async function getMeters() {
        const { data, error } = await getAllMeters(uxpContext);
        if (!!error) return { items: [] };
        return { items: data };
    }

    async function handleDelete(item: UtilityMeter): Promise<ActionResponse> {
        const { data, error } = await deleteMeter(uxpContext, item.meterId);
        crudUIRef?.current?.refreshList();
        return {
            status: !!error ? 'error' : 'done',
            message: !!error ? `Unable to delete the meter. ${error}` : 'Meter deleted!',
        };
    }

    function renderCustomForm(show: boolean, onClose: () => void, editInstance?: UtilityMeter) {

        return <MeterConfigForm
            uxpContext={uxpContext}
            meterType={MeterType.Meters}
            show={show}
            onClose={onClose}
            editInstance={editInstance}
            afterSave={() => { crudUIRef?.current?.refreshList(); }}
            utilityTypes={meterTypes}
            utilityMeters={[]}
            virtualMeters={[]}
            meterGroups={[]}
            tags={tags}
            locations={locations}
        />;
    }

    return <WidgetWrapper>
        <CRUDComponent
            ref={crudUIRef}
            list={{
                title: 'Meters',
                columns: [
                    {
                        id: 'displayName',
                        label: 'Name'
                    },
                    {
                        id: 'description',
                        label: 'Description'
                    },
                    {
                        id: 'meterType',
                        label: 'Meter Type',
                        renderColumn: (item) => {
                            return <>
                                <div>{item.meterType}</div>
                                <div style={{ fontSize: '0.9em', opacity: '0.8' }}>{item.unit}</div>
                            </>;
                        }
                    },
                    {
                        id: "servingLocation",
                        label: 'Serving Location',
                        renderColumn: (item) => {
                            const location = (locations || []).find(l => l.LocationKey == item?.servingLocation);
                            return <>{location?.LocationName || 'N/A'}</>;
                        }

                    },
                    {
                        id: 'tags',
                        label: 'Tags',
                        renderColumn: (item) => {
                            return <div style={{ fontSize: '0.8em', marginTop: '10px' }}>
                                <TagList tags={generateUITagsFromTags(item.tags, tags)} />
                            </div>;
                        }
                    },
                    {
                        id: 'metadata',
                        label: 'Metadata',
                        renderColumn: (item) => {
                            return <Button icon="fas info" onClick={() => setSelectedMetadata(item.metadata)} title="View" />
                        }
                    }
                ],
                defaultPageSize: 25,
                data: {
                    isPaginated: false,
                    getData: getMeters
                },
                search: {
                    enabled: true,
                    fields: ['name']
                },
                onDeleteItem: handleDelete
            }}
            renderCustomAddView={renderCustomForm}
            renderCustomEditView={renderCustomForm}
        />

        {selectedMetadata && (
            <Modal
                className="ums_metercrud__metadata_model"
                title="Metadata Details"
                show={selectedMetadata != null}
                onClose={() => {
                    setSelectedMetadata(null)
                }}
            >
                <MetadataList
                    uxpContext={uxpContext}
                    metadataList={selectedMetadata}
                    editable={false}
                    onChangeMetadataList={(updatedList) => setSelectedMetadata(updatedList)}
                />
            </Modal>
        )}
    </WidgetWrapper>;
};
