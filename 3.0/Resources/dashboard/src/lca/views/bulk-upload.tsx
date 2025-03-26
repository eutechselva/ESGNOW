import { IContextProvider } from "@uxp";
import API_BASE_URL from "../config";
import './bulk-upload.scss';
import React, { useState } from "react";

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
            setMessage(`Selected: ${selectedFile.name}`);
            setMessageType("success");
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
            setMessage(`Selected: ${selectedFile.name}`);
            setMessageType("success");
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
            const requestOptions = {
                method: "POST",
                body: formData,
                headers: { "x-iviva-account": "lucy1" },
            };

            let response = await fetch(`${API_BASE_URL}/api/products/bulk-upload`, requestOptions);

            if (response.ok) {
                setMessage("Data upload successful!");
                setMessageType("success");
                setDataFile(null);
                // Reset the file input
                const fileInput = document.getElementById("data-file-input") as HTMLInputElement;
                if (fileInput) fileInput.value = "";
            } else {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { message: "An unknown error occurred" };
                }
                
                // Provide more detailed error messages
                if (errorData.validationErrors) {
                    const errorMessages = Object.entries(errorData.validationErrors)
                        .map(([field, msg]) => `${field}: ${msg}`)
                        .join(", ");
                    setMessage(`Data validation failed: ${errorMessages}`);
                } else {
                    setMessage(`Data upload failed: ${errorData.message || "Please try again."}`);
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
            const requestOptions = {
                method: "POST",
                body: formData,
                headers: { "x-iviva-account": "lucy1" },
            };

            let response = await fetch(`${API_BASE_URL}/api/products/bulk-image-upload`, requestOptions);

            if (response.ok) {
                setMessage("ZIP upload successful!");
                setMessageType("success");
                setZipFile(null);
                // Reset the file input
                const fileInput = document.getElementById("zip-file-input") as HTMLInputElement;
                if (fileInput) fileInput.value = "";
            } else {
                const errorData = await response.json();
                setMessage(`ZIP upload failed: ${errorData.message || "Please try again."}`);
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
    const handleDownloadTemplate = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/products/sample-template`, {
                headers: { "x-iviva-account": "lucy1" },
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'product_upload_template.xlsx';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                setMessage("Failed to download sample template.");
                setMessageType("error");
            }
        } catch (error) {
            console.error("Download Error:", error);
            setMessage("An error occurred while downloading the template.");
            setMessageType("error");
        }
    };

    // Handle sample folder structure download
    const handleDownloadFolderStructure = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/products/sample-folder-structure`, {
                headers: { "x-iviva-account": "lucy1" },
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'product_images_structure.zip';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                setMessage("Failed to download sample folder structure.");
                setMessageType("error");
            }
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
            
            <div className="card">
                <div className="card-header">
                    <h2>Upload Product Data (Excel/CSV)</h2>
                    <button 
                        onClick={handleDownloadTemplate}
                        className="download-btn"
                        title="Download a sample template for product upload"
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
                            />
                            <label htmlFor="data-file-input" className="file-label">
                                {dataFile ? dataFile.name : "Choose Excel/CSV File..."}
                            </label>
                        </div>
                        
                        <button 
                            onClick={handleDataUpload} 
                            disabled={uploadingData || !dataFile}
                            className={`upload-btn ${!dataFile ? 'disabled' : ''}`}
                        >
                            {uploadingData ? "Uploading..." : "Upload Data"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2>Upload Product Images (ZIP)</h2>
                    <button 
                        onClick={handleDownloadFolderStructure}
                        className="download-btn"
                        title="Download a sample folder structure for product images"
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
                            />
                            <label htmlFor="zip-file-input" className="file-label">
                                {zipFile ? zipFile.name : "Choose ZIP File..."}
                            </label>
                        </div>
                        
                        <button 
                            onClick={handleZipUpload} 
                            disabled={uploadingZip || !zipFile}
                            className={`upload-btn ${!zipFile ? 'disabled' : ''}`}
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

            {/* Status Messages */}
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
        </div>
    );
};

export default BulkUploadWidget;