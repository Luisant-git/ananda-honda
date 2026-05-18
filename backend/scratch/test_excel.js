const XLSX = require('xlsx');

// Create a dummy workbook
const wb = XLSX.utils.book_new();
const wsData = [
  ['#ERROR!', 'Jobcard Status', 'Service Advisor', 'Technician', 'SERVICE TYPE 1', 'PM KIT NAME', 'Parts Type'],
  ['Network Type', 'Network Code', 'Network Name', 'Customer Name', 'Customer Mobile', 'Account Name', 'Account Mobile', 'GSTIN(Account)', 'Part Category', 'Part Number', 'Part Description', 'QTY Shipped', 'Basic Price', 'Total Discount', 'Taxable Amount', 'Total Tax', 'Line Item Invoice Amount', 'Invoice Number', 'Reference No', 'Job Card Number', 'Job Card Close Date', 'Billing Type', 'Service Type', 'Frame Number', 'Current KM', 'Vehicle Sale date', 'Model Name', 'Model Variant', '', 'Service Advisor', 'Assigned Technician', 'Service Type', '#N/A', '#N/A'],
  ['TypeA', 'C001', 'NetName', 'John Doe', '1234567890', 'AccName', '0987654321', 'GST123', 'Oil', 'P001', 'Oil filter', '1', '100', '0', '100', '18', '118', 'INV001', 'REF001', 'JC-12345', '2026-05-18', 'Paid', 'General', 'FRM001', '1000', '2025-01-01', 'ModelX', 'VariantY', '', 'AdvA', 'TechA', 'General', '', '']
];
const ws = XLSX.utils.aoa_to_sheet(wsData);
XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
console.log("DEFAULT sheet_to_json output for row 0:");
console.log(rows[0]);
console.log("DEFAULT sheet_to_json output for row 1:");
console.log(rows[1]);

// Let's write a dynamic header finder
const allRowsAoa = XLSX.utils.sheet_to_json(ws, { header: 1 });
let headerRowIdx = 0;
for (let i = 0; i < Math.min(10, allRowsAoa.length); i++) {
  const rowObj = allRowsAoa[i];
  if (rowObj && rowObj.includes('Job Card Number')) {
    headerRowIdx = i;
    break;
  }
}
console.log("\nFOUND HEADER ROW AT:", headerRowIdx);

const rowsFixed = XLSX.utils.sheet_to_json(ws, { defval: '', range: headerRowIdx });
console.log("\nFIXED sheet_to_json output for first data row:");
console.log(rowsFixed[0]);

