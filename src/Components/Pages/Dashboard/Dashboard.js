import React, { useEffect, useMemo, useState } from "react";
import { contxtname } from "../../../Context/appcontext";

const Dashboard = () => {
  const contxt = React.useContext(contxtname);
  const [loading, setLoading] = useState(false);
  const [chartStartDate, setChartStartDate] = useState("");
  const [chartEndDate, setChartEndDate] = useState("");

  useEffect(() => {
    if (!contxt.patientList?.length) {
      const fetchPatients = async () => {
        setLoading(true);
        try {
          const token = contxt.loggedIn.token;
          const patients = await window.api.invoke("patients:getAll", token);
          contxt.setPatientList(patients);
        } catch (error) {
          console.error("Dashboard load failed", error);
        } finally {
          setLoading(false);
        }
      };
      fetchPatients();
    }
  }, [contxt]);

  const totalPatients = contxt.patientList?.length || 0;
  const totalVisits = useMemo(
    () =>
      contxt.patientList?.reduce(
        (sum, patient) =>
          sum + (Array.isArray(patient.dateWiseData) ? patient.dateWiseData.length : 1),
        0
      ) || 0,
    [contxt.patientList]
  );
  const totalEarnings = useMemo(
    () =>
      contxt.patientList?.reduce((sum, patient) => {
        const baseFee = Number(patient.fee) || 0;
        const extraFees = Array.isArray(patient.dateWiseData)
          ? patient.dateWiseData.reduce((rowSum, entry) => rowSum + (Number(entry.fee) || 0), 0)
          : 0;
        return sum + baseFee + extraFees;
      }, 0) || 0,
    [contxt.patientList]
  );

  const todayEarnings = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    return (contxt.patientList || []).reduce((sum, patient) => {
      let total = 0;
      if (patient.date === todayKey) {
        total += Number(patient.fee) || 0;
      }
      if (Array.isArray(patient.dateWiseData)) {
        total += patient.dateWiseData.reduce((rowSum, entry) => {
          const entryDate = entry.todaydate || patient.date;
          return rowSum + (entryDate === todayKey ? Number(entry.fee) || 0 : 0);
        }, 0);
      }
      return sum + total;
    }, 0);
  }, [contxt.patientList]);

  const recentPatients = useMemo(
    () =>
      [...(contxt.patientList || [])]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5),
    [contxt.patientList]
  );

  const topDiseases = useMemo(() => {
    const counts = (contxt.patientList || []).reduce((acc, patient) => {
      const disease = patient.desease?.trim() || "Unknown";
      acc[disease] = (acc[disease] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([disease, count]) => ({ disease, count }));
  }, [contxt.patientList]);

  const patientsLast7Days = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return (contxt.patientList || []).filter((patient) => {
      const date = new Date(patient.date).getTime();
      return !Number.isNaN(date) && date >= sevenDaysAgo;
    }).length;
  }, [contxt.patientList]);

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

  return (
    <div>
      <div className="form-horizon-btw p25">
        <div>
          <h1 className="page-heading">Dashboard</h1>
          <p className="text-slate-600">Clinic performance and patient insights at a glance.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 px-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.16em] text-slate-500">Total patients</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{totalPatients}</p>
          <p className="mt-2 text-sm text-slate-500">Total registered patients in the clinic.</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.16em] text-slate-500">Today’s earnings</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">₹ {todayEarnings.toLocaleString()}</p>
          <p className="mt-2 text-sm text-slate-500">Clinic income recorded for today.</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.16em] text-slate-500">Visits / reports</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{totalVisits}</p>
          <p className="mt-2 text-sm text-slate-500">Number of visit records tracked across patients.</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.16em] text-slate-500">New patients (7 days)</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{patientsLast7Days}</p>
          <p className="mt-2 text-sm text-slate-500">Patients registered in the last week.</p>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm mx-5">
        <div className="grid gap-4 xl:grid-cols-[0.95fr_0.45fr] ">
          <section>
            <div className="form-horizon-btw">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Earnings by date</h2>
                <p className="mt-1 text-sm text-slate-500">Use the date range to inspect daily income.</p>
              </div>
              <div className="text-right text-sm text-slate-500">
                Total ₹{chartRangeTotal.toLocaleString()}
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
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
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">Clear filter</div>
                <p className="mt-2 text-sm text-slate-500">
                  Remove the current date range and show the default earnings view.
                </p>
                <button
                  type="button"
                  className="mt-4 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200"
                  onClick={() => {
                    setChartStartDate("");
                    setChartEndDate("");
                  }}
                >
                  Clear filters
                </button>
              </div>
              <div className="flex items-center text-sm text-slate-500">
                {chartStartDate || chartEndDate
                  ? `Showing ${chartStartDate || "start"} to ${chartEndDate || "end"}`
                  : "Showing latest 7 dates"}
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

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-lg font-semibold text-slate-900">Range summary</h2>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between rounded-3xl bg-white px-4 py-3">
                <span>Distinct patients in range</span>
                <span className="font-semibold text-slate-900">{chartPatientCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-3xl bg-white px-4 py-3">
                <span>Daily dates shown</span>
                <span className="font-semibold text-slate-900">{chartData.length}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="mt-8 grid gap-4 xl:grid-cols-[1.3fr_0.7fr] px-5">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="form-horizon-btw">
            <h2 className="text-lg font-semibold text-slate-900">Recent patients</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-600">
              Latest entries
            </span>
          </div>

          {loading ? (
            <div className="mt-6 text-sm text-slate-500">Loading patient data…</div>
          ) : recentPatients.length > 0 ? (
            <div className="mt-6 space-y-3">
              {recentPatients.map((patient) => (
                <div key={patient.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{patient.name || patient.id}</p>
                    <span className="text-sm text-slate-500">{patient.date || "—"}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">Disease: {patient.desease || "Unknown"}</p>
                  <p className="mt-1 text-sm text-slate-600">Fee: ₹ {Number(patient.fee || 0).toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 text-sm text-slate-500">No recent patient records available.</div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Top diseases</h2>
          <div className="mt-5 space-y-3">
            {topDiseases.length > 0 ? (
              topDiseases.map((item) => (
                <div key={item.disease} className="flex items-center justify-between rounded-3xl bg-slate-50 px-4 py-3">
                  <span className="text-sm font-medium text-slate-700">{item.disease}</span>
                  <span className="text-sm text-slate-500">{item.count} cases</span>
                </div>
              ))
            ) : (
              <div className="rounded-3xl bg-slate-50 px-4 py-5 text-sm text-slate-500">No disease summary available yet.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
