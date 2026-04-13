# Custom Suggestions Feature — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow doctors to add/delete custom Medicines, Symptoms, and Diseases from Settings; these merge with defaults in all autocomplete fields.

**Architecture:** Custom suggestions stored in `data.json` under `customSuggestions` key (same file as patients — auto-included in export/import). Loaded into React context on app startup. Passed as `customData` prop to `MedicineField` which merges them with defaults.

**Tech Stack:** Electron IPC (lowdb), React Context, Shopify Polaris

---

### Task 1: Backend — DB default + IPC handlers

**Files:**
- Modify: `electron/main.js:39` (db.defaults line)
- Modify: `electron/main.js` (after line 157, after patients:delete handler)

- [ ] **Step 1: Update db.defaults to include customSuggestions**

Find this line in `electron/main.js`:
```js
db.defaults({ users: [], patients: [], migrationDone: false }).write();
```
Replace with:
```js
db.defaults({ users: [], patients: [], customSuggestions: { medicines: [], symptoms: [], diseases: [] }, migrationDone: false }).write();
```

- [ ] **Step 2: Add two IPC handlers after the `patients:delete` handler (after line 157)**

```js
ipcMain.handle('suggestions:get', (event, token) => {
  requireAuth(token);
  return db.get('customSuggestions').value();
});

ipcMain.handle('suggestions:save', (event, token, data) => {
  requireAuth(token);
  db.set('customSuggestions', data).write();
  return db.get('customSuggestions').value();
});
```

- [ ] **Step 3: Commit**

```bash
git add electron/main.js
git commit -m "feat: add customSuggestions DB default and IPC handlers"
```

---

### Task 2: Preload whitelist

**Files:**
- Modify: `electron/preload.js:19` (after `'data:import'`)

- [ ] **Step 1: Add two channels to allowedChannels array**

Find:
```js
  'data:import',
  'update:install',
```
Replace with:
```js
  'data:import',
  'suggestions:get',
  'suggestions:save',
  'update:install',
```

- [ ] **Step 2: Commit**

```bash
git add electron/preload.js
git commit -m "feat: whitelist suggestions IPC channels in preload"
```

---

### Task 3: App Context — add customSuggestions state

**Files:**
- Modify: `src/Context/appcontext.js`

- [ ] **Step 1: Replace entire file content**

```js
import React, { useState } from "react";
export const contxtname = React.createContext();

export const Context = (props) => {
  const [patientList, setPatientList] = useState([]);
  const [loggedIn, setLoggedIn] = useState({
    id: "",
    username: "",
    name: "",
    role: null,
    token: null,
    loggedin: false,
  });
  const [customSuggestions, setCustomSuggestions] = useState({
    medicines: [],
    symptoms: [],
    diseases: [],
  });

  return (
    <contxtname.Provider
      value={{
        patientList,
        setPatientList,
        loggedIn,
        setLoggedIn,
        customSuggestions,
        setCustomSuggestions,
      }}
    >
      {props.children}
    </contxtname.Provider>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/Context/appcontext.js
git commit -m "feat: add customSuggestions to app context"
```

---

### Task 4: Load suggestions on app startup (historyTable)

**Files:**
- Modify: `src/Components/Pages/History/historyTable.js:30-41`

- [ ] **Step 1: Update the fetchPatients useEffect to also load suggestions**

Find:
```js
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
```
Replace with:
```js
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
  }, []);
```

- [ ] **Step 2: Commit**

```bash
git add src/Components/Pages/History/historyTable.js
git commit -m "feat: load custom suggestions from DB on app startup"
```

---

### Task 5: Create diseases data file

**Files:**
- Create: `src/data/homeopathyDiseases.js`

- [ ] **Step 1: Create the file**

```js
const homeopathyDiseases = [
  "Acidity",
  "Allergic Rhinitis",
  "Anaemia",
  "Anxiety",
  "Arthritis",
  "Asthma",
  "Back Pain",
  "Bronchitis",
  "Chronic Fatigue",
  "Cold and Flu",
  "Constipation",
  "Cough",
  "Depression",
  "Diabetes",
  "Diarrhoea",
  "Eczema",
  "Fever",
  "Gastritis",
  "Headache",
  "Hypertension",
  "Hypothyroidism",
  "Indigestion",
  "Insomnia",
  "Irritable Bowel Syndrome",
  "Joint Pain",
  "Kidney Stones",
  "Leucorrhoea",
  "Migraine",
  "Obesity",
  "Piles",
  "Psoriasis",
  "Sinusitis",
  "Skin Allergy",
  "Tonsillitis",
  "Typhoid",
  "Urinary Tract Infection",
  "Vertigo",
  "Warts",
];

export default homeopathyDiseases;
```

- [ ] **Step 2: Commit**

```bash
git add src/data/homeopathyDiseases.js
git commit -m "feat: add homeopathy diseases data file"
```

---

### Task 6: MedicineField — add customData prop

**Files:**
- Modify: `src/Components/common/MedicineField.js:48-63`

- [ ] **Step 1: Update MedicineField to accept and merge customData**

Find:
```js
const MedicineField = ({ label, value, onChange, error, helpText, data }) => {
  const medicines = data || defaultMedicines;
```
Replace with:
```js
const MedicineField = ({ label, value, onChange, error, helpText, data, customData }) => {
  const medicines = [...(data || defaultMedicines), ...(customData || [])];
```

- [ ] **Step 2: Commit**

```bash
git add src/Components/common/MedicineField.js
git commit -m "feat: MedicineField accepts customData prop merged with defaults"
```

---

### Task 7: PatientForm — pass customData + fix disease field

**Files:**
- Modify: `src/Components/Pages/PatientForm/patientForm.js`

