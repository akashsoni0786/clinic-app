import { Tabs, Banner, Button } from "@shopify/polaris";
import { useState, useCallback, useEffect } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import HistoryTable from "./Components/Pages/History/historyTable";
import Home from "./Components/Pages/HomePage/Home";
import Login from "./Components/Pages/Login/login";
import PatientDetails from "./Components/Pages/PatientDetails/PatientDetails";
import PatientForm from "./Components/Pages/PatientForm/patientForm";
import AdminPanel from "./Components/Pages/Admin/AdminPanel";
import Settings from "./Components/Pages/Settings/Settings";
import { contxtname } from "./Context/appcontext";
import React from "react";

function Panel() {
  const contxt = React.useContext(contxtname);
  const isAdmin = contxt.loggedIn.role === "admin";
  const [selected, setSelected] = useState(0);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const navigate = useNavigate();

  const baseTabs = [
    { id: "history", content: "All Patients", accessibilityLabel: "All Patients", panelID: "/history" },
    { id: "add-new-patient", content: "Add New Patient", panelID: "/patientform" },
  ];
  const adminTabs = [
    { id: "admin", content: "Users", panelID: "/admin" },
    { id: "settings", content: "Settings", panelID: "/settings" },
  ];
  const tabs = isAdmin ? [...baseTabs, ...adminTabs] : baseTabs;

  const handleTabChange = useCallback((selectedTabIndex) => {
    setSelected(selectedTabIndex);
    navigate(tabs[selectedTabIndex].panelID);
  }, [tabs]);

  useEffect(() => {
    navigate("/history");
  }, []);

  // Register update event listeners via contextBridge
  useEffect(() => {
    if (window.api && window.api.onUpdateAvailable) {
      const unlistenAvailable = window.api.onUpdateAvailable(() => setUpdateAvailable(true));
      const unlistenDownloaded = window.api.onUpdateDownloaded(() => setUpdateReady(true));
      return () => {
        if (unlistenAvailable) unlistenAvailable();
        if (unlistenDownloaded) unlistenDownloaded();
      };
    }
  }, []);

  const handleLogout = async () => {
    await window.api.invoke("auth:logout", contxt.loggedIn.token);
    contxt.setLoggedIn({ id: "", username: "", name: "", role: null, token: null, loggedin: false });
  };

  return (
    <div>
      {updateReady && (
        <Banner
          status="info"
          action={{ content: "Install & Restart", onAction: () => window.api.invoke("update:install") }}
        >
          Update downloaded. Restart the app to apply.
        </Banner>
      )}
      {updateAvailable && !updateReady && (
        <Banner status="info">A new update is downloading…</Banner>
      )}
      <div className="app-header">
        <div className="brand">
          <img src="logo.png" alt="MediTrack" className="brand-logo" />
          <span className="brand-name">MediTrack</span>
        </div>
        <div className="header-user">
          <span><strong>{contxt.loggedIn.name}</strong> &nbsp;·&nbsp; {contxt.loggedIn.role}</span>
          <Button size="slim" onClick={handleLogout}>Logout</Button>
        </div>
      </div>
      <Tabs tabs={tabs} selected={selected} onSelect={handleTabChange}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/history" element={<HistoryTable />} />
          <Route path="/patientform" element={<PatientForm />} />
          <Route path="/patientdetails" element={<PatientDetails />} />
          {isAdmin && <Route path="/admin" element={<AdminPanel />} />}
          {isAdmin && <Route path="/settings" element={<Settings />} />}
        </Routes>
      </Tabs>
    </div>
  );
}

export default Panel;
