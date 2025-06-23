import { db } from "./firebaseConfig.js";
import { 
  collection, 
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

export async function fetchUsers() {
  const querySnapshot = await getDocs(collection(db, "users"));
  const users = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();

    // Skip if role is admin
    if (data.role && data.role.toLowerCase() === "admin") return;

    users.push({
      id: doc.id,
      lastName: data.lastName || '',
      firstName: data.firstName || '',
      middleInitial: data.middleInitial || '',
      type: data.type || ''
    });
  });

  return users;
}

export async function fetchConsumablesMap() {
  const snapshot = await getDocs(collection(db, "consumable"));
  const map = {};
  snapshot.forEach((doc) => {
    const d = doc.data();
    map[doc.id] = {
      specification: d.specification || "",
      unit: d.unit || "",
    };
  });
  return map;
}

// 3) Fetch all ledger entries where assignedTo === userId
export async function fetchLedgerByUser(userId) {
  const q = query(
    collection(db, "ledger"),
    where("assignedTo", "==", userId)
  );
  const snapshot = await getDocs(q);
  const entries = [];
  snapshot.forEach((doc) => {
    const d = doc.data();
    entries.push({
      cid: d.cid,                         
      amount: d.amount || 0,              
      dateModified: d.dateModified || null,
      remarks: d.remarks || '-'
    });
  });
  return entries;
} 

export async function generateConsumablePDF(user, entriesArray, consumablesMap) {
  const { jsPDF } = window.jspdf;

  const doc = new jsPDF();

  // Load logo
  const logoUrl = './images/denr logo.png';
  const loadImageAsBase64 = (url) =>
    fetch(url)
      .then((res) => res.blob())
      .then(
        (blob) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          })
      );

  const logoData = await loadImageAsBase64(logoUrl);

  const fullName = `${user.lastName}, ${user.firstName} ${user.middleInitial}.`;

  // Date formatter
  const formatDateForTable = (dateObj) =>
    dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "2-digit"
    });

  const now = new Date();
  const today = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  // Header and logo
  doc.addImage(logoData, "PNG", 14, 10, 15, 15);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Department of Environment and Natural Resources - National Capital Region", 32, 16);
  doc.text("Licenses, Patents, and Deeds Division", 32, 22);
  doc.text("Water Resources Utilization Section", 32, 28);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Date:", 14, 36);
  let dateLabelWidth = doc.getTextWidth("Date:");
  doc.setFont("helvetica", "bold");
  doc.text(today, 14 + dateLabelWidth + 2, 36);

  doc.setFont("helvetica", "normal");
  const labelText = "Consumable Item Ledger Report for:";
  doc.text(labelText, 14, 42);

  const titleLabelWidth = doc.getTextWidth(labelText);
  doc.setFont("helvetica", "bold");
  doc.text(fullName, 14 + titleLabelWidth + 2, 42);

  const tableBody = entriesArray.map(({ cid, amount, dateModified, remarks }) => {
    const spec = consumablesMap[cid]?.specification || "–";
    const unit = consumablesMap[cid]?.unit || "–";

    let formattedDate = "–";
    if (dateModified && typeof dateModified.toDate === "function") {
      formattedDate = formatDateForTable(dateModified.toDate());
    }

    return [
      formattedDate,
      spec,
      unit,
      amount,
      remarks
    ];
  });

  // Table with Remarks
  doc.autoTable({
    startY: 50,
    head: [["Date", "Specification", "UoM", "Qty", "Remarks"]],
    body: tableBody,
    styles: { font: "helvetica", fontSize: 10 },
  });

  // Watermark
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const watermarkWidth = 100;
  const watermarkHeight = 100;
  const x = (pageWidth - watermarkWidth) / 2;
  const y = (pageHeight - watermarkHeight) / 2;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.07 }));
    doc.addImage(logoData, 'PNG', x, y, watermarkWidth, watermarkHeight);
    doc.restoreGraphicsState();
  }

  // Ask to save on mobile, or show modal on desktop
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  const filename = `consumable-report-${now.toISOString().slice(0, 19).replace(/[:T]/g, "-")}.pdf`;

  if (isMobile) {
    const confirmSave = window.confirm("Do you want to save this report as a PDF?");
    if (confirmSave) {
      doc.save(filename);
    }
  } else {
    // Show PDF in modal on desktop
    const blob = doc.output("blob");
    const blobUrl = URL.createObjectURL(blob);
    const modalBody = document.querySelector("#consumableModal .modal-body");
    modalBody.innerHTML = `<embed src="${blobUrl}" type="application/pdf" width="100%" height="600px" />`;
  }
}

