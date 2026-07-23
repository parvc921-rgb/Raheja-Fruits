import ExcelJS from "exceljs";
import type { ProcurementRow } from "./procurement";

export async function exportProcurementToExcel(
  rows: ProcurementRow[],
  dateLabel: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Procurement");

  sheet.columns = [
    { header: "Fruit", key: "name", width: 24 },
    { header: "Unit", key: "unit", width: 10 },
    { header: "Total quantity", key: "totalQuantity", width: 16 },
    { header: "Orders", key: "orderCount", width: 10 },
  ];
  sheet.getRow(1).font = { bold: true };

  rows.forEach((row) => {
    sheet.addRow({
      name: row.name,
      unit: row.unit,
      totalQuantity: row.totalQuantity,
      orderCount: row.orderCount,
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `procurement-${dateLabel}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
