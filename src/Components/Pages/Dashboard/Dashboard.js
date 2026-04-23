import React, { useEffect, useMemo, useState } from "react";
import { contxtname } from "../../../Context/appcontext";

const Dashboard = () => {
  const contxt = React.useContext(contxtname);
  const [loading, setLoading] = useState(false);
  const [chartStartDate, setChartStartDate] = useState("");
  const [chartEndDate, setChartEndDate] = useState("");
  const [chartType, setChartType] = useState("column");
  const [metricFilter, setMetricFilter] = useState("earnings");

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

  const patientTrendByDate = useMemo(() => {
    const totals = {};
    const start = chartStartDate ? new Date(chartStartDate).getTime() : null;
    const end = chartEndDate ? new Date(chartEndDate).getTime() : null;

    const addRecord = (date) => {
      if (!date) return;
      const time = new Date(date).getTime();
      if (Number.isNaN(time)) return;
      if (start && time < start) return;
      if (end && time > end) return;
      totals[date] = (totals[date] || 0) + 1;
    };

    (contxt.patientList ?? []).forEach((patient) => {
      addRecord(patient.date);
      if (Array.isArray(patient.dateWiseData)) {
        patient.dateWiseData.forEach((entry) => addRecord(entry.todaydate || patient.date));
      }
    });

    return Object.keys(totals)
      .sort((a, b) => new Date(a) - new Date(b))
      .map((date) => ({ date, count: totals[date] }));
  }, [contxt.patientList, chartStartDate, chartEndDate]);

  const patientTrendMax = Math.max(...patientTrendByDate.map((item) => item.count), 1);

  const patientRegistrationsByDate = useMemo(() => {
    const totals = {};
    const start = chartStartDate ? new Date(chartStartDate).getTime() : null;
    const end = chartEndDate ? new Date(chartEndDate).getTime() : null;

    (contxt.patientList ?? []).forEach((patient) => {
      const date = patient.date;
      if (!date) return;
      const time = new Date(date).getTime();
      if (Number.isNaN(time)) return;
      if (start && time < start) return;
      if (end && time > end) return;
      totals[date] = (totals[date] || 0) + 1;
    });

    return Object.keys(totals)
      .sort((a, b) => new Date(a) - new Date(b))
      .map((date) => ({ date, count: totals[date] }));
  }, [contxt.patientList, chartStartDate, chartEndDate]);

  const topDiseasesSeries = useMemo(() => {
    return topDiseases.map((item) => ({ label: item.disease, value: item.count }));
  }, [topDiseases]);

  const activeChartData = useMemo(() => {
    if (metricFilter === "visits") return patientTrendByDate.map((item) => ({ label: item.date, value: item.count }));
    if (metricFilter === "patients") return patientRegistrationsByDate.map((item) => ({ label: item.date, value: item.count }));
    if (metricFilter === "diseases") return topDiseasesSeries;
    return chartData.map((item) => ({ label: item.date, value: item.amount }));
  }, [metricFilter, chartData, patientTrendByDate, patientRegistrationsByDate, topDiseasesSeries]);

  const activeMetricLabel = useMemo(() => {
    if (metricFilter === "visits") return "Visits by date";
    if (metricFilter === "patients") return "Patients registered";
    if (metricFilter === "diseases") return "Top diseases";
    return "Earnings by date";
  }, [metricFilter]);

  const activeChartMax = Math.max(...activeChartData.map((item) => item.value), 1);
  const activeChartTotal = activeChartData.reduce((sum, item) => sum + item.value, 0);

  const renderChart = () => {
    if (activeChartData.length === 0) {
      return (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No chart data available for this selection.
        </div>
      );
    }

    if (metricFilter === "diseases") {
      return (
        <div className="space-y-4">
          {activeChartData.map((item) => {
            const width = (item.value / activeChartMax) * 100;
            return (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <span>{item.label}</span>
                  <span className="font-semibold">{item.value}</span>
                </div>
                <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-sky-600" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    const svgWidth = Math.max(520, activeChartData.length * 90);
    const svgHeight = 280;
    const chartTop = 24;
    const chartBottom = svgHeight - 50;
    const chartLeft = 50;
    const chartRight = svgWidth - 20;
    const chartHeight = chartBottom - chartTop;
    const chartWidth = chartRight - chartLeft;
    const barWidth = Math.min(40, chartWidth / Math.max(activeChartData.length, 1) * 0.6);

    const points = activeChartData.map((item, index) => {
      const x = chartLeft + (activeChartData.length === 1 ? chartWidth / 2 : (chartWidth / (activeChartData.length - 1)) * index);
      const y = chartBottom - (item.value / activeChartMax) * chartHeight;
      return { x, y, label: item.label, value: item.value };
    });

    const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartBottom} L ${points[0].x} ${chartBottom} Z`;

    return (
      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div style={{ minWidth: svgWidth }}>
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full">
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.38" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
              </linearGradient>
            </defs>
            <g className="stroke-slate-300" strokeWidth="1">
              {[0, 1, 2, 3].map((index) => {
                const y = chartTop + (chartHeight / 3) * index;
                return <line key={index} x1={chartLeft} y1={y} x2={chartRight} y2={y} strokeDasharray="4 4" />;
              })}
            </g>
            {[0, 1, 2, 3].map((index) => {
              const value = Math.round(activeChartMax - (activeChartMax / 3) * index);
              const y = chartTop + (chartHeight / 3) * index + 4;
              return (
                <text key={index} x={chartLeft - 10} y={y} textAnchor="end" fontSize="11" fill="#64748b">
                  {value}
                </text>
              );
            })}

            {chartType === "area" || chartType === "series" ? (
              <path d={areaPath} fill="url(#areaGradient)" />
            ) : null}

            {chartType !== "column" ? (
              <path
                d={linePath}
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="3"
                strokeDasharray={chartType === "series" ? "8 6" : "0"}
              />
            ) : null}

            {chartType === "column" &&
              points.map((point) => {
                const barHeight = Math.max(16, (point.value / activeChartMax) * chartHeight);
                return (
                  <rect
                    key={point.label}
                    x={point.x - barWidth / 2}
                    y={chartBottom - barHeight}
                    width={barWidth}
                    height={barHeight}
                    rx="10"
                    fill="#0ea5e9"
                  />
                );
              })}

            {(chartType === "line" || chartType === "area" || chartType === "series") &&
              points.map((point) => (
                <circle key={point.label} cx={point.x} cy={point.y} r="4" fill="#0ea5e9" stroke="#ffffff" strokeWidth="2" />
              ))}

            {points.map((point) => (
              <text key={`${point.label}-label`} x={point.x} y={svgHeight - 24} textAnchor="middle" fontSize="11" fill="#475569">
                {point.label}
              </text>
            ))}

            <line x1={chartLeft} y1={chartBottom} x2={chartRight} y2={chartBottom} stroke="#cbd5e1" strokeWidth="1" />
          </svg>
        </div>
      </div>
    );
  };

  const totalTrendDays = patientTrendByDate.length;
  const averageDailyPatients = totalTrendDays
    ? Math.round(patientTrendByDate.reduce((sum, item) => sum + item.count, 0) / totalTrendDays)
    : 0;

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
<p className="mt-3 text-3xl font-semibold text-slate-900 break-all">
  ₹ {todayEarnings.toLocaleString()}
</p>        <p className="mt-2 text-sm text-slate-500">Clinic income recorded for today.</p>
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
          <div className="grid gap-4 xl:grid-cols-2">
          <section>
            <div className="form-horizon-btw">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{activeMetricLabel}</h2>
                <p className="mt-1 text-sm text-slate-500">Use the date range and chart type to explore clinic data.</p>
              </div>
              <div className="text-right text-sm text-slate-500">
                {metricFilter === "diseases" ? `Total ${activeChartTotal} cases` : `Total ${activeChartTotal.toLocaleString()}`}
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
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">Chart metric</div>
                <select
                  value={metricFilter}
                  onChange={(e) => setMetricFilter(e.target.value)}
                  className="input-base mt-3 w-full"
                >
                  <option value="earnings">Earnings by date</option>
                  <option value="visits">Visits by date</option>
                  <option value="patients">New patients by date</option>
                  <option value="diseases">Top diseases</option>
                </select>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">Chart type</div>
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value)}
                  className="input-base mt-3 w-full "
                >
                  <option value="column">Column chart</option>
                  <option value="line">Line chart</option>
                  <option value="area">Area chart</option>
                  <option value="series">Series chart</option>
                </select>
              </div>
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
            </div>
            <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <div className="font-semibold text-slate-900">Current selection</div>
              <div className="mt-2">Metric: {activeMetricLabel}</div>
              <div>Chart type: {chartType === "column" ? "Column chart" : chartType === "line" ? "Line chart" : chartType === "area" ? "Area chart" : "Series chart"}</div>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-slate-500">
                {chartStartDate || chartEndDate
                  ? `Showing ${chartStartDate || "start"} to ${chartEndDate || "end"}`
                  : "Showing latest 7 dates"}
              </div>
              <div className="text-sm font-medium text-slate-700">{activeMetricLabel}</div>
            </div>
            <div className="mt-5">{renderChart()}</div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-lg font-semibold text-slate-900">Range summary</h2>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between rounded-3xl bg-white px-4 py-3">
                <span>Distinct patients in range</span>
                <span className="font-semibold text-slate-900">{chartPatientCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-3xl bg-white px-4 py-3">
                <span>Active data points</span>
                <span className="font-semibold text-slate-900">{activeChartData.length}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="mt-8 grid gap-4 xl:grid-cols-2 px-5">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="form-horizon-btw">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Patient trend</h2>
              <p className="mt-1 text-sm text-slate-500">Daily visits and consultations in the selected range.</p>
            </div>
            <div className="text-right text-sm text-slate-500">
              Avg {averageDailyPatients} visits/day
            </div>
          </div>
          {patientTrendByDate.length > 0 ? (
            <div className="mt-6 grid gap-4">
              {patientTrendByDate.map((item) => (
                <div key={item.date} className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-700">
                    <span>{new Date(item.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    <span className="font-semibold">{item.count} visits</span>
                  </div>
                  <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${(item.count / patientTrendMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              No trend data available for the selected range.
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="form-horizon-btw">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Top diseases</h2>
              <p className="mt-1 text-sm text-slate-500">Most frequent conditions from your clinic records.</p>
            </div>
            <div className="text-right text-sm text-slate-500">
              {topDiseases.reduce((sum, item) => sum + item.count, 0)} cases
            </div>
          </div>
          {topDiseases.length > 0 ? (
            <div className="mt-5 space-y-3">
              {topDiseases.map((item) => {
                const maxCount = topDiseases[0]?.count || 1;
                return (
                  <div key={item.disease} className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-slate-700">
                      <span>{item.disease}</span>
                      <span className="font-semibold">{item.count}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-sky-600"
                        style={{ width: `${(item.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              No disease summary available yet.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
