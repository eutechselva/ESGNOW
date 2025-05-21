import { IContextProvider } from "@uxp";
import './bulk-upload.scss';
import React, { useState, useEffect } from "react";
import { bulkImageUpload, bulkUpload } from "../../esgnow-service";
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
// Import logo
import esgLogo from '../../images/ESG_now_logo.png';

interface IBulkUploadWidgetProps {
    uxpContext: IContextProvider;
}

const BulkUploadWidget: React.FC<IBulkUploadWidgetProps> = ({ uxpContext }) => {
    const [dataFile, setDataFile] = useState<File | null>(null);
    const [zipFile, setZipFile] = useState<File | null>(null);
    const [uploadingData, setUploadingData] = useState<boolean>(false);
    const [uploadingZip, setUploadingZip] = useState<boolean>(false);
    const [message, setMessage] = useState<string | null>(null);
    const [messageType, setMessageType] = useState<"success" | "error" | null>(null);
    const [logoImageData, setLogoImageData] = useState<Uint8Array | null>(null);
    const [isActiveUpload, setIsActiveUpload] = useState<"data" | "zip" | null>(null);
    
    // Load the logo image when component mounts
    useEffect(() => {
        const loadLogoImage = async () => {
            try {
                // Create a simple 1x1 pixel image as fallback
                const sampleJpg = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==";
                const jpgBase64 = sampleJpg.replace(/^data:image\/jpeg;base64,/, '');
                const defaultImage = new Uint8Array(Array.from(atob(jpgBase64), c => c.charCodeAt(0)));
                
                // Try to fetch the actual logo image
                try {
                    const response = await fetch(esgLogo);
                    const blob = await response.blob();
                    const arrayBuffer = await blob.arrayBuffer();
                    setLogoImageData(new Uint8Array(arrayBuffer));
                } catch (error) {
                    console.error("Error loading logo image:", error);
                    setLogoImageData(defaultImage);
                }
            } catch (error) {
                console.error("Error in loadLogoImage:", error);
            }
        };
        
        loadLogoImage();
    }, []);

    // Handle file selection for data file (Excel or CSV)
    const handleDataFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const selectedFile = event.target.files[0];
            const fileName = selectedFile.name.toLowerCase();

            if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".csv")) {
                setMessage("Unsupported file type. Please upload an Excel (.xlsx) or CSV (.csv) file.");
                setMessageType("error");
                return;
            }

            setDataFile(selectedFile);
            setZipFile(null);
            setIsActiveUpload("data");
            setMessage(`Selected: ${selectedFile.name}, Please click Upload Data button`);
            setMessageType("success");
            
            // Reset the zip file input
            const zipFileInput = document.getElementById("zip-file-input") as HTMLInputElement;
            if (zipFileInput) zipFileInput.value = "";
        }
    };

    // Handle file selection for ZIP
    const handleZipFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const selectedFile = event.target.files[0];

            if (!selectedFile.name.toLowerCase().endsWith(".zip")) {
                setMessage("Unsupported file type. Please upload a ZIP file.");
                setMessageType("error");
                return;
            }

            setZipFile(selectedFile);
            setDataFile(null);
            setIsActiveUpload("zip");
            setMessage(`Selected: ${selectedFile.name}, Please click Upload ZIP button`);
            setMessageType("success");
            
            // Reset the data file input
            const dataFileInput = document.getElementById("data-file-input") as HTMLInputElement;
            if (dataFileInput) dataFileInput.value = "";
        }
    };

    // Handle Data File Upload (Excel or CSV)
    const handleDataUpload = async () => {
        if (!dataFile) {
            setMessage("Please select an Excel or CSV file to upload.");
            setMessageType("error");
            return;
        }

        setUploadingData(true);
        setMessage(`Uploading ${dataFile.name}...`);
        setMessageType(null);

        const formData = new FormData();
        formData.append("file", dataFile);

        try {
            let response = await bulkUpload(uxpContext, formData);

            if (response.data) {
                setMessage("Data upload successful!");
                setMessageType("success");
                setDataFile(null);
                setIsActiveUpload(null);
                // Reset the file input
                const fileInput = document.getElementById("data-file-input") as HTMLInputElement;
                if (fileInput) fileInput.value = "";
            } else {
                let errorData;
                try {
                    errorData = await response.error;

                } catch (e) {
                    errorData = { message: "An unknown error occurred" };
                }


                setMessageType("error");
            }
        } catch (error) {
            console.error("Data Upload Error:", error);
            setMessage(`An error occurred during data upload: ${error.message}`);
            setMessageType("error");
        } finally {
            setUploadingData(false);
        }
    };

    // Handle ZIP Upload
    const handleZipUpload = async () => {
        if (!zipFile) {
            setMessage("Please select a ZIP file to upload.");
            setMessageType("error");
            return;
        }

        setUploadingZip(true);
        setMessage("Uploading ZIP file...");
        setMessageType(null);

        const formData = new FormData();
        formData.append("file", zipFile);

        try {
            // const requestOptions = {
            //     method: "POST",
            //     body: formData,
            //     headers: { "x-iviva-account": "lucy1" },
            // };

            let response = await bulkImageUpload(uxpContext, formData);


            if (response.data) {
                setMessage("ZIP upload successful!");
                setMessageType("success");
                setZipFile(null);
                setIsActiveUpload(null);
                // Reset the file input
                const fileInput = document.getElementById("zip-file-input") as HTMLInputElement;
                if (fileInput) fileInput.value = "";
            } else {
                const errorData = await response.error;
                ;
                setMessage(`ZIP upload failed: ${errorData || "Please try again."}`);
                setMessageType("error");
            }
        } catch (error) {
            console.error("ZIP Upload Error:", error);
            setMessage("An error occurred during ZIP upload.");
            setMessageType("error");
        } finally {
            setUploadingZip(false);
        }
    };

    // Handle sample template download
    const handleDownloadTemplate = () => {
        try {
            // Define the sample data
            const sampleData = [
                {
                    "code": "OF001",
                    "name": "Executive Desk",
                    "description": "Modern wooden executive desk with drawers",
                    "weight": 50,
                    "countryOfOrigin": "CN",
                    "supplierName": "OfficeFurnish Ltd"
                },
                {
                    "code": "OF002",
                    "name": "Ergonomic Chair",
                    "description": "Adjustable office chair with lumbar support",
                    "weight": 15,
                    "countryOfOrigin": "VN",
                    "supplierName": "ComfortSeating GmbH"
                },
                {
                    "code": "OF003",
                    "name": "Conference Table",
                    "description": "Large wooden conference table for meetings",
                    "weight": 80,
                    "countryOfOrigin": "Global",
                    "supplierName": "BoardRoom Supplies"
                },
                {
                    "code": "OF004",
                    "name": "Bookshelf",
                    "description": "5-tier wooden bookshelf for office storage",
                    "weight": 30,
                    "countryOfOrigin": "CN",
                    "supplierName": "ScandiOffice Solutions"
                },
                {
                    "code": "OF005",
                    "name": "File Cabinet",
                    "description": "Steel file cabinet with locking drawers",
                    "weight": 45,
                    "countryOfOrigin": "VN",
                    "supplierName": "SecureFiles Inc"
                }
            ]
                ;

            // Create a new workbook
            const workbook = XLSX.utils.book_new();

            // Convert JSON data to worksheet
            const worksheet = XLSX.utils.json_to_sheet(sampleData);

            // Add the worksheet to the workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

            // Generate Excel file as array buffer
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

            // Convert to Blob
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            // Create URL and trigger download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'product_upload_template.xlsx';
            document.body.appendChild(a);
            a.click();

            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setMessage("Excel template downloaded successfully.");
            setMessageType("success");
        } catch (error) {
            console.error("Download Error:", error);
            setMessage("An error occurred while downloading the template.");
            setMessageType("error");
        }
    };

    // Handle sample folder structure download
    const handleDownloadFolderStructure = async () => {
        try {
            // Create a sample folder structure programmatically
            // This creates a basic structure with product folders that matches what's needed
            
            // Create a new JSZip instance
            const zip = new JSZip();
            
            // Create a default 1x1 pixel JPG as fallback
            const sampleJpg = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==";
            const jpgBase64 = sampleJpg.replace(/^data:image\/jpeg;base64,/, '');
            const defaultImage = new Uint8Array(Array.from(atob(jpgBase64), c => c.charCodeAt(0)));
            
            // Use the loaded logo image or default if not available
            const imageData = logoImageData || defaultImage;
            
            // Create product folders with sample images
            // Product 1
            const prod1Folder = zip.folder("OF001");
            prod1Folder.file("main.jpg", imageData, {binary: true});
            prod1Folder.file("alternate1.jpg", imageData, {binary: true});
            prod1Folder.file("alternate2.jpg", imageData, {binary: true});
            
            // Product 2
            const prod2Folder = zip.folder("OF002");
            prod2Folder.file("main.jpg", imageData, {binary: true});
            prod2Folder.file("side_view.jpg", imageData, {binary: true});
            
            
            
            // Add a README file explaining the structure
            zip.file("README.txt", 
                "PRODUCT IMAGES FOLDER STRUCTURE\n\n" +
                "Each product should have its own folder named exactly as the product's Code.\n" +
                "For example, if your product code is PROD001, create a folder named 'PROD001'.\n\n" +
                "Inside each product folder, save the images with proper naming:\n" +
                "- Main product image should be named 'main.jpg' or 'main.png'\n" +
                "- Additional images can be named as desired (e.g., 'alternate1.jpg', 'side.png', etc.)\n\n" +
                "Supported image formats: JPG, PNG (max 5MB per image)\n" +
                "Ensure all images are high quality and properly represent the product.\n\n" +
                "EXAMPLE STRUCTURE:\n" +
                "- PROD001/\n" +
                "  - main.jpg (Main product image)\n" +
                "  - alternate1.jpg (Additional view)\n" +
                "  - alternate2.jpg (Another view)\n" +
                "- PROD002/\n" +
                "  - main.jpg (Main product image)\n" +
                "  - side_view.jpg (Side view of product)\n" +
                "- PROD003/\n" +
                "  - main.jpg (Main product image)\n\n" +
                "Note: The sample images in this ZIP are 1x1 pixel placeholders. Replace them with your actual product images."
            );
            
            // Generate zip file
            const content = await zip.generateAsync({type: "blob"});
            
            // Create URL and download
            const url = window.URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'product_images_structure.zip';
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            setMessage("Folder structure downloaded successfully.");
            setMessageType("success");
        } catch (error) {
            console.error("Download Error:", error);
            setMessage("An error occurred while downloading the folder structure.");
            setMessageType("error");
        }
    };

    return (
        <div className="bulk-upload-container">
            <h1 className="page-title">Product Bulk Upload</h1>
            <p className="page-description">
                Upload your product data and images in bulk using the forms below.
                Make sure to follow the required template and folder structure.
            </p>

            {/* Status Messages - Moved to the top */}
            {message && (
                <div className={`message ${messageType || ''}`}>
                    <span className="message-icon">{messageType === "success" ? "✓" : messageType === "error" ? "✗" : "ℹ"}</span>
                    <span className="message-text">{message}</span>
                    {messageType === "error" && (
                        <button className="dismiss-btn" onClick={() => setMessage(null)}>
                            Dismiss
                        </button>
                    )}
                </div>
            )}

            <div className={`card ${isActiveUpload === "zip" ? "disabled-card" : ""}`}>
                <div className="card-header">
                    <h2>Upload Product Data (Excel/CSV)</h2>
                    <button
                        onClick={handleDownloadTemplate}
                        className="download-btn"
                        title="Download a sample template for product upload"
                        disabled={isActiveUpload === "zip"}
                    >
                        Download Template
                    </button>
                </div>

                <div className="card-body">
                    <p className="section-info">
                        Upload your Excel (.xlsx) or CSV (.csv) file containing product data. Make sure all required fields are filled.
                    </p>

                    <div className="upload-section">
                        <div className="file-input-container">
                            <input
                                type="file"
                                id="data-file-input"
                                accept=".xlsx,.csv"
                                onChange={handleDataFileChange}
                                className="file-input"
                                disabled={isActiveUpload === "zip"}
                            />
                            <label htmlFor="data-file-input" className={`file-label ${isActiveUpload === "zip" ? "disabled-label" : ""}`}>
                                {dataFile ? dataFile.name : "Choose Excel/CSV File..."}
                            </label>
                        </div>

                        <button
                            onClick={handleDataUpload}
                            disabled={uploadingData || !dataFile || isActiveUpload === "zip"}
                            className={`upload-btn ${(!dataFile || isActiveUpload === "zip") ? 'disabled' : ''}`}
                        >
                            {uploadingData ? "Uploading..." : "Upload Data"}
                        </button>
                    </div>
                </div>
            </div>

            <div className={`card ${isActiveUpload === "data" ? "disabled-card" : ""}`}>
                <div className="card-header">
                    <h2>Upload Product Images (ZIP)</h2>
                    <button
                        onClick={handleDownloadFolderStructure}
                        className="download-btn"
                        title="Download a sample folder structure for product images"
                        disabled={isActiveUpload === "data"}
                    >
                        Download Structure
                    </button>
                </div>

                <div className="card-body">
                    <p className="section-info">
                        Upload a ZIP file containing product images. Each product should have its own folder named
                        with the product SKU or ID, containing images named according to the specification.
                    </p>

                    <div className="upload-section">
                        <div className="file-input-container">
                            <input
                                type="file"
                                id="zip-file-input"
                                accept=".zip"
                                onChange={handleZipFileChange}
                                className="file-input"
                                disabled={isActiveUpload === "data"}
                            />
                            <label htmlFor="zip-file-input" className={`file-label ${isActiveUpload === "data" ? "disabled-label" : ""}`}>
                                {zipFile ? zipFile.name : "Choose ZIP File..."}
                            </label>
                        </div>

                        <button
                            onClick={handleZipUpload}
                            disabled={uploadingZip || !zipFile || isActiveUpload === "data"}
                            className={`upload-btn ${(!zipFile || isActiveUpload === "data") ? 'disabled' : ''}`}
                        >
                            {uploadingZip ? "Uploading..." : "Upload ZIP"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Instructions Section */}
            <div className="instructions-card">
                <h3>Upload Instructions</h3>
                <div className="instructions-content">
                    <div className="instruction-section">
                        <h4>Data File Format</h4>
                        <ul>
                            <li>Your Excel or CSV file must contain the following required columns: Code, Name, Description, Weight, Country Of Origin, Supplier Name</li>
                            <li>The system will match column headers regardless of case (e.g., "Code" or "code" will both work)</li>
                            <li>Make sure all required fields (Code, Name, Description) are filled for each product</li>
                            <li>Each product must have a unique Code</li>
                        </ul>
                    </div>
                    <div className="instruction-section">
                        <h4>ZIP File Structure</h4>
                        <ul>
                            <li>Create a folder for each product named exactly as the product's Code</li>
                            <li>Place all product images in their respective folders</li>
                            <li>Supported image formats: JPG, PNG (max 5MB per image)</li>
                            <li>Main product image should be named "main.jpg" or "main.png"</li>
                        </ul>
                    </div>
                    <div className="instruction-section">
                        <h4>Common Issues</h4>
                        <ul>
                            <li>If upload fails, check that all required fields are filled out</li>
                            <li>Verify that your CSV file has proper column headers</li>
                            <li>Ensure your file isn't too large (max 10MB)</li>
                            <li>Check that your file is properly formatted without special characters</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkUploadWidget;