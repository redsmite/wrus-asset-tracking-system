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