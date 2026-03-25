import React, { useState } from "react";
export const contxtname = React.createContext();

export const Context = (props) => {
  const [patientList, setPatientList] = useState([]);
  const [loggedIn, setLoggedIn] = useState({
    id: "",
    username: "",
    name: "",
    role: null,
    token: null,
    loggedin: false,
  });

  return (
    <contxtname.Provider
      value={{
        patientList,
        setPatientList,
        loggedIn,
        setLoggedIn,
      }}
    >
      {props.children}
    </contxtname.Provider>
  );
};
