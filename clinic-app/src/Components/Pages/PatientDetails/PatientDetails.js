import {
  Card,
  DataTable,
  Scrollable,
  Button,
  Page,
  Layout,
  LegacyCard,
  Modal,
  LegacyStack,
  TextContainer,
  ActionList,
  TextField,
} from "@shopify/polaris";
import apicall from "../../../database/db";
import React, { useEffect, useState } from "react";
import { EditMinor, DeleteMinor } from "@shopify/polaris-icons";
import { contxtname } from "../../../Context/appcontext";
import { useLocation } from "react-router-dom";

const PatientDetails = () => {
  const contxt = React.useContext(contxtname);
  const location = useLocation();
  const [patientData, setPatientData] = useState([]);
  const [editIndex, setEditIndex] = useState("");
  const [activeEdit, setActiveEdit] = useState(false);
  const [activeDel, setActiveDel] = useState(false);
  const [activeAdd, setActiveAdd] = useState(false);
  const [editedData, setEditedData] = useState({
    date: "",
    symptoms: "",
    medicines: "",
  });
  const [editedDataError, setEditedDataError] = useState({
    date: "",
    dateErr: false,
    symptoms: "",
    symptomsErr: false,
    medicines: "",
    medicinesErr: false,
  });
  const setuppatientData = (allptntdata) => {
    let temp = [];
    allptntdata.forEach((data, index) => {
      let symp = data.daysymptoms.replaceAll("\n", "<br/> &#x2022 ");
      let medi = data.daymedicines.replaceAll("\n", "<br/> &#x2022 ");
      temp.push([
        data.todaydate,
        <div
          key={index}
          dangerouslySetInnerHTML={{ __html: "&#x2022 " + symp }}
        />,
        <div
          key={index}
          dangerouslySetInnerHTML={{ __html: "&#x2022 " + medi }}
        />,
        <ActionList
          key={index}
          actionRole="menuitem"
          sections={[
            {
              items: [
                {
                  content: "Edit",
                  icon: EditMinor,
                  onAction: () => {
                    setActiveEdit(true);
                    setEditIndex(index);
                    setEditedData({
                      date: data.todaydate,
                      symptoms: symp,
                      medicines: medi,
                    });
                  },
                },
                {
                  content: "Delete",
                  icon: DeleteMinor,
                  onAction: () => {
                    setActiveDel(true);
                  },
                },
              ],
            },
          ]}
        />,
      ]);
    });
    setPatientData(temp);
  };
  useEffect(() => {
    setuppatientData(location.state.rowdata.dateWiseData);
  }, [location.state.rowdata]);
  const handleDateChange = (value) => {
    setEditedData({
      ...editedData,
      date: value,
    });
  };
  const handleSymptomsChange = (value) => {
    setEditedData({
      ...editedData,
      symptoms: value,
    });
  };
  const handleMedicinesChange = (value) => {
    setEditedData({
      ...editedData,
      medicines: value,
    });
  };
  const onSubmitEditedData = async () => {
    let errors = {
      date: "",
      dateErr: false,
      symptoms: "",
      symptomsErr: false,
      medicines: "",
      medicinesErr: false,
    };
    Object.keys(editedData).forEach((data) => {
      if (editedData[data] === "") {
        errors = {
          ...errors,
          [data]: true,
          [data + "Err"]: "Please enter here!",
        };
      } else {
        errors = {
          ...errors,
          [data]: false,
          [data + "Err"]: "",
        };
      }
    });
    let noError = true;
    Object.keys(editedData).forEach((data) => {
      if (errors[data] && noError) {
        noError = false;
      }
    });
    let tempData = { ...location.state.rowdata };
    tempData.dateWiseData[editIndex] = {
      todaydate: editedData.date,
      daysymptoms: editedData.symptoms,
      daymedicines: editedData.medicines,
    };
    if (noError) {
      try {
        await apicall.put(`/patients/${location.state.rowdata.id}`, tempData);
        let alldata = await apicall.get("/patients");
        console.log(
          "alldata.data[location.state.index] ",
          alldata.data[location.state.index]
        );
        contxt.setPatientList(alldata.data);
        setuppatientData(alldata.data[location.state.index].dateWiseData);
        setActiveEdit(false);
        setEditIndex("");
        setEditedData({ date: "", symptoms: "", medicines: "" });
      } catch (e) {
        console.log(e);
      }
    }
    setEditedDataError(errors);
  };
  const onSubmitAddedData = async () => {
    let errors = {
      date: "",
      dateErr: false,
      symptoms: "",
      symptomsErr: false,
      medicines: "",
      medicinesErr: false,
    };
    Object.keys(editedData).forEach((data) => {
      if (editedData[data] === "") {
        errors = {
          ...errors,
          [data]: true,
          [data + "Err"]: "Please enter here!",
        };
      } else {
        errors = {
          ...errors,
          [data]: false,
          [data + "Err"]: "",
        };
      }
    });
    let noError = true;
    Object.keys(editedData).forEach((data) => {
      if (errors[data] && noError) {
        noError = false;
      }
    });
    let tempData = { ...location.state.rowdata };
    tempData.dateWiseData = [
      {
        todaydate: editedData.date,
        daysymptoms: editedData.symptoms,
        daymedicines: editedData.medicines,
      },
      ...tempData.dateWiseData,
    ];
    if (noError) {
      try {
        await apicall.put(`/patients/${location.state.rowdata.id}`, tempData);
        let alldata = await apicall.get("/patients");
        contxt.setPatientList(alldata.data);
        setuppatientData(alldata.data[location.state.index].dateWiseData);
        setActiveAdd(false);
        setEditIndex("");
        setEditedData({ date: "", symptoms: "", medicines: "" });
      } catch (e) {
        console.log(e);
      }
    }
    setEditedDataError(errors);
  };
  const onDeleteData = async () => {
    let tempData = { ...location.state.rowdata };
    tempData.dateWiseData.splice(editIndex, 1);
    try {
      await apicall.put(`/patients/${location.state.rowdata.id}`, tempData);
      let alldata = await apicall.get("/patients");
      contxt.setPatientList(alldata.data);
      setuppatientData(alldata.data[location.state.index].dateWiseData);
      setActiveDel(false);
      setEditIndex("");
    } catch (e) {
      console.log(e);
    }
  };
  return (
    <div className="container">
      <div className="form-horizon-btw p25">
        <div className="form-horizon-start">
          <img alt="details pic" src="details.png" className="patient-pic" />
          <h1 className="page-heading">{location.state.rowdata.name}</h1>
        </div>
      </div>
      <Page fullWidth>
        <Layout>
          <Layout.Section secondary>
            <LegacyCard title="Patient Details" sectioned>
              <div className="flex-horizon-btw">
                <div>
                  <p>Mobile No.: {location.state.rowdata.contact_no}</p>
                  <p>Location : {location.state.rowdata.location}</p>
                  <p>Gender : {location.state.rowdata.gender}</p>
                </div>
                <Button size="slim" onClick={() => setActiveAdd(!activeAdd)}>
                  Add New Details
                </Button>
              </div>
            </LegacyCard>
          </Layout.Section>
        </Layout>
        {patientData.length == 0 ? (
          <div className="flex-horizon">
            <img alt="nodata pic" src="nodata.png" className="fallback-pic" />
          </div>
        ) : (
          <div className="p25">
            {/* <Scrollable shadow> */}
            {/* <Card> */}
            <DataTable
              columnContentTypes={["text", "text", "text"]}
              headings={["Date", "Symptoms", "Medicines", "Actions"]}
              rows={patientData}
            />
            {/* </Card> */}
            {/* </Scrollable> */}
          </div>
        )}
      </Page>

      <div style={{ height: "500px" }}>
        <Modal
          // activator={activator}
          open={activeAdd}
          onClose={() => setActiveAdd(!activeAdd)}
          title="Add somthing today"
          primaryAction={{
            content: "Add",
            onAction: () => onSubmitAddedData(),
          }}
          secondaryActions={{
            content: "Close",
            onAction: () => setActiveAdd(!activeAdd),
          }}
        >
          <Modal.Section>
            <LegacyStack vertical>
              <LegacyStack.Item>
                <TextContainer>
                  <p>You can edit here.</p>
                  <TextField
                    label="Enter Date"
                    value={editedData.date}
                    error={editedDataError.dateErr}
                    onChange={handleDateChange}
                    type="date"
                    helpText={
                      <span style={{ color: "red" }}>
                        {editedDataError.date}
                      </span>
                    }
                  />
                  <TextField
                    label="Enter patient's symptoms"
                    error={editedDataError.symptomsErr}
                    value={editedData.symptoms}
                    onChange={handleSymptomsChange}
                    type="text"
                    multiline={5}
                    helpText={
                      <span style={{ color: "red" }}>
                        {editedDataError.symptoms}
                      </span>
                    }
                  />
                  <TextField
                    label="Enter patient's medicines"
                    value={editedData.medicines}
                    error={editedDataError.medicinesErr}
                    onChange={handleMedicinesChange}
                    type="text"
                    multiline={5}
                    helpText={
                      <span style={{ color: "red" }}>
                        {editedDataError.medicines}
                      </span>
                    }
                  />
                </TextContainer>
              </LegacyStack.Item>
            </LegacyStack>
          </Modal.Section>
        </Modal>
      </div>
      <div style={{ height: "500px" }}>
        <Modal
          // activator={activator}
          open={activeEdit}
          onClose={() => setActiveEdit(!activeEdit)}
          title="Get a shareable link"
          primaryAction={{
            content: "Edit",
            onAction: () => onSubmitEditedData(),
          }}
          secondaryActions={{
            content: "Close",
            onAction: () => setActiveEdit(!activeEdit),
          }}
        >
          <Modal.Section>
            <LegacyStack vertical>
              <LegacyStack.Item>
                <TextContainer>
                  <p>You can edit here.</p>
                  <TextField
                    label="Enter Date"
                    value={editedData.date}
                    error={editedDataError.dateErr}
                    onChange={handleDateChange}
                    type="date"
                    helpText={
                      <span style={{ color: "red" }}>
                        {editedDataError.date}
                      </span>
                    }
                  />
                  <TextField
                    label="Enter patient's symptoms"
                    error={editedDataError.symptomsErr}
                    value={editedData.symptoms}
                    onChange={handleSymptomsChange}
                    type="text"
                    multiline={5}
                    helpText={
                      <span style={{ color: "red" }}>
                        {editedDataError.symptoms}
                      </span>
                    }
                  />
                  <TextField
                    label="Enter patient's medicines"
                    value={editedData.medicines}
                    error={editedDataError.medicinesErr}
                    onChange={handleMedicinesChange}
                    type="text"
                    multiline={5}
                    helpText={
                      <span style={{ color: "red" }}>
                        {editedDataError.medicines}
                      </span>
                    }
                  />
                </TextContainer>
              </LegacyStack.Item>
            </LegacyStack>
          </Modal.Section>
        </Modal>
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

export default PatientDetails;
