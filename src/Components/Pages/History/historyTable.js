import React, { useEffect, useMemo, useState } from "react";
import { contxtname } from "../../../Context/appcontext";
import { useNavigate } from "react-router-dom";

const HistoryTable = () => {
  const contxt = React.useContext(contxtname);
  const [delId, setDelId] = useState("");
  const [activeDel, setActiveDel] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = contxt.loggedIn.token;
        const [patients, suggestions] = await Promise.all([
          window.api.invoke("patients:getAll", token),
          window.api.invoke("suggestions:get", token),
        ]);
        contxt.setPatientList(patients);
        contxt.setCustomSuggestions(suggestions);
      } catch (e) {
        console.log("Error fetching data:", e);
      }
    };
    fetchData();
  }, [contxt]);

  const filteredPatients = useMemo(() => {
    const list = contxt.patientList ?? [];
    return [...list].reverse().filter((patient) => {
      const matchesSearch =
        !inputValue ||
        patient.name.toLowerCase().includes(inputValue.toLowerCase()) ||
        patient.id.includes(inputValue);
      const matchesDate = !dateFilter || patient.date === dateFilter;
      return matchesSearch && matchesDate;
    });
  }, [contxt.patientList, inputValue, dateFilter]);

  const onDeleteData = async () => {
    try {
      const token = contxt.loggedIn.token;
      await window.api.invoke("patients:delete", token, delId);
      const patientList = await window.api.invoke("patients:getAll", token);
      contxt.setPatientList(patientList);
      setDelId("");
      setActiveDel(false);
    } catch (er) {
      console.log(er);
    }
  };

  return (
    <div className="container">
      <div className="form-horizon-btw p25">
        <div className="form-horizon-start">
          <img alt="history pic" src="history.png" className="patient-pic" />
          <h1 className="page-heading">History of Patients</h1>
        </div>
        <div className="form-horizon child-mar-15 flex-wrap gap-3">
          <input
            type="search"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search by name or registration no."
            className="input-base w-full max-w-sm"
          />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input-base max-w-[220px]"
          />
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
            onClick={() => setDateFilter("")}
          >
            Clear filter
          </button>
        </div>
      </div>
      <div className="p25 table-scroll">
        <table className="min-w-full divide-y divide-slate-200 bg-white text-left shadow-sm rounded-3xl overflow-hidden">
          <thead className="bg-slate-50 text-sm uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Registration no.</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Disease</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {filteredPatients.map((rowdata) => (
              <tr key={rowdata.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sky-700 font-semibold">
                  <button
                    type="button"
                    className="text-left text-sm font-medium text-sky-600 hover:underline"
                    onClick={() => navigate("/patientdetails", { state: { rowdata } })}
                  >
                    {rowdata.id}
                  </button>
                </td>
                <td className="px-4 py-3">{rowdata.name}</td>
                <td className="px-4 py-3">{rowdata.date}</td>
                <td className="px-4 py-3">{rowdata.desease}</td>
                <td className="px-4 py-3">{rowdata.location}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200"
                      onClick={() => navigate("/patientdetails", { state: { rowdata } })}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm text-red-700 hover:bg-red-100"
                      onClick={() => {
                        setActiveDel(true);
                        setDelId(rowdata.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredPatients.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  No patients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {activeDel && (
        <div className="modal-overlay">
          <div className="modal-panel">
            <h2 className="text-lg font-semibold text-slate-900">Delete patient record?</h2>
            <p className="mt-2 text-sm text-slate-600">
              This action cannot be undone. Are you sure you want to delete this patient?
            </p>
            <div className="mt-6 flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setActiveDel(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                onClick={onDeleteData}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryTable;
