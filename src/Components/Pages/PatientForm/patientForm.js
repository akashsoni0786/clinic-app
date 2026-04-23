import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { contxtname } from "../../../Context/appcontext";
import MedicineField from "../../common/MedicineField";
import homeopathySymptoms from "../../../data/homeopathySymptoms";
import homeopathyDiseases from "../../../data/homeopathyDiseases";
import { generateBillPdf } from "../../common/generateBillPdf";
import { Plus, Trash } from "feather-icons-react";
const PatientForm = () => {
  const contxt = React.useContext(contxtname);
  const date = new Date();
  const today = date.toISOString().split("T")[0];
  const navigate = useNavigate();
  const [patientError, setPatientError] = useState({});
  const [regno] = useState(
    String(date.getFullYear()) +
    String(date.getMonth()) +
    String(date.getDate()) +
    String(date.getHours()) +
    String(date.getMinutes()) +
    String(date.getSeconds()) +
    String(date.getMilliseconds())
  );
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });
  const [billPreview, setBillPreview] = useState(null);
  const [clinicName, setClinicName] = useState("Medryon Clinic");
  const [otherCharges, setOtherCharges] = useState([{ description: "Injection", price: "100" }, { description: "Syrup", price: "300" }]);

  useEffect(() => {
    const fetchClinicName = async () => {
      try {
        const result = await window.api.invoke("settings:getClinicConfig", contxt.loggedIn.token);
        if (!result?.error && result?.clinicName) {
          setClinicName(result.clinicName);
        }
      } catch (error) {
        console.error("Unable to load clinic name:", error);
      }
    };

    fetchClinicName();
  }, [contxt.loggedIn.token]);



  const [patient, setPatient] = useState({
    id: regno,
    name: "",
    contact_no: "",
    patient_age: "",
    fee: "",
    pathology_report: "",
    date: today,
    gender: "",
    location: "Lucknow",
    symptoms: "",
    medicines: "",
    desease: "",
    dateWiseData: [
      {
        todaydate: "",
        daysymptoms: "",
        daymedicines: "",
        otherCharges: [],
        pathology_report: "",
        fee: "",
      },
    ],
  });
  // ✅ IPC Timeout Wrapper — component ke bahar define karo
  const invokeWithTimeout = (channel, ...args) => {
    return Promise.race([
      window.api.invoke(channel, ...args),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`IPC timeout: ${channel}`)), 10000)
      ),
    ]);
  };
  const handleGenerateBill = async (options = {}) => {
    try {
      setLoading(true);

      const generateBill =
        typeof options === "object" && typeof options.generateBill === "boolean"
          ? options.generateBill
          : false;

      console.log("handleSubmit called, generateBill:", generateBill);

      // ✅ Validation
      const errors = {
        name: !patient.name,
        nameErr: !patient.name ? "Please enter patient name." : "",
        date: !patient.date,
        dateErr: !patient.date ? "Please select a date." : "",
        gender: !patient.gender,
        genderErr: !patient.gender ? "Please select a gender." : "",
        location: !patient.location,
        locationErr: !patient.location ? "Please enter a location." : "",
        symptoms: !patient.symptoms,
        symptomsErr: !patient.symptoms ? "Please enter symptoms." : "",
        medicines: !patient.medicines,
        medicinesErr: !patient.medicines ? "Please enter medicines." : "",
        desease: !patient.desease,
        deseaseErr: !patient.desease ? "Please enter disease name." : "",
      };

      const hasError = Object.values(errors).some((v) => v === true);

      if (hasError) {
        setPatientError(errors);
        setToast({
          message: "Please fix validation errors before submitting.",
          type: "error",
          visible: true,
        });
        setLoading(false);
        return;
      }
      const totalCharges = otherCharges?.reduce((sum, charge) => sum + Number(charge?.singleprice == "" ? 0 : Number(charge?.singleprice || 0) * Number(charge?.quantity || 0)), 0) + Number(patient.fee || 0);
      console.log("Total Charges calculated:", totalCharges);
      const billNumber = `BILL-${regno}`;
      const billDetails = {
        billGenerated: generateBill,
        billNumber,
        billGeneratedAt: new Date().toISOString(),
        billTotal: totalCharges,
        billItems: patient.medicines,
        billDisease: patient.desease,
        billPathology: patient.pathology_report,
        otherCharges: otherCharges,
      };

      const tempdata = JSON.parse(
        JSON.stringify({
          ...patient,
          ...(generateBill ? { bill: billDetails } : {}),
          dateWiseData: [
            {
              todaydate: patient.date,
              daysymptoms: patient.symptoms,
              daymedicines: patient.medicines,
              pathology_report: patient.pathology_report,
              fee: totalCharges,
              otherCharges: patient.otherCharges,
              fixcharge: patient.fee,
            },
          ],
        })
      );

      const token = contxt?.loggedIn?.token;
      if (!token) throw new Error("Session expired. Please login again.");

      // ✅ Save patient
      // const addResult = await window.api.invoke("patients:add", token, tempdata);
      // if (addResult?.error) throw new Error(addResult.error);

      let message = "Bill generated successfully.";
      let toastType = "success";

      // ✅ Generate bill — FRONTEND ONLY (no IPC)
      if (generateBill) {
        try {
          const doc = generateBillPdf(patient, billDetails, clinicName);

          // ✅ Preview ke liye blob URL banao
          const pdfBlob = doc.output("blob");
          const pdfUrl = URL.createObjectURL(pdfBlob);

          setBillPreview({
            billNumber,
            pdfUrl,       // blob URL — embed mein use hoga
            doc,          // download ke liye
            patient: { ...patient },
            bill: billDetails,
          });

          message = `Bill generated. Bill: ${billNumber}`;
        } catch (pdfErr) {
          console.error("PDF generation error:", pdfErr);
          message = `Patient saved, but PDF failed: ${pdfErr.message}`;
          toastType = "error";
        }
      }

      // ✅ Refresh list
      // const patients = await window.api.invoke("patients:getAll", token);
      // if (patients?.error) throw new Error(patients.error);

      // contxt.setPatientList(patients);

      // setToast({ message, type: toastType, visible: true });

      // ✅ Bill generate hua hai toh navigate nahi — user modal se close karega
      // if (!generateBill) {
      //   setTimeout(() => navigate("/history"), 800);
      // }

    } catch (e) {
      console.error("❌ Error:", e);
      setToast({
        message: e?.message || "Something went wrong",
        type: "error",
        visible: true,
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (options = {}) => {
    try {
      setLoading(true);

      const generateBill =
        typeof options === "object" && typeof options.generateBill === "boolean"
          ? options.generateBill
          : false;

      console.log("handleSubmit called, generateBill:", generateBill);

      // ✅ Validation
      const errors = {
        name: !patient.name,
        nameErr: !patient.name ? "Please enter patient name." : "",
        date: !patient.date,
        dateErr: !patient.date ? "Please select a date." : "",
        gender: !patient.gender,
        genderErr: !patient.gender ? "Please select a gender." : "",
        location: !patient.location,
        locationErr: !patient.location ? "Please enter a location." : "",
        symptoms: !patient.symptoms,
        symptomsErr: !patient.symptoms ? "Please enter symptoms." : "",
        medicines: !patient.medicines,
        medicinesErr: !patient.medicines ? "Please enter medicines." : "",
        desease: !patient.desease,
        deseaseErr: !patient.desease ? "Please enter disease name." : "",
      };

      const hasError = Object.values(errors).some((v) => v === true);

      if (hasError) {
        setPatientError(errors);
        setToast({
          message: "Please fix validation errors before submitting.",
          type: "error",
          visible: true,
        });
        setLoading(false);
        return;
      }
      const totalCharges = otherCharges?.reduce((sum, charge) => sum + Number(charge?.singleprice == "" ? 0 : Number(charge?.singleprice || 0) * Number(charge?.quantity || 0)), 0) + Number(patient.fee || 0);
      console.log("Total Charges calculated:", totalCharges);
      const billNumber = `BILL-${regno}`;
      const billDetails = {
        billGenerated: generateBill,
        billNumber,
        billGeneratedAt: new Date().toISOString(),
        billTotal: totalCharges,
        billItems: patient.medicines,
        billDisease: patient.desease,
        billPathology: patient.pathology_report,
        otherCharges: otherCharges,
      };

      const tempdata = JSON.parse(
        JSON.stringify({
          ...patient,
          ...(generateBill ? { bill: billDetails } : {}),
          dateWiseData: [
            {
              todaydate: patient.date,
              daysymptoms: patient.symptoms,
              daymedicines: patient.medicines,
              pathology_report: patient.pathology_report,
              fee: totalCharges,
              otherCharges: patient.otherCharges,
              fixcharge: patient.fee,
            },
          ],
        })
      );

      const token = contxt?.loggedIn?.token;
      if (!token) throw new Error("Session expired. Please login again.");

      // ✅ Save patient
      const addResult = await window.api.invoke("patients:add", token, tempdata);
      if (addResult?.error) throw new Error(addResult.error);

      let message = "Patient saved successfully.";
      let toastType = "success";

      // ✅ Generate bill — FRONTEND ONLY (no IPC)
      if (generateBill) {
        try {
          const doc = generateBillPdf(patient, billDetails, clinicName);

          // ✅ Preview ke liye blob URL banao
          const pdfBlob = doc.output("blob");
          const pdfUrl = URL.createObjectURL(pdfBlob);

          setBillPreview({
            billNumber,
            pdfUrl,       // blob URL — embed mein use hoga
            doc,          // download ke liye
            patient: { ...patient },
            bill: billDetails,
          });

          message = `Patient saved & bill generated. Bill: ${billNumber}`;
        } catch (pdfErr) {
          console.error("PDF generation error:", pdfErr);
          message = `Patient saved, but PDF failed: ${pdfErr.message}`;
          toastType = "error";
        }
      }

      // ✅ Refresh list
      const patients = await window.api.invoke("patients:getAll", token);
      if (patients?.error) throw new Error(patients.error);

      contxt.setPatientList(patients);

      setToast({ message, type: toastType, visible: true });

      // ✅ Bill generate hua hai toh navigate nahi — user modal se close karega
      if (!generateBill) {
        setTimeout(() => navigate("/history"), 800);
      }

    } catch (e) {
      console.error("❌ Error:", e);
      setToast({
        message: e?.message || "Something went wrong",
        type: "error",
        visible: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContactNoChange = (value) => {
    if (/^\d*$/.test(value)) {
      setPatient({ ...patient, contact_no: value.slice(0, 10) });
    }
  };

  const handleAgeChange = (value) => {
    if (/^\d*$/.test(value)) {
      setPatient({ ...patient, patient_age: value.slice(0, 3) });
    }
  };

  const handleFeeChange = (value) => {
    if (/^\d*$/.test(value)) {
      setPatient({ ...patient, fee: value });
    }
  };

  const handleOtherChargeChange = (index, field, value) => {
    if (field === "price" && !/^\d*$/.test(value)) return; // Price should be numeric
    const updatedCharges = [...otherCharges];
    updatedCharges[index][field] = value;
    setOtherCharges(updatedCharges);
  };
  const handleDelete = (index) => {
    const updatedCharges = otherCharges.filter((_, i) => i !== index);
    setOtherCharges(updatedCharges);
  };
  const handleAddCharge = () => {
    setOtherCharges([...otherCharges, { description: "", price: "" }]);
  };
  const handleOpenPdf = () => {
    if (!billPreview?.pdfUrl) {
      setToast({ message: "PDF unavailable.", type: "error", visible: true });
      return;
    }
    // Blob URL ko new tab mein open karo
    window.open(billPreview.pdfUrl, "_blank");
  };

  const handleReset = () => {
    setPatient({
      id: regno,
      name: "",
      contact_no: "",
      patient_age: "",
      fee: "",
      pathology_report: "",
      date: today,
      gender: "",
      location: "Lucknow",
      symptoms: "",
      medicines: "",
      desease: "",
      dateWiseData: [
        { todaydate: "", daysymptoms: "", daymedicines: "", pathology_report: "", fee: "" },
      ],
    });
    setPatientError({});
  };

  return (
    <div className="container">
      <div className="form-horizon-btw p25">
        <div className="form-horizon-start">
          <img alt="patient pic" src="patient.png" className="patient-pic" />
          <h1 className="page-heading">Add Patient</h1>
        </div>
        {toast.visible && (
          <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
            {toast.message}
          </div>
        )}
        <div className="form-horizon child-mar-15">
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            onClick={handleReset}
          >
            Reset
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            onClick={() => handleSubmit({ generateBill: false })}
            disabled={loading}
          >
            {loading ? "Processing..." : "Submit"}
          </button>
          <button
            type="button"
            className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            onClick={() => handleGenerateBill({ generateBill: true })}
            disabled={loading}
          >
            {loading ? "Processing..." : "Submit & Generate Bill"}
          </button>
        </div>
      </div>
      <div className="p25">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit({ generateBill: false }); }}>
          <div className="card-base p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">Registration number</label>
              <input type="text" className="input-base mt-2" value={regno} disabled />
              <p className="mt-2 text-sm text-slate-500">We’ll use this registration number for records only.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Patient name</label>
              <input
                type="text"
                value={patient.name}
                onChange={(e) => setPatient({ ...patient, name: e.target.value })}
                className={`input-base mt-2 ${patientError.name ? "border-red-500" : "border-slate-300"}`}
              />
              {patientError.nameErr && <p className="mt-2 text-sm text-red-600">{patientError.nameErr}</p>}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Contact number</label>
                <div className="mt-2 flex rounded-2xl border border-slate-300 bg-white">
                  <span className="flex items-center px-3 text-sm text-slate-500">+91</span>
                  <input
                    type="text"
                    value={patient.contact_no}
                    onChange={(e) => handleContactNoChange(e.target.value)}
                    className="input-base min-w-0 border-0 bg-transparent focus:ring-0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Age</label>
                <input
                  type="text"
                  value={patient.patient_age}
                  onChange={(e) => handleAgeChange(e.target.value)}
                  className="input-base mt-2"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Date</label>
                <input
                  type="date"
                  value={patient.date}
                  onChange={(e) => setPatient({ ...patient, date: e.target.value })}
                  className={`input-base mt-2 ${patientError.date ? "border-red-500" : "border-slate-300"}`}
                />
                {patientError.dateErr && <p className="mt-2 text-sm text-red-600">{patientError.dateErr}</p>}
              </div>
              <div>
                <span className="block text-sm font-medium text-slate-700">Gender</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {['Male', 'Female', 'Other'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setPatient({ ...patient, gender: option })}
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${patient.gender === option ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {patientError.genderErr && <p className="mt-2 text-sm text-red-600">{patientError.genderErr}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Location</label>
              <input
                type="text"
                value={patient.location}
                onChange={(e) => setPatient({ ...patient, location: e.target.value })}
                className={`input-base mt-2 ${patientError.location ? "border-red-500" : "border-slate-300"}`}
              />
              {patientError.locationErr && <p className="mt-2 text-sm text-red-600">{patientError.locationErr}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Pathology report</label>
              <textarea
                value={patient.pathology_report}
                onChange={(e) => setPatient({ ...patient, pathology_report: e.target.value })}
                rows={4}
                className="input-base mt-2"
              />
            </div>
            <MedicineField
              label="Patient symptoms"
              error={patientError.symptoms}
              value={patient.symptoms}
              onChange={(value) => setPatient({ ...patient, symptoms: value })}
              data={homeopathySymptoms}
              customData={contxt.customSuggestions.symptoms}
              helpText={patientError.symptomsErr ? patientError.symptomsErr : ""}
            />
            <MedicineField
              label="Disease name"
              error={patientError.desease}
              value={patient.desease}
              onChange={(value) => setPatient({ ...patient, desease: value })}
              data={homeopathyDiseases}
              customData={contxt.customSuggestions.diseases}
              helpText={patientError.deseaseErr ? patientError.deseaseErr : ""}
            />
            <MedicineField
              label="Patient medicines"
              error={patientError.medicines}
              value={patient.medicines}
              onChange={(value) => setPatient({ ...patient, medicines: value })}
              customData={contxt.customSuggestions.medicines}
              helpText={patientError.medicinesErr ? patientError.medicinesErr : ""}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700">Fee</label>
              <input
                type="text"
                value={patient.fee}
                onChange={(e) => handleFeeChange(e.target.value)}
                className="input-base mt-2"
              />
            </div>


            <div className="flex gap-4  items-center">
              <label className="block text-md font-medium text-slate-900">Other Charges</label>
              <button
                onClick={handleAddCharge}
                type="button"
                className="rounded-full bg-green-600 p-2 text-sm font-semibold text-white hover:bg-green-400">
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {otherCharges.length > 0 && (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-left font-semibold text-slate-700">Description</th>
                    <th className="px-2 py-2 text-left font-semibold text-slate-700">Quantity</th>
                    <th className="px-2 py-2 text-left font-semibold text-slate-700">Single Price (₹)</th>
                    <th className="px-2 py-2 text-left font-semibold text-slate-700">Total Price (₹)</th>
                    <th className="px-2 py-2 text-left font-semibold text-slate-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {otherCharges.map((charge, index) => (
                    <tr key={index}>
                      <td className="p-2">
                        <input
                          type="text"
                          value={charge.description}
                          onChange={(e) => handleOtherChargeChange(index, "description", e.target.value)}
                          className="w-full input-base"
                          placeholder="Injection, Syrup, etc."
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={charge.quantity || ""}
                          onChange={(e) => handleOtherChargeChange(index, "quantity", e.target.value)}
                          className="w-full input-base"
                          placeholder="Quantity"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={charge.singleprice}
                          onChange={(e) => handleOtherChargeChange(index, "singleprice", e.target.value)}
                          className="w-full input-base"
                          placeholder="₹"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={Number(charge.singleprice || 0) * Number(charge.quantity || 0) || ""}
                          readOnly
                          className="w-full input-base bg-slate-50 cursor-not-allowed"
                          placeholder="₹"
                        />
                      </td>
                      <td className="p-2">
                        <button
                          onClick={() => handleDelete(index)}
                          type="button"
                          className="rounded-full bg-red-600 p-2 text-sm font-semibold text-white hover:bg-red-500"
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
        </form>
      </div>
      {billPreview && (
        <div className="modal-overlay">
          <div className="modal-panel max-w-3xl">
            <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
              <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Invoice</div>
                  <h2 className="text-2xl font-bold text-slate-900">{clinicName || 'Medryon Clinic'}</h2>
                </div>
                <div className="space-y-2 text-right">
                  <div className="text-sm text-slate-500">Invoice No.</div>
                  <div className="text-lg font-semibold text-slate-900">{billPreview.billNumber}</div>
                  <div className="text-sm text-slate-500">Date Issued</div>
                  <div className="text-sm font-medium text-slate-700">{new Date(billPreview.bill.billGeneratedAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm font-semibold text-slate-700">Billed To</div>
                  <div className="mt-2 text-sm text-slate-600">{billPreview.patient.name}</div>
                  <div className="text-sm text-slate-600">{billPreview.patient.contact_no ? `+91 ${billPreview.patient.contact_no}` : "Contact not set"}</div>
                  <div className="text-sm text-slate-600">{billPreview.patient.location}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-700">Patient Details</div>
                  <div className="mt-2 text-sm text-slate-600">Age: {billPreview.patient.patient_age || 'N/A'}</div>
                  <div className="text-sm text-slate-600">Gender: {billPreview.patient.gender || 'N/A'}</div>
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-200">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-slate-100 text-left text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Qty</th>
                      <th className="px-4 py-3">Rate</th>
                      <th className="px-4 py-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr className="border-b border-slate-200">
                      <td className="px-4 py-4">Consultation Fee</td>
                      <td className="px-4 py-4">-</td>
                      <td className="px-4 py-4">₹{Number(billPreview.patient.fee || 0)}</td>
                      <td className="px-4 py-4 font-semibold">₹{Number(billPreview.patient.fee || 0)}</td>
                    </tr>

                    {billPreview.bill.otherCharges?.map((charge, index) => (
                      <tr className="border-b border-slate-200" key={index}>
                        <td className="px-4 py-4">{charge.description}</td>
                        <td className="px-4 py-4">{charge.quantity}</td>
                        <td className="px-4 py-4">₹{Number(charge.singleprice || 0)}</td>
                        <td className="px-4 py-4 font-semibold">₹{Number(charge.singleprice || 0) * Number(charge.quantity || 1)}</td>
                      </tr>
                    ))}


                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
                  <div className="font-semibold text-slate-700">Notes</div>
                  <p className="mt-2">Thank you for visiting Medryon. Please contact us for any follow-up consultation.</p>
                </div>
                <div className="rounded-3xl bg-slate-900 p-4 text-right text-white">
                  <div className="text-sm text-slate-300">Grand Total</div>
                  <div className="text-2xl font-bold">₹{Number(billPreview.bill.billTotal || 0)}</div>
                </div>
              </div>

              {billPreview?.pdfUrl && (
                <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
                  <embed
                    src={billPreview.pdfUrl}
                    type="application/pdf"
                    width="100%"
                    height="480px"
                  />
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-3 justify-end">
                <button
                  type="button"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    setBillPreview(null);
                    navigate("/history");
                  }}
                >
                  Save & View History
                </button>

                {/* Open PDF — new tab mein */}
                <button
                  type="button"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={handleOpenPdf}
                >
                  Open PDF
                </button>

                {/* Download PDF — direct save */}
                {/* {billPreview?.doc && (
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={() => billPreview.doc.save(`${billPreview.billNumber}.pdf`)}
                  >
                    Download PDF
                  </button>
                )} */}
                <button
                  type="button"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    setBillPreview(null);
                  }}
                >
                  Close
                </button>
                {/* <button
                  type="button"
                  className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                  onClick={() => window.print()}
                >
                  Print Bill
                </button> */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientForm;
