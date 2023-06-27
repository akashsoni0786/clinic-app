import {
  Card,
  DataTable,
  Scrollable,
  Autocomplete,
  Icon,
  Button,
  ActionList,
  Modal,
  LegacyStack,
  TextContainer,
} from "@shopify/polaris";
import apicall from "../../../database/db";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { SearchMinor, DeleteMinor, ViewMinor } from "@shopify/polaris-icons";
import { contxtname } from "../../../Context/appcontext";
import { useNavigate } from "react-router-dom";
const HistoryTable = () => {
  const contxt = React.useContext(contxtname);
  const [rows, setRows] = useState([]);
  const [delId, setDelId] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    const ax = async () => {
      try {
        let temp = [];
        contxt.patientList?.map((rowdata, index) => {
          temp.push([
            <Button
              key={index}
              plain
              onClick={() =>
                navigate("/patientdetails", {
                  state: { rowdata: rowdata, index: index },
                })
              }
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
                  navigate("/patientdetails", {
                    state: { rowdata: rowdata, index: index },
                  })
                }
              >
                View
              </Button>
              <Button
                onClick={() => {
                  setActiveDel(true);
                  setDelId(rowdata.id);
                }}
                plain
                destructive
              >
                Delete
              </Button>
            </div>,
          ]);
        });
        setRows(temp);
      } catch (e) {
        console.log("Error :", e);
      }
    };
    ax();
  }, [contxt]);

  const deselectedOptions = useMemo(
    () => [
      { value: "rustic", label: "Rustic" },
      { value: "antique", label: "Antique" },
      { value: "vinyl", label: "Vinyl" },
      { value: "vintage", label: "Vintage" },
      { value: "refurbished", label: "Refurbished" },
    ],
    []
  );
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState(deselectedOptions);
  const [activeDel, setActiveDel] = useState(false);
  const updateText = useCallback(
    (value) => {
      setInputValue(value);

      if (value === "") {
        setOptions(deselectedOptions);
        return;
      }

      const filterRegex = new RegExp(value, "i");
      const resultOptions = deselectedOptions.filter((option) =>
        option.label.match(filterRegex)
      );
      setOptions(resultOptions);
    },
    [deselectedOptions]
  );

  const updateSelection = useCallback(
    (selected) => {
      const selectedValue = selected.map((selectedItem) => {
        const matchedOption = options.find((option) => {
          return option.value.match(selectedItem);
        });
        return matchedOption && matchedOption.label;
      });

      setSelectedOptions(selected);
      setInputValue(selectedValue[0]);
    },
    [options]
  );

  const textField = (
    <Autocomplete.TextField
      onChange={updateText}
      placeholder="Search by Name, Reg no"
      value={inputValue}
      prefix={<Icon source={SearchMinor} color="base" />}
    />
  );
  const onDeleteData = async () => {
    try {
      await apicall.delete(`/patients/${delId}`);
      let patientList = await apicall.get("/patients");
      contxt.setPatientList(patientList.data);
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
            selected={selectedOptions}
            onSelect={updateSelection}
            textField={textField}
          />
        </div>
      </div>
      <div className="p25">
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
                  "Desiese",
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
          // activator={activator}
          open={activeDel}
          onClose={() => setActiveDel(!activeDel)}
          title="Alert! "
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
                    cannot be revert!
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
