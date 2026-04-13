import React, { useState, useCallback, useEffect } from "react";
import { Route, Routes, useNavigate, useLocation } from "react-router-dom";
import HistoryTable from "./Components/Pages/History/historyTable";
import Home from "./Components/Pages/HomePage/Home";
import Login from "./Components/Pages/Login/login";
import PatientDetails from "./Components/Pages/PatientDetails/PatientDetails";
import PatientForm from "./Components/Pages/PatientForm/patientForm";
import AdminPanel from "./Components/Pages/Admin/AdminPanel";
import Settings from "./Components/Pages/Settings/Settings";
import { contxtname } from "./Context/appcontext";

function Panel() {
  const contxt = React.useContext(contxtname);
  const isAdmin = contxt.loggedIn.role === "admin";
  const [selected, setSelected] = useState(0);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const baseTabs = [
    { id: "history", content: "All Patients", panelID: "/history" },
    { id: "add-new-patient", content: "Add New Patient", panelID: "/patientform" },
  ];
  const adminTabs = [
    { id: "admin", content: "Users", panelID: "/admin" },
    { id: "settings", content: "Settings", panelID: "/settings" },
  ];
  const tabs = isAdmin ? [...baseTabs, ...adminTabs] : baseTabs;

  const handleTabChange = useCallback(
    (selectedTabIndex) => {
      setSelected(selectedTabIndex);
      navigate(tabs[selectedTabIndex].panelID);
    },
    [navigate, tabs]
  );

  useEffect(() => {
    const currentIndex = tabs.findIndex((tab) => tab.panelID === location.pathname);
    if (currentIndex !== -1) setSelected(currentIndex);
  }, [location.pathname, tabs]);

  useEffect(() => {
    if (location.pathname === "/" || location.pathname === "/home") {
      navigate("/history");
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (window.api && window.api.onUpdateAvailable) {
      const unlistenAvailable = window.api.onUpdateAvailable(() => setUpdateAvailable(true));
      const unlistenDownloaded = window.api.onUpdateDownloaded(() => setUpdateReady(true));
      return () => {
        if (unlistenAvailable) unlistenAvailable();
        if (unlistenDownloaded) unlistenDownloaded();
      };
    }
    return undefined;
  }, []);

  const handleLogout = async () => {
    await window.api.invoke("auth:logout", contxt.loggedIn.token);
    contxt.setLoggedIn({ id: "", username: "", name: "", role: null, token: null, loggedin: false });
  };

  return (
    <div>
      {updateReady && (
        <div className="bg-sky-50 border border-sky-200 text-sky-900 p-4 text-sm">
          <div className="font-semibold">Update downloaded.</div>
          <div className="mt-1">Restart the app to apply.</div>
          <button
            type="button"
            className="mt-3 inline-flex rounded-full bg-sky-600 px-3 py-1.5 text-white hover:bg-sky-700"
            onClick={() => window.api.invoke("update:install")}
          >
            Install & Restart
          </button>
        </div>
      )}
      {updateAvailable && !updateReady && (
        <div className="bg-slate-50 border border-slate-300 text-slate-900 p-4 text-sm">
          A new update is downloading…
        </div>
      )}
      <div className="app-header">
        <div className="brand">
          <img src="logo.png" alt="MediTrack" className="brand-logo" />
          <span className="brand-name">MediTrack</span>
        </div>
        <div className="header-user">
          <span>
            <strong>{contxt.loggedIn.name}</strong> &nbsp;·&nbsp; {contxt.loggedIn.role}
          </span>
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
      <nav className="mx-auto flex flex-wrap gap-2 px-4 py-3">
          {tabs.map((tab, idx) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(idx)}
              className={`rounded-full h-10 px-4 py-2 text-sm font-semibold ${
                idx === selected
                  ? "bg-sky-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab.content}
            </button>
          ))}
        </nav>
      <div className="container py-4">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/history" element={<HistoryTable />} />
          <Route path="/patientform" element={<PatientForm />} />
          <Route path="/patientdetails" element={<PatientDetails />} />
          {isAdmin && <Route path="/admin" element={<AdminPanel />} />}
          {isAdmin && <Route path="/settings" element={<Settings />} />}
        </Routes>
      </div>
    </div>
  );
}

export default Panel;
