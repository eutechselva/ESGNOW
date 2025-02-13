import { IContextProvider } from "@uxp";
import { head } from "lodash";
import React, { useState } from "react";

interface IBulkUploadWidgetProps {
   uxpContext: IContextProvider;
}

const BulkUploadWidget: React.FC<IBulkUploadWidgetProps> = ({ uxpContext }) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState<boolean>(false);
    const [message, setMessage] = useState<string | null>(null);

    // Handle file selection
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const selectedFile = event.target.files[0];
            const allowedTypes = [".xlsx", ".rar"];

            if (!allowedTypes.some(ext => selectedFile.name.toLowerCase().endsWith(ext))) {
                setMessage("Unsupported file type. Please upload a ZIP or RAR file.");
                return;
            }

            setFile(selectedFile);
            setMessage(null);
        }
    };

    // Handle file upload
    const handleUpload = async () => {
        if (!file) {
            setMessage("Please select a file to upload.");
            return;
        }

        setUploading(true);
        setMessage(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const requestOptions = {
                method: "POST",
                body: formData,
                headers: {
                    "x-iviva-account": "lucy1",
                },
              };
              
            let response =   await fetch("http://localhost:5009/api/products/bulk-upload",   requestOptions);

            debugger;

            if (response.ok) {
                setMessage("Upload successful!");
            } else {
                setMessage("Upload failed. Please try again.");
            }
        } catch (error) {
            console.error("Upload Error:", error);
            setMessage("An error occurred during upload.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <h1>Bulk Upload</h1>
            <input type="file" accept=".xlsx" onChange={handleFileChange} />
            <button onClick={handleUpload} disabled={uploading}>
                {uploading ? "Uploading..." : "Upload"}
            </button>
            {message && <p>{message}</p>}
        </div>
    );
};

export default BulkUploadWidget;
