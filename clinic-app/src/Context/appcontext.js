import React, { useState } from "react";
import apicall from "../database/db";
export const contxtname = React.createContext();
export const Context = (props) => {
  const [patientList, setPatientList] = useState([]);
  const [loggedIn, setLoggedIn] = useState({username:"",password:"",loggedin:false});
  React.useEffect(() => {
    const ax = async () => {
      try {
        let patients = await apicall.get("/patients");
        setPatientList(patients.data);
      } catch (e) {
        console.log("Error :", e);
      }
    };
    ax();
  }, []);

  return (
    <contxtname.Provider
      value={{
        patientList: patientList,
        setPatientList: setPatientList,
        loggedIn: loggedIn,
        setLoggedIn: setLoggedIn,
      }}
    >
      {props.children}


      
    </contxtname.Provider>
  );
};