export async function getICSDataByUserId(userId) {
  const querySnapshot = await getDocs(
    query(collection(db, "ICS"), where("assignedTo", "==", userId))
  );

  const items = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    items.push({
      qty: data.qty || 0,
      unit: data.unit || "",
      description: data.description || "",
      serialNo: data.serialNo || "",
      unitCost: parseFloat(data.unitCost) || 0,
      totalCost: parseFloat(data.totalCost) || 0,
      ICSno: data.ICSno || "",
      dateIssued: data.dateIssued || "",
      remarks: data.remarks || "",
      attachmentURL: data.attachmentURL || "",
      status: data.status || ""  // ✅ Include status field
    });
  });

  return items;
}

export async function generatePdfICS(userId) {
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait" }); // Portrait mode

    if (typeof doc.autoTable !== "function") {
      throw new Error("autoTable plugin not loaded.");
    }

    const logoUrl = './images/denr logo.png';
    const loadImageAsBase64 = (url) =>
      fetch(url)
        .then(res => res.blob())
        .then(blob => new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        }));

    const logoData = await loadImageAsBase64(logoUrl);

    // Fetch user info
    const users = await fetchUsers();
    const user = users.find(u => u.id === userId);
    const fullName = user
      ? `${user.lastName}, ${user.firstName} ${user.middleInitial}.`
      : "";
    const label = "Property Accountability of ";
    const fullText = `${label}${fullName}`;

    // Fetch ICS data
    const allItems = await getICSDataByUserId(userId);
    const icsItems = allItems.filter(item => item.status !== 'RTS');

    const now = new Date();
    const today = now.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    // Header
    doc.addImage(logoData, "PNG", 14, 8, 15, 15);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Department of Environment and Natural Resources - National Capital Region", 32, 14);
    doc.text("Licenses, Patents, and Deeds Division", 32, 20);
    doc.text("Water Resources Utilization Section", 32, 26);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Date:", 14, 36);
    const dateLabelWidth = doc.getTextWidth("Date:");
    doc.setFont("helvetica", "bold");
    doc.text(today, 14 + dateLabelWidth + 2, 36);

    // Custom Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10); // Smaller font
    const fullTextWidth = doc.getTextWidth(fullText);
    const centerX = doc.internal.pageSize.getWidth() / 2;
    const startX = centerX - (fullTextWidth / 2);
    doc.text(fullText, startX, 45);

    // Table
    const headers = [
      "Qty", "Unit", "Description", "Serial No.",
      "Unit Cost", "Total Cost", "ICS No", "Date Issued", "Remarks"
    ];

    const rows = icsItems.map(item => [
      item.qty,
      item.unit,
      item.description,
      item.serialNo,
      item.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      item.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      item.ICSno,
      typeof item.dateIssued?.toDate === "function"
        ? item.dateIssued.toDate().toLocaleDateString("en-US", {
            year: "numeric", month: "short", day: "2-digit"
          })
        : item.dateIssued || "–",
      item.remarks || ""
    ]);

    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 50,
      styles: {
        font: "helvetica",
        fontSize: 7, // smaller font size
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        cellPadding: { top: 1, bottom: 1, left: 2, right: 2 } // reduced padding
      },
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: 0
      },
      tableLineColor: [0, 0, 0],
      tableLineWidth: 0.1
    });


    // Total Amount
    const totalAmount = icsItems.reduce((sum, item) => sum + item.totalCost, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9); // Smaller font
    const totalAmountText = `Total Amount PHP: ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    doc.text(totalAmountText, 14, doc.lastAutoTable.finalY + 10); // Left-aligned

    // Watermark
    const pageCount = doc.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const watermarkWidth = 60;
    const watermarkHeight = 60;
    const x = (pageWidth - watermarkWidth) / 2;
    const y = (pageHeight - watermarkHeight) / 2;

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.07 }));
      doc.addImage(logoData, 'PNG', x, y, watermarkWidth, watermarkHeight);
      doc.restoreGraphicsState();
    }

    const filename = `ics-report-${now.toISOString().slice(0, 19).replace(/[:T]/g, "-")}.pdf`;

    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    if (isMobile) {
      const confirmSave = window.confirm("Do you want to save this ICS report as a PDF?");
      if (confirmSave) {
        doc.save(filename);
      }
    } else {
      const blob = doc.output("blob");
      const blobUrl = URL.createObjectURL(blob);
      const modalBody = document.querySelector("#ICS-pdfModal .modal-body");
      modalBody.innerHTML = `<embed src="${blobUrl}" type="application/pdf" width="100%" height="600px" />`;

      const modal = new bootstrap.Modal(document.getElementById("ICS-pdfModal"));
      modal.show();
    }

  } catch (err) {
    console.error("Failed to generate ICS PDF:", err);
    alert("Failed to generate PDF. Please try again.");
  }
}



