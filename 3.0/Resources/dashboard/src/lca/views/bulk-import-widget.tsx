import React, { useState, useRef, useEffect } from 'react';
import { Button, Modal, CRUDComponent, DropDownButton, Select, TableComponent } from 'uxp/components';
import { IContextProvider } from '@uxp';
import { bulkUpload, bulkImageUpload, triggerAIProcessing, initChunkUpload, uploadChunk, completeImageUpload } from '../../esgnow-service';
import './bulk-import-widget.scss';

const XLSX = require("xlsx");
const JSZip = require("jszip");

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
  const [zipValidationMessage, setZipValidationMessage] = useState<string | null>(null);
  const [zipValidationStatus, setZipValidationStatus] = useState<"success" | "warning" | "error" | null>(null);
  const [availableImageFolders, setAvailableImageFolders] = useState<Set<string>>(new Set());
  const [imageFolderCount, setImageFolderCount] = useState<number | null>(null);

  const ChevronIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
    <svg
      width="16"
      height="15"
      viewBox="0 0 16 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
        transition: 'transform 0.2s ease-in-out'
      }}
    >
      <path
        d="M4.30371 5.64233L7.99988 9.14233L11.696 5.64233"
        stroke="#181D27"
        strokeWidth="1.67"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
  

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

      // Re-validate ZIP file if it exists
      if (imagesFile && filteredHeaders.length > 0) {
        // Use setTimeout to ensure field mapping is complete
        setTimeout(() => {
          validateZipFile(imagesFile);
        }, 100);
      }
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

  const validateZipFile = async (file: File) => {
    try {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);
      
      // Get all folder names from the zip file
      const folderNames = new Set<string>();
      zipContent.forEach((relativePath: string, zipEntry: any) => {
        if (zipEntry.dir) {
          // Remove trailing slash and get folder name
          const folderName = relativePath.replace(/\/$/, '');
          if (folderName) {
            folderNames.add(folderName);
          }
        } else {
          // If it's a file, get the parent folder name
          const pathParts = relativePath.split('/');
          if (pathParts.length > 1) {
            folderNames.add(pathParts[0]);
          }
        }
      });

      // Get product codes from valid CSV records
      const validRecords = csvRows.filter((row) => {
        const hasProductCode = productCodeField && row[productCodeField] && String(row[productCodeField]).trim() !== '';
        const hasProductName = productNameField && row[productNameField] && String(row[productNameField]).trim() !== '';
        const hasProductDescription = productDescriptionField && row[productDescriptionField] && String(row[productDescriptionField]).trim() !== '';
        const hasWeight = weightField && row[weightField] && String(row[weightField]).trim() !== '';
        const hasValidProductCode = !productCodeField || !row[productCodeField] || !String(row[productCodeField]).includes('undefined');
        
        return hasProductCode && hasProductName && hasProductDescription && hasWeight && hasValidProductCode;
      });

      const productCodes = validRecords.map(row => row[productCodeField]).filter(code => code);
      const productCodeSet = new Set(productCodes);

      // Store available image folders for later use
      setAvailableImageFolders(folderNames);

      // Check which product codes have matching folders
      const matchingFolders = Array.from(folderNames).filter(folder => productCodeSet.has(folder));
      const missingFolders = productCodes.filter(code => !folderNames.has(code));

      if (missingFolders.length === 0) {
        setZipValidationMessage(`✓ All ${productCodes.length} product codes have matching image folders`);
        setZipValidationStatus("success");
      } else if (matchingFolders.length > 0) {
        setZipValidationMessage(`⚠ ${matchingFolders.length}/${productCodes.length} product codes have matching folders. Missing: ${missingFolders.slice(0, 5).join(', ')}${missingFolders.length > 5 ? '...' : ''}`);
        setZipValidationStatus("warning");
      } else {
        //setZipValidationMessage(`❌ No matching folders found for product codes. ZIP contains: ${Array.from(folderNames).slice(0, 5).join(', ')}${folderNames.size > 5 ? '...' : ''}`);
        //setZipValidationStatus("error");
      }
    } catch (error) {
      console.error("Error validating ZIP file:", error);
      setZipValidationMessage("❌ Error reading ZIP file. Please ensure it's a valid ZIP file.");
      setZipValidationStatus("error");
    }
  };


const handleImagesFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
  if (event.target.files && event.target.files[0]) {
    const zipFile = event.target.files[0];
    setImagesFile(zipFile);
    setZipValidationMessage(null);
    setZipValidationStatus(null);
    setAvailableImageFolders(new Set());
    setImageFolderCount(null); // reset before reloading

    const zip = new JSZip();
    const contents = await zip.loadAsync(zipFile);

    const folderSet = new Set<string>();

    contents.forEach((relativePath:any, file:any) => {
      if (!file.dir) {
        const topLevelFolder = relativePath.split('/')[0];
        folderSet.add(topLevelFolder);
      }
    });

    setImageFolderCount(folderSet.size);

    // Continue with validation if needed
    if (csvRows.length > 0 && productCodeField) {
      await validateZipFile(zipFile);
    }
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

  // Helper function to upload images using chunk upload
  const uploadImagesWithChunks = async (file: File, uxpContext: IContextProvider, productCount?: number) => {
    try {
      const CHUNK_SIZE = 1024 * 1024 * 5; // 5MB chunks
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      
      // 1. Initialize chunk upload
      const initResponse = await initChunkUpload(uxpContext, {
        filename: file.name,
        totalSize: file.size,
        totalChunks,
        fileHash: '' // Optional
      });
      
      if (!initResponse.data?.uploadId) {
        throw new Error('Failed to initialize chunk upload');
      }
      
      const uploadId = initResponse.data.uploadId;
      
      // 2. Upload chunks sequentially
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);
        
        const chunkFormData = new FormData();
        chunkFormData.append('uploadId', uploadId);
        chunkFormData.append('chunkIndex', i.toString());
        chunkFormData.append('chunk', chunk);
        
        const chunkResponse = await uploadChunk(uxpContext, chunkFormData);
        
        if (!chunkResponse.data) {
          throw new Error(`Failed to upload chunk ${i + 1}/${totalChunks}`);
        }
        
        // Update progress message
        const productMsg = productCount ? `Successfully imported ${productCount} products. ` : 'Successfully imported products. ';        setUploadMessage(`${productMsg}Uploading images: ${i + 1}/${totalChunks} chunks...`);
      }
      
      // 3. Complete the image upload
      const completeResponse = await completeImageUpload(uxpContext, { uploadId });
      
      if (!completeResponse.data) {
        throw new Error('Failed to complete image upload');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Chunk upload error:', error);
      return { success: false, error: error.message };
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
    setZipValidationMessage(null);
    setZipValidationStatus(null);
    setAvailableImageFolders(new Set());
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
      // Filter out invalid rows - only send validated records
      const validRecords = csvRows.filter((row) => {
        // Check if row has all mandatory fields
        const hasProductCode = productCodeField && row[productCodeField] && String(row[productCodeField]).trim() !== '';
        const hasProductName = productNameField && row[productNameField] && String(row[productNameField]).trim() !== '';
        const hasProductDescription = productDescriptionField && row[productDescriptionField] && String(row[productDescriptionField]).trim() !== '';
        const hasWeight = weightField && row[weightField] && String(row[weightField]).trim() !== '';
        
        // Check for invalid data patterns
        const hasValidProductCode = !productCodeField || !row[productCodeField] || !String(row[productCodeField]).includes('undefined');
        
        // Check if image folder exists in ZIP file (only if ZIP file is provided)
        const hasImageFolder = !imagesFile || !productCodeField || !row[productCodeField] || availableImageFolders.has(row[productCodeField]);
        
        return hasProductCode && hasProductName && hasProductDescription && hasWeight && hasValidProductCode && hasImageFolder;
      });

      if (validRecords.length === 0) {
        setUploadMessage('No valid records found to import. Please check your data and field mappings.');
        setUploadMessageType("error");
        return;
      }

      // Create a new CSV with only valid records
      const headers = csvHeaders;
      const csvContent = [
        headers.join(','),
        ...validRecords.map(row => 
          headers.map(header => `"${row[header] || ''}"`).join(',')
        )
      ].join('\n');

      // Create a new file with filtered data
      const filteredFile = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const filteredDataFile = new File([filteredFile], dataFile.name, { type: 'text/csv' });

      // Create FormData for the API call
      const formData = new FormData();
      formData.append("file", filteredDataFile);
      
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
        setUploadMessage(`Successfully imported ${validRecords.length} products! ${imagesFile ? 'Uploading images...' : ''}`);
        setUploadMessageType("success");
        
        // If images file is provided, upload it using chunk upload after successful data upload
        if (imagesFile) {
          try {
            const chunkUploadResult = await uploadImagesWithChunks(imagesFile, uxpContext, validRecords.length);
            
            if (chunkUploadResult.success) {
              setUploadMessage(`Successfully imported ${validRecords.length} products and uploaded images!`);
            } else {
              setUploadMessage(`Successfully imported ${validRecords.length} products, but image upload failed: ${chunkUploadResult.error || 'Unknown error'}`);
            }
          } catch (imageError) {
            console.error("Image upload error:", imageError);
            setUploadMessage(`Successfully imported ${validRecords.length} products, but image upload failed: ${imageError.message}`);
          }
        } else {
          // If no images file, trigger AI processing directly
          try {
            await triggerAIProcessing(uxpContext);
            setUploadMessage(`Successfully imported ${validRecords.length} products! AI processing started.`);
          } catch (aiError) {
            console.error("AI processing trigger error:", aiError);
            setUploadMessage(`Successfully imported ${validRecords.length} products, but AI processing failed to start: ${aiError.message}`);
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
<svg width="82" height="82" viewBox="0 0 82 82" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M39.0081 4.27084H42.9919C49.6578 4.27084 54.9093 4.27084 59.0093 4.79018C63.2083 5.32318 66.5908 6.44384 69.2695 8.97218C71.9721 11.5244 73.1816 14.7771 73.7556 18.8088C74.3125 22.7106 74.3125 27.6921 74.3125 33.9651V37.5833C74.3125 38.9978 73.1645 40.1458 71.75 40.1458C70.3355 40.1458 69.1875 38.9978 69.1875 37.5833V34.1667C69.1875 27.6477 69.1807 23.0318 68.6818 19.5331C68.1967 16.1233 67.2912 14.1518 65.7503 12.6998C64.1923 11.2272 62.0467 10.3423 58.3635 9.87418C54.6223 9.39926 49.6988 9.39584 42.8074 9.39584H39.1926C32.3012 9.39584 27.3778 9.39926 23.6365 9.87418C19.9533 10.3423 17.8077 11.2272 16.2463 12.6998C14.7088 14.1518 13.8033 16.1233 13.3182 19.5331C12.8193 23.0318 12.8125 27.6477 12.8125 34.1667V47.8333C12.8125 54.3523 12.8193 58.9683 13.3182 62.4669C13.8033 65.8768 14.7088 67.8482 16.2463 69.3003C17.8077 70.7729 19.9533 71.6578 23.6365 72.1258C27.3778 72.6008 32.3012 72.6042 39.1926 72.6042H41C42.4145 72.6042 43.5625 73.7522 43.5625 75.1667C43.5625 76.5812 42.4145 77.7292 41 77.7292H39.0081C32.3422 77.7292 27.0908 77.7292 22.9908 77.2098C18.7917 76.6734 15.4092 75.5562 12.7305 73.0278C10.0279 70.4756 8.81842 67.2229 8.24442 63.1913C7.6875 59.2894 7.6875 54.3079 7.6875 48.0349V33.9651C7.6875 27.6921 7.6875 22.7106 8.24442 18.8088C8.81842 14.7771 10.0279 11.5244 12.7305 8.97218C15.4092 6.44384 18.7917 5.32318 22.9908 4.79018C27.0908 4.27084 32.3422 4.27084 39.0081 4.27084ZM69.1875 58.0833C69.1875 56.4092 68.3743 54.4548 66.8915 52.8934C65.4223 51.3491 63.4988 50.3958 61.5 50.3958C59.5013 50.3958 57.5777 51.3491 56.1085 52.8934C54.6257 54.4548 53.8125 56.4092 53.8125 58.0833V70.0417C53.8125 71.135 55.0083 72.6042 56.8397 72.6042C58.671 72.6042 59.8703 71.135 59.8703 70.0417V60.6971C59.8703 59.2826 61.0148 58.1346 62.4328 58.1346C63.8473 58.1346 64.9953 59.2826 64.9953 60.6971V70.0417C64.9953 74.2749 61.1857 77.7292 56.8397 77.7292C52.4971 77.7292 48.6875 74.2749 48.6875 70.0417V58.0833C48.6875 54.8751 50.1703 51.7044 52.3946 49.3606C54.6359 47.0031 57.8408 45.2708 61.5 45.2708C65.1593 45.2708 68.3641 47.0031 70.6054 49.3606C72.8297 51.7044 74.3125 54.8751 74.3125 58.0833V70.5439C74.3125 71.9584 73.1645 73.1064 71.75 73.1064C70.3355 73.1064 69.1875 71.9584 69.1875 70.5439V58.0833ZM27.3333 21.3542H54.6667C56.0812 21.3542 57.2292 22.5022 57.2292 23.9167C57.2292 25.3312 56.0812 26.4792 54.6667 26.4792H27.3333C25.9188 26.4792 24.7708 25.3312 24.7708 23.9167C24.7708 22.5022 25.9188 21.3542 27.3333 21.3542ZM24.7708 41C24.7708 39.5855 25.9188 38.4375 27.3333 38.4375H44.4167C45.8312 38.4375 46.9792 39.5855 46.9792 41C46.9792 42.4145 45.8312 43.5625 44.4167 43.5625H27.3333C25.9188 43.5625 24.7708 42.4145 24.7708 41Z" fill="#181D27"/>
</svg>

  );

  const ImageFileIcon = () => (
<svg width="82" height="82" viewBox="0 0 82 82" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M21.7812 71.75L54.4531 41L69.8281 56.375M21.7812 71.75H60.2188C66.5873 71.75 71.75 66.5873 71.75 60.2188V41M21.7812 71.75C15.4127 71.75 10.25 66.5873 10.25 60.2188V21.7813C10.25 15.4127 15.4127 10.25 21.7812 10.25H46.7656M56.375 18.0739L64.2363 10.25M64.2363 10.25L71.75 17.7202M64.2363 10.25V29.4688M33.3125 27.5469C33.3125 30.7311 30.7311 33.3125 27.5469 33.3125C24.3626 33.3125 21.7812 30.7311 21.7812 27.5469C21.7812 24.3626 24.3626 21.7813 27.5469 21.7813C30.7311 21.7813 33.3125 24.3626 33.3125 27.5469Z" stroke="#181D27" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
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
          <div className="esgnow-bulk-import__step-content">
            <div className="esgnow-bulk-import__content-header">
              <p></p>
              <p>Download the sample files and compare it with your import files to ensure you have them perfect for import.</p>
            </div>

            <div className="esgnow-bulk-import__upload-sections">
              {/* Data File Section */}
              <div className="esgnow-bulk-import__upload-section">
                <h3 className="esgnow-bulk-import__section-title">A. Data File</h3>
                <div className="esgnow-bulk-import__upload-area">
                  <div className="esgnow-bulk-import__upload-icon">
                    <DataFileIcon />
                  </div>
                  <p>Drag and drop your <strong>data file</strong> here in .csv or .xls format</p>
                  <p className="esgnow-bulk-import__or-text">or</p>
                  <input
                    type="file"
                    id="data-file-input"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleDataFileChange}
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                  />
                  <button 
                    className="esgnow-bulk-import__browse-btn"
                    onClick={() => document.getElementById('data-file-input')?.click()}
                  >
                    <UploadIcon />
                    Browse File for upload
                  
                  </button>
                  <button 
                    className="esgnow-bulk-import__download-sample-btn"
                    onClick={() => handleDownloadSampleFile('data')}
                  >
                    Download sample file
                  </button>
                  <p className="esgnow-bulk-import__file-limit">Maximum file size allowed is 25 MB</p>
                  {dataFile && <p className="esgnow-bulk-import__selected-file">Selected: {dataFile.name}</p>}
                                  {/* Sheet Selection - Only show if multiple sheets */}
                {sheets.length > 1 && (
                  <div className="esgnow-bulk-import__sheet-selection">
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
                  <div className="esgnow-bulk-import__headers-preview">
                    <h4>Detected Headers:</h4>
                    <div className="esgnow-bulk-import__headers-list">
                      {csvHeaders.map((header, index) => (
                        <span key={index} className="esgnow-bulk-import__header-tag">{header},</span>
                      ))}
                    </div>
                    <h4>Found {csvRows.length} data rows</h4>
                  </div>
                )}
                </div>
                

                
                <div className="esgnow-bulk-import__note">
                <svg
                  width="22"
                  height="20"
                  viewBox="0 0 22 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ marginRight: '6px', flexShrink: 0 }}
                >
                  <path
                    d="M2.20117 9.99998C2.20117 6.26803 2.20117 4.40205 3.42611 3.24268C4.65106 2.08331 6.62258 2.08331 10.5656 2.08331C14.5086 2.08331 16.4802 2.08331 17.7052 3.24268C18.9301 4.40205 18.9301 6.26803 18.9301 9.99998C18.9301 13.7319 18.9301 15.5979 17.7052 16.7573C16.4802 17.9166 14.5086 17.9166 10.5656 17.9166C6.62258 17.9166 4.65106 17.9166 3.42611 16.7573C2.20117 15.5979 2.20117 13.7319 2.20117 9.99998Z"
                    stroke="#414651"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10.5656 13.3333V9.58331"
                    stroke="#414651"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10.5656 6.67642V6.66809"
                    stroke="#414651"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                  <strong>Note: You can import upto 5000 records at a time</strong> 
                </div>
              </div>
                        <div className='esgnow-bulk-import__upload-section esgnow-test-center'>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2.5 12C2.5 7.52166 2.5 5.28249 3.89124 3.89124C5.28249 2.5 7.52166 2.5 12 2.5C16.4783 2.5 18.7175 2.5 20.1088 3.89124C21.5 5.28249 21.5 7.52166 21.5 12C21.5 16.4783 21.5 18.7175 20.1088 20.1088C18.7175 21.5 16.4783 21.5 12 21.5C7.52166 21.5 5.28249 21.5 3.89124 20.1088C2.5 18.7175 2.5 16.4783 2.5 12Z" stroke="#414651" stroke-width="1.5" stroke-linejoin="round"/>
                            <path d="M12 8V16M16 12H8" stroke="#414651" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>

                          
                        </div>
              {/* Images ZIP Section */}
              <div className="esgnow-bulk-import__upload-section">
                <h3 className="esgnow-bulk-import__section-title">B. Images Zip File</h3>
                <div className="esgnow-bulk-import__upload-area">
                  <div className="esgnow-bulk-import__upload-icon">
                    <ImageFileIcon />
                  </div>
                  <p>Drag and drop your <strong>images</strong> zip file</p>
                  <p className="esgnow-bulk-import__or-text">or</p>
                  <input
                    type="file"
                    id="images-file-input"
                    accept=".zip"
                    onChange={handleImagesFileChange}
                    style={{ display: 'none' }}
                  />
                  <button 
                    className="esgnow-bulk-import__browse-btn"
                    onClick={() => document.getElementById('images-file-input')?.click()}
                  >
                    <UploadIcon />
                    Browse File for upload
                   
                  </button>
                  <button 
                    className="esgnow-bulk-import__download-sample-btn"
                    onClick={() => handleDownloadSampleFile('images')}
                  >
                    Download sample file
                  </button>
                  <p className="esgnow-bulk-import__file-limit">Maximum file size allowed is 25 MB</p>
                  {imagesFile && (
                      <p className="esgnow-bulk-import__selected-file">
                        Selected: {imagesFile.name}
                        {imageFolderCount !== null && (
                          <>
                            <br />
                            Contains: <strong>{imageFolderCount - 1}</strong> folder{imageFolderCount !== 1 && 's'}
                          </>
                        )}
                      </p>
                    )}
                  
                  {/* ZIP Validation Message */}
                  {zipValidationMessage && (
                    <div className={`esgnow-bulk-import__zip-validation esgnow-bulk-import__zip-validation--${zipValidationStatus}`}>
                      <span className="esgnow-validation-message">{zipValidationMessage}</span>
                    </div>
                  )}
                </div>
                <div className="esgnow-bulk-import__note">
                <svg
                  width="22"
                  height="20"
                  viewBox="0 0 22 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ marginRight: '6px', flexShrink: 0 }}
                >
                  <path
                    d="M2.20117 9.99998C2.20117 6.26803 2.20117 4.40205 3.42611 3.24268C4.65106 2.08331 6.62258 2.08331 10.5656 2.08331C14.5086 2.08331 16.4802 2.08331 17.7052 3.24268C18.9301 4.40205 18.9301 6.26803 18.9301 9.99998C18.9301 13.7319 18.9301 15.5979 17.7052 16.7573C16.4802 17.9166 14.5086 17.9166 10.5656 17.9166C6.62258 17.9166 4.65106 17.9166 3.42611 16.7573C2.20117 15.5979 2.20117 13.7319 2.20117 9.99998Z"
                    stroke="#414651"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10.5656 13.3333V9.58331"
                    stroke="#414651"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10.5656 6.67642V6.66809"
                    stroke="#414651"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                  <strong>Note: Place each image (.png or .jpg) in its own folder named with the product code, then compress all folders into a .zip file for easy mapping</strong>.
                </div>
              </div>
            </div>
          </div>
        );

      case 2:



        return (
          <div className="esgnow-bulk-import__step-content">
            <h3>Field Mapping & Assigning Defaults</h3>
            
            {csvHeaders.length === 0 ? (
              <div className="esgnow-bulk-import__no-data">
                <p>No headers available. Please go back and upload a valid file.</p>
              </div>
            ) : (
              <>
                <div className="esgnow-bulk-import__mapping-info">
                  <span className="esgnow-bulk-import__file-label">File Selected:</span>
                  <span className="esgnow-bulk-import__selected-file"> {dataFile?.name}</span>
                </div>
                <h3>Review Auto-mapped Field Labels in Iviva’s ESG Now to that of your imported file headers and let our agentic AI do all the heavy lifting for you: importing and calculating the carbon footprint of all the products.</h3>
                <div className="esgnow-field-mapping-table">
                <div className="esgnow-field-mapping-header">
                  <div>ESG Now Field Labels</div>
                  <div>Imported File Headers</div>
                  <div>Default Field Values</div>
                  <div>Sample Data from File</div>
                </div>
                {mappingData.map((field, idx) => (
                  <div className="esgnow-field-mapping-row" key={idx}>
                    <div className="esgnow-field-label">
                      {field.esgField} {field.required && <span className="esgnow-required">*</span>}
                    </div>
                    <div className="esgnow-field-dropdown">
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
                        if (field.esgField === 'Product Code') {
                          setProductCodeField(value);
                          // Re-validate ZIP file when product code field is changed
                          if (imagesFile && value && csvRows.length > 0) {
                            setTimeout(() => validateZipFile(imagesFile), 100);
                          }
                        }
                        else if (field.esgField === 'Product Name') setProductNameField(value);
                        else if (field.esgField === 'Product Description') setProductDescriptionField(value);
                        else if (field.esgField === 'Weight (kg)') setWeightField(value);
                        else if (field.esgField === 'Country Of Origin') setCountryOfOriginField(value);
                        else if (field.esgField === 'Supplier Name') setSupplierNameField(value);
                        // else if (field.esgField === 'Product Category') setProductCategoryField(value);
                        // else if (field.esgField === 'Product Sub-Category') setProductSubCategoryField(value);
                      }}
                      className="esgnow-dropdown-select"
                    />

                    </div>
                                <div className="esgnow-field-default">
                                  {field.defaultValue}
                                </div>
                                <div className="esgnow-field-sample-columns">
                                  <div className="esgnow-sample-column">{field.sampleData[0] || '-'}</div>
                                  <div className="esgnow-sample-column esgnow-with-divider">{field.sampleData[1] || '-'}</div>
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
            
            // Check for missing mandatory fields: product code, product name, description, and weight
            if (productCodeField && (!row[productCodeField] || String(row[productCodeField]).trim() === '')) {
              issues.push('Missing Product Code');
            }
            if (productNameField && (!row[productNameField] || String(row[productNameField]).trim() === '')) {
              issues.push('Missing Product Name');
            }
            if (productDescriptionField && (!row[productDescriptionField] || String(row[productDescriptionField]).trim() === '')) {
              issues.push('Missing Product Description');
            }
            if (weightField && (!row[weightField] || String(row[weightField]).trim() === '')) {
              issues.push('Missing Weight');
            }
            
            // Check for invalid data patterns
            if (productCodeField && row[productCodeField] && String(row[productCodeField]).includes('undefined')) {
              issues.push('Invalid Product Code format');
            }
            
            // Check if image folder exists in ZIP file (only if ZIP file is provided)
            if (imagesFile && productCodeField && row[productCodeField] && !availableImageFolders.has(row[productCodeField])) {
              issues.push('Missing Image Folder');
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
          const handleDownloadSkippedRows = () => {
            if (csvHeaders.length === 0 || skippedRows.length === 0) {
              return;
            }
          
            const allHeaders = csvHeaders.concat('Skipped Reason');
            const skippedData = [allHeaders];
          
            // Convert all values to strings
            skippedRows.forEach(item => {
              const originalRow = csvRows[item.row - 2];
              const rowData = csvHeaders.map(header => String(originalRow[header] || ''));
              rowData.push(item.reason);
              skippedData.push(rowData);
            });
          
            const worksheet = XLSX.utils.aoa_to_sheet(skippedData);
          
            // Set column widths
            const colWidths = allHeaders.map((_, colIdx) => {
              const maxLength = skippedData.reduce((max, row) => {
                const cell = row[colIdx];
                return Math.max(max, cell ? cell.length : 0);
              }, allHeaders[colIdx].length);
              return { wch: maxLength + 2 };
            });
            worksheet['!cols'] = colWidths;
          
            // Force left-alignment on all cells
            Object.keys(worksheet).forEach(cell => {
              if (cell.startsWith('!')) return;
              const value = worksheet[cell].v;
              worksheet[cell].t = 's'; // force text type
              worksheet[cell].s = {
                alignment: { horizontal: 'left' }
              };
              worksheet[cell].v = String(value); // ensure string value
            });
          
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Skipped Rows");
          
            XLSX.writeFile(workbook, 'skipped_rows.xlsx');
          };
          
          
          return (
            <div className="esgnow-bulk-import__step-content esgnow-review-import">
              <h3>Review & Import</h3>
          
              <div className="esgnow-review-section">
                <div className="esgnow-review-row" onClick={() => setShowReadyRecords(!showReadyRecords)}>
                  <div className="esgnow-review-toggle">
                  <span className="esgnow-icon"><ChevronIcon isOpen={showReadyRecords} /></span>
                    <span>Product records ready for Import</span>
                    <span className="esgnow-count-value">: {validRecords.length}</span>
                  </div>
                  <a className="esgnow-toggle-link">
                    {showReadyRecords ? 'Hide Details' : 'View Details'}
                  </a>
                </div>
                
                {showReadyRecords && (
                  <div className="esgnow-ready-records-section">
                    <TableComponent
                      data={validRecords.slice(0, 10).map((row) => {
                        const actualRowIndex = csvRows.findIndex(r => r === row) + 2;
                        return {
                          rowNo: actualRowIndex,
                          productCode: row[productCodeField] || '-',
                          productName: row[productNameField] || '-',
                          productDescription: row[productDescriptionField] || '-',
                          weight: row[weightField] || '-',
                          countryOfOrigin: row[countryOfOriginField] || '-',
                          supplierName: row[supplierNameField] || '-'
                        };
                      })}
                      columns={[
                        { id: 'rowNo', label: 'ROW NO.', minWidth: 80 },
                        { id: 'productCode', label: 'PRODUCT CODE', minWidth: 150 },
                        { id: 'productName', label: 'PRODUCT NAME', minWidth: 200 },
                        { id: 'productDescription', label: 'DESCRIPTION', minWidth: 200 },
                        { id: 'weight', label: 'WEIGHT (KG)', minWidth: 120 },
                        { id: 'countryOfOrigin', label: 'COUNTRY OF ORIGIN', minWidth: 150 },
                        { id: 'supplierName', label: 'SUPPLIER NAME', minWidth: 150 }
                      ]}
                      pageSize={10}
                      total={Math.min(validRecords.length, 10)}
                    />
                    {validRecords.length > 10 && (
                      <div className="esgnow-table-footer">
                        <p>Showing first 10 records. Total ready records: {validRecords.length}</p>
                      </div>
                    )}
                  </div>
                )}
          
                <div className="esgnow-review-row" onClick={() => setShowSkipped(!showSkipped)}>
                  <div className="esgnow-review-toggle">
                  <span className="esgnow-icon"><ChevronIcon isOpen={showSkipped} /></span>
                    <span>No. of Records Skipped</span>
                    <span className="esgnow-count-value">: {skippedRows.length}</span>
                  </div>
                  <div className="esgnow-row-actions">
                  {skippedRows.length > 0 ? (
                    <>
                      <button className="esgnow-download-btn" onClick={handleDownloadSkippedRows}>
                        <span className="esgnow-download-icon">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M13.3332 4C13.3332 5.65467 12.9878 6 11.3332 6H4.6665C3.01184 6 2.6665 5.65467 2.6665 4" stroke="#0156D2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M8.00033 14.6667L8.00033 7.99999M8.00033 14.6667C8.46713 14.6667 9.33931 13.3371 9.66699 13M8.00033 14.6667C7.53353 14.6667 6.66133 13.3371 6.33366 13" stroke="#0156D2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                        Download skipped rows
                      </button>

                      <div className="esgnow-divider" />

                      <button className="esgnow-toggle-link">
                        {showSkipped ? 'Hide Details' : 'View Details'}
                      </button>
                    </>
                  ) : (
                    <span className="esgnow-no-skipped-msg">No records have been skipped</span>
                  )}
                  </div>


                </div>
          
                {showSkipped && (
                  <div className="esgnow-skipped-table">
                    <div className="esgnow-table-header">
                      <div>ROW NO.</div>
                      <div>PRODUCT DETAILS</div>
                      <div>SKIPPED REASON</div>
                    </div>
                    {skippedRows.map((item, idx) => (
                      <div className="esgnow-table-row" key={idx}>
                        <div>{item.row}</div>
                        <div>
                          <div className="esgnow-code">{item.code}</div>
                          <div>{item.name}</div>
                        </div>
                        <div>{item.reason}</div>
                      </div>
                    ))}
                  </div>
                )}
          
                <div className="esgnow-review-row" onClick={() => setShowUnmapped(!showUnmapped)}>
                  <div className="esgnow-review-toggle">
                  <span className="esgnow-icon"><ChevronIcon isOpen={showSkipped} /></span>
                    <span>Unmapped Fields</span>
                    <span className="esgnow-count-value">: {unmappedFields.length}</span>
                  </div>
                  <a className="esgnow-toggle-link">
                    {showUnmapped ? 'Hide Details' : 'View Details'}
                  </a>
                </div>
          
                {showUnmapped && (
                  <div className="esgnow-unmapped-info">
                    <p>
                    The following fields in your uploaded file have not been mapped to any of IVIVA's ESG NOW fields and they will be ignored during import.
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
    <div className={`esgnow-bulk-import-widget ${className}`}>
      {/* Post-upload alert notification */}
      {showPostUploadAlert && (
        <div className="esgnow-alert-overlay">
          <div className="esgnow-alert-box">
          <div className="esgnow-alert-icon-frame">
            <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M37.3056 12.4974L36.4418 10.9984C35.7885 9.86468 35.462 9.29784 34.9062 9.07179C34.3504 8.84576 33.7218 9.02412 32.4648 9.38084L30.3294 9.98231C29.5269 10.1674 28.6848 10.0624 27.952 9.68588L27.3625 9.34573C26.734 8.94325 26.2507 8.34983 25.9831 7.65229L25.3988 5.90688C25.0145 4.75185 24.8223 4.17433 24.3649 3.844C23.9076 3.51367 23.3 3.51367 22.0848 3.51367H20.1339C18.9189 3.51367 18.3113 3.51367 17.8538 3.844C17.3965 4.17433 17.2044 4.75185 16.8201 5.90688L16.2357 7.65229C15.9681 8.34983 15.4848 8.94325 14.8564 9.34573L14.2669 9.68588C13.534 10.0624 12.692 10.1674 11.8895 9.98231L9.75406 9.38084C8.49697 9.02412 7.86844 8.84576 7.31267 9.07179C6.75691 9.29784 6.43029 9.86468 5.77701 10.9984L4.91325 12.4974C4.3009 13.5601 3.99472 14.0915 4.05415 14.6571C4.11357 15.2227 4.52345 15.6786 5.3432 16.5902L7.14752 18.6074C7.58852 19.1657 7.90162 20.1386 7.90162 21.0135C7.90162 21.8886 7.58863 22.8613 7.14758 23.4197L5.3432 25.437C4.52345 26.3487 4.11358 26.8044 4.05415 27.3702C3.99472 27.9358 4.3009 28.4671 4.91325 29.5297L5.77699 31.0287C6.43025 32.1624 6.75691 32.7294 7.31267 32.9553C7.86844 33.1814 8.49698 33.0031 9.7541 32.6463L11.8894 32.0448C12.6921 31.8596 13.5343 31.9648 14.2672 32.3414L14.8566 32.6816C15.4849 33.0841 15.9681 33.6773 16.2356 34.3749L16.8201 36.1205C17.2044 37.2755 17.3965 37.853 17.8538 38.1834C18.3113 38.5136 18.9189 38.5136 20.1339 38.5136H22.0848C23.3 38.5136 23.9076 38.5136 24.3649 38.1834C24.8223 37.853 25.0145 37.2755 25.3988 36.1205L25.9833 34.3749C26.2507 33.6773 26.7339 33.0841 27.3623 32.6816L27.9517 32.3414C28.6846 31.9648 29.5267 31.8596 30.3294 32.0448L32.4648 32.6463C33.7218 33.0031 34.3504 33.1814 34.9062 32.9553C35.462 32.7294 35.7885 32.1624 36.4418 31.0287L37.3056 29.5297C37.9179 28.4671 38.224 27.9358 38.1647 27.3702C38.1052 26.8044 37.6953 26.3487 36.8756 25.437L35.0712 23.4197C34.6302 22.8613 34.3171 21.8886 34.3171 21.0135C34.3171 20.1386 34.6304 19.1657 35.0712 18.6074L36.8756 16.5902C37.6953 15.6786 38.1052 15.2227 38.1647 14.6571C38.224 14.0915 37.9179 13.5601 37.3056 12.4974Z" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M21 14V21L25.9065 23.625" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

            <div className="esgnow-alert-heading">
            Products uploaded successfully. 
            </div>
            <div className="esgnow-alert-description">
            AI is processing classifications and emissions. Please check back shortly for full results.
            </div>
            <button className="esgnow-alert-cta" onClick={() => setShowPostUploadAlert(false)}>
              Okay, got it!
            </button>
          </div>
        </div>
      )}


      {!hideToggleButton && (
        <button 
          className="esgnow-bulk-import__trigger-btn"
          onClick={() => setIsModalOpen(true)}
        >
          Bulk Upload Products
        </button>
      )}

      <Modal
        show={isModalOpen} 
        onClose={handleModalClose}
        title="Bulk Upload Products"
        className="esgnow-bulk-import__modal"
        headerContent={
          <div className="esgnow-bulk-import__modal-header">
            <span className="esgnow-bulk-import__modal-title">Bulk Upload Products</span>
            <div className="esgnow-bulk-import__modal-header-controls">
              {currentStep > 1 && (
                <Button 
                  title="Previous"
                  className="esgnow-bulk-import__back-btn"
                  onClick={handleBack}
                />
              )}
              {currentStep < 3 ? (
                <Button
                  title="Next"
                  onClick={handleNext}
                  className="esgnow-bulk-import__next-btn"
                  styles={{
                    opacity: currentStep === 1 && (!dataFile || !imagesFile) ? 0.5 : 1,
                    pointerEvents: currentStep === 1 && (!dataFile || !imagesFile) ? "none" : "auto"
                  }}
                />

              ) : (
                <Button 
                  className="esgnow-bulk-import__import-btn"
                  title={isUploading ? "Importing..." : "Proceed to Import"}
                  onClick={handleBulkImport}
                  disabled={!productCodeField || !productNameField || !productDescriptionField || isUploading}
                />
              )}
              <div className="esgnow-bulk-import__vertical-separator" />
            </div>
          </div>  
        }
      >
        {/* Progress Steps */}
        {/* <div className="esgnow-bulk-import__progress-steps">
          <div className={`esgnow-bulk-import__step ${currentStep >= 1 ? 'esgnow-bulk-import__step--active' : ''}`}>
            <div className="esgnow-bulk-import__step-number">1</div>
            <span className="esgnow-bulk-import__step-text">Upload File</span>
          </div>

          <div className="esgnow-step-line" />

          <div className={`esgnow-bulk-import__step ${currentStep >= 2 ? 'esgnow-bulk-import__step--active' : ''}`}>
            <div className="esgnow-bulk-import__step-number">2</div>
            <span className="esgnow-bulk-import__step-text">Map Fields & Assign Defaults</span>
          </div>

          <div className="esgnow-step-line" />

          <div className={`esgnow-bulk-import__step ${currentStep >= 3 ? 'esgnow-bulk-import__step--active' : ''}`}>
            <div className="esgnow-bulk-import__step-number">3</div>
            <span className="esgnow-bulk-import__step-text">Review & Import</span>
          </div>
        </div> */}
        <div className="esgnow-bulk-import__progress-steps">
          <div className={`esgnow-bulk-import__step ${currentStep > 1 ? 'esgnow-bulk-import__step--completed' : currentStep === 1 ? 'esgnow-bulk-import__step--active' : ''}`}>
            <div className="esgnow-bulk-import__step-number">
              {currentStep > 1 ? '✔' : '1'}
            </div>
            <span className="esgnow-bulk-import__step-text">Upload File</span>
          </div>

          <div className="esgnow-step-line" />

          <div className={`esgnow-bulk-import__step ${currentStep > 2 ? 'esgnow-bulk-import__step--completed' : currentStep === 2 ? 'esgnow-bulk-import__step--active' : ''}`}>
            <div className="esgnow-bulk-import__step-number">
              {currentStep > 2 ? '✔' : '2'}
            </div>
            <span className="esgnow-bulk-import__step-text">Map Fields & Assign Defaults</span>
          </div>

          <div className="esgnow-step-line" />

          <div className={`esgnow-bulk-import__step ${currentStep === 3 ? 'esgnow-bulk-import__step--active' : ''}`}>
            <div className="esgnow-bulk-import__step-number">3</div>
            <span className="esgnow-bulk-import__step-text">Review & Import</span>
          </div>
        </div>

        {/* Upload Status Message */}
        {/* {uploadMessage && (
          <div className={`esgnow-bulk-import__upload-message ${uploadMessageType || ''}`}>
            <span className="esgnow-message-icon">
              {uploadMessageType === "success" ? "✓" : uploadMessageType === "error" ? "✗" : "ℹ"}
            </span>
            <span className="esgnow-message-text">{uploadMessage}</span>
            {uploadMessageType === "error" && (
              <button 
                className="esgnow-dismiss-btn" 
                onClick={() => {
                  setUploadMessage(null);
                  setUploadMessageType(null);
                }}
              >
                Dismiss
              </button>
            )}
          </div>
        )} */}

        {/* Step Content */}
        {getStepContent()}

      </Modal>
    </div>
  );
};

export default BulkImportWidget;


