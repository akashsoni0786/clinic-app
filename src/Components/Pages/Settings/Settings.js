import React, { useState, useEffect } from "react";
import { contxtname } from "../../../Context/appcontext";

const Settings = () => {
  const contxt = React.useContext(contxtname);
  const token = contxt.loggedIn.token;
  const [message, setMessage] = useState({ msg: "", type: "success" });
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [clinicName, setClinicName] = useState("");
  const [newItem, setNewItem] = useState({ medicine: "", symptom: "", disease: "" });

  const handleExport = async () => {
    const result = await window.api.invoke("data:export", token);
    if (result.canceled) return;
    if (result.error) {
      setMessage({ msg: result.error, type: "critical" });
    } else {
      setMessage({ msg: `Data exported to: ${result.filePath}`, type: "success" });
    }
  };

  const handleImportConfirm = async () => {
    setShowImportConfirm(false);
    const result = await window.api.invoke("data:import", token);
    if (result.canceled) return;
    if (result.error) {
      setMessage({ msg: result.error, type: "critical" });
    } else {
      setMessage({ msg: "Data imported! All sessions cleared. Please log in again.", type: "success" });
      setTimeout(() => {
        contxt.setLoggedIn({ id: "", username: "", name: "", role: null, token: null, loggedin: false });
      }, 2000);
    }
  };

  useEffect(() => {
    const fetchClinicConfig = async () => {
      const result = await window.api.invoke("settings:getClinicConfig", token);
      if (!result?.error) {
        setClinicName(result.clinicName || "");
      }
    };

    fetchClinicConfig();
  }, [token]);

  const handleSaveClinicName = async () => {
    const result = await window.api.invoke("settings:saveClinicConfig", token, { clinicName });
    if (result.error) {
      setMessage({ msg: result.error, type: "critical" });
    } else {
      setMessage({ msg: "Clinic name saved successfully.", type: "success" });
    }
  };

  const handleAddSuggestion = async (category, field) => {
    const value = newItem[field].trim();
    if (!value) return;
    const updated = {
      ...contxt.customSuggestions,
      [category]: [...contxt.customSuggestions[category], value],
    };
    const saved = await window.api.invoke("suggestions:save", token, updated);
    contxt.setCustomSuggestions(saved);
    setNewItem({ ...newItem, [field]: "" });
  };

  const handleDeleteSuggestion = async (category, index) => {
    const updated = {
      ...contxt.customSuggestions,
      [category]: contxt.customSuggestions[category].filter((_, i) => i !== index),
    };
    const saved = await window.api.invoke("suggestions:save", token, updated);
    contxt.setCustomSuggestions(saved);
  };

  const chipStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 10px",
    background: "#f1f2f3",
    borderRadius: "20px",
    fontSize: "13px",
    color: "#202223",
  };

  const deleteBtn = {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#6d7175",
    fontSize: "16px",
    lineHeight: 1,
    padding: "0 0 0 2px",
  };

  const renderSuggestionCard = (title, category, field) => (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <label className="sr-only">Add new {title.toLowerCase()}</label>
          <input
            type="text"
            value={newItem[field]}
            onChange={(e) => setNewItem({ ...newItem, [field]: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddSuggestion(category, field);
              }
            }}
            placeholder={`Naya ${title.toLowerCase()} add karein`}
            className="input-base w-full md:flex-1"
          />
          <button
            type="button"
            className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            onClick={() => handleAddSuggestion(category, field)}
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {contxt.customSuggestions[category].length === 0 ? (
            <p className="text-sm text-slate-500">Abhi koi custom entry nahi hai.</p>
          ) : (
            contxt.customSuggestions[category].map((item, i) => (
              <span key={i} style={chipStyle}>
                {item}
                <button style={deleteBtn} onClick={() => handleDeleteSuggestion(category, i)}>
                  ×
                </button>
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container p25 flex flex-col gap-5">
      <h1 className="page-heading">Settings</h1>
      {message.msg && (
        <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${message.type === "critical" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {message.msg}
          <button
            type="button"
            className="ml-4 font-semibold"
            onClick={() => setMessage({ msg: "", type: "success" })}
          >
            Dismiss
          </button>
        </div>
      )}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold">Data Backup</h2>
        <p className="mt-2 text-sm text-slate-600">Export all patient and user data to a JSON file. Save to USB, Google Drive, or any location.</p>
        <button
          type="button"
          className="mt-4 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
          onClick={handleExport}
        >
          Export Data
        </button>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold">Clinic Details</h2>
        <p className="mt-2 text-sm text-slate-600">Apne clinic ka naam yahan daalein. Ye naam bill aur reports mein dikhaya jayega.</p>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-slate-700">Clinic Name</label>
            <input
              type="text"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              placeholder="Apne clinic ka naam likhein"
              className="input-base w-full"
            />
          </div>
          <button
            type="button"
            className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            onClick={handleSaveClinicName}
          >
            Save Clinic Name
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold">Data Import</h2>
        <p className="mt-2 text-sm text-slate-600"><strong>Warning:</strong> Importing will replace ALL current data and log out all users. Export first as a backup.</p>
        <button
          type="button"
          className="mt-4 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          onClick={() => setShowImportConfirm(true)}
        >
          Import Data
        </button>
      </section>

      {renderSuggestionCard("Custom Medicines", "medicines", "medicine")}
      {renderSuggestionCard("Custom Symptoms", "symptoms", "symptom")}
      {renderSuggestionCard("Custom Diseases", "diseases", "disease")}

      {showImportConfirm && (
        <div className="modal-overlay">
          <div className="modal-panel">
            <h2 className="text-lg font-semibold text-slate-900">Confirm Import</h2>
            <p className="mt-4 text-sm text-slate-600">
              Ye action poora data replace karega aur sabko logout kar dega. Kya aap sure hain? Pehle Export karke backup le lein.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setShowImportConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                onClick={handleImportConfirm}
              >
                Yes, Import & Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
