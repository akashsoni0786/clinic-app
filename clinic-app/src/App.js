
import './App.css';
import HistoryTable from './Components/Pages/History/historyTable';
import Login from './Components/Pages/Login/login';
import PatientDetails from './Components/Pages/PatientDetails/PatientDetails';
import PatientForm from './Components/Pages/PatientForm/patientForm';
import { Route, Routes } from "react-router-dom";
function App() {
  return (
    <div>
       <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/history" element={<HistoryTable />} />
        <Route path="/patientform" element={<PatientForm />} />
        <Route path="/patientdetails" element={<PatientDetails />} />
      </Routes>
    </div>
  );
}

export default App;
