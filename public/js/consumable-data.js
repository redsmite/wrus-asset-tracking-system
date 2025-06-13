import { db } from "./firebaseConfig.js";
import {
  collection,
  query,
  getDocs,
  updateDoc, 
  doc,
  orderBy,
  setDoc,
  where,
  serverTimestamp,
  addDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// ✅ Named export
export async function generateConsumableID() {
  const year = new Date().getFullYear();
  const prefix = `${year}-`;

  const q = query(
    collection(db, "consumable"),
    where("__name__", ">=", prefix),
    where("__name__", "<", `${year + 1}-`)
  );

  const snapshot = await getDocs(q);
  const count = snapshot.size + 1;

  const padded = String(count).padStart(3, "0");
  return `${year}-${padded}`;
}

// ✅ Named export
export async function addConsumable(spec, qty, unit, addedBy) {
  const id = await generateConsumableID();

  const newItem = {
    specification: spec,
    qty: Number(qty),
    unit,
    addedBy,
    timestamp: new Date()
  };

  const docRef = doc(db, "consumable", id);
  await setDoc(docRef, newItem);

  // Add entry to the ledger
  const ledgerEntry = {
    cid: id,
    modifiedBy: addedBy,
    amount: Number(qty),
    remarks: "Opening stock",
    action: "Add Stock",
    dateModified: new Date()
  };

  const ledgerRef = doc(collection(db, "ledger"));
  await setDoc(ledgerRef, ledgerEntry);

  return id;
}

export async function fetchConsumables() {
  const consumablesRef = collection(db, "consumable");
  const q = query(consumablesRef, orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);

  const items = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    items.push({
      id: doc.id, // CID
      specification: data.specification,
      qty: data.qty,
      unit: data.unit,
      addedBy: data.addedBy,
      timestamp: data.timestamp?.toDate().toLocaleString() || "N/A"
    });
  });

  return items;
}

export async function updateConsumable(cid, updatedData) {
  const docRef = doc(db, "consumable", cid);
  await updateDoc(docRef, updatedData);
}

// document.getElementById("confirmAddStockBtn").addEventListener("click", async () => {
//   const amount = parseInt(document.getElementById("stockAmount").value);
//   if (!amount || amount <= 0 || !selectedCID) return alert("Invalid amount.");

//   const consumableRef = doc(db, "consumables", selectedCID);
//   const snapshot = await getDoc(consumableRef);
//   if (!snapshot.exists()) return alert("Item not found.");

//   const newQty = (snapshot.data().qty || 0) + amount;
//   await updateDoc(consumableRef, { qty: newQty });

//   const year = new Date().getFullYear();
//   const ledgerRef = collection(db, "ledger");
//   await addDoc(ledgerRef, {
//     LID: `${year}-${Math.floor(100 + Math.random() * 900)}`, // Format: 2025-XXX
//     cid: selectedCID,
//     modifiedBy: localStorage.getItem("userFullName") || "Unknown",
//     dateModified: serverTimestamp(),
//     action: "Add Stock",
//     assignedTo: "",
//     amount: amount,
//   });

//   const modal = bootstrap.Modal.getInstance(document.getElementById("addStockModal"));
//   modal.hide();
//   renderConsumableTable();
// });

export async function addStock(cid, amount, remarks = "") {
  const consumableRef = doc(db, "consumable", cid);

  const snapshot = await getDoc(consumableRef);
  if (!snapshot.exists()) throw new Error("Item not found");

  const newQty = (snapshot.data().qty || 0) + amount;
  await updateDoc(consumableRef, { qty: newQty });

  const year = new Date().getFullYear();
  await addDoc(collection(db, "ledger"), {
    cid: cid,
    modifiedBy: localStorage.getItem("userFullName") || "Unknown",
    dateModified: serverTimestamp(),
    action: "Add Stock",
    assignedTo: "",
    amount: amount,
    remarks: remarks.trim(),  // ✅ store remarks
  });
}

