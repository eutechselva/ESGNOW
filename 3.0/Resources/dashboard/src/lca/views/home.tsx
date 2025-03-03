import React, { useEffect, useState } from 'react';
import { Button, Input, FormField, Label, Select, TableComponent, SearchBox, FilterPanel } from 'uxp/components';
import './home.scss';

const HomeDashboard = () => {
    const data = [
        { ProductImage: 'https://via.placeholder.com/50', ProductCode: 'P12345', ProductName: 'Black Executive Office Chair - Leather/Fabric - Arm & Headrest -Domino', TotalImpact: 15.2, MainCategory: 'Furniture', SubCategory: 'Chair', Date: '2025-02-05' },
        { ProductImage: 'https://via.placeholder.com/50', ProductCode: 'P67890', ProductName: 'Black Executive Office Chair - Leather/Fabric - Arm & Headrest -Domino', TotalImpact: 20.5, MainCategory: 'Furniture', SubCategory: 'Chair', Date: '2025-02-04' },
        { ProductImage: 'https://via.placeholder.com/50', ProductCode: 'P67890', ProductName: 'Black Executive Office Chair - Leather/Fabric - Arm & Headrest -Domino', TotalImpact: 20.5, MainCategory: 'Furniture', SubCategory: 'Chair', Date: '2025-02-04' },
        { ProductImage: 'https://via.placeholder.com/50', ProductCode: 'P67890', ProductName: 'Black Executive Office Chair - Leather/Fabric - Arm & Headrest -Domino', TotalImpact: 20.5, MainCategory: 'Furniture', SubCategory: 'Chair', Date: '2025-02-04' },
        { ProductImage: 'https://via.placeholder.com/50', ProductCode: 'P67890', ProductName: 'Black Executive Office Chair - Leather/Fabric - Arm & Headrest -Domino', TotalImpact: 20.5, MainCategory: 'Furniture', SubCategory: 'Chair', Date: '2025-02-04' },
    ];

    const [searchValue, setSearchValue] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [selected, setSelected] = useState<string | null>(null);

    const handleSearchChange = (value: string) => {
        setSearchValue(value);
    };

    return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
            <div className="title-container">
                <h1 className="heading">Welcome to ESG NOW!</h1>
            </div>

            <div className="summary-card-container">
                <section className="summary">
                    <div className="card">
                        <h2>No. of Products Created</h2>
                        <p className="number">245</p>
                        <span>Products</span>
                    </div>
                    {/* <div className="card">
                        <h2>No. of Impacts Calculated</h2>
                        <p className="number">245</p>
                        <span>Emission Impact</span>
                    </div> */}
                    <div className="card">
                        <h2>No. of Projects Created</h2>
                        <p className="number">10</p>
                        <span>Projects</span>
                    </div>
                    <div className="card">
                        <h2>No. of AI Credits Consumed</h2>
                        <p className="number">1000</p>
                        <span>Credits</span>
                    </div>
                </section>

                <section className="getting-started">
                    <iframe
                        width="100%"
                        height="200"
                        src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
                        title="Getting Started Video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </section>
            </div>

            <div className="recent-projects-container">
                <div className="recent-projects">
                    <div className="recent-projects-header">
                        <h2>Recent Products</h2>
                        <div className="search-box-filter-container">
                            <div className="uxp-search-box-container">
                                <SearchBox
                                    placeholder="Search products..."
                                    value={searchValue}
                                    onChange={handleSearchChange}
                                />
                            </div>
                            <FilterPanel
                                enableClear={inputValue?.length > 0 || selected != null}
                                onClear={() => { setInputValue(""); setSelected(null) }} >
                                <FormField className="no-padding mb-only">
                                    <Label>Sort By</Label>
                                    <Select
                                        selected={selected}
                                        options={[
                                            { label: "Name", value: "op-1" },
                                            { label: "Date", value: "op-2" },
                                        ]}
                                        onChange={(value) => { setSelected(value) }}
                                        placeholder=" -- select --"
                                        isValid={selected ? selected?.length > 0 : null}
                                    />
                                </FormField>
                            </FilterPanel>
                        </div>
                    </div>
                    <TableComponent
                        data={data}
                        columns={[
                            { id: 'ProductImage', label: 'Product Image' },
                            { id: 'ProductCode', label: 'Product Code' },
                            { id: 'ProductName', label: 'Product Name' },
                            { id: 'TotalImpact', label: 'Total Impact' },
                            { id: 'MainCategory', label: 'Main Category' },
                            { id: 'SubCategory', label: 'Sub Category' },
                            { id: 'Date', label: 'Date Created/Modified' }
                        ]}
                        pageSize={10}
                        total={25}
                    />
                </div>
            </div>
        </div>
    );
};

export default HomeDashboard