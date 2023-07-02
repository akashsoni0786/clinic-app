import { LegacyCard, Tabs } from "@shopify/polaris";
import { useState, useCallback, useEffect } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import HistoryTable from "./Components/Pages/History/historyTable";
import Home from "./Components/Pages/HomePage/Home";
import Login from "./Components/Pages/Login/login";
import PatientDetails from "./Components/Pages/PatientDetails/PatientDetails";
import PatientForm from "./Components/Pages/PatientForm/patientForm";
function Panel() {
  const [selected, setSelected] = useState(0);
  const navigate = useNavigate();

  const handleTabChange = useCallback((selectedTabIndex) => {
    setSelected(selectedTabIndex);
    navigate(tabs[selectedTabIndex].panelID);
  }, []);

  const tabs = [
    {
      id: "history",
      content: "All Patients",
      accessibilityLabel: "All Patients",
      panelID: "/history",
    },
    {
      id: "add-new-patient",
      content: "Add new patient",
      panelID: "/patientform",
    },
  ];
  useEffect(()=>{
    navigate("/history");
  },[]);

  return (
    <Tabs tabs={tabs} selected={selected} onSelect={handleTabChange} >
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/history" element={<HistoryTable />} />
        <Route path="/patientform" element={<PatientForm />} />
        <Route path="/patientdetails" element={<PatientDetails />} />
      </Routes>
    </Tabs>
  );
}

export default Panel;
