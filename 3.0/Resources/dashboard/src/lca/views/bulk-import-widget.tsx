import React, { useState, useRef, useEffect } from 'react';
import { Button, Modal, CRUDComponent, DropDownButton, Select, TableComponent } from 'uxp/components';
import { IContextProvider } from '@uxp';
import { bulkUpload, bulkImageUpload, triggerAIProcessing } from '../../esgnow-service';
import './bulk-import-widget.scss';

const XLSX = require("xlsx");

interface BulkImportWidgetProps {
  className?: string;
  uxpContext?: IContextProvider;
  hideToggleButton?: boolean;
}

const BulkImportWidget: React.FC<BulkImportWidgetProps> = ({ className = '', uxpContext, hideToggleButton = false }) => {
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
  const [productCategoryField, setProductCategoryField] = useState('');
  const [productSubCategoryField, setProductSubCategoryField] = useState('');
  const [weightField, setWeightField] = useState('');
  const [countryOfOriginField, setCountryOfOriginField] = useState('');
  const [supplierNameField, setSupplierNameField] = useState('');


  const [showSkipped, setShowSkipped] = useState(true);
  const [showUnmapped, setShowUnmapped] = useState(true);
  const [showReadyRecords, setShowReadyRecords] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadMessageType, setUploadMessageType] = useState<"success" | "error" | null>(null);
  const [showPostUploadAlert, setShowPostUploadAlert] = useState(false);

  // Listen for custom event from home component
  useEffect(() => {
    const handleOpenBulkImport = () => {
      setIsModalOpen(true);
    };

    document.addEventListener('open-bulk-import', handleOpenBulkImport);
    
    return () => {
      document.removeEventListener('open-bulk-import', handleOpenBulkImport);
    };
  }, []);

    // Mapping data aligned with microservice expected fields
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
        required: true,
        importedHeader: 'Description',
        defaultValue: 'No Description available for this product',
        sampleData: [
          'This is a luxury office chair with plush ergonomic cushion',
          'This is a generic plywood office desk with socket provision'
        ]
      },
      {
        esgField: 'Weight (kg)',
        required: false,
        importedHeader: 'Weight',
        defaultValue: '0',
        sampleData: ['15.5', '25.0']
      },
      {
        esgField: 'Country Of Origin',
        required: false,
        importedHeader: 'Country',
        defaultValue: 'Unknown',
        sampleData: ['CN', 'IN']
      },
      {
        esgField: 'Supplier Name',
        required: false,
        importedHeader: 'Supplier',
        defaultValue: 'Unknown',
        sampleData: ['OfficeFurnish Ltd', 'Industrial Supplies Co']
      },
      // {
      //   esgField: 'Product Category',
      //   required: false,
      //   importedHeader: 'Category',
      //   defaultValue: 'Uncategorized',
      //   sampleData: ['Furniture', 'Office Equipment']
      // },
      // {
      //   esgField: 'Product Sub-Category',
      //   required: false,
      //   importedHeader: 'Sub-Category',
      //   defaultValue: 'Uncategorized',
      //   sampleData: ['Office supplies', 'Storage']
      // }
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
    // Auto-detect common field patterns and set field mappings
    headers.forEach(header => {
      const lowerHeader = header.toLowerCase();
      
      // Product Code mapping
      if (!productCodeField && (
        lowerHeader.includes('code') || 
        lowerHeader.includes('product code') || 
        lowerHeader.includes('prod') ||
        lowerHeader.includes('id')
      )) {
        setProductCodeField(header);
      }
      
      // Product Name mapping
      if (!productNameField && (
        lowerHeader.includes('name') || 
        lowerHeader.includes('title') ||
        lowerHeader.includes('product name')
      )) {
        setProductNameField(header);
      }
      
      // Product Description mapping
      if (!productDescriptionField && (
        lowerHeader.includes('description') || 
        lowerHeader.includes('desc') ||
        lowerHeader.includes('details')
      )) {
        setProductDescriptionField(header);
      }

      // Weight mapping
      if (!weightField && (
        lowerHeader.includes('weight') || 
        lowerHeader.includes('kg') ||
        lowerHeader.includes('mass')
      )) {
        setWeightField(header);
      }

      // Country of Origin mapping
      if (!countryOfOriginField && (
        lowerHeader.includes('country') || 
        lowerHeader.includes('origin') ||
        lowerHeader.includes('country of origin')
      )) {
        setCountryOfOriginField(header);
      }

      // Supplier Name mapping
      if (!supplierNameField && (
        lowerHeader.includes('supplier') || 
        lowerHeader.includes('vendor') ||
        lowerHeader.includes('manufacturer')
      )) {
        setSupplierNameField(header);
      }

      // Category mapping
      if (!productCategoryField && (
        lowerHeader.includes('category') && !lowerHeader.includes('sub')
      )) {
        setProductCategoryField(header);
      }

      // Sub-Category mapping
      if (!productSubCategoryField && (
        lowerHeader.includes('subcategory') || 
        lowerHeader.includes('sub-category') ||
        lowerHeader.includes('sub category')
      )) {
        setProductSubCategoryField(header);
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
      if (!imagesFile) {
        alert("Please upload a Images ZIP before proceeding");
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
    if (type === 'data') {
      // Create sample CSV data
      const sampleData = [
        ['code', 'name', 'description', 'weight', 'country of origin', 'supplier name', 'category', 'subcategory'],
        ['PC-001', 'Executive Office Chair', 'Ergonomic leather executive chair with lumbar support', '25.5', 'China', 'OfficeFurnish Ltd', 'Furniture', 'Office Chairs'],
        ['PC-002', 'Standing Desk', 'Height adjustable standing desk with electric motor', '45.0', 'Germany', 'ErgoDesk GmbH', 'Furniture', 'Desks'],
        ['PC-003', 'LED Monitor 27"', '27-inch 4K LED monitor with USB-C connectivity', '8.2', 'South Korea', 'TechDisplay Co', 'Electronics', 'Monitors'],
        ['PC-004', 'Office Storage Cabinet', 'Metal filing cabinet with 4 drawers and lock', '35.8', 'India', 'MetalWorks Inc', 'Furniture', 'Storage'],
        ['PC-005', 'Wireless Keyboard', 'Bluetooth wireless keyboard with backlight', '0.8', 'Taiwan', 'KeyTech Solutions', 'Electronics', 'Peripherals']
      ];

      // Convert to CSV format
      const csvContent = sampleData.map(row => 
        row.map(field => `"${field}"`).join(',')
      ).join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'sample_product_data.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (type === 'images') {
      // For images, provide instructions since we can't create actual images
      const instructionsContent = `PRODUCT IMAGES ZIP FILE STRUCTURE

Create a ZIP file with product images organized in folders by product code:

my_product_images.zip
├── PC-001/
│   ├── image1.jpg
│   ├── image2.png
│   └── product_photo.jpeg
├── PC-002/
│   └── main_image.jpg
├── PC-003/
│   ├── front_view.png
│   └── side_view.jpg
├── PC-004/
│   └── cabinet.jpeg
└── PC-005/
    └── keyboard.png

IMPORTANT GUIDELINES:
1. Create a folder for each product using the EXACT product code from your data file
2. Place all images for that product inside its folder
3. Supported formats: PNG, JPG, JPEG, GIF (case-insensitive)
4. Maximum file size: 25MB for the entire ZIP file
5. Image dimensions: Recommended 800x600 or higher for best quality
6. Multiple images per product are supported

FOLDER NAMING EXAMPLES:
- Data file has product code "PC-001" → Create folder named "PC-001"
- Data file has product code "CHAIR-ABC" → Create folder named "CHAIR-ABC"
- Folder names must match product codes EXACTLY (case-sensitive)

AUTOMATIC PROCESSING:
After upload, images will be automatically:
- Uploaded to the image storage system
- Linked to the corresponding products
- Made available in the product gallery

This folder-based structure ensures proper mapping between products and their images during bulk import.`;

      const blob = new Blob([instructionsContent], { type: 'text/plain;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'image_zip_instructions.txt');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
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
    setUploadMessage(null);
    setUploadMessageType(null);
    setIsUploading(false);
    // Reset field mappings
    setProductCodeField('');
    setProductNameField('');
    setProductDescriptionField('');
    setWeightField('');
    setCountryOfOriginField('');
    setSupplierNameField('');
    setProductCategoryField('');
    setProductSubCategoryField('');
  };

  const handleBulkImport = async () => {
    if (!dataFile || !uxpContext) {
      setUploadMessage("Missing required data or context for import");
      setUploadMessageType("error");
      return;
    }

    if (!productCodeField || !productNameField || !productDescriptionField) {
      setUploadMessage('Please map the required fields (Product Code, Product Name, and Product Description) before importing.');
      setUploadMessageType("error");
      return;
    }

    setIsUploading(true);
    setUploadMessage("Uploading products...");
    setUploadMessageType(null);

    try {
      // Create FormData for the API call
      const formData = new FormData();
      formData.append("file", dataFile);
      
      // Add field mappings to the FormData - aligned with microservice expected field names
      formData.append("codeField", productCodeField);
      formData.append("nameField", productNameField);  
      formData.append("descriptionField", productDescriptionField);
      if (weightField) formData.append("weightField", weightField);
      if (countryOfOriginField) formData.append("countryOfOriginField", countryOfOriginField);
      if (supplierNameField) formData.append("supplierNameField", supplierNameField);
      if (productCategoryField) formData.append("categoryField", productCategoryField);
      if (productSubCategoryField) formData.append("subCategoryField", productSubCategoryField);
      
      // Add selected sheet info if applicable
      if (selectedSheet) formData.append("selectedSheet", selectedSheet);

      const response = await bulkUpload(uxpContext, formData);

      if (response.data) {
        setUploadMessage(`Successfully imported ${csvRows.length} products! ${imagesFile ? 'Uploading images...' : ''}`);
        setUploadMessageType("success");
        
        // If images file is provided, upload it after successful data upload
        if (imagesFile) {
          try {
            const imageFormData = new FormData();
            imageFormData.append("file", imagesFile);
            
            const imageResponse = await bulkImageUpload(uxpContext, imageFormData);
            
            if (imageResponse.data) {
              setUploadMessage(`Successfully imported ${csvRows.length} products and uploaded images!`);
            } else {
              setUploadMessage(`Successfully imported ${csvRows.length} products, but image upload failed: ${imageResponse.error || 'Unknown error'}`);
            }
          } catch (imageError) {
            console.error("Image upload error:", imageError);
            setUploadMessage(`Successfully imported ${csvRows.length} products, but image upload failed: ${imageError.message}`);
          }
        } else {
          // If no images file, trigger AI processing directly
          try {
            await triggerAIProcessing(uxpContext);
            setUploadMessage(`Successfully imported ${csvRows.length} products! AI processing started.`);
          } catch (aiError) {
            console.error("AI processing trigger error:", aiError);
            setUploadMessage(`Successfully imported ${csvRows.length} products, but AI processing failed to start: ${aiError.message}`);
          }
        }
        
        // Close modal after successful upload and show post-upload alert
        setTimeout(() => {
          handleModalClose();
          setShowPostUploadAlert(true);
          // Auto-hide the alert after 10 seconds
          setTimeout(() => {
            setShowPostUploadAlert(false);
          }, 10000);
        }, 2000);
      } else {
        const errorMessage = response.error || "Upload failed. Please try again.";
        setUploadMessage(`Upload failed: ${errorMessage}`);
        setUploadMessageType("error");
      }
    } catch (error) {
      console.error("Bulk upload error:", error);
      setUploadMessage(`An error occurred during upload: ${error.message}`);
      setUploadMessageType("error");
    } finally {
      setIsUploading(false);
    }
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
                        <div className='bulk-import__upload-section test-center'>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2.5 12C2.5 7.52166 2.5 5.28249 3.89124 3.89124C5.28249 2.5 7.52166 2.5 12 2.5C16.4783 2.5 18.7175 2.5 20.1088 3.89124C21.5 5.28249 21.5 7.52166 21.5 12C21.5 16.4783 21.5 18.7175 20.1088 20.1088C18.7175 21.5 16.4783 21.5 12 21.5C7.52166 21.5 5.28249 21.5 3.89124 20.1088C2.5 18.7175 2.5 16.4783 2.5 12Z" stroke="#414651" stroke-width="1.5" stroke-linejoin="round"/>
                            <path d="M12 8V16M16 12H8" stroke="#414651" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>

                          
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
          field.esgField === 'Weight (kg)' ? weightField :
          field.esgField === 'Country Of Origin' ? countryOfOriginField :
          field.esgField === 'Supplier Name' ? supplierNameField :
          // field.esgField === 'Product Category' ? productCategoryField :
          // field.esgField === 'Product Sub-Category' ? productSubCategoryField :
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
          else if (field.esgField === 'Weight (kg)') setWeightField(value);
          else if (field.esgField === 'Country Of Origin') setCountryOfOriginField(value);
          else if (field.esgField === 'Supplier Name') setSupplierNameField(value);
          // else if (field.esgField === 'Product Category') setProductCategoryField(value);
          // else if (field.esgField === 'Product Sub-Category') setProductSubCategoryField(value);
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

        
          // Calculate skipped rows based on real data validation
          const skippedRows = csvRows.map((row, index) => {
            const issues = [];
            
            // Check for missing required fields
            if (productCodeField && (!row[productCodeField] || String(row[productCodeField]).trim() === '')) {
              issues.push('Missing Product Code');
            }
            if (productNameField && (!row[productNameField] || String(row[productNameField]).trim() === '')) {
              issues.push('Missing Product Name');
            }
            
            // Check for invalid data patterns
            if (productCodeField && row[productCodeField] && String(row[productCodeField]).includes('undefined')) {
              issues.push('Invalid Product Code format');
            }
            
            if (issues.length > 0) {
              return {
                row: index + 2, // +2 because Excel starts at 1 and we skip header
                code: row[productCodeField] || 'N/A',
                name: row[productNameField] || '-',
                reason: issues.join(', ')
              };
            }
            return null;
          }).filter(row => row !== null);
        
          // Calculate actual unmapped fields
          const mappedHeaders = [
            productCodeField,
            productNameField,
            productDescriptionField,
            weightField,
            countryOfOriginField,
            supplierNameField,
            productCategoryField,
            productSubCategoryField
          ].filter(field => field); // Remove empty values
          
          const unmappedFields = csvHeaders.filter(header => !mappedHeaders.includes(header));
          
          // Calculate valid records (records that are not skipped)
          const validRecords = csvRows.filter((row, index) => {
            return !skippedRows.some(skippedRow => skippedRow.row === index + 2);
          });
        
          return (
            <div className="bulk-import__step-content review-import">
              <h3>Review & Import</h3>
        
              <div className="review-section">
                <div className="review-row">
                  <div className="review-toggle">
                    <span className="icon">📦</span>
                    <span>Product records ready for Import</span>
                  </div>
                  <span>: {validRecords.length}</span>
                  <a className="toggle-link" onClick={() => setShowReadyRecords(!showReadyRecords)}>
                    {showReadyRecords ? 'Hide Details ▲' : 'View Details ▼'}
                  </a>
                </div>
                
                {showReadyRecords && (
                  <div className="ready-records-section">
                    <TableComponent
                      data={validRecords.slice(0, 10).map((row) => {
                        const actualRowIndex = csvRows.findIndex(r => r === row) + 2;
                        return {
                          rowNo: actualRowIndex,
                          productCode: row[productCodeField] || '-',
                          productName: row[productNameField] || '-',
                          category: row[productCategoryField] || '-',
                          subCategory: row[productSubCategoryField] || '-'
                        };
                      })}
                      columns={[
                        { id: 'rowNo', label: 'ROW NO.', minWidth: 80 },
                        { id: 'productCode', label: 'PRODUCT CODE', minWidth: 150 },
                        { id: 'productName', label: 'PRODUCT NAME', minWidth: 200 },
                        { id: 'category', label: 'CATEGORY', minWidth: 150 },
                        { id: 'subCategory', label: 'SUB-CATEGORY', minWidth: 150 }
                      ]}
                      pageSize={10}
                      total={Math.min(validRecords.length, 10)}
                    />
                    {validRecords.length > 10 && (
                      <div className="table-footer">
                        <p>Showing first 10 records. Total ready records: {validRecords.length}</p>
                      </div>
                    )}
                  </div>
                )}
        
                <div className="review-row">
                  <div className="review-toggle" onClick={() => setShowSkipped(!showSkipped)}>
                    <span className="icon">{showSkipped ? '▼' : '▶'}</span>
                    <span>No. of Records Skipped</span>
                  </div>
                  <span>: {skippedRows.length}</span>
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
      {/* Post-upload alert notification */}
      {showPostUploadAlert && (
        <div className="bulk-import__post-upload-alert">
          <div className="alert-content">
            <div className="alert-icon">⚡</div>
            <div className="alert-text">
              <strong>Import Process in Progress</strong>
              <p>Your products and images have been uploaded successfully. AI classification, emission calculations, and image processing are being handled in the background. Please check back in a few minutes to see the complete product data with images.</p>
            </div>
            <button 
              className="alert-close-btn"
              onClick={() => setShowPostUploadAlert(false)}
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {!hideToggleButton && (
        <button 
          className="bulk-import__trigger-btn"
          onClick={() => setIsModalOpen(true)}
        >
          Bulk Upload Products
        </button>
      )}

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
                  title={isUploading ? "Importing..." : "Start Import"}
                  onClick={handleBulkImport}
                  disabled={!productCodeField || !productNameField || !productDescriptionField || isUploading}
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

        {/* Upload Status Message */}
        {uploadMessage && (
          <div className={`bulk-import__upload-message ${uploadMessageType || ''}`}>
            <span className="message-icon">
              {uploadMessageType === "success" ? "✓" : uploadMessageType === "error" ? "✗" : "ℹ"}
            </span>
            <span className="message-text">{uploadMessage}</span>
            {uploadMessageType === "error" && (
              <button 
                className="dismiss-btn" 
                onClick={() => {
                  setUploadMessage(null);
                  setUploadMessageType(null);
                }}
              >
                Dismiss
              </button>
            )}
          </div>
        )}

        {/* Step Content */}
        {getStepContent()}

      </Modal>
    </div>
  );
};

export default BulkImportWidget;