export async function populateUserSelect() {
  const userSelect = document.getElementById("userSelect");
  if (!userSelect) return;

  userSelect.innerHTML = ''; // Clear existing options

  // Optional: add a disabled "Select user" placeholder
  const defaultOption = document.createElement("option");
  defaultOption.disabled = true;
  defaultOption.selected = true;
  defaultOption.textContent = 'Select user';
  userSelect.appendChild(defaultOption);

  // Fetch and append users with status 'active' from Firestore
  const usersSnapshot = await getDocs(collection(db, "users"));
  usersSnapshot.forEach(doc => {
    const user = doc.data();
    
    // Only include users with status 'active'
    if (user.status === 'active') {
      const fullName = `${user.lastName}, ${user.firstName} ${user.middleInitial}.`;
      const option = document.createElement("option");
      option.value = doc.id;
      option.textContent = fullName;
      userSelect.appendChild(option);
    }
  });
}

// assign button function
export async function handleAssignConsumable(selectedCID) {
  const qtyInput = document.getElementById("assignQty");
  const userSelect = document.getElementById("userSelect");
  const remarksInput = document.getElementById("assignRemarks");

  const assignQty = parseInt(qtyInput.value);
  const assignedTo = userSelect.value;
  const remarks = remarksInput.value.trim();

  if (!assignQty || assignQty < 1) {
    alert("Please enter a valid quantity.");
    return;
  }

  if (!assignedTo) {
    alert("Please select a user to assign to.");
    return;
  }

  try {
    const consumableRef = doc(db, "consumable", selectedCID);
    const consumableSnap = await getDoc(consumableRef);

    if (!consumableSnap.exists()) {
      alert("Consumable item not found.");
      return;
    }

    const currentData = consumableSnap.data();
    const availableQty = currentData.qty || 0;

    if (assignQty > availableQty) {
      alert(`Cannot assign more than available quantity (${availableQty}).`);
      return;
    }

    await addDoc(collection(db, "ledger"), {
      action: "Assign Item",
      amount: assignQty,
      assignedTo: assignedTo,
      cid: selectedCID,
      dateModified: serverTimestamp(),
      modifiedBy: localStorage.getItem("userFullName"),
      remarks: remarks  // ✅ Save remarks
    });

    await updateDoc(consumableRef, {
      qty: availableQty - assignQty
    });

    alert("Item assigned successfully.");
    const assignModal = bootstrap.Modal.getInstance(document.getElementById("assignModal"));
    assignModal.hide();

  } catch (error) {
    console.error("Error assigning item:", error);
    alert("An error occurred. Please try again.");
  }
}

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
  } catch (error) {
    specification = "Error fetching specification";
  }

  const formatDate = (dateObj) =>
    dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

  const today = formatDate(new Date());

  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.setFontSize(12);
  pdfDoc.text("Department of Environment and Natural Resources - National Capital Region", 32, 16);
  pdfDoc.text("Licenses, Patents, and Deeds Division", 32, 22);
  pdfDoc.text("Water Resources Utilization Section", 32, 28);

  pdfDoc.setFont("helvetica", "normal");
  pdfDoc.setFontSize(10);
  pdfDoc.text("Date:", 14, 36);
  let dateLabelWidth = pdfDoc.getTextWidth("Date:");
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text(today, 14 + dateLabelWidth + 2, 36);

  pdfDoc.setFont("helvetica", "normal");
  pdfDoc.text("Ledger Report for:", 14, 40);
  let titleLabelWidth = pdfDoc.getTextWidth("Ledger Report for:");
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text(specification, 14 + titleLabelWidth + 2, 40);

  pdfDoc.setFont("helvetica", "normal");
  pdfDoc.text("Total Quantity:", 14, 46);
  let qtyLabelWidth = pdfDoc.getTextWidth("Total Quantity:");
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text(String(totalQty), 14 + qtyLabelWidth + 2, 46);

  pdfDoc.setFont("helvetica", "normal");
  pdfDoc.text("Unit:", 14, 50);
  let unitLabelWidth = pdfDoc.getTextWidth("Unit:");
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text(unit, 14 + unitLabelWidth + 2, 50);

  let currentY = 56;

  const addStockEntries = ledgerEntries.filter(e => e.action === "Add Stock");
  if (addStockEntries.length > 0) {
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("Items Received", 14, currentY);
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
          data.cell.styles.textColor = [0, 128, 0]; // green
        }
      }
    });

    currentY = pdfDoc.lastAutoTable.finalY + 10;
  }

  const assignedEntries = ledgerEntries.filter(e => e.action !== "Add Stock");
  if (assignedEntries.length > 0) {
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("Items Assigned", 14, currentY);
    currentY += 6;

    const assignedTable = assignedEntries.map(entry => ([
      entry.dateModified ? formatDate(entry.dateModified.toDate()) : "—",
      entry.assignedTo || "—",
      entry.amount,
      entry.remarks || "—"
    ]));

    pdfDoc.autoTable({
      head: [["Date", "Assigned To", "Qty", "Remarks"]],
      body: assignedTable,
      startY: currentY,
      theme: 'grid',
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 2) {
          data.cell.styles.textColor = [220, 20, 60]; // red
        }
      }
    });

    currentY = pdfDoc.lastAutoTable.finalY + 10;
  }

  // Watermark
  const pageCount = pdfDoc.getNumberOfPages();
  const pageWidth = pdfDoc.internal.pageSize.getWidth();
  const pageHeight = pdfDoc.internal.pageSize.getHeight();
  const watermarkWidth = 100;
  const watermarkHeight = 100;
  const x = (pageWidth - watermarkWidth) / 2;
  const y = (pageHeight - watermarkHeight) / 2;

  for (let i = 1; i <= pageCount; i++) {
    pdfDoc.setPage(i);
    pdfDoc.saveGraphicsState();
    pdfDoc.setGState(new pdfDoc.GState({ opacity: 0.07 }));
    pdfDoc.addImage(logoData, 'PNG', x, y, watermarkWidth, watermarkHeight);
    pdfDoc.restoreGraphicsState();
  }

  const blob = pdfDoc.output("blob");

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    const saveConfirmed = window.confirm("Do you want to save this PDF?");
    if (saveConfirmed) {
      const now = new Date();
      const filename = `ledger-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}.pdf`;

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }
  } else {
    // On desktop: display the PDF in a new tab
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
  }

  return blob;
}

