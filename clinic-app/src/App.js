import "./App.css";
import HistoryTable from "./Components/Pages/History/historyTable";
import Home from "./Components/Pages/HomePage/Home";
import Login from "./Components/Pages/Login/login";
import PatientDetails from "./Components/Pages/PatientDetails/PatientDetails";
import PatientForm from "./Components/Pages/PatientForm/patientForm";
import { Navigate, Route, Routes } from "react-router-dom";
import Panel from "./Panel";
import { contxtname } from "./Context/appcontext";
import React from "react";
function App() {
  const contxt = React.useContext(contxtname);
  return (
    <div>
      {contxt.loggedIn.loggedin ? (
        <Panel />
      ) : (
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="*" element={<Navigate to={'/'} />} />
        </Routes>
      )}
    </div>
  );
}

export default App;
