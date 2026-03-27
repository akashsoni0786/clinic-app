import React, { useState } from "react";
import { Card, Button, Banner, Modal, LegacyStack, TextContainer, TextField } from "@shopify/polaris";
import { contxtname } from "../../../Context/appcontext";

const Settings = () => {
  const contxt = React.useContext(contxtname);
  const token = contxt.loggedIn.token;
  const [message, setMessage] = useState({ msg: "", type: "success" });
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [newItem, setNewItem] = useState({ medicine: "", symptom: "", disease: "" });

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
      setTimeout(() => {
        contxt.setLoggedIn({ id: "", username: "", name: "", role: null, token: null, loggedin: false });
      }, 2000);
    }
  };

  const handleAddSuggestion = async (category, field) => {
    const value = newItem[field].trim();
    if (!value) return;
    const updated = {
      ...contxt.customSuggestions,
      [category]: [...contxt.customSuggestions[category], value],
    };
    const saved = await window.api.invoke("suggestions:save", token, updated);
    contxt.setCustomSuggestions(saved);
    setNewItem({ ...newItem, [field]: "" });
  };

  const handleDeleteSuggestion = async (category, index) => {
    const updated = {
      ...contxt.customSuggestions,
      [category]: contxt.customSuggestions[category].filter((_, i) => i !== index),
    };
    const saved = await window.api.invoke("suggestions:save", token, updated);
    contxt.setCustomSuggestions(saved);
  };

  const chipStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 10px",
    background: "#f1f2f3",
    borderRadius: "20px",
    fontSize: "13px",
    color: "#202223",
  };

  const deleteBtn = {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#6d7175",
    fontSize: "16px",
    lineHeight: 1,
    padding: "0 0 0 2px",
  };

  const renderSuggestionCard = (title, category, field) => (
    <Card title={title} sectioned>
      <LegacyStack vertical spacing="loose">
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <TextField
              label={`Naya ${title.toLowerCase()} add karein`}
              value={newItem[field]}
              onChange={(v) => setNewItem({ ...newItem, [field]: v })}
              autoComplete="off"
              onKeyPress={(e) => { if (e.key === "Enter") handleAddSuggestion(category, field); }}
            />
          </div>
          <Button onClick={() => handleAddSuggestion(category, field)}>Add</Button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {contxt.customSuggestions[category].length === 0 ? (
            <p style={{ color: "#6d7175", fontSize: "13px" }}>Abhi koi custom entry nahi hai.</p>
          ) : (
            contxt.customSuggestions[category].map((item, i) => (
              <span key={i} style={chipStyle}>
                {item}
                <button style={deleteBtn} onClick={() => handleDeleteSuggestion(category, i)}>×</button>
              </span>
            ))
          )}
        </div>
      </LegacyStack>
    </Card>
  );

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

      {renderSuggestionCard("Custom Medicines", "medicines", "medicine")}
      {renderSuggestionCard("Custom Symptoms", "symptoms", "symptom")}
      {renderSuggestionCard("Custom Diseases", "diseases", "disease")}

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
