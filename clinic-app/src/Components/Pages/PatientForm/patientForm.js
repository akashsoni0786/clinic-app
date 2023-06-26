import React from 'react';
import {Form, TextField, Button, ChoiceList, Scrollable} from '@shopify/polaris';
import {useState} from 'react';
import apicall from '../../../database/db';
import { useNavigate } from 'react-router-dom';
import { contxtname } from '../../../Context/appcontext';
const PatientForm = () => {
  const contxt = React.useContext(contxtname);
  let date = new Date();
  const navigate = useNavigate();
  const [patientError,setPatientError] = useState({});
  const [regno] = useState(String(date.getFullYear())+String(date.getMonth())+String(date.getDate())+String(date.getHours())+String(date.getMinutes())+String(date.getSeconds())+String(date.getMilliseconds()));
  const [patient,setPatient] = useState({
    id:regno,
    name:"",
    contact_no:"",
    date:"",
    gender:"",
    location:"",
    symptoms:"",
    medicines:"",
  });
  const handleSubmit = async() => {
    let errors = {
      name:false,
      nameErr:"",
      contact_no:false,
      contact_noErr:"",
      date:false,
      dateErr:"",
      gender:false,
      genderErr:"",
      location:false,
      locationErr:"",
      symptoms:false,
      symptomsErr:"",
      medicines:false,
      medicinesErr:""
    };
    Object.keys(patient).forEach((data)=>{
      if(patient[data] === "" && data !== "registration_no") {
        errors = {
          ...errors,
          [data]:true,
          [data+"Err"]:"Please enter here!"
        }
      }
      else if(Number(patient.contact_no) < 0 || Number(patient.contact_no) < 1111111111 || Number(patient.contact_no) > 9999999999) {
        errors = {
          ...errors,
          contact_no:true,
          contact_noErr:"Invalid mobile number!"
        }
      }
    });
    let flag = false;
    Object.keys(errors).forEach((data)=>{
      if(errors[data] && errors[data+"Err"] !== "") {
        flag = true;
      }
    })
    if(flag){
      setPatientError(errors);
    } else{
      try {
        await apicall.post("/patients/", patient);
        let patients = await apicall.get("/patients");
        contxt.setPatientList(patients.data);
        navigate("/history");
      } catch (e) {
        console.log("Error : ",e);
      }
      // console.log(patient)
    }
    
  };
  const handlePatientname = (value) => {
    setPatient({
      ...patient,
      name:value
  })};
  const handleContactNoChange = (value) => {
    setPatient({
      ...patient,
      contact_no:value
  })};
  const handleDateChange = (value) => {
    setPatient({
      ...patient,
      date:value
  })};
  const handleGenderChange = (value) => {
    setPatient({
      ...patient,
      gender:value[0]
  })};
  const handleLocationChange = (value) => {
    setPatient({
      ...patient,
      location:value
  })};
  const handleSymptomsChange = (value) => {
    setPatient({
      ...patient,
      symptoms:value
  })};
  const handleMedicinesChange = (value) => {
    setPatient({
      ...patient,
      medicines:value
  })};
    
  return (
    <div className="container">
    <div className="form-horizon-btw p25">
    <div className="form-horizon-start">
    <img alt='patient pic' src='patient.png' className="patient-pic"/>
    <h1 className="page-heading">Add Patient</h1>
    </div>
    <div className='form-horizon child-mar-15'>
    <Button onClick={handleSubmit} >Reset</Button>
    <Form>
    <Button onClick={handleSubmit} primary>Submit</Button>
    </Form>
    </div>
    </div>
    <div className='p25'>
    <Form onSubmit={handleSubmit} >
    <Scrollable shadow style={{height: '80vh'}}>
    <TextField
        label="Registration number"
        disabled
        value={regno}
          type="text"
          helpText={
            <span >
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
            <span style={{color:"red"}}>
              {patientError.nameErr}
            </span>
          }
        />
        <TextField
        label="Enter patient's contact number"
        
          value={patient.contact_no}
          onChange={handleContactNoChange}
          prefix={"+91"}
          type="number"
          max={10}
          error={patientError.contact_no}
          helpText={
            <span style={{color:"red"}}>
              {patientError.contact_noErr}
            </span>
          }
        />
        <TextField
        label="Enter Date"
          value={patient.date}
          error={patientError.date}
          onChange={handleDateChange}
          type="date"
          helpText={
            <span style={{color:"red"}}>
             {patientError.dateErr}
            </span>
          }
        />
        <ChoiceList
        error={patientError.genderErr}
      choices={[
        {label: 'Male', value: 'Male'},
        {label: 'Female', value: 'Female'},
        {label: 'Other', value: 'Other'},
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
            <span style={{color:"red"}}>
             {patientError.locationErr}
            </span>
          }
        />
      <TextField
         label="Enter patient's symptoms"
         error={patientError.symptoms}
          value={patient.symptoms}
          onChange={handleSymptomsChange}
          type="text"
          multiline={5}
          helpText={
            <span style={{color:"red"}}>
             {patientError.symptomsErr}
            </span>
          }
        />
         <TextField
         label="Enter patient's medicines"
          value={patient.medicines}
          error={patientError.medicines}
          onChange={handleMedicinesChange}
          type="text"
          multiline={5}
          helpText={
            <span style={{color:"red"}}>
             {patientError.medicinesErr}
            </span>
          }
        />
         
        </Scrollable>
    </Form>
    </div>
  </div>
  );
}
export default PatientForm