import React from "react";
import {
  Form,
  TextField,
  Button,
  ChoiceList,
  Scrollable,
} from "@shopify/polaris";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { contxtname } from "../../../Context/appcontext";
import MedicineField from "../../common/MedicineField";
import homeopathySymptoms from "../../../data/homeopathySymptoms";
import homeopathyDiseases from "../../../data/homeopathyDiseases";
const PatientForm = () => {
  const contxt = React.useContext(contxtname);
  let date = new Date();
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
    let errors = {
      name: false,
      nameErr: "",
      contact_no: false,
      contact_noErr: "",
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
      desease:false,
      deseaseErr:"",
      fee:"",
    };
    Object.keys(patient).forEach((data) => {
      if (patient[data] === "" && data !== "registration_no" && data !== "contact_no") {
        errors = {
          ...errors,
          [data]: true,
          [data + "Err"]: "Please enter here!",
        };
      }
    });
    let flag = false;
    Object.keys(errors).forEach((data) => {
      if (errors[data] && errors[data + "Err"] !== "") {
        flag = true;
      }
    });
    if (flag) {
      setPatientError(errors);
    } else {
      let tempdata = {...patient};
      tempdata["dateWiseData"] = [
        {
          todaydate: patient.date,
          daysymptoms: patient.symptoms,
          daymedicines: patient.medicines,
          pathology_report:patient.pathology_report,
          fee:patient.fee
        },
      ];
      try {
        const token = contxt.loggedIn.token;
        await window.api.invoke("patients:add", token, tempdata);
        const patients = await window.api.invoke("patients:getAll", token);
        contxt.setPatientList(patients);
        navigate("/history");
      } catch (e) {
        console.log("Error : ", e);
      }
      // console.log(patient)
    }
  };
  const handlePatientname = (value) => {
    setPatient({
      ...patient,
      name: value,
    });
  };
  const handleContactNoChange = (value) => {
    if (/^\d*$/.test(value)) {
      setPatient({
        ...patient,
        contact_no: value.slice(0, 10),
      });
    }
  };
    const handleAgeChange = (value) => {
    if (/^\d*$/.test(value)) {
      setPatient({
        ...patient,
        patient_age: value.slice(0, 3),
      });
    }
  };
  const handleFeeChange = (value) => {
    if (/^\d*$/.test(value)) {
      setPatient({
        ...patient,
        fee: value,
      });
    }
  };
  const handleDateChange = (value) => {
    setPatient({
      ...patient,
      date: value,
    });
  };
  const handleGenderChange = (value) => {
    setPatient({
      ...patient,
      gender: value[0],
    });
  };
  const handleLocationChange = (value) => {
    setPatient({
      ...patient,
      location: value,
    });
  };
  const handlePathologyReportChange = (value) => {
    setPatient({
      ...patient,
      pathology_report: value,
    });
  };
  const handleSymptomsChange = (value) => {
    setPatient({
      ...patient,
      symptoms: value,
    });
  };
  const handleDeseasename = (value) => {
    setPatient({
      ...patient,
      desease: value,
    });
  };
  const handleMedicinesChange = (value) => {
    setPatient({
      ...patient,
      medicines: value,
    });
  };

  const handleReset = () => {
    setPatient({
      id: regno,
      name: "",
      contact_no: "",
      date: today,
      gender: "",
      location: "Lucknow",
      symptoms: "",
      medicines: "",
      desease: "",
      dateWiseData: [{ todaydate: "", daysymptoms: "", daymedicines: "",pathology_report:"",fee:"" }],
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
          <Button onClick={handleReset}>Reset</Button>
          <Form>
            <Button onClick={handleSubmit} primary>
              Submit
            </Button>
          </Form>
        </div>
      </div>
      <div className="p25">
        <Form onSubmit={handleSubmit}>
          <Scrollable shadow style={{ height: "80vh" }}>
            <TextField
              label="Registration number"
              disabled
              value={regno}
              type="text"
              helpText={
                <span>
                  We’ll use this Registration number for records only.
                </span>
              }
            />
            <TextField
              label="Enter patient name"
              value={patient.name}
              onChange={handlePatientname}
              type="text"
              error={patientError.name}
              helpText={
                <span style={{ color: "red" }}>{patientError.nameErr}</span>
              }
            />
            <TextField
              label="Enter patient's contact number"
              value={patient.contact_no}
              onChange={handleContactNoChange}
              prefix={"+91"}
              type="text"
              error={patientError.contact_no}
              helpText={
                <span style={{ color: "red" }}>
                  {patientError.contact_noErr}
                </span>
              }
            />
            <TextField
              label="Enter patient's age"
              value={patient.patient_age}
              onChange={handleAgeChange}
              type="text"
            />
            <TextField
              label="Enter Date"
              value={patient.date}
              error={patientError.date}
              onChange={handleDateChange}
              type="date"
              helpText={
                <span style={{ color: "red" }}>{patientError.dateErr}</span>
              }
            />
            <ChoiceList
              error={patientError.genderErr}
              choices={[
                { label: "Male", value: "Male" },
                { label: "Female", value: "Female" },
                { label: "Other", value: "Other" },
              ]}
              selected={patient.gender}
              onChange={handleGenderChange}
            />

            <TextField
              label="Enter location"
              error={patientError.location}
              value={patient.location}
              onChange={handleLocationChange}
              type="text"
              helpText={
                <span style={{ color: "red" }}>{patientError.locationErr}</span>
              }
            />
            <TextField
              label="Enter Pathalogy Report"
              error={patientError.pathology_report}
              value={patient.pathology_report}
              onChange={handlePathologyReportChange}
              type="text"
              multiline={5}
            />
            <MedicineField
              label="Enter patient's symptoms"
              error={patientError.symptoms}
              value={patient.symptoms}
              onChange={handleSymptomsChange}
              data={homeopathySymptoms}
              customData={contxt.customSuggestions.symptoms}
              helpText={
                <span style={{ color: "red" }}>{patientError.symptomsErr}</span>
              }
            />
            <MedicineField
              label="Enter desease name"
              value={patient.desease}
              onChange={handleDeseasename}
              data={homeopathyDiseases}
              customData={contxt.customSuggestions.diseases}
              error={patientError.desease}
              helpText={
                <span style={{ color: "red" }}>{patientError.deseaseErr}</span>
              }
            />
            <MedicineField
              label="Enter patient's medicines"
              value={patient.medicines}
              error={patientError.medicines}
              onChange={handleMedicinesChange}
              customData={contxt.customSuggestions.medicines}
              helpText={
                <span style={{ color: "red" }}>
                  {patientError.medicinesErr}
                </span>
              }
            />
            <TextField
              label="Enter Fee"
              value={patient.fee}
              onChange={handleFeeChange}
              type="text"
            />
          </Scrollable>
        </Form>
      </div>
    </div>
  );
};
export default PatientForm;
