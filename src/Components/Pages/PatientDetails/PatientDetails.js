import React, { useEffect, useState } from "react";
import { contxtname } from "../../../Context/appcontext";
import MedicineField from "../../common/MedicineField";
import homeopathySymptoms from "../../../data/homeopathySymptoms";
import { useLocation } from "react-router-dom";
import jsPDF from "jspdf";
import { Trash } from "feather-icons-react";

const PatientDetails = () => {
  const contxt = React.useContext(contxtname);
  const location = useLocation();
  const [patientData, setPatientData] = useState([]);
  const [editIndex, setEditIndex] = useState("");
  const [activeEdit, setActiveEdit] = useState(false);
  const [activeDel, setActiveDel] = useState(false);
  const [activeAdd, setActiveAdd] = useState(false);
  const [clinicName, setClinicName] = useState("Medryon Clinic");
  const [billPreview, setBillPreview] = useState(null);
  const [otherCharges, setOtherCharges] = useState([]);

  const [patientInfo, setPatientInfo] = useState({
    name: location.state.rowdata.name,
    contact_no: location.state.rowdata.contact_no,
    location: location.state.rowdata.location,
    gender: location.state.rowdata.gender,
    patient_age: location.state.rowdata.patient_age,
  });

  const [activeEditDetails, setActiveEditDetails] = useState(false);
  const [editedPatientDetails, setEditedPatientDetails] = useState({
    name: "", contact_no: "", location: "", gender: "", patient_age: "",
  });
  const [editedPatientDetailsError, setEditedPatientDetailsError] = useState({
    name: false, nameErr: "",
    contact_no: false, contact_noErr: "",
    location: false, locationErr: "",
    gender: false, genderErr: "",
  });

  // ✅ otherCharges bhi state mein
  const [editedData, setEditedData] = useState({
    date: "", symptoms: "", medicines: "", pathology_report: "", fee: "",
    otherCharges: [],
  });

  const [editedDataError, setEditedDataError] = useState({
    date: "", dateErr: false,
    symptoms: "", symptomsErr: false,
    medicines: "", medicinesErr: false,
  });

  // ── Clinic name fetch ──────────────────────────────────
  useEffect(() => {
    const fetchClinicName = async () => {
      try {
        const result = await window.api.invoke("settings:getClinicConfig", contxt.loggedIn.token);
        if (!result?.error && result?.clinicName) setClinicName(result.clinicName);
      } catch (e) { console.error("Unable to load clinic name:", e); }
    };
    fetchClinicName();
  }, [contxt.loggedIn.token]);

  // ── otherCharges handlers ──────────────────────────────
  const handleAddCharge = () => {
    const updated = [...otherCharges, { description: "", quantity: "", singleprice: "" }];
    setOtherCharges(updated);
  };

  const handleOtherChargeChange = (index, field, value) => {
    if ((field === "quantity" || field === "singleprice") && !/^\d*$/.test(value)) return;
    const updated = [...otherCharges];
    updated[index][field] = value;
    setOtherCharges(updated);
  };

  const handleDeleteCharge = (index) => {
    setOtherCharges(otherCharges.filter((_, i) => i !== index));
  };

  // ── PDF Generator ──────────────────────────────────────
  const generateBillPdf = (patient, fee, date, medicines, symptoms, pathology, charges = []) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const billNumber = `BILL-${Date.now()}`;

    // Header
    doc.setFillColor(14, 116, 144);
    doc.rect(0, 0, pageWidth, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(clinicName || "Medryon Clinic", 14, 12);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Patient Bill / Invoice", 14, 22);
    doc.text(`Invoice: ${billNumber}`, pageWidth - 14, 12, { align: "right" });
    doc.text(`Date: ${new Date(date).toLocaleDateString("en-IN")}`, pageWidth - 14, 22, { align: "right" });

    // Patient Info
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Patient Details", 14, 40);
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 42, pageWidth - 14, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    const addInfoRow = (label, value, x, y) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, x, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(value || "N/A"), x + 32, y);
    };

    let y = 50;
    addInfoRow("Name", patient.name, 14, y);
    addInfoRow("Gender", patient.gender, 110, y); y += 8;
    addInfoRow("Age", patient.patient_age ? `${patient.patient_age} yrs` : "N/A", 14, y);
    addInfoRow("Contact", patient.contact_no ? `+91 ${patient.contact_no}` : "N/A", 110, y); y += 8;
    addInfoRow("Location", patient.location, 14, y); y += 8;

    doc.setFont("helvetica", "bold");
    doc.text("Symptoms:", 14, y);
    doc.setFont("helvetica", "normal");
    const sympLines = doc.splitTextToSize(symptoms || "N/A", pageWidth - 60);
    doc.text(sympLines, 46, y);
    y += sympLines.length * 6 + 2;

    doc.setFont("helvetica", "bold");
    doc.text("Medicines:", 14, y);
    doc.setFont("helvetica", "normal");
    const medLines = doc.splitTextToSize(medicines || "N/A", pageWidth - 60);
    doc.text(medLines, 46, y);
    y += medLines.length * 6 + 2;

    if (pathology) {
      doc.setFont("helvetica", "bold");
      doc.text("Pathology:", 14, y);
      doc.setFont("helvetica", "normal");
      const pathLines = doc.splitTextToSize(pathology, pageWidth - 60);
      doc.text(pathLines, 46, y);
      y += pathLines.length * 6 + 2;
    }

    y += 6;

    // Billing Summary Table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text("Billing Summary", 14, y);
    doc.line(14, y + 2, pageWidth - 14, y + 2);
    y += 10;

    const colDesc = 18;
    const colQty  = 100;
    const colRate = 140;
    const colAmt  = pageWidth - 14;
    const tableLeft  = 14;
    const tableRight = pageWidth - 14;

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(tableLeft, y - 6, tableRight - tableLeft, 10, "F");
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "bold");
    doc.text("Description", colDesc, y);
    doc.text("Qty",         colQty,  y, { align: "center" });
    doc.text("Rate",        colRate, y, { align: "center" });
    doc.text("Amount",      colAmt,  y, { align: "right" });

    y += 4;
    doc.setDrawColor(220, 220, 220);
    doc.line(tableLeft, y, tableRight, y);
    y += 7;

    const drawRow = (description, qty, rate, amount) => {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      doc.text(String(description), colDesc, y);
      doc.text(String(qty),         colQty,  y, { align: "center" });
      doc.text(`Rs. ${rate}`,       colRate, y, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.text(`Rs. ${amount}`,     colAmt,  y, { align: "right" });
      y += 4;
      doc.setDrawColor(235, 235, 235);
      doc.line(tableLeft, y, tableRight, y);
      y += 7;
    };

    const consultFee = Number(fee) || 0;
    drawRow("Consultation Fee", "-", consultFee, consultFee);

    charges.forEach((charge) => {
      const qty   = Number(charge.quantity    || 0);
      const rate  = Number(charge.singleprice || 0);
      const total = qty * rate;
      drawRow(charge.description || "-", qty, rate, total);
    });

    const grandTotal =
      consultFee +
      charges.reduce((sum, c) => sum + Number(c.quantity || 0) * Number(c.singleprice || 0), 0);

    y += 2;
    doc.setFillColor(15, 23, 42);
    doc.rect(pageWidth - 84, y - 7, 70, 13, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Total: Rs. ${grandTotal}`, pageWidth - 18, y + 1, { align: "right" });

    y += 20;

    // Footer
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text(
      `Thank you for visiting ${clinicName}. Please contact us for any follow-up.`,
      pageWidth / 2, y, { align: "center" }
    );
    doc.line(14, y + 4, pageWidth - 14, y + 4);
    y += 10;
    doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, pageWidth / 2, y, { align: "center" });

    return { doc, billNumber, grandTotal };
  };

  // ── Handle Generate Bill ───────────────────────────────
  const handleGenerateBill = () => {
    try {
      const { doc, billNumber, grandTotal } = generateBillPdf(
        patientInfo,
        editedData.fee,
        editedData.date,
        editedData.medicines,
        editedData.symptoms,
        editedData.pathology_report,
        otherCharges
      );
      const pdfBlob = doc.output("blob");
      const pdfUrl  = URL.createObjectURL(pdfBlob);
      setBillPreview({
        billNumber, pdfUrl, doc,
        fee: editedData.fee,
        grandTotal,
        otherCharges: [...otherCharges],
      });
      setActiveEdit(false);
      setActiveAdd(false);
    } catch (e) {
      console.error("Bill generation error:", e);
    }
  };
// ✅ Raw dateWiseData alag state mein store karo
const [rawDateWiseData, setRawDateWiseData] = useState(
  location.state.rowdata.dateWiseData || []
);
const handleEditClick = (originalIndex) => {
  // ✅ rawDateWiseData state se data lo — closure se nahi
  const data = rawDateWiseData[originalIndex];
  if (!data) return;

  const charges = data.otherCharges || [];
  setEditIndex(originalIndex);
  setOtherCharges([...charges]);
  setEditedData({
    date: data.todaydate || "",
    symptoms: data.daysymptoms || "",
    medicines: data.daymedicines || "",
    pathology_report: data.pathology_report || "",
    fee: data.fee || "",
    otherCharges: [...charges],
  });
  setActiveEdit(true); // ✅ sabse last mein open karo
};
  // ── Table Setup ────────────────────────────────────────
const setuppatientData = (allptntdata) => {
  setRawDateWiseData(allptntdata); // ✅ raw data save karo
  let temp = [];
  const reversed = [...allptntdata].reverse();

  reversed.forEach((data, visualIndex) => {
    const originalIndex = allptntdata.length - 1 - visualIndex; // ✅ correct index

    let symp = data.daysymptoms.replaceAll("\n", "<br/> &#x2022 ");
    let medi = data.daymedicines.replaceAll("\n", "<br/> &#x2022 ");
    let fee  = data.otherCharges?.length>0 ? data.otherCharges
    .reduce((sum, charge) => sum + Number(charge?.singleprice || 0) * Number(charge?.quantity || 0), 0)+Number(data.fee ? data.fee : 0)
    :(data.fee ? data.fee : "");

    temp.push([
      data.todaydate,
      <div key={`s-${visualIndex}`} dangerouslySetInnerHTML={{ __html: "&#x2022 " + symp }} />,
      <div key={`m-${visualIndex}`} dangerouslySetInnerHTML={{ __html: "&#x2022 " + medi }} />,
      <div key={`f-${visualIndex}`} dangerouslySetInnerHTML={{ __html: "₹ " + fee }} />,
      <div key={`a-${visualIndex}`} className="flex gap-2">
        <button
          type="button"
          className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200"
          // ✅ Sirf index pass karo — data closure pe depend nahi
          onClick={() => handleEditClick(originalIndex)}
        >
          Edit
        </button>
        <button
          type="button"
          className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm text-red-700 hover:bg-red-100"
          onClick={() => { setEditIndex(originalIndex); setActiveDel(true); }}
        >
          Delete
        </button>
      </div>,
    ]);
  });
  setPatientData(temp);
};

  useEffect(() => {
    setuppatientData(location.state.rowdata.dateWiseData);
  }, [location.state.rowdata]);

  // ── Field Handlers ─────────────────────────────────────
  const handleDateChange            = (v) => setEditedData({ ...editedData, date: v });
  const handleSymptomsChange        = (v) => setEditedData({ ...editedData, symptoms: v });
  const handlePathologyReportChange = (v) => setEditedData({ ...editedData, pathology_report: v });
  const handleMedicinesChange       = (v) => setEditedData({ ...editedData, medicines: v });
  const handleFeeChange = (v) => {
    if (/^\d*$/.test(v)) setEditedData({ ...editedData, fee: v });
  };
  const handlePatientNameChange     = (v) => setEditedPatientDetails({ ...editedPatientDetails, name: v });
  const handlePatientContactChange  = (v) => setEditedPatientDetails({ ...editedPatientDetails, contact_no: v.slice(0, 10) });
  const handlePatientLocationChange = (v) => setEditedPatientDetails({ ...editedPatientDetails, location: v });
  const handlePatientGenderChange   = (v) => setEditedPatientDetails({ ...editedPatientDetails, gender: v });
  const handlePatientAgeChange = (v) => {
    if (/^\d*$/.test(v)) setEditedPatientDetails({ ...editedPatientDetails, patient_age: v.slice(0, 3) });
  };

  // ── Submit Handlers ────────────────────────────────────
  const onSubmitEditedPatientDetails = async () => {
    let errors = { name: false, nameErr: "", contact_no: false, contact_noErr: "", location: false, locationErr: "", gender: false, genderErr: "" };
    Object.keys(editedPatientDetails).forEach((field) => {
      if (editedPatientDetails[field] === "")
        errors = { ...errors, [field]: true, [field + "Err"]: "Please enter here!" };
    });
    const hasError = Object.keys(editedPatientDetails).some((field) => errors[field]);
    if (!hasError) {
      try {
        const token = contxt.loggedIn.token;
        const updatedData = { ...location.state.rowdata, ...editedPatientDetails };
        await window.api.invoke("patients:update", token, location.state.rowdata.id, updatedData);
        const alldata = await window.api.invoke("patients:getAll", token);
        contxt.setPatientList(alldata);
        setPatientInfo({ ...editedPatientDetails });
        location.state.rowdata = { ...location.state.rowdata, ...editedPatientDetails };
        setActiveEditDetails(false);
      } catch (e) { console.log(e); }
    }
    setEditedPatientDetailsError(errors);
  };

const onSubmitEditedData = async () => {
  let errors = { date: "", dateErr: false, symptoms: "", symptomsErr: false, medicines: "", medicinesErr: false };
  Object.keys(editedData).forEach((key) => {
    if (key === "otherCharges") return;
    errors = editedData[key] === ""
      ? { ...errors, [key]: true, [key + "Err"]: "Please enter here!" }
      : { ...errors, [key]: false, [key + "Err"]: "" };
  });
  const noError = !Object.keys(editedData).some((key) => key !== "otherCharges" && errors[key]);

  let tempData = { ...location.state.rowdata };
  tempData.dateWiseData = [...location.state.rowdata.dateWiseData];
  tempData.dateWiseData[editIndex] = {
    todaydate: editedData.date,
    daysymptoms: editedData.symptoms,
    daymedicines: editedData.medicines,
    pathology_report: editedData.pathology_report,
    fee: editedData.fee,
    otherCharges: otherCharges,
  };

  if (noError) {
    try {
      const token = contxt.loggedIn.token;
      await window.api.invoke("patients:update", token, location.state.rowdata.id, tempData);
      const alldata = await window.api.invoke("patients:getAll", token);
      contxt.setPatientList(alldata);

      // ✅ location.state.rowdata update karo
      const freshPatient = alldata.find((p) => p.id === location.state.rowdata.id);
      if (freshPatient) location.state.rowdata = freshPatient;

      setuppatientData(freshPatient.dateWiseData);
      setActiveEdit(false);
      setEditIndex("");
      setEditedData({ date: "", symptoms: "", medicines: "", pathology_report: "", fee: "", otherCharges: [] });
      setOtherCharges([]);
    } catch (e) { console.log(e); }
  }
  setEditedDataError(errors);
};

 const onSubmitAddedData = async () => {
  let errors = { date: "", dateErr: false, symptoms: "", symptomsErr: false, medicines: "", medicinesErr: false };
  Object.keys(editedData).forEach((key) => {
    if (key === "otherCharges") return;
    errors = editedData[key] === ""
      ? { ...errors, [key]: true, [key + "Err"]: "Please enter here!" }
      : { ...errors, [key]: false, [key + "Err"]: "" };
  });
  const noError = !Object.keys(editedData).some((key) => key !== "otherCharges" && errors[key]);

  let tempData = { ...location.state.rowdata };
  tempData.dateWiseData = [
    {
      todaydate: editedData.date,
      daysymptoms: editedData.symptoms,
      daymedicines: editedData.medicines,
      pathology_report: editedData.pathology_report,
      fee: editedData.fee,
      otherCharges: otherCharges,
    },
    ...location.state.rowdata.dateWiseData,
  ];

  if (noError) {
    try {
      const token = contxt.loggedIn.token;
      await window.api.invoke("patients:update", token, location.state.rowdata.id, tempData);
      const alldata = await window.api.invoke("patients:getAll", token);
      contxt.setPatientList(alldata);

      // ✅ location.state.rowdata update karo
      const freshPatient = alldata.find((p) => p.id === location.state.rowdata.id);
      if (freshPatient) location.state.rowdata = freshPatient;

      setuppatientData(freshPatient.dateWiseData);
      setActiveAdd(false);
      setEditIndex("");
      setEditedData({ date: "", symptoms: "", medicines: "", pathology_report: "", fee: "", otherCharges: [] });
      setOtherCharges([]);
    } catch (e) { console.log(e); }
  }
  setEditedDataError(errors);
};

  const onDeleteData = async () => {
    let tempData = { ...location.state.rowdata };
    tempData.dateWiseData.splice(editIndex, 1);
    try {
      const token = contxt.loggedIn.token;
      await window.api.invoke("patients:update", token, location.state.rowdata.id, tempData);
      const alldata = await window.api.invoke("patients:getAll", token);
      contxt.setPatientList(alldata);
      setuppatientData(alldata.find((p) => p.id === location.state.rowdata.id).dateWiseData);
      setActiveDel(false);
      setEditIndex("");
    } catch (e) { console.log(e); }
  };

  // ── Other Charges Table UI ─────────────────────────────
  const renderOtherCharges = () => (
    <div className="mt-2 space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">Other Charges</label>
        <button
          type="button"
          onClick={handleAddCharge}
          className="rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-700"
        >
          + Add Charge
        </button>
      </div>
      {otherCharges.length > 0 && (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600">Description</th>
              <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600">Qty</th>
              <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600">Rate (₹)</th>
              <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600">Total (₹)</th>
              <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {otherCharges.map((charge, index) => (
              <tr key={index}>
                <td className="p-1">
                  <input
                    type="text"
                    value={charge.description}
                    onChange={(e) => handleOtherChargeChange(index, "description", e.target.value)}
                    className="w-full input-base"
                    placeholder="Injection, Syrup..."
                  />
                </td>
                <td className="p-1">
                  <input
                    type="text"
                    value={charge.quantity || ""}
                    onChange={(e) => handleOtherChargeChange(index, "quantity", e.target.value)}
                    className="w-full input-base"
                    placeholder="Qty"
                  />
                </td>
                <td className="p-1">
                  <input
                    type="text"
                    value={charge.singleprice}
                    onChange={(e) => handleOtherChargeChange(index, "singleprice", e.target.value)}
                    className="w-full input-base"
                    placeholder="₹"
                  />
                </td>
                <td className="p-1">
                  <input
                    type="text"
                    readOnly
                    value={Number(charge.singleprice || 0) * Number(charge.quantity || 0) || ""}
                    className="w-full input-base bg-slate-50 cursor-not-allowed"
                    placeholder="₹"
                  />
                </td>
                <td className="p-1">
                  <button
                    type="button"
                    onClick={() => handleDeleteCharge(index)}
                    className="rounded-full bg-red-600 p-2 text-white hover:bg-red-500"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  // ── Modal Form Fields ──────────────────────────────────
  const renderFormFields = () => (
    <div className="mt-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Date</label>
        <input type="date" value={editedData.date} onChange={(e) => handleDateChange(e.target.value)} className="input-base mt-2" />
        {editedDataError.dateErr && <p className="mt-1 text-sm text-red-600">{editedDataError.date}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Fee (₹)</label>
        <input type="text" value={editedData.fee} onChange={(e) => handleFeeChange(e.target.value)} className="input-base mt-2" placeholder="Consultation fee" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Pathology Report</label>
        <input type="text" value={editedData.pathology_report} onChange={(e) => handlePathologyReportChange(e.target.value)} className="input-base mt-2" />
      </div>
      <MedicineField
        label="Patient's symptoms"
        error={editedDataError.symptomsErr}
        value={editedData.symptoms}
        onChange={handleSymptomsChange}
        data={homeopathySymptoms}
        customData={contxt.customSuggestions.symptoms}
        helpText={<span className="text-red-600">{editedDataError.symptoms}</span>}
      />
      <MedicineField
        label="Patient's medicines"
        value={editedData.medicines}
        error={editedDataError.medicinesErr}
        onChange={handleMedicinesChange}
        customData={contxt.customSuggestions.medicines}
        helpText={<span className="text-red-600">{editedDataError.medicines}</span>}
      />
      {/* ✅ Other Charges */}
      {renderOtherCharges()}
    </div>
  );

  // ── Bill Preview Modal ─────────────────────────────────
  const renderBillPreview = () => {
    const grandTotal = billPreview?.grandTotal || 0;
    const charges    = billPreview?.otherCharges || [];
    return (
      <div className="modal-overlay" style={{ zIndex: 600 }}>
        <div className="modal-panel max-w-3xl">
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Invoice</div>
                <h2 className="text-2xl font-bold text-slate-900">{clinicName}</h2>
              </div>
              <div className="space-y-1 text-right">
                <div className="text-sm text-slate-500">Invoice No.</div>
                <div className="text-lg font-semibold text-slate-900">{billPreview?.billNumber}</div>
                <div className="text-sm text-slate-500">Date Issued</div>
                <div className="text-sm font-medium text-slate-700">{new Date().toLocaleDateString("en-IN")}</div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm font-semibold text-slate-700">Billed To</div>
                <div className="mt-2 text-sm text-slate-600">{patientInfo.name}</div>
                <div className="text-sm text-slate-600">{patientInfo.contact_no ? `+91 ${patientInfo.contact_no}` : "Contact not set"}</div>
                <div className="text-sm text-slate-600">{patientInfo.location}</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-700">Patient Details</div>
                <div className="mt-2 text-sm text-slate-600">Age: {patientInfo.patient_age || "N/A"}</div>
                <div className="text-sm text-slate-600">Gender: {patientInfo.gender || "N/A"}</div>
              </div>
            </div>

            {/* ✅ Bill Table */}
            <div className="overflow-hidden rounded-3xl border border-slate-200">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-slate-100 text-left text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Rate</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  <tr>
                    <td className="px-4 py-3">Consultation Fee</td>
                    <td className="px-4 py-3">-</td>
                    <td className="px-4 py-3">₹{Number(billPreview?.fee || 0)}</td>
                    <td className="px-4 py-3 text-right font-semibold">₹{Number(billPreview?.fee || 0)}</td>
                  </tr>
                  {charges.map((charge, i) => {
                    const qty   = Number(charge.quantity    || 0);
                    const rate  = Number(charge.singleprice || 0);
                    const total = qty * rate;
                    return (
                      <tr key={i}>
                        <td className="px-4 py-3">{charge.description || "-"}</td>
                        <td className="px-4 py-3">{qty}</td>
                        <td className="px-4 py-3">₹{rate}</td>
                        <td className="px-4 py-3 text-right font-semibold">₹{total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
                <div className="font-semibold text-slate-700">Notes</div>
                <p className="mt-2">Thank you for visiting {clinicName}. Please contact us for any follow-up.</p>
              </div>
              <div className="rounded-3xl bg-slate-900 p-4 text-right text-white">
                <div className="text-sm text-slate-300">Grand Total</div>
                <div className="text-2xl font-bold">₹{grandTotal}</div>
              </div>
            </div>

            {billPreview?.pdfUrl && (
              <div className="mt-2 overflow-hidden rounded-3xl border border-slate-200">
                <embed src={billPreview.pdfUrl} type="application/pdf" width="100%" height="480px" />
              </div>
            )}

            <div className="mt-2 flex flex-wrap gap-3 justify-end">
              <button type="button" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setBillPreview(null)}>Close</button>
              <button type="button" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => window.open(billPreview.pdfUrl, "_blank")}>Open PDF</button>
              {billPreview?.doc && (
                <button type="button" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => billPreview.doc.save(`${billPreview.billNumber}.pdf`)}>Download PDF</button>
              )}
              <button type="button" className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700" onClick={() => window.print()}>Print Bill</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      <div className="form-horizon-btw p25">
        <div className="form-horizon-start">
          <img alt="details pic" src="details.png" className="patient-pic" />
          <h1 className="page-heading max-w-[70vw] truncate overflow-hidden whitespace-nowrap">{patientInfo.name}</h1>
        </div>
      </div>

      <div className="space-y-5 p25">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p>Mobile No.: {patientInfo.contact_no}</p>
              <p>Location : {patientInfo.location}</p>
              <p>Gender : {patientInfo.gender}</p>
              <p>Age : {patientInfo.patient_age}</p>
              <p>Visit Count : {patientData.length}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
                onClick={() => {
                  setEditedPatientDetails({
                    name: location.state.rowdata.name,
                    contact_no: location.state.rowdata.contact_no,
                    location: location.state.rowdata.location,
                    gender: location.state.rowdata.gender,
                    patient_age: location.state.rowdata.patient_age,
                  });
                  setEditedPatientDetailsError({ name: false, nameErr: "", contact_no: false, contact_noErr: "", location: false, locationErr: "", gender: false, genderErr: "" });
                  setActiveEditDetails(true);
                }}
              >
                Edit Details
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
                onClick={() => {
                  // ✅ Fresh state for Add
                  setEditedData({ date: new Date().toISOString().split("T")[0], symptoms: "", medicines: "", pathology_report: "", fee: "", otherCharges: [] });
                  setOtherCharges([]);
                  setActiveAdd(true);
                }}
              >
                Add New Details
              </button>
            </div>
          </div>
        </section>

        {patientData.length === 0 ? (
          <div className="flex-horizon">
            <img alt="nodata pic" src="nodata.png" className="fallback-pic" />
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Symptoms</th>
                    <th className="px-4 py-3 text-left">Medicines</th>
                    <th className="px-4 py-3 text-left">Amount</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {patientData.map((row, rowIndex) => {
                  return  <tr key={rowIndex} className="hover:bg-slate-50">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-4 align-top max-w-[150px] truncate overflow-hidden whitespace-nowrap">{cell}</td>
                      ))}
                    </tr>
})}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Modal ── */}
      {activeAdd && (
        <div className="modal-overlay">
          <div className="modal-panel">
            <h2 className="text-lg font-semibold text-slate-900">Add today's record</h2>
            <p className="mt-1 text-sm text-slate-600">Fill in today's visit details.</p>
            {renderFormFields()}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button type="button" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setActiveAdd(false)}>Close</button>
              <button
                type="button"
                className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                onClick={async () => { await onSubmitAddedData(); handleGenerateBill(); }}
              >
                Generate Bill
              </button>
              <button
                type="button"
                className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                onClick={async () => { await onSubmitAddedData(); }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {activeEdit && (
        <div className="modal-overlay">
          <div className="modal-panel">
            <h2 className="text-lg font-semibold text-slate-900">Edit record</h2>
            <p className="mt-1 text-sm text-slate-600">Update the selected entry details below.</p>
            {renderFormFields()}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button type="button" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setActiveEdit(false)}>Cancel</button>
              <button
                type="button"
                className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                onClick={async () => { await onSubmitEditedData(); handleGenerateBill(); }}
              >
                Generate Bill
              </button>
              <button
                type="button"
                className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                onClick={async () => { await onSubmitEditedData(); }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {activeDel && (
        <div className="modal-overlay">
          <div className="modal-panel max-w-md">
            <h2 className="text-lg font-semibold text-slate-900">Delete record</h2>
            <p className="mt-2 text-sm text-slate-600">Do you really want to delete this? This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setActiveDel(false)}>Cancel</button>
              <button type="button" className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700" onClick={onDeleteData}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Patient Details Modal ── */}
      {activeEditDetails && (
        <div className="modal-overlay">
          <div className="modal-panel max-w-xl">
            <h2 className="text-lg font-semibold text-slate-900">Edit Patient Details</h2>
            <p className="mt-2 text-sm text-slate-600">Update the patient information and save the changes.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Name</label>
                <input type="text" value={editedPatientDetails.name} onChange={(e) => handlePatientNameChange(e.target.value)} className="input-base mt-2" />
                {editedPatientDetailsError.nameErr && <p className="mt-1 text-sm text-red-600">{editedPatientDetailsError.nameErr}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Mobile No.</label>
                <input type="text" value={editedPatientDetails.contact_no} onChange={(e) => handlePatientContactChange(e.target.value)} className="input-base mt-2" />
                {editedPatientDetailsError.contact_noErr && <p className="mt-1 text-sm text-red-600">{editedPatientDetailsError.contact_noErr}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Age</label>
                <input type="text" value={editedPatientDetails.patient_age} onChange={(e) => handlePatientAgeChange(e.target.value)} className="input-base mt-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Location</label>
                <input type="text" value={editedPatientDetails.location} onChange={(e) => handlePatientLocationChange(e.target.value)} className="input-base mt-2" />
                {editedPatientDetailsError.locationErr && <p className="mt-1 text-sm text-red-600">{editedPatientDetailsError.locationErr}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700">Gender</label>
                <input type="text" value={editedPatientDetails.gender} onChange={(e) => handlePatientGenderChange(e.target.value)} className="input-base mt-2" />
                {editedPatientDetailsError.genderErr && <p className="mt-1 text-sm text-red-600">{editedPatientDetailsError.genderErr}</p>}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setActiveEditDetails(false)}>Cancel</button>
              <button type="button" className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700" onClick={onSubmitEditedPatientDetails}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bill Preview Modal ── */}
      {billPreview && renderBillPreview()}
    </div>
  );
};

export default PatientDetails;