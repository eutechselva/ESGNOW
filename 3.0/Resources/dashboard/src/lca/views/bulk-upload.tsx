import { IContextProvider } from "@uxp";
import API_BASE_URL from "../config";
import React, { useState } from "react";

interface IBulkUploadWidgetProps {
   uxpContext: IContextProvider;
}

const BulkUploadWidget: React.FC<IBulkUploadWidgetProps> = ({ uxpContext }) => {
    const [excelFile, setExcelFile] = useState<File | null>(null);
    const [zipFile, setZipFile] = useState<File | null>(null);
    const [uploadingExcel, setUploadingExcel] = useState<boolean>(false);
    const [uploadingZip, setUploadingZip] = useState<boolean>(false);
    const [message, setMessage] = useState<string | null>(null);

    // Handle file selection for Excel
    const handleExcelFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const selectedFile = event.target.files[0];

            if (!selectedFile.name.toLowerCase().endsWith(".xlsx")) {
                setMessage("Unsupported file type. Please upload an Excel (.xlsx) file.");
                return;
            }

            setExcelFile(selectedFile);
            setMessage(null);
        }
    };

    // Handle file selection for ZIP
    const handleZipFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const selectedFile = event.target.files[0];

            if (!selectedFile.name.toLowerCase().endsWith(".zip")) {
                setMessage("Unsupported file type. Please upload a ZIP file.");
                return;
            }

            setZipFile(selectedFile);
            setMessage(null);
        }
    };

    // Handle Excel Upload
    const handleExcelUpload = async () => {
        if (!excelFile) {
            setMessage("Please select an Excel file to upload.");
            return;
        }

        setUploadingExcel(true);
        setMessage(null);

        const formData = new FormData();
        formData.append("file", excelFile);

        try {
            const requestOptions = {
                method: "POST",
                body: formData,
                headers: { "x-iviva-account": "lucy1" },
            };

            let response = await fetch(`${API_BASE_URL}/api/products/bulk-upload`, requestOptions);

            if (response.ok) {
                setMessage("Excel upload successful!");
            } else {
                setMessage("Excel upload failed. Please try again.");
            }
        } catch (error) {
            console.error("Excel Upload Error:", error);
            setMessage("An error occurred during Excel upload.");
        } finally {
            setUploadingExcel(false);
        }
    };

    // Handle ZIP Upload
    const handleZipUpload = async () => {
        if (!zipFile) {
            setMessage("Please select a ZIP file to upload.");
            return;
        }

        setUploadingZip(true);
        setMessage(null);

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
            } else {
                setMessage("ZIP upload failed. Please try again.");
            }
        } catch (error) {
            console.error("ZIP Upload Error:", error);
            setMessage("An error occurred during ZIP upload.");
        } finally {
            setUploadingZip(false);
        }
    };

    return (
        <div>
            <h1>Bulk Upload</h1>

            {/* Excel Upload Section */}
            <div>
                <h2>Upload Product Data (Excel)</h2>
                <input type="file" accept=".xlsx" onChange={handleExcelFileChange} />
                <button onClick={handleExcelUpload} disabled={uploadingExcel}>
                    {uploadingExcel ? "Uploading..." : "Upload Excel"}
                </button>
            </div>

            {/* ZIP Upload Section */}
            <div style={{ marginTop: "20px" }}>
                <h2>Upload Product Images (ZIP)</h2>
                <input type="file" accept=".zip" onChange={handleZipFileChange} />
                <button onClick={handleZipUpload} disabled={uploadingZip}>
                    {uploadingZip ? "Uploading..." : "Upload ZIP"}
                </button>
            </div>

            {/* Status Messages */}
            {message && <p>{message}</p>}
        </div>
    );
};

export default BulkUploadWidget;
