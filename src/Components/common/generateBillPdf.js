import jsPDF from "jspdf";

export const generateBillPdf = (patient, billDetails, clinicName) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // ── Header ──────────────────────────────────────────
  doc.setFillColor(14, 116, 144); // sky-700
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(clinicName || "Medryon Clinic", 14, 12);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Patient Bill / Invoice", 14, 22);

  // Bill number right align
  doc.text(`Invoice: ${billDetails.billNumber}`, pageWidth - 14, 12, { align: "right" });
  doc.text(
    `Date: ${new Date(billDetails.billGeneratedAt).toLocaleDateString("en-IN")}`,
    pageWidth - 14,
    22,
    { align: "right" }
  );

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
  addRow("Disease", patient.desease, col1, y);
  y += 8;

  // Symptoms — wrap long text
  doc.setFont("helvetica", "bold");
  doc.text("Symptoms:", col1, y);
  doc.setFont("helvetica", "normal");
  const sympLines = doc.splitTextToSize(patient.symptoms || "N/A", pageWidth - col1 - 40);
  doc.text(sympLines, col1 + 30, y);
  y += sympLines.length * 6 + 2;

  // Medicines
  doc.setFont("helvetica", "bold");
  doc.text("Medicines:", col1, y);
  doc.setFont("helvetica", "normal");
  const medLines = doc.splitTextToSize(patient.medicines || "N/A", pageWidth - col1 - 40);
  doc.text(medLines, col1 + 30, y);
  y += medLines.length * 6 + 2;

  // Pathology
  if (patient.pathology_report) {
    doc.setFont("helvetica", "bold");
    doc.text("Pathology:", col1, y);
    doc.setFont("helvetica", "normal");
    const pathLines = doc.splitTextToSize(patient.pathology_report, pageWidth - col1 - 40);
    doc.text(pathLines, col1 + 30, y);
    y += pathLines.length * 6 + 2;
  }

  y += 6;

  // ── Fee Table ─────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Billing Summary", 14, y);
  doc.line(14, y + 2, pageWidth - 14, y + 2);
  y += 10;

  // Table header
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(14, y - 5, pageWidth - 28, 10, "F");

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("Description", 18, y);
  doc.text("Qty", pageWidth - 60, y, { align: "center" });
  doc.text("Amount", pageWidth - 18, y, { align: "right" });

  y += 8;
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "normal");
  doc.text("Consultation Fee", 18, y);
  doc.text("1", pageWidth - 60, y, { align: "center" });
  doc.text(`Rs. ${Number(billDetails.billTotal || 0)}`, pageWidth - 18, y, { align: "right" });

  y += 6;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y, pageWidth - 14, y);
  y += 8;

  // Grand Total
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(pageWidth - 80, y - 6, 66, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Total: Rs. ${Number(billDetails.billTotal || 0)}`, pageWidth - 18, y + 3, {
    align: "right",
  });

  y += 20;

  // ── Footer ───────────────────────────────────────────
  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.text(
    `Thank you for visiting ${clinicName || "Medryon Clinic"}. Please contact us for any follow-up.`,
    pageWidth / 2,
    y,
    { align: "center" }
  );

  doc.line(14, y + 4, pageWidth - 14, y + 4);
  y += 10;
  doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, pageWidth / 2, y, {
    align: "center",
  });

  return doc;
};