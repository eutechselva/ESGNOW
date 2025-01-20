import * as React from 'react'
import * as FileSaver from 'file-saver';
import * as XLSX from "xlsx";

const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
const fileExtension = ".xlsx";

/**
 * 
 * @param data 
 * This will be a object 
 * each key will be the sheet name and value will an array of items (data for the sheet)
 * @param fileName 
 */

const useExportToExcel = (data: Record<string, any[]>, fileName: string) => {

    let sheetNames = [...Object.keys(data)]
    let sheets: any = {}
    for (let sheet of sheetNames) {
        sheets[sheet] = XLSX.utils.json_to_sheet(data[sheet])
    }

    const wb = { Sheets: sheets, SheetNames: sheetNames };
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const fileData = new Blob([excelBuffer], { type: fileType });
    FileSaver.saveAs(fileData, fileName + fileExtension);
}

export default useExportToExcel