export async function renderLedgerTable(selectedCID) {
  const totalQtyDisplay = document.getElementById("totalQtyDisplay");

  try {
    // Fetch total quantity
    const consumableSnap = await getDoc(doc(db, "consumable", selectedCID));
    let totalQty = 0;
    if (consumableSnap.exists()) {
      totalQty = consumableSnap.data().qty ?? 0;
      totalQtyDisplay.textContent = totalQty;
    } else {
      totalQtyDisplay.textContent = "Not found";
    }

    // Fetch ledger entries
    const q = query(
      collection(db, "ledger"),
      where("cid", "==", selectedCID),
      orderBy("dateModified", "desc")
    );
    const ledgerSnapshot = await getDocs(q);

    const ledgerEntries = [];
    const userIds = new Set();

    ledgerSnapshot.forEach(doc => {
      const data = doc.data();
      ledgerEntries.push({ id: doc.id, ...data });
      if (data.assignedTo) userIds.add(data.assignedTo);
    });

    const userMap = {};
    await Promise.all(Array.from(userIds).map(async userId => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const u = userDoc.data();
          userMap[userId] = `${u.lastName}, ${u.firstName} ${u.middleInitial}.`;
        } else {
          userMap[userId] = "Unknown User";
        }
      } catch {
        userMap[userId] = "Error";
      }
    }));

    // Resolve user names
    const enrichedEntries = ledgerEntries.map(entry => ({
      ...entry,
      assignedTo: userMap[entry.assignedTo] || "—"
    }));

    return { totalQty, ledgerEntries: enrichedEntries };

  } catch (error) {
    console.error("Failed to load ledger or total qty:", error);
    totalQtyDisplay.textContent = "Error";
    return { totalQty: 0, ledgerEntries: [] };
  }
}

async function loadImageAsBase64(url) {
  const response = await fetch(url);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}