import React, { useState } from 'react';
import apicall from '../database/db';
export const contxtname = React.createContext();
export const Context = (props) => {
  const [patientList, setPatientList] = useState([]);
  React.useEffect(()=>{
    const ax = async ()=>
    {
      try
      {
        let patients = await apicall.get("/patients");
        console.log("data ",patients.data)
        setPatientList(patients.data);
      }
      catch(e){
        console.log("Error :",e)
      }
    }
   ax();
  },[])

  return (
    <contxtname.Provider
      value=
      {{ 
        patientList: patientList, 
        setPatientList: setPatientList
      }}
    >
      {props.children}
    </contxtname.Provider>
  );
};