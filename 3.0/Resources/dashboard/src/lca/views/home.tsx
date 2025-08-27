import * as React from "react";
import {
  WidgetWrapper,
  TitleBar,
  Button,
  useToast,
  Modal,
  ActionResponse,
} from "uxp/components";
import { useRef, useState } from "react";
import Papa from "papaparse";
import { IContextProvider } from "../../uxp";

export interface IWidgetProps {
  uxpContext?: IContextProvider;
  instanceId?: string;
  uiProps?: any;
}

// Custom Table Component
const DataTable: React.FC<{
  data: any[];
  onEdit: (index: number, newData: any) => void;
  onDelete: (index: number) => void;
  onAdd: (newData: any) => void;
}> = ({ data, onEdit, onDelete, onAdd }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newData, setNewData] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

  const handleEdit = (index: number) => {
    const actualIndex = startIndex + index;
    setEditingIndex(actualIndex);
    setEditData({ ...data[actualIndex] });
  };

  const saveEdit = () => {
    if (editingIndex !== null) {
      onEdit(editingIndex, editData);
      setEditingIndex(null);
      setEditData({});
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditData({});
  };

  const handleAdd = () => {
    const newRecord = columns.reduce((acc, col) => ({ ...acc, [col]: "" }), {});
    setNewData(newRecord);
    setShowAddForm(true);
  };

  const saveAdd = () => {
    onAdd(newData);
    setShowAddForm(false);
    setNewData({});
  };

  const cancelAdd = () => {
    setShowAddForm(false);
    setNewData({});
  };

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '16px' 
      }}>
        <h3>Uploaded Data ({data.length} records)</h3>
        <Button title="Add Record" onClick={handleAdd} />
      </div>

      {showAddForm && (
        <div style={{
          background: '#f5f5f5',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <h4>Add New Record</h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            margin: '16px 0'
          }}>
            {columns.map((col) => (
              <div key={col}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  {col}
                </label>
                <input
                  type="text"
                  value={newData[col] || ""}
                  onChange={(e) => setNewData({ ...newData, [col]: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button title="Save" onClick={saveAdd} />
            <Button title="Cancel" onClick={cancelAdd} />
          </div>
        </div>
      )}

      <div style={{
        overflowX: 'auto',
        border: '1px solid #ddd',
        borderRadius: '8px'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col} style={{
                  padding: '12px',
                  textAlign: 'left',
                  borderBottom: '1px solid #eee',
                  background: '#f8f9fa',
                  fontWeight: 'bold'
                }}>
                  {col}
                </th>
              ))}
              <th style={{
                padding: '12px',
                textAlign: 'left',
                borderBottom: '1px solid #eee',
                background: '#f8f9fa',
                fontWeight: 'bold'
              }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, index) => {
              const actualIndex = startIndex + index;
              const isEditing = editingIndex === actualIndex;
              
              return (
                <tr key={actualIndex} style={{ background: isEditing ? '#fff3cd' : 'transparent' }}
                    onMouseEnter={(e) => !isEditing && (e.currentTarget.style.background = '#f8f9fa')}
                    onMouseLeave={(e) => !isEditing && (e.currentTarget.style.background = 'transparent')}
                >
                  {columns.map((col) => (
                    <td key={col} style={{
                      padding: '12px',
                      textAlign: 'left',
                      borderBottom: '1px solid #eee'
                    }}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData[col] || ""}
                          onChange={(e) => setEditData({ ...editData, [col]: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '4px',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                        />
                      ) : (
                        row[col]
                      )}
                    </td>
                  ))}
                  <td style={{
                    padding: '12px',
                    textAlign: 'left',
                    borderBottom: '1px solid #eee'
                  }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={saveEdit}
                          style={{
                            padding: '4px 8px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            background: '#28a745',
                            color: 'white'
                          }}
                        >
                          Save
                        </button>
                        <button 
                          onClick={cancelEdit}
                          style={{
                            padding: '4px 8px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            background: '#6c757d',
                            color: 'white'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleEdit(index)}
                          style={{
                            padding: '4px 8px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            background: '#007bff',
                            color: 'white'
                          }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => onDelete(actualIndex)}
                          style={{
                            padding: '4px 8px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            background: '#dc3545',
                            color: 'white'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '16px',
          marginTop: '16px'
        }}>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              background: 'white',
              borderRadius: '4px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.5 : 1
            }}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              background: 'white',
              borderRadius: '4px',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === totalPages ? 0.5 : 1
            }}
          >
            Next
          </button>
        </div>
      )}


    </div>
  );
};

