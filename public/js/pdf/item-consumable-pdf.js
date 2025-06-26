import { db } from "../firebaseConfig.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

export async function generateLedgerPDFBlob(selectedCID, ledgerEntries, totalQty) {
  const { jsPDF } = window.jspdf;
  const pdfDoc = new jsPDF();
  const logoUrl = './images/denr logo.png';

  const loadImageAsBase64 = (url) =>
    fetch(url)
      .then(res => res.blob())
      .then(blob =>
        new Promise(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        })
      );

  const logoData = await loadImageAsBase64(logoUrl);

  // Header logo
  pdfDoc.addImage(logoData, 'PNG', 14, 10, 15, 15);

  let specification = "Not Found";
  let unit = "—";

  try {
    const docRef = doc(db, "consumable", selectedCID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      specification = data.specification || "N/A";
      unit = data.unit || "—";
    }
  } catch {
    specification = "Error fetching specification";
  }

  const formatDate = (dateObj) =>
    dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

  const today = formatDate(new Date());

  // Header text
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.setFontSize(12);
  pdfDoc.text("Department of Environment and Natural Resources - NCR", 32, 16);
  pdfDoc.text("Licenses, Patents, and Deeds Division", 32, 22);
  pdfDoc.text("Water Resources Utilization Section", 32, 28);

  // Details
  pdfDoc.setFont("helvetica", "normal");
  pdfDoc.setFontSize(10);

  const addLabel = (label, value, y) => {
    pdfDoc.setFont("helvetica", "normal");
    pdfDoc.text(label, 14, y);
    const labelWidth = pdfDoc.getTextWidth(label);
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text(value, 14 + labelWidth + 2, y);
  };

  addLabel("Date:", today, 36);
  addLabel("Ledger Report for:", specification, 40);
  addLabel("Stocks Left:", String(totalQty), 46);
  addLabel("Unit of Measurement:", unit, 50);

  let currentY = 56;

  // Filter for Add Stock entries
  const addStockEntries = ledgerEntries.filter(e => e.action === "Add Stock");
  if (addStockEntries.length > 0) {
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("Add to Stock", 14, currentY);
    currentY += 6;

    const inventoryTable = addStockEntries.map(entry => ([
      entry.dateModified ? formatDate(entry.dateModified.toDate()) : "—",
      entry.amount,
      entry.remarks || "—"
    ]));

    pdfDoc.autoTable({
      head: [["Date", "Qty", "Remarks"]],
      body: inventoryTable,
      startY: currentY,
      theme: 'grid',
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 1) {
          data.cell.styles.textColor = [0, 128, 0]; // green for qty
        }
      }
    });

    currentY = pdfDoc.lastAutoTable.finalY + 10;
  }

  // Filter for Assign Item entries
  const assignEntries = ledgerEntries.filter(e => e.action === "Assign Item");
  if (assignEntries.length > 0) {
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("Assigned Items", 14, currentY);
    currentY += 6;

    const assignTable = assignEntries.map(entry => ([
      entry.dateModified ? formatDate(entry.dateModified.toDate()) : "—",
      entry.amount,
      entry.assignedTo || "—",
      entry.remarks || "—"
    ]));

    pdfDoc.autoTable({
      head: [["Date", "Qty", "Assigned To", "Remarks"]],
      body: assignTable,
      startY: currentY,
      theme: 'grid',
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 1) {
          data.cell.styles.textColor = [220, 20, 60]; // crimson for qty
        }
      }
    });
  }

  return pdfDoc.output("blob");
}
