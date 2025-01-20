import './Queue.scss'
import React, { useCallback, useRef, useState } from "react";
import { BaseWidgetProps } from "@types";
import { deleteDoneQueue, getDoneQueue } from "@ums-service";
import { Button, CRUDComponent, Modal, WidgetWrapper } from 'uxp/components'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface QueueComponentProps extends BaseWidgetProps {}

export const DoneQueue: React.FunctionComponent<QueueComponentProps> = (props) => {
    const { uxpContext } = props
    const crudUIRef = useRef(null)
    const [selectedMeasurements, setSelectedMeasurements] = useState<{ measurementToRemove?: string[], measurementToUpdate?: string[] } | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const getData = useCallback(async() => {
        const { data, error } = await getDoneQueue(uxpContext)
        if (!!error) return { items: [] }

        return { items: data }
    }, [uxpContext, isLoading])

    return <WidgetWrapper className="queue-wrapper">
        <CRUDComponent
            ref={crudUIRef}
            list={{
                title: <div className='title-container'>
                    <span>Done Queue</span>
                    <Button 
                        title={"Clear All"}
                        className='clear-btn'
                        onClick={async() => {
                            try {
                                setIsLoading(true)
                                await deleteDoneQueue(uxpContext)
                            } finally {
                                setIsLoading(false)
                            }
                        }} 
                    />
                </div>,
                
                columns: [
                    {
                        id: 'meterId',
                        label: 'Meter ID',
                        renderColumn: (item) => `${ item.meterId}${item.isVirtualMeter ? ' (Virtual)' : ''}`
                    },

                    {
                        id: 'status',
                        label: 'Status',
                        renderColumn: (item) => <span style={{fontWeight: 'bold'}}>{item.status}</span>,
                        minWidth: 120,
                        maxWidth: 120
                    },
                    {
                        id: 'type',
                        label: 'Type',
                        renderColumn: (item) => item.type,
                        minWidth: 120,
                        maxWidth: 120
                    },
                    {
                        id: 'scalingFactor',
                        label: 'Scaling Factor',
                        renderColumn: (item) => item.scalingFactor || 'N/A'
                    },
                    {
                        id: 'dateRange',
                        label: 'Date Range',
                        renderColumn: (item) => `${new Date(item.start).toLocaleDateString()} - ${new Date(item.stop).toLocaleDateString()}`
                    },
                    {
                        id: 'measurements',
                        label: 'Measurements',
                        renderColumn: (item) => (
                            <FontAwesomeIcon
                                style={{ width: '25px', height: '25px', cursor: 'pointer', color: '#666' }}
                                icon={['fas', 'info-circle']}
                                onClick={() => setSelectedMeasurements({
                                    measurementToRemove: item.measurementToRemove,
                                    measurementToUpdate: item.measurementToUpdate
                                })}
                            />
                        )
                    }
                ],
                defaultPageSize: 25,
                data: {
                    isPaginated: false,
                    getData
                },
                search: {
                    enabled: true,
                    fields: ['meterId', 'type', 'status']
                },
            }}
        />

        {selectedMeasurements && (
            <Modal
                title="Measurements Details"
                show={true}
                onClose={() => setSelectedMeasurements(null)}
            >
                <div style={{ padding: '20px' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <strong>Measurements to Remove:</strong>
                        <div style={{ maxHeight: '200px', overflow: 'auto', marginTop: '8px' }}>
                            {selectedMeasurements.measurementToRemove?.map((m: string, i: number) => (
                                <div key={i} style={{ fontSize: '12px', marginBottom: '8px', padding: '4px', backgroundColor: '#f5f5f5' }}>
                                    {m}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <strong>Measurements to Update:</strong>
                        <div style={{ maxHeight: '200px', overflow: 'auto', marginTop: '8px' }}>
                            {selectedMeasurements.measurementToUpdate?.map((m: string, i: number) => (
                                <div key={i} style={{ fontSize: '12px', marginBottom: '8px', padding: '4px', backgroundColor: '#f5f5f5' }}>
                                    {m}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Modal>
        )}
    </WidgetWrapper>
}