const HomeDashboard: React.FunctionComponent<IWidgetProps> = (props) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [parsedData, setParsedData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = React.useState(false);

  const toast = useToast();

  const resetState = () => {
    setParsedData(null);
    setFileName(null);
    setLoading(false);
  };

  const downloadEmptySheet = () => {
    // Define the template structure with predefined activities
    const templateData = [
      // Header row
      ["Activity", "Year", "Month", "Value"],
      
      // Predefined activity rows with empty values for user input
      ["Generator Fuel Consumption", "20xx", "Jan", ""],
      ["Refrigerant Leakages/Refilling", "20xx", "Jan", ""],
      
      // Additional empty rows for more data entry
      ["", "20xx", "", ""],
      ["", "20xx", "", ""],
      ["", "20xx", "", ""],
      ["", "20xx", "", ""],
      ["", "20xx", "", ""],
      ["", "20xx", "", ""],
      ["", "20xx", "", ""],
      ["", "20xx", "", ""],
      ["", "20xx", "", ""],
      ["", "20xx", "", ""],
    ];
  
    // Convert to CSV format
    const csvContent = templateData
      .map(row => row.map(cell => {
        // Handle cells that might contain commas by wrapping in quotes
        if (cell.includes(',')) {
          return `"${cell}"`;
        }
        return cell;
      }).join(','))
      .join('\n');
  
    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "Empty_Carbon_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSVFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      const results = Papa.parse(csv, {
        header: true,
        skipEmptyLines: true
      });
      
      if (results.errors.length > 0) {
        console.error("CSV parsing error:", results.errors);
        toast.error("Failed to parse CSV file");
        return;
      }
      
      const jsonData = results.data.map((row: any) => {
        const cleanedRow: any = {};
        for (const key in row) {
          cleanedRow[key] = row[key] ?? "";
        }
        return cleanedRow;
      });
      setParsedData(jsonData);
      setFileName(file.name);
    };
    reader.readAsText(file);
  };

  const uploadToLucy = () => {
    if (!parsedData || !Array.isArray(parsedData)) {
      toast.error("Parsed data is empty or invalid.");
      return;
    }
    setLoading(true);
    try {
      props.uxpContext?.executeAction(
        "carbon_reporting_80rr",
        "InsertCarbonReport",
        { CarbonInputData: JSON.stringify(parsedData) }
      );
      toast.success("Data uploaded successfully!");
      resetState();
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  // Table event handlers
  const handleEdit = (index: number, newData: any) => {
    setParsedData((prev: any[]) => {
      const updated = [...prev];
      updated[index] = newData;
      return updated;
    });
  };

  const handleDelete = (index: number) => {
    setParsedData((prev: any[]) => prev.filter((_, i) => i !== index));
  };

  const handleAdd = (newData: any) => {
    setParsedData((prev: any[]) => [...prev, newData]);
  };

  return (
    <WidgetWrapper>
      <TitleBar title="Bulk Data Upload" />

      <div className="upload-controls">
        <Button title="Download Empty Sheet" onClick={downloadEmptySheet} />
      </div>

      <div
        className={`dropzone ${loading ? "disabled" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.classList.add("highlight");
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove("highlight");
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove("highlight");
          const file = e.dataTransfer.files?.[0];
          if (file) parseCSVFile(file);
        }}
        onClick={() => {
          if (!loading) fileInputRef.current?.click();
        }}
      >
        {fileName ? (
          <>
            <div className="filename-box">
              <span className="filename">{fileName}</span>
              <button className="remove-file" onClick={(e) => {
                e.stopPropagation();
                resetState();
              }}>✖</button>
            </div>
            <p className="parsed-info">
              ✅ <strong>{parsedData.length}</strong> rows parsed
            </p>
            <div className="action-buttons">
              <Button
                title="Review"
                onClick={() => {
                  setShowReviewModal(true);
                }}
                disabled={loading}
              />
              <Button
                title="Cancel"
                onClick={() => {
                  resetState();
                }}
                disabled={loading}
              />
            </div>
          </>
        ) : (
          <p className="placeholder-text">
            Drag & drop a CSV file here,<br />or click to select
          </p>
        )}
      </div>

      <Modal
        show={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Review and Edit CSV Data"
      >
        <div className="modal-body">
          {parsedData && (
            <DataTable
              data={parsedData}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAdd={handleAdd}
            />
          )}
          <div className="modal-actions">
            <Button
              title="Upload"
              onClick={() => {
                uploadToLucy();
                setShowReviewModal(false);
              }}
            />
            <Button
              title="Cancel"
              onClick={() => setShowReviewModal(false)}
            />
          </div>
        </div>
      </Modal>

      <input
        type="file"
        accept=".csv"
        style={{ display: "none" }}
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) parseCSVFile(file);
          e.target.value = "";
        }}
      />
    </WidgetWrapper>
  );
};

export default HomeDashboard;