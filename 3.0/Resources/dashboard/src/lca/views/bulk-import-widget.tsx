import React, { useState, useRef } from 'react';
import { Button, Modal, CRUDComponent, DropDownButton, Select, TableComponent } from 'uxp/components';
import './bulk-import-widget.scss';

const XLSX = require("xlsx");

interface BulkImportWidgetProps {
  className?: string;
}

const BulkImportWidget: React.FC<BulkImportWidgetProps> = ({ className = '' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [dataFile, setDataFile] = useState<File | null>(null);
  const [imagesFile, setImagesFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [sheets, setSheets] = useState<string[]>([]);
  const [isSheetSelected, setIsSheetSelected] = useState(false);
  
  const [productCodeField, setProductCodeField] = useState('');
  const [productNameField, setProductNameField] = useState('');
  const [productDescriptionField, setProductDescriptionField] = useState('');


  const [showSkipped, setShowSkipped] = useState(true);
  const [showUnmapped, setShowUnmapped] = useState(true);
    // Hardcoded mapping data to match Figma
    const mappingData = [
      {
        esgField: 'Product Code',
        required: true,
        importedHeader: 'Prod. Code',
        defaultValue: 'N/A',
        sampleData: ['PC-002', 'PC-104']
      },
      {
        esgField: 'Product Name',
        required: true,
        importedHeader: 'Name',
        defaultValue: 'N/A',
        sampleData: ['Office Chair', 'Employee Locker']
      },
      {
        esgField: 'Product Description',
        required: false,
        importedHeader: 'Description',
        defaultValue: 'No Description available for this product',
        sampleData: [
          'This is a luxury office chair with plush ergonomic cushion',
          'This is a generic plywood office desk with socket provision'
        ]
      },
      {
        esgField: 'Product Image',
        required: false,
        importedHeader: 'Image',
        defaultValue: 'N/A',
        sampleData: ['', '']
      },
      {
        esgField: 'Product Category',
        required: true,
        importedHeader: 'AI Generated',
        defaultValue: 'N/A',
        sampleData: ['-', '-']
      },
      {
        esgField: 'Product Sub-Category',
        required: true,
        importedHeader: 'Sub-Category',
        defaultValue: 'N/A',
        sampleData: ['Office supplies', 'Office supplies']
      }
    ];

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDataFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".csv")) {
      console.error("Invalid file extension. Please upload a .xlsx or .csv file.");
      // You can add toast notification here
      return;
    }

    setDataFile(file);
    setSheets([]);
    setIsSheetSelected(false);
    setCsvHeaders([]);
    setCsvRows([]);

    if (file) {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });

          // Get the sheet names and populate the dropdown options
          const sheetNames = workbook.SheetNames;
          setSheets(sheetNames);
          
          // Auto-select the sheet if there's only one sheet
          if (sheetNames.length === 1) {
            setSelectedSheet(sheetNames[0]);
            setIsSheetSelected(true);
            processSelectedSheet(workbook, sheetNames[0]);
          }
        } catch (error) {
          console.error("Error reading the Excel file:", error);
          // Add toast notification here
        }
      };

      reader.readAsArrayBuffer(file);
    }
  };

  const processSelectedSheet = (workbook: any, sheetName: string) => {
    const sheet = workbook.Sheets[sheetName];
    if (sheet) {
      // Get headers (first row)
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const sheetHeaders = jsonData[0] as string[];
      const sheetData = XLSX.utils.sheet_to_json(sheet);

      // Filter out empty headers
      const filteredHeaders = sheetHeaders?.filter((x: any) => x) || [];
      
      setCsvHeaders(filteredHeaders);
      setCsvRows(sheetData);

      // Auto-map common fields
      autoMapFields(filteredHeaders);
    }
  };

  const autoMapFields = (headers: string[]) => {
    const mappings = {
      productCode: '',
      productName: '',
      productDescription: ''
    };

    // Auto-detect common field patterns
    headers.forEach(header => {
      const lowerHeader = header.toLowerCase();
      
      if (!mappings.productCode && (
        lowerHeader.includes('code') || 
        lowerHeader.includes('product code') || 
        lowerHeader.includes('prod') ||
        lowerHeader.includes('id')
      )) {
        mappings.productCode = header;
      }
      
      if (!mappings.productName && (
        lowerHeader.includes('name') || 
        lowerHeader.includes('title') ||
        lowerHeader.includes('product name')
      )) {
        mappings.productName = header;
      }
      
      if (!mappings.productDescription && (
        lowerHeader.includes('description') || 
        lowerHeader.includes('desc') ||
        lowerHeader.includes('details')
      )) {
        mappings.productDescription = header;
      }
    });

  };

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (sheetName && dataFile) {
      setIsSheetSelected(true);
      
      // Re-read the file to process the selected sheet
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          processSelectedSheet(workbook, sheetName);
        } catch (error) {
          console.error("Error reading the Excel file:", error);
        }
      };
      reader.readAsArrayBuffer(dataFile);
    } else {
      setIsSheetSelected(false);
    }
  };

  const handleImagesFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImagesFile(event.target.files[0]);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate that we have the necessary data before proceeding
      if (!dataFile) {
        alert("Please upload a data file before proceeding");
        return;
      }
      if (sheets.length > 1 && !selectedSheet) {
        alert("Please select a sheet from your uploaded file");
        return;
      }
      if (csvHeaders.length === 0) {
        alert("No headers found in the uploaded file");
        return;
      }
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDownloadSampleFile = (type: 'data' | 'images') => {
    // Placeholder for download functionality
    console.log(`Download sample ${type} file`);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    // Reset form state when modal closes
    setCurrentStep(1);
    setDataFile(null);
    setImagesFile(null);
    setCsvHeaders([]);
    setCsvRows([]);
    setSelectedSheet("");
    setSheets([]);
    setIsSheetSelected(false);
  };

  const getSampleData = (headerName: string) => {
    if (csvRows.length > 0 && headerName) {
      const sampleValues = csvRows
        .slice(0, 3) // Get first 3 rows as sample
        .map(row => row[headerName])
        .filter(val => val !== undefined && val !== null && val !== '')
        .join(', ');
      return sampleValues || 'No sample data';
    }
    return 'No sample data';
  };

  const DataFileIcon = () => (
    <svg width="82" height="82" viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.5" fill="currentColor"/>
      <polyline points="14,2 14,8 20,8" stroke="white" strokeWidth="1.5"/>
      <line x1="16" y1="13" x2="8" y2="13" stroke="white" strokeWidth="1.5"/>
      <line x1="16" y1="17" x2="8" y2="17" stroke="white" strokeWidth="1.5"/>
      <polyline points="10,9 9,9 8,9" stroke="white" strokeWidth="1.5"/>
    </svg>
  );

  const ImageFileIcon = () => (
    <svg width="82" height="82" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
      <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
      <polyline points="21,15 16,10 5,21" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );

  const UploadIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2"/>
      <polyline points="17,8 12,3 7,8" stroke="currentColor" strokeWidth="2"/>
      <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );

  const DownloadIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2"/>
      <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2"/>
      <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
  const DropdownIcon = () => (
    <svg width="15" height="14" viewBox="0 0 15 14" fill="none">
      <path d="M7.39 3.5L3.70 5.25L7.39 7L11.08 5.25L7.39 3.5Z" 
            stroke="#181D27" strokeWidth="1.67" fill="none"/>
    </svg>
  );
  
  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="bulk-import__step-content">
            <div className="bulk-import__content-header">
              <p>Download the sample files and compare it with your import files to ensure you have them perfect for import.</p>
            </div>

            <div className="bulk-import__upload-sections">
              {/* Data File Section */}
              <div className="bulk-import__upload-section">
                <h3 className="bulk-import__section-title">A. Data File</h3>
                <div className="bulk-import__upload-area">
                  <div className="bulk-import__upload-icon">
                    <DataFileIcon />
                  </div>
                  <p>Drag and drop your <strong>data file</strong> here in .csv or .xls format</p>
                  <p className="bulk-import__or-text">or</p>
                  <input
                    type="file"
                    id="data-file-input"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleDataFileChange}
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                  />
                  <button 
                    className="bulk-import__browse-btn"
                    onClick={() => document.getElementById('data-file-input')?.click()}
                  >
                    <UploadIcon />
                    Browse File for upload
                    <DownloadIcon />
                  </button>
                  <button 
                    className="bulk-import__download-sample-btn"
                    onClick={() => handleDownloadSampleFile('data')}
                  >
                    Download sample file
                  </button>
                  <p className="bulk-import__file-limit">Maximum file size allowed is 25 MB</p>
                  {dataFile && <p className="bulk-import__selected-file">Selected: {dataFile.name}</p>}
                </div>
                
                {/* Sheet Selection - Only show if multiple sheets */}
                {sheets.length > 1 && (
                  <div className="bulk-import__sheet-selection">
                    <label>Select Sheet:</label>
                    <Select
                      placeholder="Select a Sheet"
                      options={[
                        { value: "", label: "-- Select a sheet --" },
                        ...sheets.map((sheet) => ({ value: sheet, label: sheet })),
                      ]}
                      selected={selectedSheet}
                      onChange={(newValue: any) => handleSheetChange(newValue)}
                    />
                  </div>
                )}
                
                {/* Show headers preview if available */}
                {csvHeaders.length > 0 && (
                  <div className="bulk-import__headers-preview">
                    <h4>Detected Headers:</h4>
                    <div className="bulk-import__headers-list">
                      {csvHeaders.map((header, index) => (
                        <span key={index} className="bulk-import__header-tag">{header}</span>
                      ))}
                    </div>
                    <p>Found {csvRows.length} data rows</p>
                  </div>
                )}
                
                <div className="bulk-import__note">
                  <strong>Note:</strong> You can import upto 5000 records at a time
                </div>
              </div>

              {/* Images ZIP Section */}
              <div className="bulk-import__upload-section">
                <h3 className="bulk-import__section-title">B. Images Zip File</h3>
                <div className="bulk-import__upload-area">
                  <div className="bulk-import__upload-icon">
                    <ImageFileIcon />
                  </div>
                  <p>Drag and drop your <strong>images</strong> zip file</p>
                  <p className="bulk-import__or-text">or</p>
                  <input
                    type="file"
                    id="images-file-input"
                    accept=".zip"
                    onChange={handleImagesFileChange}
                    style={{ display: 'none' }}
                  />
                  <button 
                    className="bulk-import__browse-btn"
                    onClick={() => document.getElementById('images-file-input')?.click()}
                  >
                    <UploadIcon />
                    Browse File for upload
                    <DownloadIcon />
                  </button>
                  <button 
                    className="bulk-import__download-sample-btn"
                    onClick={() => handleDownloadSampleFile('images')}
                  >
                    Download sample file
                  </button>
                  <p className="bulk-import__file-limit">Maximum file size allowed is 25 MB</p>
                  {imagesFile && <p className="bulk-import__selected-file">Selected: {imagesFile.name}</p>}
                </div>
                <div className="bulk-import__note">
                  <strong>Note:</strong> Name each of your image (.png) files with the product code corresponding to that of the importing product for and compress it all into a .zip file for effective mapping
                </div>
              </div>
            </div>
          </div>
        );

      case 2:



        return (
          <div className="bulk-import__step-content">
            <h3>Field Mapping & Assigning Defaults</h3>
            
            {csvHeaders.length === 0 ? (
              <div className="bulk-import__no-data">
                <p>No headers available. Please go back and upload a valid file.</p>
              </div>
            ) : (
              <>
                <div className="bulk-import__mapping-info">
                  <p><strong>File Selected:</strong> {dataFile?.name}</p>
                </div>

                <div className="field-mapping-table">
  <div className="field-mapping-header">
    <div>ESG Now Field Labels</div>
    <div>Imported File Headers</div>
    <div>Default Field Values</div>
    <div>Sample Data from File</div>
  </div>
  {mappingData.map((field, idx) => (
    <div className="field-mapping-row" key={idx}>
      <div className="field-label">
        {field.esgField} {field.required && <span className="required">*</span>}
      </div>
      <div className="field-dropdown">
      <Select
      selected={
          field.esgField === 'Product Code' ? productCodeField :
          field.esgField === 'Product Name' ? productNameField :
          field.esgField === 'Product Description' ? productDescriptionField :
          ''
        }
        options={csvHeaders.map(header => ({
          value: header,
          label: header
        }))}
        onChange={(value) => {
          if (field.esgField === 'Product Code') setProductCodeField(value);
          else if (field.esgField === 'Product Name') setProductNameField(value);
          else if (field.esgField === 'Product Description') setProductDescriptionField(value);
        }}
        className="dropdown-select"
      />

      </div>
                  <div className="field-default">
                    {field.defaultValue}
                  </div>
                  <div className="field-sample-columns">
                    <div className="sample-column">{field.sampleData[0] || '-'}</div>
                    <div className="sample-column with-divider">{field.sampleData[1] || '-'}</div>
                  </div>
                </div>
              ))}
            </div>

              </>
            )}
          </div>
        );

        case 3:

        
          const skippedRows = [
            { row: 7, code: '#P - 0291', name: 'Wrist Cooling Pad', reason: 'There seems to be a mismatch between the corresponding image mapped and the product information specified.' },
            { row: 13, code: '#P - 0873', name: '-', reason: 'Insufficient information - Product details are missing.' }
          ];
        
          const unmappedFields = ['Sub-Category level 2', 'Product Price', 'Date of purchase'];
        
          return (
            <div className="bulk-import__step-content review-import">
              <h3>Review & Import</h3>
        
              <div className="review-section">
                <div className="review-row">
                  <div className="review-toggle">
                    <span className="icon">📦</span>
                    <span>Product records ready for Import</span>
                  </div>
                  <span>: 500</span>
                  <a className="toggle-link">View Details</a>
                </div>
        
                <div className="review-row">
                  <div className="review-toggle" onClick={() => setShowSkipped(!showSkipped)}>
                    <span className="icon">{showSkipped ? '▼' : '▶'}</span>
                    <span>No. of Records Skipped</span>
                  </div>
                  <span>: 2</span>
                  <div className="row-actions">
                    {showSkipped && (
                      <a className="download-link" onClick={() => alert('Download skipped rows')}>Download skipped rows</a>
                    )}
                    <a className="toggle-link" onClick={() => setShowSkipped(!showSkipped)}>
                      {showSkipped ? 'Hide Details ▲' : 'View Details ▼'}
                    </a>
                  </div>
                </div>
        
                {showSkipped && (
                  <div className="skipped-table">
                    <div className="table-header">
                      <div>ROW NO.</div>
                      <div>PRODUCT DETAILS</div>
                      <div>SKIPPED REASON</div>
                    </div>
                    {skippedRows.map((item, idx) => (
                      <div className="table-row" key={idx}>
                        <div>{item.row}</div>
                        <div>
                          <div className="code">{item.code}</div>
                          <div>{item.name}</div>
                        </div>
                        <div>{item.reason}</div>
                      </div>
                    ))}
                  </div>
                )}
        
                <div className="review-row">
                  <div className="review-toggle" onClick={() => setShowUnmapped(!showUnmapped)}>
                    <span className="icon">{showUnmapped ? '▼' : '▶'}</span>
                    <span>Unmapped Fields</span>
                  </div>
                  <span>: {unmappedFields.length}</span>
                  <a className="toggle-link" onClick={() => setShowUnmapped(!showUnmapped)}>
                    {showUnmapped ? 'Hide Details ▲' : 'View Details ▼'}
                  </a>
                </div>
        
                {showUnmapped && (
                  <div className="unmapped-info">
                    <p>
                      The following fields in your upload file have not been mapped to any of IVIVA’s ESG NOW fields.
                      Please create <strong>‘New Custom Fields’</strong> for these fields and map them to the relevant field labels in your import file.
                      If not, they will be ignored during import.
                    </p>
                    <ul>
                      {unmappedFields.map((field, idx) => (
                        <li key={idx}>{field}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        

      default:
        return null;
    }
  };

  return (
    <div className={`bulk-import-widget ${className}`}>
      <button 
        className="bulk-import__trigger-btn"
        onClick={() => setIsModalOpen(true)}
      >
        Bulk Upload Products
      </button>

      <Modal
        show={isModalOpen} 
        onClose={handleModalClose}
        title="Bulk Upload Products"
        className="bulk-import__modal"
        headerContent={
          <div className="bulk-import__modal-header">
            <span className="bulk-import__modal-title">Bulk Upload Products</span>
            <div className="bulk-import__modal-header-controls">
              {currentStep > 1 && (
                <Button 
                  title="Previous"
                  className="bulk-import__back-btn"
                  onClick={handleBack}
                />
              )}
              {currentStep < 3 ? (
                <Button
                  title="Next"
                  onClick={handleNext}
                  className="bulk-import__next-btn"
                />
              ) : (
                <Button 
                  className="bulk-import__import-btn"
                  title="Start Import"
                  onClick={() => {
                    if (!productCodeField || !productNameField) {
                      alert('Please map the required fields (Product Code and Product Name) before importing.');
                      return;
                    }
                    console.log('Data rows:', csvRows);
                    handleModalClose();
                  }}
                  disabled={!productCodeField || !productNameField}
                />
              )}
            </div>

          </div>
        }
      >
        {/* Progress Steps */}
        <div className="bulk-import__progress-steps">
          <div className={`bulk-import__step ${currentStep >= 1 ? 'bulk-import__step--active' : ''}`}>
            <div className="bulk-import__step-number">1</div>
            <span className="bulk-import__step-text">Upload File</span>
          </div>

          <div className="step-line" />

          <div className={`bulk-import__step ${currentStep >= 2 ? 'bulk-import__step--active' : ''}`}>
            <div className="bulk-import__step-number">2</div>
            <span className="bulk-import__step-text">Map Fields & Assign Defaults</span>
          </div>

          <div className="step-line" />

          <div className={`bulk-import__step ${currentStep >= 3 ? 'bulk-import__step--active' : ''}`}>
            <div className="bulk-import__step-number">3</div>
            <span className="bulk-import__step-text">Review & Import</span>
          </div>
        </div>

        {/* Step Content */}
        {getStepContent()}

      </Modal>
    </div>
  );
};

export default BulkImportWidget;
