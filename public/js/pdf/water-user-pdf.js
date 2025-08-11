export async function generateWaterUserPDF(user, options = {}) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "A4" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  // Top Right: NWRB-MED-16-r0, Control No., Date
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const rightX = pageWidth - margin;

  doc.setFont(undefined, "bold");
  doc.text("NWRB-MED-16-r0", rightX, 15, { align: "right" });

  doc.setFont(undefined, "normal");
  doc.text("Control No.:", rightX - 40, 20);
  doc.text("__________________", rightX - 5, 20, { align: "right" });

  doc.text("Date:", rightX - 40, 25);
  doc.text("__________________", rightX - 5, 25, { align: "right" });

  // Center-aligned header
  const center = pageWidth / 2;
  let y = 35;

  doc.text("Republic of the Philippines", center, y, { align: "center" });
  y += 4;
  doc.text("NATIONAL WATER RESOURCES BOARD", center, y, { align: "center" });
  y += 4;
  doc.text("8th Floor N.I.A. Building, E.D.S.A., Quezon City", center, y, { align: "center" });
  y += 4;
  doc.text("Tel. No. 920-26-54", center, y, { align: "center" });

  y += 6;
  doc.text("MONITORING AND ENFORCEMENT DIVISION", center, y, { align: "center" });

  y += 6;
  doc.setFont(undefined, "bold");
  doc.text("SITE VERIFICATION REPORT", center, y, { align: "center" });

  doc.setFont(undefined, "normal");

  const lineSpacing = 5;
  const pad = 20;
  y += 8;

const lines = [
  [`OWNER:`, user.owner],
  [`MAILING ADDRESS:`, `${user.street} ${user.barangay}, ${user.city}`],
  [`LOCATION OF WATER SOURCE:`, `${user.street} ${user.barangay}, ${user.city}`],
  [
    `GPS COORDINATES:`,
    `LATITUDE: ${Number(user.latitude).toFixed(5)} LONGITUDE: ${Number(user.longitude).toFixed(5)}`
  ],
  [`SOURCE OF WATER:`, user.type || "N/A"],
  [`REMARKS:`, user.remarks || "N/A"],
];

