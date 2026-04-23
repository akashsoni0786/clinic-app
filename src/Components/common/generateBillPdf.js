import jsPDF from "jspdf";

export const generateBillPdf = (patient, billDetails, clinicName) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // ── Header ──────────────────────────────────────────
  doc.setFillColor(14, 116, 144);
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(clinicName || "Medryon Clinic", 14, 12);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Patient Bill / Invoice", 14, 22);
  doc.text(`Invoice: ${billDetails.billNumber}`, pageWidth - 14, 12, { align: "right" });
  doc.text(`Date: ${new Date(billDetails.billGeneratedAt).toLocaleDateString("en-IN")}`, pageWidth - 14, 22, { align: "right" });

  // ── Patient Info ─────────────────────────────────────
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Patient Details", 14, 40);

  doc.setDrawColor(200, 200, 200);
  doc.line(14, 42, pageWidth - 14, 42);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const col1 = 14;
  const col2 = 110;
  let y = 50;

  const addRow = (label, value, x, currentY) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, x, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(String(value || "N/A"), x + 30, currentY);
  };

  addRow("Name", patient.name, col1, y);
  addRow("Gender", patient.gender, col2, y);
  y += 8;
  addRow("Age", patient.patient_age ? `${patient.patient_age} yrs` : "N/A", col1, y);
  addRow("Contact", patient.contact_no ? `+91 ${patient.contact_no}` : "N/A", col2, y);
  y += 8;
  addRow("Location", patient.location, col1, y);
  y += 8;
  // addRow("Disease", patient.desease, col1, y);
  // y += 8;

  doc.setFont("helvetica", "bold");
  doc.text("Symptoms:", col1, y);
  doc.setFont("helvetica", "normal");
  const sympLines = doc.splitTextToSize(patient.symptoms || "N/A", pageWidth - col1 - 40);
  doc.text(sympLines, col1 + 30, y);
  y += sympLines.length * 6 + 2;

  // doc.setFont("helvetica", "bold");
  // doc.text("Medicines:", col1, y);
  // doc.setFont("helvetica", "normal");
  // const medLines = doc.splitTextToSize(patient.medicines || "N/A", pageWidth - col1 - 40);
  // doc.text(medLines, col1 + 30, y);
  // y += medLines.length * 6 + 2;

  // if (patient.pathology_report) {
  //   doc.setFont("helvetica", "bold");
  //   doc.text("Pathology:", col1, y);
  //   doc.setFont("helvetica", "normal");
  //   const pathLines = doc.splitTextToSize(patient.pathology_report, pageWidth - col1 - 40);
  //   doc.text(pathLines, col1 + 30, y);
  //   y += pathLines.length * 6 + 2;
  // }

  y += 6;

  // ── Billing Summary Table ─────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text("Billing Summary", 14, y);
  doc.line(14, y + 2, pageWidth - 14, y + 2);
  y += 10;

  // Column X positions
  const colDesc = 18;
  const colQty  = 100;
  const colRate = 135;
  const colAmt  = pageWidth - 14;
  const tableLeft  = 14;
  const tableRight = pageWidth - 14;
  const rowH = 10;

  // ── Table Header ──────────────────────────────────────
  doc.setFillColor(241, 245, 249);
  doc.rect(tableLeft, y - 6, tableRight - tableLeft, rowH, "F");

  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.setFont("helvetica", "bold");
  doc.text("Description",  colDesc, y);
  doc.text("Qty",          colQty,  y, { align: "center" });
  doc.text("Rate",         colRate, y, { align: "center" });
  doc.text("Amount",       colAmt,  y, { align: "right" });

  y += 4;
  doc.setDrawColor(220, 220, 220);
  doc.line(tableLeft, y, tableRight, y);
  y += 7;

  // ── Helper: draw one row ──────────────────────────────
  const drawRow = (description, qty, rate, amount) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    doc.text(String(description),      colDesc, y);
    doc.text(String(qty),              colQty,  y, { align: "center" });
    doc.text(`Rs. ${rate}`,            colRate, y, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text(`Rs. ${amount}`,          colAmt,  y, { align: "right" });

    y += 4;
    doc.setDrawColor(235, 235, 235);
    doc.line(tableLeft, y, tableRight, y);
    y += 7;
  };

  // ── Row 1: Consultation Fee ───────────────────────────
  const consultFee = Number(billDetails.billTotal || 0);
  drawRow("Consultation Fee", "-", consultFee, consultFee);

  // ── Other Charges rows ────────────────────────────────
  // billDetails.otherCharges = [{ description, quantity, singleprice }]
  const otherCharges = billDetails.otherCharges || [];
  otherCharges.forEach((charge) => {
    const qty    = Number(charge.quantity   || 0);
    const rate   = Number(charge.singleprice || 0);
    const total  = qty * rate;
    drawRow(charge.description || "-", qty, rate, total);
  });

  // ── Grand Total ───────────────────────────────────────
  const grandTotal =
    consultFee +
    otherCharges.reduce(
      (sum, c) => sum + Number(c.quantity || 0) * Number(c.singleprice || 0),
      0
    );

  y += 2;
  doc.setFillColor(15, 23, 42);
  doc.rect(pageWidth - 84, y - 7, 70, 13, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Total: Rs. ${grandTotal}`, pageWidth - 18, y + 1, { align: "right" });

  y += 20;

  // ── Footer ───────────────────────────────────────────
  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.text(
    `Thank you for visiting ${clinicName || "Medryon Clinic"}. Please contact us for any follow-up.`,
    pageWidth / 2, y, { align: "center" }
  );
  doc.line(14, y + 4, pageWidth - 14, y + 4);
  y += 10;
  doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, pageWidth / 2, y, { align: "center" });

  return doc;
};