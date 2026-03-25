import {
  Card,
  DataTable,
  Scrollable,
  Autocomplete,
  Icon,
  Button,
  Modal,
  LegacyStack,
  TextContainer,
  Popover,
  TextField,
} from "@shopify/polaris";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { SearchMinor, CalendarMinor } from "@shopify/polaris-icons";
import { contxtname } from "../../../Context/appcontext";
import { useNavigate } from "react-router-dom";

const HistoryTable = () => {
  const contxt = React.useContext(contxtname);
  const [rows, setRows] = useState([]);
  const [delId, setDelId] = useState("");
  const [activeDel, setActiveDel] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [datePopoverActive, setDatePopoverActive] = useState(false);
  const navigate = useNavigate();

  // Fetch patients from IPC on mount
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const token = contxt.loggedIn.token;
        const patients = await window.api.invoke("patients:getAll", token);
        contxt.setPatientList(patients);
      } catch (e) {
        console.log("Error fetching patients:", e);
      }
    };
    fetchPatients();
  }, []);

  // Build table rows from a patient list
  const buildRows = useCallback(
    (patientList) =>
      [...(patientList ?? [])].reverse().map((rowdata, index) => [
        <Button
          key={index}
          plain
          onClick={() => navigate("/patientdetails", { state: { rowdata } })}
        >
          {rowdata.id}
        </Button>,
        rowdata.name,
        rowdata.date,
        rowdata.desease,
        rowdata.location,
        <div
          key={index}
          className="flex-horizon-btw"
          style={{ width: "100px" }}
        >
          <Button
            plain
            onClick={() =>
              navigate("/patientdetails", { state: { rowdata } })
            }
          >
            View
          </Button>
          <Button
            plain
            destructive
            onClick={() => {
              setActiveDel(true);
              setDelId(rowdata.id);
            }}
          >
            Delete
          </Button>
        </div>,
      ]),
    [navigate]
  );

  // Filter patients by name/id and date, then rebuild rows
  useEffect(() => {
    const list = contxt.patientList ?? [];
    const filtered = list.filter((p) => {
      const matchesSearch =
        !inputValue ||
        p.name.toLowerCase().includes(inputValue.toLowerCase()) ||
        p.id.includes(inputValue);
      const matchesDate = !dateFilter || p.date === dateFilter;
      return matchesSearch && matchesDate;
    });
    setRows(buildRows(filtered));
  }, [contxt.patientList, inputValue, dateFilter, buildRows]);

  // Autocomplete options: patient names matching search
  const options = useMemo(() => {
    const list = contxt.patientList ?? [];
    const regex = new RegExp(inputValue, "i");
    return list
      .filter((p) => !inputValue || regex.test(p.name) || regex.test(p.id))
      .map((p) => ({ value: p.id, label: p.name }));
  }, [contxt.patientList, inputValue]);

  const handleSearchSelect = useCallback(
    (selected) => {
      if (selected.length > 0) {
        const patient = (contxt.patientList ?? []).find(
          (p) => p.id === selected[0]
        );
        if (patient) setInputValue(patient.name);
      }
    },
    [contxt.patientList]
  );

  const textField = (
    <Autocomplete.TextField
      onChange={setInputValue}
      placeholder="Search by Name, Reg no"
      value={inputValue}
      prefix={<Icon source={SearchMinor} color="base" />}
      clearButton
      onClearButtonClick={() => setInputValue("")}
    />
  );

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
        <div className="form-horizon child-mar-15">
          <Autocomplete
            options={options}
            selected={[]}
            onSelect={handleSearchSelect}
            textField={textField}
          />
          <Popover
            active={datePopoverActive}
            activator={
              <Button
                onClick={() => setDatePopoverActive((v) => !v)}
                icon={CalendarMinor}
                pressed={!!dateFilter}
              />
            }
            onClose={() => setDatePopoverActive(false)}
          >
            <div style={{ padding: "12px", minWidth: "200px" }}>
              <TextField
                label="Filter by date"
                type="date"
                value={dateFilter}
                onChange={(val) => {
                  setDateFilter(val);
                  setDatePopoverActive(false);
                }}
              />
              {dateFilter && (
                <div style={{ marginTop: "8px" }}>
                  <Button
                    plain
                    destructive
                    onClick={() => {
                      setDateFilter("");
                      setDatePopoverActive(false);
                    }}
                  >
                    Clear filter
                  </Button>
                </div>
              )}
            </div>
          </Popover>
        </div>
      </div>
      <div className="p25 table-wrapper">
        <>
          <Scrollable shadow style={{ height: "80vh" }}>
            <Card>
              <DataTable
                columnContentTypes={[
                  "text",
                  "text",
                  "text",
                  "text",
                  "text",
                  "text",
                ]}
                headings={[
                  "Registration no.",
                  "Name",
                  "Date",
                  "Disease",
                  "Location",
                  "Action",
                ]}
                rows={rows}
              />
            </Card>
          </Scrollable>
        </>
      </div>
      <div style={{ height: "200px" }}>
        <Modal
          open={activeDel}
          onClose={() => setActiveDel(!activeDel)}
          title="Alert!"
          primaryAction={{
            content: "Delete",
            onAction: () => onDeleteData(),
          }}
          secondaryActions={{
            content: "Cancel",
            onAction: () => setActiveDel(!activeDel),
          }}
        >
          <Modal.Section>
            <LegacyStack vertical>
              <LegacyStack.Item>
                <TextContainer>
                  <p>
                    Do you really want to delete this? Because this action
                    cannot be reverted!
                  </p>
                </TextContainer>
              </LegacyStack.Item>
            </LegacyStack>
          </Modal.Section>
        </Modal>
      </div>
    </div>
  );
};

export default HistoryTable;
