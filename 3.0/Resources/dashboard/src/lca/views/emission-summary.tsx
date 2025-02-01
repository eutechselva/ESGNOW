import React, { useState } from 'react';
import './emission-summary.scss';
import { Button, Input, FormField, Label, Select } from 'uxp/components';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { Modal } from 'uxp/components';
import Projects from './projects';

const SaveResultsModal: React.FC<{ onClose: () => void; hasExistingProjects: boolean }> = ({
    onClose,
    hasExistingProjects,
}) => {
    const [selectedCard, setSelectedCard] = useState<string | null>(null);
    const [projectName, setProjectName] = useState('');
    const [projectId, setProjectId] = useState('');
    const [selectedProject, setSelectedProject] = useState<string | null>(null);

    const projectOptions = [
        { label: "Project Alpha", value: "alpha" },
        { label: "Project Beta", value: "beta" },
        { label: "Project Gamma", value: "gamma" },
    ];
    return (
        <Modal show={true} onClose={onClose} title="Save Emission Results">
            <div className="save-results-modal">

                {hasExistingProjects ? (
                    <p>Would you like to save these results by creating a new project or adding them to an existing one?</p>
                ) : (
                    <p>
                        No existing projects found.Please create a new project.
                    </p>
                )}

                <div className="card-container">
                    <div
                        className={`option-card ${selectedCard === 'new' ? 'selected' : ''}`}
                        onClick={() => setSelectedCard('new')}
                    >
                        <h3>Create New Project</h3>
                        <p>Start a fresh project with these results.</p>
                    </div>
                    {hasExistingProjects && (
                        <div
                            className={`option-card ${selectedCard === 'existing' ? 'selected' : ''}`}
                            onClick={() => setSelectedCard('existing')}
                        >
                            <h3>Add to Existing Project</h3>
                            <p>Include these results in one of your existing projects.</p>
                        </div>
                    )}
                </div>
                {selectedCard === 'new' && (
                    <div className="new-project-inputs">
                        <FormField>
                            <Label><span style={{ fontSize: '12px' }}>Project Name</span></Label>
                            <Input
                                type="text"
                                value={projectName}
                                onChange={(value) => setProjectName(value)}
                                placeholder="Enter project name"
                            />
                        </FormField>
                        <FormField>
                            <Label><span style={{ fontSize: '12px' }}>Project Code</span></Label>
                            <Input
                                type="text"
                                value={projectId}
                                onChange={(value) => setProjectId(value)}
                                placeholder="Enter project ID"
                            />
                        </FormField>
                    </div>
                )}
                {selectedCard === 'existing' && (
                    <div className="existing-project-selection">
                        <FormField>
                            <Label><span style={{ fontSize: '12px' }}>Select an existing project</span></Label>
                            <Select
                                options={projectOptions}
                                selected={selectedProject}
                                onChange={(newValue) => setSelectedProject(newValue)}
                                placeholder="Select a project"
                            />
                        </FormField>
                    </div>
                )}
                <div className="save-button-container">
                    <Button title="Save results" onClick={onClose} className="save-results" />
                </div>
            </div>
        </Modal>
    );
};


