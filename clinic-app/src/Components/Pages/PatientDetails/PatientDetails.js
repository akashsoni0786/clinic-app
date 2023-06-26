import {
  Card,
  DataTable,
  Scrollable,
  Icon,
  Button,
  Page,
  Layout,
  LegacyCard,
} from "@shopify/polaris";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { SearchMinor } from "@shopify/polaris-icons";
import { contxtname } from "../../../Context/appcontext";
import { useLocation } from "react-router-dom";
const PatientDetails = () => {
  const location = useLocation();
  const [patientData, setPatientData] = useState([]);
  useEffect(() => {
    let temp = [];
    location.state.dateWiseData.forEach((data) => {
      temp.push([data.todaydate, data.daysymptoms, data.daymedicines]);
    });
    setPatientData(temp);
  }, [location.state]);
  console.log("patientData ",patientData)
  return (
    <div className="container">
      <div className="form-horizon-btw p25">
        <div className="form-horizon-start">
          <img alt="details pic" src="details.png" className="patient-pic" />
          <h1 className="page-heading">{location.state.name}</h1>
        </div>
      </div>
      <Page fullWidth>
        <Layout>
          <Layout.Section secondary>
            <LegacyCard title="Patient Details" sectioned>
              <div className="flex-horizon-btw">
                <div>
                  <p>Mobile No.: {location.state.contact_no}</p>
                  <p>Location : {location.state.location}</p>
                  <p>Gender : {location.state.gender}</p>
                </div>
                <Button size="slim">Add New Details</Button>
              </div>
            </LegacyCard>
          </Layout.Section>
        </Layout>
      </Page>
      {patientData.length > 0 && (
        <div className="p25">
          <Scrollable shadow style={{ height: "80vh" }}>
            <Card>
              <DataTable
                columnContentTypes={["text", "text", "text"]}
                headings={["Date", "Symptoms", "Medicines"]}
                rows={[patientData]}
              />
            </Card>
          </Scrollable>
        </div>
      )}
    </div>
  );
};

export default PatientDetails;