- [ ] **Step 1: Add homeopathyDiseases import after homeopathySymptoms import (line 13)**

Find:
```js
import homeopathySymptoms from "../../../data/homeopathySymptoms";
```
Replace with:
```js
import homeopathyDiseases from "../../../data/homeopathyDiseases";
```

- [ ] **Step 2: Update symptoms MedicineField (around line 255) to pass customData**

Find:
```jsx
            <MedicineField
              label="Enter patient's symptoms"
              error={patientError.symptoms}
              value={patient.symptoms}
              onChange={handleSymptomsChange}
              data={homeopathySymptoms}
              helpText={
                <span style={{ color: "red" }}>{patientError.symptomsErr}</span>
              }
            />
```
Replace with:
```jsx
            <MedicineField
              label="Enter patient's symptoms"
              error={patientError.symptoms}
              value={patient.symptoms}
              onChange={handleSymptomsChange}
              data={homeopathySymptoms}
              customData={contxt.customSuggestions.symptoms}
              helpText={
                <span style={{ color: "red" }}>{patientError.symptomsErr}</span>
              }
            />
```

- [ ] **Step 3: Replace plain TextField for disease with MedicineField**

Find:
```jsx
            <TextField
              label="Enter desease name"
              value={patient.desease}
              onChange={handleDeseasename}
              type="text"
              error={patientError.desease}
              helpText={
                <span style={{ color: "red" }}>{patientError.deseaseErr}</span>
              }
            />
```
Replace with:
```jsx
            <MedicineField
              label="Enter desease name"
              value={patient.desease}
              onChange={handleDeseasename}
              data={homeopathyDiseases}
              customData={contxt.customSuggestions.diseases}
              error={patientError.desease}
              helpText={
                <span style={{ color: "red" }}>{patientError.deseaseErr}</span>
              }
            />
```

- [ ] **Step 4: Update medicines MedicineField to pass customData**

Find:
```jsx
            <MedicineField
              label="Enter patient's medicines"
              value={patient.medicines}
              error={patientError.medicines}
              onChange={handleMedicinesChange}
              helpText={
                <span style={{ color: "red" }}>
                  {patientError.medicinesErr}
                </span>
              }
            />
```
Replace with:
```jsx
            <MedicineField
              label="Enter patient's medicines"
              value={patient.medicines}
              error={patientError.medicines}
              onChange={handleMedicinesChange}
              customData={contxt.customSuggestions.medicines}
              helpText={
                <span style={{ color: "red" }}>
                  {patientError.medicinesErr}
                </span>
              }
            />
```

- [ ] **Step 5: Commit**

```bash
git add src/Components/Pages/PatientForm/patientForm.js
git commit -m "feat: pass customSuggestions to PatientForm fields, fix disease field"
```

---

### Task 8: PatientDetails — pass customData props

**Files:**
- Modify: `src/Components/Pages/PatientDetails/PatientDetails.js`

There are 4 MedicineField usages — 2 in Add modal, 2 in Edit modal. All need `customData`.

- [ ] **Step 1: Add all 4 customData props**

For both Add and Edit modals, find the symptoms MedicineField (has `data={homeopathySymptoms}`):
```jsx
                  <MedicineField
                    label="Enter patient's symptoms"
                    error={editedDataError.symptomsErr}
                    value={editedData.symptoms}
                    onChange={handleSymptomsChange}
                    data={homeopathySymptoms}
                    helpText={...}
                  />
```
Replace with (do this for BOTH occurrences):
```jsx
                  <MedicineField
                    label="Enter patient's symptoms"
                    error={editedDataError.symptomsErr}
                    value={editedData.symptoms}
                    onChange={handleSymptomsChange}
                    data={homeopathySymptoms}
                    customData={contxt.customSuggestions.symptoms}
                    helpText={...}
                  />
```

For both Add and Edit modals, find the medicines MedicineField (no `data` prop):
```jsx
                  <MedicineField
                    label="Enter patient's medicines"
                    value={editedData.medicines}
                    error={editedDataError.medicinesErr}
                    onChange={handleMedicinesChange}
                    helpText={...}
                  />
```
Replace with (do this for BOTH occurrences):
```jsx
                  <MedicineField
                    label="Enter patient's medicines"
                    value={editedData.medicines}
                    error={editedDataError.medicinesErr}
                    onChange={handleMedicinesChange}
                    customData={contxt.customSuggestions.medicines}
                    helpText={...}
                  />
```

- [ ] **Step 2: Commit**

```bash
git add src/Components/Pages/PatientDetails/PatientDetails.js
git commit -m "feat: pass customSuggestions to PatientDetails MedicineFields"
```

---

### Task 9: Settings — Add suggestion management UI

**Files:**
- Modify: `src/Components/Pages/Settings/Settings.js`

- [ ] **Step 1: Replace entire Settings.js with the updated version**

```jsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/Components/Pages/Settings/Settings.js
git commit -m "feat: add custom suggestions management UI in Settings"
```

---

### Task 10: Manual verification

- [ ] **Step 1: Start the app**

```bash
npm start
```

- [ ] **Step 2: Verify the following**

1. Settings page mein 3 nayi cards dikhen: Custom Medicines, Custom Symptoms, Custom Diseases
2. Koi medicine add karo (e.g. "Calc Phos 6X") → chip mein dikh jaaye
3. App restart karo → added medicine abhi bhi dikhe (persisted in data.json)
4. Patient form mein symptoms/medicines type karo → custom entry suggestions mein aaye
5. Disease field ab autocomplete ho (homeopathyDiseases list)
6. Chip ka × button click karo → item delete ho jaaye
7. Data Export karo → exported JSON mein `customSuggestions` key ho
