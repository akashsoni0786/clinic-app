import React, { useState } from "react";
import { Card, Button, Banner, Modal, LegacyStack, TextContainer } from "@shopify/polaris";
import { contxtname } from "../../../Context/appcontext";

const Settings = () => {
  const contxt = React.useContext(contxtname);
  const token = contxt.loggedIn.token;
  const [message, setMessage] = useState({ msg: "", type: "success" });
  const [showImportConfirm, setShowImportConfirm] = useState(false);

  const handleExport = async () => {
    const result = await window.api.invoke("data:export", token);
    if (result.canceled) return;
    if (result.error) {
      setMessage({ msg: result.error, type: "critical" });
    } else {
      setMessage({ msg: `Data exported to: ${result.filePath}`, type: "success" });
    }
  };

  const handleImportConfirm = async () => {
    setShowImportConfirm(false);
    const result = await window.api.invoke("data:import", token);
    if (result.canceled) return;
    if (result.error) {
      setMessage({ msg: result.error, type: "critical" });
    } else {
      setMessage({ msg: "Data imported! All sessions cleared. Please log in again.", type: "success" });
      // Clear local session — import cleared all server sessions
      setTimeout(() => {
        contxt.setLoggedIn({ id: "", username: "", name: "", role: null, token: null, loggedin: false });
      }, 2000);
    }
  };

  return (
    <div className="container p25">
      <h1 className="page-heading">Settings</h1>
      {message.msg && (
        <Banner status={message.type} onDismiss={() => setMessage({ msg: "", type: "success" })}>
          {message.msg}
        </Banner>
      )}
      <Card title="Data Backup" sectioned>
        <LegacyStack vertical spacing="loose">
          <TextContainer>
            <p>Export all patient and user data to a JSON file. Save to USB, Google Drive, or any location.</p>
          </TextContainer>
          <Button onClick={handleExport}>Export Data</Button>
        </LegacyStack>
      </Card>
      <Card title="Data Import" sectioned>
        <LegacyStack vertical spacing="loose">
          <TextContainer>
            <p><strong>Warning:</strong> Importing will replace ALL current data and log out all users. Export first as a backup.</p>
          </TextContainer>
          <Button destructive onClick={() => setShowImportConfirm(true)}>Import Data</Button>
        </LegacyStack>
      </Card>

      <Modal open={showImportConfirm} onClose={() => setShowImportConfirm(false)} title="Confirm Import"
        primaryAction={{ content: "Yes, Import & Logout", destructive: true, onAction: handleImportConfirm }}
        secondaryActions={[{ content: "Cancel", onAction: () => setShowImportConfirm(false) }]}>
        <Modal.Section>
          <TextContainer>
            <p>Ye action poora data replace karega aur sabko logout kar dega. Kya aap sure hain? Pehle Export karke backup le lein.</p>
          </TextContainer>
        </Modal.Section>
      </Modal>
    </div>
  );
};

export default Settings;