const EmissionSummary: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');

    const toggleExpand = () => setIsExpanded(!isExpanded);

    const handleViewToggle = (mode: 'list' | 'tree') => setViewMode(mode);
    const [showModal, setShowModal] = useState(false);
    const [hasExistingProjects, setHasExistingProjects] = useState(true);
    const [showProjects, setShowProjects] = useState(false); // Change this based on actual data

    const donutChartOptions: Highcharts.Options = {
        chart: {
            type: 'pie',
            backgroundColor: null,
            height: 350,
            width: 600,
            events: {
                render() {
                    const chart = this as Highcharts.Chart & { customText?: Highcharts.SVGElement };
                    const totalValue = 60 + 40 + 30; 
                    if (!chart.customText) {
                        chart.customText = chart.renderer
                            .text(
                                `${totalValue} KgCO₂e`,
                                chart.plotWidth / 2 + chart.plotLeft,
                                chart.plotHeight / 2 + chart.plotTop
                            )
                            .css({
                                fontSize: '16px',
                                fontWeight: 'bold',
                                fontFamily: 'Comfortaa',
                                color: '#424242',
                                textAlign: 'center',
                            })
                            .attr({
                                align: 'center',
                                zIndex: 5,
                            })
                            .add();
                    } else {
                        chart.customText.attr({
                            text: `${totalValue} KgCO₂e`,
                        });
                    }
                },
            },
        },
        title: {
            text: '',
        },
        plotOptions: {
            pie: {
                innerSize: '60%',
                dataLabels: {
                    enabled: false,
                    format: '{point.name}: {point.y} KgCO₂e ({point.percentage:.1f}%)',
                    style: {
                        fontSize: '12px',
                        fontWeight: 'bold',
                        fontFamily: 'Comfortaa',
                        color: '#424242',
                    },
                },
            },
        },
        series: [
            {
                name: 'Contribution',
                type: 'pie',
                data: [
                    { name: 'Raw Materials', y: 60, color: '#78BE7C' },
                    { name: 'Manufacturing', y: 40, color: '#ffaa00' },
                    { name: 'Transportation', y: 30, color: '#2A9D8F' },
                ],
            },
        ],
        legend: {
            enabled: true,
            layout: 'horizontal',
            align: 'center',
            verticalAlign: 'bottom',
            symbolRadius: 5, 
            symbolHeight: 10,
            symbolWidth: 10,
            itemMarginTop: 5,
            itemStyle: {
                fontFamily: 'Comfortaa',
                fontWeight: 'bold',
                fontSize: '12px',
            },
        },
        tooltip: {
            pointFormat: '<b>{point.name}</b>: {point.y} KgCO₂e ({point.percentage:.1f}%)',
        },
        credits: {
            enabled: false,
        },
    };

    function onSave(): void {
        setShowModal(true);
    }

    return (
        <>
            <div className="title-container">
                <h1 className="dashboard-title">Emission Summary</h1>

                <div className="save-go-back-buttons">
                    <Button
                        title="Save results & view later"
                        onClick={onSave}
                        className="save-results-button"
                    />
                    <Button
                        title="Go back"
                        onClick={onBack}
                        className="back-button"
                    />
                </div>
            </div>
            <div className="widgets-section">
                <div className="widget product-footprint">
                    <h3>Product Footprint</h3>
                    <div className="widget-content">
                        <HighchartsReact highcharts={Highcharts} options={donutChartOptions} />
                    </div>
                </div>
                <div className="widgets-row">
                    <div className="widget contribution-raw-material">
                        <h3>Contribution by Raw Material</h3>
                        <div className="widget-content">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Material Class</th>
                                        <th>Specific Material</th>
                                        <th>Contribution</th>
                                        <th>Percentage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Metal</td>
                                        <td>Aluminum</td>
                                        <td>20 KgCO₂e</td>
                                        <td>25%</td>
                                    </tr>
                                    <tr>
                                        <td>Metal</td>
                                        <td>Aluminum</td>
                                        <td>20 KgCO₂e</td>
                                        <td>25%</td>
                                    </tr>
                                    <tr>
                                        <td>Metal</td>
                                        <td>Aluminum</td>
                                        <td>20 KgCO₂e</td>
                                        <td>25%</td>
                                    </tr>
                                    <tr>
                                        <td>Metal</td>
                                        <td>Aluminum</td>
                                        <td>20 KgCO₂e</td>
                                        <td>25%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="widget contribution-manufacturing">
                        <h3>Contribution by Manufacturing</h3>
                        <div className="widget-content">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Material Class</th>
                                        <th>Specific Material</th>
                                        <th>Contribution</th>
                                        <th>Percentage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Wood Working</td>
                                        <td>Sawing</td>
                                        <td>20 KgCO₂e</td>
                                        <td>25%</td>
                                    </tr>
                                    <tr>
                                        <td>Wood Working</td>
                                        <td>Sawing</td>
                                        <td>20 KgCO₂e</td>
                                        <td>25%</td>
                                    </tr>
                                    <tr>
                                        <td>Wood Working</td>
                                        <td>Sawing</td>
                                        <td>20 KgCO₂e</td>
                                        <td>25%</td>
                                    </tr>
                                    <tr>
                                        <td>Wood Working</td>
                                        <td>Sawing</td>
                                        <td>20 KgCO₂e</td>
                                        <td>25%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="widget contribution-raw-material">
                        <h3>Contribution by Transportation</h3>
                        <div className="widget-content">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Mode</th>
                                        <th>Origin</th>
                                        <th>Destination</th>
                                        <th>Contribution</th>
                                        <th>Percentage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Wood Working</td>
                                        <td>Srilanka</td>
                                        <td>China</td>
                                        <td>20 KgCO₂e</td>
                                        <td>25%</td>
                                    </tr>
                                    <tr>
                                        <td>Wood Working</td>
                                        <td>Srilanka</td>
                                        <td>China</td>
                                        <td>20 KgCO₂e</td>
                                        <td>25%</td>
                                    </tr>
                                    <tr>
                                        <td>Wood Working</td>
                                        <td>Srilanka</td>
                                        <td>China</td>
                                        <td>20 KgCO₂e</td>
                                        <td>25%</td>
                                    </tr>
                                    <tr>
                                        <td>Wood Working</td>
                                        <td>Srilanka</td>
                                        <td>China</td>
                                        <td>20 KgCO₂e</td>
                                        <td>25%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            {showModal && <SaveResultsModal onClose={() => setShowModal(false)} hasExistingProjects={hasExistingProjects} />}
        </>
    );
};

export default EmissionSummary;
