import React, { useEffect, useMemo, useState } from "react";
import { contxtname } from "../../../Context/appcontext";
import { useNavigate } from "react-router-dom";

const HistoryTable = () => {
  const contxt = React.useContext(contxtname);
  const [delId, setDelId] = useState("");
  const [activeDel, setActiveDel] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [chartStartDate, setChartStartDate] = useState("");
  const [chartEndDate, setChartEndDate] = useState("");
  const [expandedDates, setExpandedDates] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const groupsPerPage = 4;
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
    return [...list]
      .reverse()
      .filter((patient) => {
        const matchesSearch =
          !inputValue ||
          patient.name.toLowerCase().includes(inputValue.toLowerCase()) ||
          patient.id.includes(inputValue);
        const matchesDate = !dateFilter || patient.date === dateFilter;
        return matchesSearch && matchesDate;
      });
  }, [contxt.patientList, inputValue, dateFilter]);

  const groupedPatients = useMemo(() => {
    return filteredPatients.reduce((groups, patient) => {
      const dateKey = patient.date || "Unknown date";
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(patient);
      return groups;
    }, {});
  }, [filteredPatients]);

  const dateGroups = useMemo(() => {
    return Object.keys(groupedPatients)
      .sort((a, b) => (a < b ? 1 : -1))
      .map((date) => ({ date, rows: groupedPatients[date] }));
  }, [groupedPatients]);

  const earningsByDate = useMemo(() => {
    const totals = {};
    const addAmount = (date, amount) => {
      if (!date) return;
      totals[date] = (totals[date] || 0) + amount;
    };

    (contxt.patientList ?? []).forEach((patient) => {
      const baseFee = Number(patient.fee) || 0;
      addAmount(patient.date, baseFee);
      if (Array.isArray(patient.dateWiseData)) {
        patient.dateWiseData.forEach((entry) => {
          addAmount(entry.todaydate || patient.date, Number(entry.fee) || 0);
        });
      }
    });

    return Object.keys(totals)
      .sort((a, b) => new Date(a) - new Date(b))
      .map((date) => ({ date, amount: totals[date] }));
  }, [contxt.patientList]);

  const filteredEarnings = useMemo(() => {
    const start = chartStartDate ? new Date(chartStartDate).getTime() : null;
    const end = chartEndDate ? new Date(chartEndDate).getTime() : null;
    return earningsByDate.filter(({ date }) => {
      const time = new Date(date).getTime();
      if (Number.isNaN(time)) return false;
      if (start && time < start) return false;
      if (end && time > end) return false;
      return true;
    });
  }, [earningsByDate, chartStartDate, chartEndDate]);

  const chartData = filteredEarnings.length ? filteredEarnings : earningsByDate.slice(-7);
  const chartRangeTotal = chartData.reduce((sum, item) => sum + item.amount, 0);
  const chartMax = Math.max(...chartData.map((item) => item.amount), 1);

  const chartPatientCount = useMemo(() => {
    const ids = new Set();
    const start = chartStartDate ? new Date(chartStartDate).getTime() : null;
    const end = chartEndDate ? new Date(chartEndDate).getTime() : null;

    (contxt.patientList ?? []).forEach((patient) => {
      const registerTime = new Date(patient.date).getTime();
      if (!Number.isNaN(registerTime) && (!start || registerTime >= start) && (!end || registerTime <= end)) {
        ids.add(patient.id);
      }
      if (Array.isArray(patient.dateWiseData)) {
        patient.dateWiseData.forEach((entry) => {
          const entryTime = new Date(entry.todaydate || patient.date).getTime();
          if (!Number.isNaN(entryTime) && (!start || entryTime >= start) && (!end || entryTime <= end)) {
            ids.add(patient.id);
          }
        });
      }
    });
    return ids.size;
  }, [contxt.patientList, chartStartDate, chartEndDate]);

  const pageCount = Math.max(1, Math.ceil(dateGroups.length / groupsPerPage));
  const pagedDateGroups = useMemo(() => {
    const start = (currentPage - 1) * groupsPerPage;
    return dateGroups.slice(start, start + groupsPerPage);
  }, [dateGroups, currentPage]);

  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount);
  }, [currentPage, pageCount]);

  const toggleDateGroup = (date) => {
    setExpandedDates((current) => ({
      ...current,
      [date]: !current[date],
    }));
  };

  const isDateExpanded = (date) =>
    expandedDates[date] !== undefined ? expandedDates[date] : true;

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
        <div className="form-horizon flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex flex-1 flex-col gap-4 lg:flex-row">
            <input
              type="search"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search by name or registration no."
              className="input-base w-full max-w-sm h-10"
            />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input-base max-w-[220px] h-10"
            />
            <button
              type="button"
              className="rounded-full w-[max-content] border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
              onClick={() => setDateFilter("")}
            >
              Clear
            </button>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">From date</span>
                <input
                  type="date"
                  value={chartStartDate}
                  onChange={(e) => setChartStartDate(e.target.value)}
                  className="input-base w-full h-10"
                />
              </label>
              <label className="block text-sm text-slate-600">
                <span className="mb-1 block font-medium text-slate-700">To date</span>
                <input
                  type="date"
                  value={chartEndDate}
                  onChange={(e) => setChartEndDate(e.target.value)}
                  className="input-base w-full h-10"
                />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200"
                onClick={() => {
                  setChartStartDate("");
                  setChartEndDate("");
                }}
              >
                Reset range
              </button>
              <span className="text-sm text-slate-500">
                {chartStartDate || chartEndDate
                  ? `Showing ${chartStartDate || "start"} to ${chartEndDate || "end"}`
                  : "Showing latest 7 dates"}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-[0.95fr_0.45fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="form-horizon-btw">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Earnings by date</h2>
              <p className="mt-1 text-sm text-slate-500">Use the date range to inspect daily income.</p>
            </div>
            <div className="text-right text-sm text-slate-500">
              Total ₹{chartRangeTotal.toLocaleString()}
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {chartData.length > 0 ? (
              chartData.map((item) => (
                <div key={item.date} className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-700">
                    <span>{new Date(item.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    <span className="font-semibold">₹ {item.amount.toLocaleString()}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-sky-600"
                      style={{ width: `${(item.amount / chartMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No earnings data available for this range.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Range summary</h2>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between rounded-3xl bg-slate-50 px-4 py-3">
              <span>Distinct patients in range</span>
              <span className="font-semibold text-slate-900">{chartPatientCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-3xl bg-slate-50 px-4 py-3">
              <span>Daily dates shown</span>
              <span className="font-semibold text-slate-900">{chartData.length}</span>
            </div>
          </div>
        </section>
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
          <tbody className="text-sm">
            {pagedDateGroups.length > 0 ? (
              pagedDateGroups.map(({ date, rows }) => {
                const expanded = isDateExpanded(date);
                return (
                  <React.Fragment key={date}>
                    <tr className="bg-slate-100">
                      <td colSpan={6} className="px-4 py-3 text-sm font-semibold text-slate-700">
                        <button
                          type="button"
                          className="flex w-full items-center justify-between text-left"
                          onClick={() => toggleDateGroup(date)}
                        >
                          <span>
                            {new Date(date).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })} ({rows.length})
                          </span>
                          <span className="text-slate-500">{expanded ? "−" : "+"}</span>
                        </button>
                      </td>
                    </tr>
                    {expanded &&
                      rows.map((rowdata) => (
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
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  No patients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <span>
            Page {currentPage} of {pageCount}
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              Previous
            </button>
            <button
              type="button"
              disabled={currentPage === pageCount}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
            >
              Next
            </button>
          </div>
        </div>
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
