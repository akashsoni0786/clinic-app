import React, { useEffect, useState } from "react";
import { contxtname } from "../../../Context/appcontext";
import MedicineField from "../../common/MedicineField";
import homeopathySymptoms from "../../../data/homeopathySymptoms";
import { useLocation } from "react-router-dom";

const PatientDetails = () => {
  const contxt = React.useContext(contxtname);
  const location = useLocation();
  const [patientData, setPatientData] = useState([]);
  const [editIndex, setEditIndex] = useState("");
  const [activeEdit, setActiveEdit] = useState(false);
  const [activeDel, setActiveDel] = useState(false);
  const [activeAdd, setActiveAdd] = useState(false);
  const [patientInfo, setPatientInfo] = useState({
    name: location.state.rowdata.name,
    contact_no: location.state.rowdata.contact_no,
    location: location.state.rowdata.location,
    gender: location.state.rowdata.gender,
    patient_age: location.state.rowdata.patient_age,
  });
  console.log("patientDatapatientData", patientData);
  const [activeEditDetails, setActiveEditDetails] = useState(false);
  const [editedPatientDetails, setEditedPatientDetails] = useState({
    name: "",
    contact_no: "",
    location: "",
    gender: "",
    patient_age: "",
  });
  const [editedPatientDetailsError, setEditedPatientDetailsError] = useState({
    name: false,
    nameErr: "",
    contact_no: false,
    contact_noErr: "",
    location: false,
    locationErr: "",
    gender: false,
    genderErr: "",
  });
  const [editedData, setEditedData] = useState({
    date: "",
    symptoms: "",
    medicines: "",
    pathology_report: "",
    fee: "",
  });
  console.log("editedDataeditedData", editedData);
  const [editedDataError, setEditedDataError] = useState({
    date: "",
    dateErr: false,
    symptoms: "",
    symptomsErr: false,
    medicines: "",
    medicinesErr: false,
  });
  const setuppatientData = (allptntdata) => {
    let temp = [];
    [...allptntdata].reverse().forEach((data, visualIndex) => {
      const originalIndex = visualIndex;
      let symp = data.daysymptoms.replaceAll("\n", "<br/> &#x2022 ");
      let medi = data.daymedicines.replaceAll("\n", "<br/> &#x2022 ");
      let fee = data.fee ? data.fee : "";
      console.log("sympsympsymp", data);
      temp.push([
        data.todaydate,
        <div
          key={visualIndex}
          dangerouslySetInnerHTML={{ __html: "&#x2022 " + symp }}
        />,
        <div
          key={visualIndex}
          dangerouslySetInnerHTML={{ __html: "&#x2022 " + medi }}
        />,
        <div
          key={visualIndex}
          dangerouslySetInnerHTML={{ __html: "₹ "+fee }}
        />,
        <div key={visualIndex} className="flex gap-2">
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200"
            onClick={() => {
              setActiveEdit(true);
              setEditIndex(originalIndex);
              setEditedData({
                date: data.todaydate,
                symptoms: data.daysymptoms,
                medicines: data.daymedicines,
                pathology_report: data.pathology_report,
                fee: data.fee ? data.fee : "",
              });
            }}
          >
            Edit
          </button>
          <button
            type="button"
            className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm text-red-700 hover:bg-red-100"
            onClick={() => {
              setEditIndex(originalIndex);
              setActiveDel(true);
            }}
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
  const handleDateChange = (value) => {
    setEditedData({
      ...editedData,
      date: value,
    });
  };
  const handleSymptomsChange = (value) => {
    setEditedData({
      ...editedData,
      symptoms: value,
    });
  };
  const handlePathologyReportChange = (value) => {
    setEditedData({
      ...editedData,
      pathology_report: value,
    });
  };
  const handleFeeChange = (value) => {
    if (/^\d*$/.test(value)) {
      setEditedData({
        ...editedData,
        fee: value,
      });
    }
  };

  const handleMedicinesChange = (value) => {
    setEditedData({
      ...editedData,
      medicines: value,
    });
  };
  
  const handlePatientNameChange = (value) => {
    setEditedPatientDetails({ ...editedPatientDetails, name: value });
  };
  const handlePatientContactChange = (value) => {
    setEditedPatientDetails({ ...editedPatientDetails, contact_no: value.slice(0, 10) });
  };
  const handlePatientLocationChange = (value) => {
    setEditedPatientDetails({ ...editedPatientDetails, location: value });
  };
  const handlePatientAgeChange = (value) => {
    if (/^\d*$/.test(value)) {
      setEditedPatientDetails({
        ...editedPatientDetails,
        patient_age: value.slice(0, 3),
      });
    }
  };
  const handlePatientGenderChange = (value) => {
    setEditedPatientDetails({ ...editedPatientDetails, gender: value });
  };
  const onSubmitEditedPatientDetails = async () => {
    let errors = {
      name: false,
      nameErr: "",
      contact_no: false,
      contact_noErr: "",
      location: false,
      locationErr: "",
      gender: false,
      genderErr: "",
    };
    Object.keys(editedPatientDetails).forEach((field) => {
      if (editedPatientDetails[field] === "") {
        errors = {
          ...errors,
          [field]: true,
          [field + "Err"]: "Please enter here!",
        };
      }
    });
    const hasError = Object.keys(editedPatientDetails).some(
      (field) => errors[field]
    );
    if (!hasError) {
      try {
        const token = contxt.loggedIn.token;
        const updatedData = {
          ...location.state.rowdata,
          name: editedPatientDetails.name,
          contact_no: editedPatientDetails.contact_no,
          location: editedPatientDetails.location,
          gender: editedPatientDetails.gender,
          patient_age: editedPatientDetails.patient_age,
        };
        await window.api.invoke("patients:update", token, location.state.rowdata.id, updatedData);
        const alldata = await window.api.invoke("patients:getAll", token);
        contxt.setPatientList(alldata);
        setPatientInfo({
          name: editedPatientDetails.name,
          contact_no: editedPatientDetails.contact_no,
          location: editedPatientDetails.location,
          gender: editedPatientDetails.gender,
          patient_age: editedPatientDetails.patient_age,
        });
        setEditedPatientDetails({
            name: editedPatientDetails.name,
            contact_no: editedPatientDetails.contact_no,
            location: editedPatientDetails.location,
            gender: editedPatientDetails.gender,
            patient_age: editedPatientDetails.patient_age,
          });

          location.state.rowdata ={
            ...location.state.rowdata,
            name: editedPatientDetails.name,
            contact_no: editedPatientDetails.contact_no,
            location: editedPatientDetails.location,
            gender: editedPatientDetails.gender,
            patient_age: editedPatientDetails.patient_age,
          }
        setActiveEditDetails(false);
      } catch (e) {
        console.log(e);
      }
    }
    setEditedPatientDetailsError(errors);
  };
  const onSubmitEditedData = async () => {
    let errors = {
      date: "",
      dateErr: false,
      symptoms: "",
      symptomsErr: false,
      medicines: "",
      medicinesErr: false,
    };
    Object.keys(editedData).forEach((data) => {
      if (editedData[data] === "") {
        errors = {
          ...errors,
          [data]: true,
          [data + "Err"]: "Please enter here!",
        };
      } else {
        errors = {
          ...errors,
          [data]: false,
          [data + "Err"]: "",
        };
      }
    });
    let noError = true;
    Object.keys(editedData).forEach((data) => {
      if (errors[data] && noError) {
        noError = false;
      }
    });
    console.log("patientDatapatientData 3", editIndex);
    let tempData = { ...location.state.rowdata };
    tempData.dateWiseData[editIndex] = {
      todaydate: editedData.date,
      daysymptoms: editedData.symptoms,
      daymedicines: editedData.medicines,
      pathology_report: editedData.pathology_report,
      fee: editedData.fee
    };
    if (noError) {
      try {
        const token = contxt.loggedIn.token;
        await window.api.invoke("patients:update", token, location.state.rowdata.id, tempData);
        const alldata = await window.api.invoke("patients:getAll", token);
        contxt.setPatientList(alldata);
        console.log("patientDatapatientData 2",alldata.find(p => p.id === location.state.rowdata.id).dateWiseData)
        setuppatientData(alldata.find(p => p.id === location.state.rowdata.id).dateWiseData);
        setActiveEdit(false);
        setEditIndex("");
        setEditedData({ date: "", symptoms: "", medicines: "",pathology_report: "" });
      } catch (e) {
        console.log(e);
      }
    }
    setEditedDataError(errors);
  };
  const onSubmitAddedData = async () => {
    let errors = {
      date: "",
      dateErr: false,
      symptoms: "",
      symptomsErr: false,
      medicines: "",
      medicinesErr: false,
    };
    Object.keys(editedData).forEach((data) => {
      if (editedData[data] === "") {
        errors = {
          ...errors,
          [data]: true,
          [data + "Err"]: "Please enter here!",
        };
      } else {
        errors = {
          ...errors,
          [data]: false,
          [data + "Err"]: "",
        };
      }
    });
    let noError = true;
    Object.keys(editedData).forEach((data) => {
      if (errors[data] && noError) {
        noError = false;
      }
    });
    let tempData = { ...location.state.rowdata };
    tempData.dateWiseData = [
      {
        todaydate: editedData.date,
        daysymptoms: editedData.symptoms,
        daymedicines: editedData.medicines,
        pathology_report: editedData.pathology_report,
        fee: editedData.fee
      },
      ...tempData.dateWiseData,
    ];
    if (noError) {
      try {
        const token = contxt.loggedIn.token;
        await window.api.invoke("patients:update", token, location.state.rowdata.id, tempData);
        const alldata = await window.api.invoke("patients:getAll", token);
        contxt.setPatientList(alldata);
        setuppatientData(alldata.find(p => p.id === location.state.rowdata.id).dateWiseData);
        setActiveAdd(false);
        setEditIndex("");
        setEditedData({ date: "", symptoms: "", medicines: "" });
      } catch (e) {
        console.log(e);
      }
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
      setuppatientData(alldata.find(p => p.id === location.state.rowdata.id).dateWiseData);
      setActiveDel(false);
      setEditIndex("");
    } catch (e) {
      console.log(e);
    }
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
                  setEditedPatientDetailsError({
                    name: false, nameErr: "",
                    contact_no: false, contact_noErr: "",
                    location: false, locationErr: "",
                    gender: false, genderErr: "",
                  });
                  setActiveEditDetails(true);
                }}
              >
                Edit Details
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
                onClick={() => {
                  setEditedData({ date: new Date().toISOString().split("T")[0], symptoms: "", medicines: "", pathology_report: "" });
                  setActiveAdd(true);
                }}
              >
                Add New Details
              </button>
            </div>
          </div>
        </section>
        {patientData.length == 0 ? (
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
                    <th className="px-4 py-3 text-left">Fee</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {patientData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-slate-50">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex}
                        className="px-4 py-4 align-top max-w-[150px] truncate overflow-hidden whitespace-nowrap"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {activeAdd && (
        <div className="modal-overlay">
          <div className="modal-panel">
            <h2 className="text-lg font-semibold text-slate-900">Add something today</h2>
            <p className="mt-4 text-sm text-slate-600">You can edit here.</p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Enter Date</label>
                <input
                  type="date"
                  value={editedData.date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="input-base mt-2"
                />
                {editedDataError.dateErr && (
                  <p className="mt-1 text-sm text-red-600">{editedDataError.date}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Enter Fee</label>
                <input
                  type="text"
                  value={editedData.fee}
                  onChange={(e) => handleFeeChange(e.target.value)}
                  className="input-base mt-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Enter New Pathology Report</label>
                <input
                  type="text"
                  value={editedData.pathology_report}
                  onChange={(e) => handlePathologyReportChange(e.target.value)}
                  className="input-base mt-2"
                />
              </div>
              <MedicineField
                label="Enter patient's symptoms"
                error={editedDataError.symptomsErr}
                value={editedData.symptoms}
                onChange={handleSymptomsChange}
                data={homeopathySymptoms}
                customData={contxt.customSuggestions.symptoms}
                helpText={
                  <span className="text-red-600">{editedDataError.symptoms}</span>
                }
              />
              <MedicineField
                label="Enter patient's medicines"
                value={editedData.medicines}
                error={editedDataError.medicinesErr}
                onChange={handleMedicinesChange}
                customData={contxt.customSuggestions.medicines}
                helpText={
                  <span className="text-red-600">{editedDataError.medicines}</span>
                }
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setActiveAdd(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                onClick={onSubmitAddedData}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
      {activeEdit && (
        <div className="modal-overlay">
          <div className="modal-panel">
            <h2 className="text-lg font-semibold text-slate-900">Edit record</h2>
            <p className="mt-2 text-sm text-slate-600">Update the selected entry details below.</p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Enter Date</label>
                <input
                  type="date"
                  value={editedData.date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="input-base mt-2"
                />
                {editedDataError.dateErr && (
                  <p className="mt-1 text-sm text-red-600">{editedDataError.date}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Pathology Report</label>
                <input
                  type="text"
                  value={editedData.pathology_report}
                  onChange={(e) => handlePathologyReportChange(e.target.value)}
                  className="input-base mt-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Fee</label>
                <input
                  type="text"
                  value={editedData.fee}
                  onChange={(e) => handleFeeChange(e.target.value)}
                  className="input-base mt-2"
                />
              </div>
              <MedicineField
                label="Symptoms"
                error={editedDataError.symptomsErr}
                value={editedData.symptoms}
                onChange={handleSymptomsChange}
                data={homeopathySymptoms}
                customData={contxt.customSuggestions.symptoms}
                helpText={
                  <span className="text-red-600">{editedDataError.symptoms}</span>
                }
              />
              <MedicineField
                label="Medicines"
                value={editedData.medicines}
                error={editedDataError.medicinesErr}
                onChange={handleMedicinesChange}
                customData={contxt.customSuggestions.medicines}
                helpText={
                  <span className="text-red-600">{editedDataError.medicines}</span>
                }
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setActiveEdit(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                onClick={onSubmitEditedData}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {activeDel && (
        <div className="modal-overlay">
          <div className="modal-panel max-w-md">
            <h2 className="text-lg font-semibold text-slate-900">Delete record</h2>
            <p className="mt-2 text-sm text-slate-600">Do you really want to delete this? This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setActiveDel(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                onClick={onDeleteData}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {activeEditDetails && (
        <div className="modal-overlay">
          <div className="modal-panel max-w-xl">
            <h2 className="text-lg font-semibold text-slate-900">Edit Patient Details</h2>
            <p className="mt-2 text-sm text-slate-600">Update the patient information and save the changes.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Name</label>
                <input
                  type="text"
                  value={editedPatientDetails.name}
                  onChange={(e) => handlePatientNameChange(e.target.value)}
                  className="input-base mt-2"
                />
                {editedPatientDetailsError.nameErr && (
                  <p className="mt-1 text-sm text-red-600">{editedPatientDetailsError.nameErr}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Mobile No.</label>
                <input
                  type="text"
                  value={editedPatientDetails.contact_no}
                  onChange={(e) => handlePatientContactChange(e.target.value)}
                  className="input-base mt-2"
                />
                {editedPatientDetailsError.contact_noErr && (
                  <p className="mt-1 text-sm text-red-600">{editedPatientDetailsError.contact_noErr}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Age</label>
                <input
                  type="text"
                  value={editedPatientDetails.patient_age}
                  onChange={(e) => handlePatientAgeChange(e.target.value)}
                  className="input-base mt-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Location</label>
                <input
                  type="text"
                  value={editedPatientDetails.location}
                  onChange={(e) => handlePatientLocationChange(e.target.value)}
                  className="input-base mt-2"
                />
                {editedPatientDetailsError.locationErr && (
                  <p className="mt-1 text-sm text-red-600">{editedPatientDetailsError.locationErr}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700">Gender</label>
                <input
                  type="text"
                  value={editedPatientDetails.gender}
                  onChange={(e) => handlePatientGenderChange(e.target.value)}
                  className="input-base mt-2"
                />
                {editedPatientDetailsError.genderErr && (
                  <p className="mt-1 text-sm text-red-600">{editedPatientDetailsError.genderErr}</p>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setActiveEditDetails(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                onClick={onSubmitEditedPatientDetails}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetails;