lines.forEach(([label, value], index) => {
  // Special handling for GPS COORDINATES line
  if (label === "GPS COORDINATES:") {
    doc.text(label, pad, y);

    // LATITUDE centered
    const latLabel = "LATITUDE: ";
    const latValue = user.latitude ? Number(user.latitude).toFixed(5) : "N/A";
    const latLabelWidth = doc.getTextWidth(latLabel);
    const latValueWidth = doc.getTextWidth(latValue);
    const latX = (pageWidth - (latLabelWidth + latValueWidth)) / 2;

    doc.text(latLabel, latX, y);
    doc.text(latValue, latX + latLabelWidth, y);
    doc.line(latX + latLabelWidth, y + 1, latX + latLabelWidth + latValueWidth, y + 1);

    // LONGITUDE right-aligned
    const longLabel = "LONGITUDE: ";
    const longValue = user.longitude ? Number(user.longitude).toFixed(5) : "N/A";
    const longLabelWidth = doc.getTextWidth(longLabel);
    const longValueWidth = doc.getTextWidth(longValue);
    const longX = pageWidth - pad - (longLabelWidth + longValueWidth);

    doc.text(longLabel, longX, y);
    doc.text(longValue, longX + longLabelWidth, y);
    doc.line(longX + longLabelWidth, y + 1, longX + longLabelWidth + longValueWidth, y + 1);

    y += lineSpacing;
    return;
  }

  // Default rendering
  doc.text(label, pad, y);

  const labelWidth = doc.getTextWidth(label) + 2;
  const valueX = pad + labelWidth;
  const valueWidth = doc.getTextWidth(value);
  const underlineY = y + 1;

  // Dynamic full-width underline logic
  let lineEndX;
  if (
    label === "OWNER:" ||
    label === "LOCATION OF WATER SOURCE:" ||
    label === "REMARKS:"
  ) {
    lineEndX = pageWidth - pad;
  } else {
    lineEndX = valueX + valueWidth;
  }

  doc.text(value, valueX, y);
  doc.line(valueX, underlineY, lineEndX, underlineY);

  // MAILING ADDRESS: => TEL. NO./CELL. NO.
  if (label === "MAILING ADDRESS:") {
    const telLabel = "TEL. NO./CELL. NO.: ";
    const telUnderlineWidth = 40;
    const telLabelWidth = doc.getTextWidth(telLabel);
    const telTotalWidth = telLabelWidth + telUnderlineWidth;
    const telX = pageWidth - pad - telTotalWidth;

    doc.text(telLabel, telX, y);
    doc.line(telX + telLabelWidth, underlineY, telX + telLabelWidth + telUnderlineWidth, underlineY);
  }

  // SOURCE OF WATER: => NO. OF SOURCES and PURPOSE
  if (label === "SOURCE OF WATER:") {
    const noOfSourcesLabel = "NO. OF SOURCES:";
    const noOfSourcesValue = "________"; // fixed-width underline
    const noOfSourcesText = `${noOfSourcesLabel} ${noOfSourcesValue}`;
    const noOfSourcesWidth = doc.getTextWidth(noOfSourcesText);

    const purposeLabel = "PURPOSE:";
    const purposeValue = user.purpose || "N/A";
    const purposeLabelWidth = doc.getTextWidth(purposeLabel);
    const purposeValueWidth = doc.getTextWidth(purposeValue);
    const spacingBetween = 10;
    const spacingAfterLabel = 2;

    // Total width of both parts
    const totalWidth =
      noOfSourcesWidth + spacingBetween + purposeLabelWidth + spacingAfterLabel + purposeValueWidth;

    const startX = pageWidth - pad - totalWidth;

    // Draw NO. OF SOURCES
    doc.text(noOfSourcesLabel, startX, y);
    const underlineStartX = startX + doc.getTextWidth(noOfSourcesLabel + " ");
    doc.text(noOfSourcesValue, underlineStartX, y);

    // Draw PURPOSE
    const purposeX = startX + noOfSourcesWidth + spacingBetween;
    doc.text(purposeLabel, purposeX, y);
    const purposeValueX = purposeX + purposeLabelWidth + spacingAfterLabel;
    doc.text(purposeValue, purposeValueX, y);

    // Underline the value of PURPOSE
    doc.line(
      purposeValueX,
      underlineY,
      purposeValueX + purposeValueWidth,
      underlineY
    );

    y += lineSpacing;

    // Determine checkbox states
    const status = (user.status || "").toUpperCase();
    const checked = "X";
    const empty = " ";

    // Default: Non-Operational is checked
    let proposed = `[ ${empty} ] Proposed`;
    let operational = `[ ${empty} ] Operational`;
    let ongoing = `[ ${empty} ] On-going Drilling/Construction`;
    let nonOperational = `[ ${checked} ] Non Operational`;

    // Override defaults if status matches
    if (status === "PROPOSED") {
      proposed = `[ ${checked} ] Proposed`;
      nonOperational = `[ ${empty} ] Non Operational`;
    } else if (status === "OPERATIONAL") {
      operational = `[ ${checked} ] Operational`;
      nonOperational = `[ ${empty} ] Non Operational`;
    } else if (status === "ON-GOING CONSTRUCTION") {
      ongoing = `[ ${checked} ] On-going Drilling/Construction`;
      nonOperational = `[ ${empty} ] Non Operational`;
    }

    // Combine the line
    const sourceStatusLine = `SOURCE STATUS:    ${proposed}   ${operational}     ${ongoing}   ${nonOperational}`;

    // Render on PDF
    doc.text(sourceStatusLine, pad, y);
    y += lineSpacing;

    // NAME OF WELL DRILLER line (indented)
    const drillerLabel = "    NAME OF WELL DRILLER (if applicable):";
    const drillerLabelWidth = doc.getTextWidth(drillerLabel);
    doc.text(drillerLabel, pad, y);
    doc.line(pad + drillerLabelWidth + 2, y + 1, pageWidth - pad, y + 1);
    y += lineSpacing;

    // MAILING ADDRESS line (indented)
    const addrLabel = "    MAILING ADDRESS:";
    const addrLabelWidth = doc.getTextWidth(addrLabel);
    doc.text(addrLabel, pad, y);
    doc.line(pad + addrLabelWidth + 2, y + 1, pageWidth - pad, y + 1);
  }

  // Extra lines after REMARKS
  if (label === "REMARKS:") {
    y += lineSpacing;
    doc.line(pad, y + 1, pageWidth - pad, y + 1);
    y += lineSpacing;
    doc.line(pad, y + 1, pageWidth - pad, y + 1);
  }

  y += lineSpacing;
});


  // Insert signature image if available
  if (user.signUrl) {
    const img = await loadImageAsDataURL(user.signUrl);
    if (img) {
      const imgWidth = 40;
      const imgHeight = 15;
      const imgX = pageWidth - pad - imgWidth;
      doc.addImage(img, "PNG", imgX, y, imgWidth, imgHeight);
      y += 18;
    }
  }

  // Line 1: VERIFIED BY (left) and REPRESENTATIVE (right)
  const verifiedByLabel = "VERIFIED BY: ";
  const verifiedLine = "_".repeat(40); // Adjust as needed
  const verifiedByText = verifiedByLabel + verifiedLine;
  doc.text(verifiedByText, pad, y);

  const repLabel = "Representative: ";
  const repValue = user.representative || "N/A";
  const repLabelWidth = doc.getTextWidth(repLabel);
  const repValueWidth = doc.getTextWidth(repValue);
  const repTotalWidth = repLabelWidth + repValueWidth;
  const repX = pageWidth - pad - repTotalWidth;

  doc.text(repLabel, repX, y);
  doc.text(repValue, repX + repLabelWidth, y);

  // Underline only the representative value
  const underlineY = y + 1;
  doc.line(
    repX + repLabelWidth,
    underlineY,
    repX + repLabelWidth + repValueWidth,
    underlineY
  );

  y += lineSpacing;

  // Line 2: Signature labels (aligned under their respective fields)
  const verifiedSignatureText = "Signature Over Printed Name";
  doc.text(verifiedSignatureText, pad + 25, y); // indent slightly under left side

  const repSignatureText = "Signature Over Printed Name";
  const repSignatureWidth = doc.getTextWidth(repSignatureText);
  const repSignatureX = pageWidth - pad - repSignatureWidth;
  doc.text(repSignatureText, repSignatureX, y);

  y += lineSpacing;

  // Line 3: Position (right-aligned with underline)
  const positionLabel = "Position: ";
  const positionValue = user.designation || "";
  const positionText = positionLabel + positionValue;
  const positionTextWidth = doc.getTextWidth(positionText);
  const positionX = pageWidth - pad - positionTextWidth;
  doc.text(positionText, positionX, y);

  // Draw underline for value only
  const labelWidth = doc.getTextWidth(positionLabel);
  const valueX = positionX + labelWidth;
  const valueWidth = doc.getTextWidth(positionValue);
  doc.line(valueX, y + 1, valueX + valueWidth, y + 1); // y+1 to place the underline below text

  y += lineSpacing;

  // Line 4: Mobile No. (right-aligned with underline)
  const mobileLabel = "Mobile No: ";
  const mobileValue = user.phone || "";
  const mobileText = mobileLabel + mobileValue;
  const mobileTextWidth = doc.getTextWidth(mobileText);
  const mobileX = pageWidth - pad - mobileTextWidth;
  doc.text(mobileText, mobileX, y);

  // Draw underline for value only
  const mobileLabelWidth = doc.getTextWidth(mobileLabel);
  const mobileValueX = mobileX + mobileLabelWidth;
  const mobileValueWidth = doc.getTextWidth(mobileValue);
  doc.line(mobileValueX, y + 1, mobileValueX + mobileValueWidth, y + 1);

  y += lineSpacing;

  // Final output
  if (options.returnBlob) {
    return doc.output("blob");
  } else {
    doc.save(`SiteVerification-${user.id || "unknown"}.pdf`);
  }
}

// Helper to load image from URL
async function loadImageAsDataURL(url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("Failed to load signature image:", e);
    return null;
  }
}
