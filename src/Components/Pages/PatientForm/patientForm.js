import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { contxtname } from "../../../Context/appcontext";
import MedicineField from "../../common/MedicineField";
import homeopathySymptoms from "../../../data/homeopathySymptoms";
import homeopathyDiseases from "../../../data/homeopathyDiseases";

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
      },
    ],
  });

  const handleSubmit = async () => {
    const errors = {
      name: false,
      nameErr: "",
      date: false,
      dateErr: "",
      gender: false,
      genderErr: "",
      location: false,
      locationErr: "",
      symptoms: false,
      symptomsErr: "",
      medicines: false,
      medicinesErr: "",
      desease: false,
      deseaseErr: "",
    };

    if (!patient.name) {
      errors.name = true;
      errors.nameErr = "Please enter patient name.";
    }
    if (!patient.date) {
      errors.date = true;
      errors.dateErr = "Please select a date.";
    }
    if (!patient.gender) {
      errors.gender = true;
      errors.genderErr = "Please select a gender.";
    }
    if (!patient.location) {
      errors.location = true;
      errors.locationErr = "Please enter a location.";
    }
    if (!patient.symptoms) {
      errors.symptoms = true;
      errors.symptomsErr = "Please enter symptoms.";
    }
    if (!patient.medicines) {
      errors.medicines = true;
      errors.medicinesErr = "Please enter medicines.";
    }
    if (!patient.desease) {
      errors.desease = true;
      errors.deseaseErr = "Please enter disease name.";
    }

    const hasError = Object.values(errors).some((value) => value === true);
    if (hasError) {
      setPatientError(errors);
      return;
    }

    const tempdata = {
      ...patient,
      dateWiseData: [
        {
          todaydate: patient.date,
          daysymptoms: patient.symptoms,
          daymedicines: patient.medicines,
          pathology_report: patient.pathology_report,
          fee: patient.fee,
        },
      ],
    };

    try {
      const token = contxt.loggedIn.token;
      await window.api.invoke("patients:add", token, tempdata);
      const patients = await window.api.invoke("patients:getAll", token);
      contxt.setPatientList(patients);
      navigate("/history");
    } catch (e) {
      console.log("Error : ", e);
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
            className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>
      </div>
      <div className="p25">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
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
                  {['Male','Female','Other'].map((option) => (
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientForm;
