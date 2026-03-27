# Patient Details Edit Feature — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "Edit Details" button in the Patient Details card that opens a modal to edit Name, Mobile No., Location, and Gender of a patient.

**Architecture:** All changes are confined to a single component file. New state variables control the modal and form data. On save, `patients:update` IPC call is made and context is refreshed — same pattern used by existing edit/add/delete flows.

**Tech Stack:** React, Shopify Polaris (`@shopify/polaris`), Electron IPC via `window.api.invoke`

---

### Task 1: Add state for the edit-details modal

**Files:**
- Modify: `src/Components/Pages/PatientDetails/PatientDetails.js:26-42`

- [ ] **Step 1: Add two new state variables after the existing state declarations (around line 34)**

Add after `const [activeAdd, setActiveAdd] = useState(false);`:

```js
const [activeEditDetails, setActiveEditDetails] = useState(false);
const [editedPatientDetails, setEditedPatientDetails] = useState({
  name: "",
  contact_no: "",
  location: "",
  gender: "",
});
const [editedPatientDetailsError, setEditedPatientDetailsError] = useState({
  name: false,
  nameErr: "",
  contact_no: false,
  contact_noErr: "",
  location: false,
  locationErr: "",
  gender: false,
  genderErr: "",
});
```

- [ ] **Step 2: Verify the file compiles without errors**

Run the app: `npm start`
Expected: App opens without console errors.

---

### Task 2: Add change handlers for the edit-details form

**Files:**
- Modify: `src/Components/Pages/PatientDetails/PatientDetails.js` (after existing handlers, before `return`)

- [ ] **Step 1: Add 4 field change handlers after `handleMedicinesChange`**

```js
const handlePatientNameChange = (value) => {
  setEditedPatientDetails({ ...editedPatientDetails, name: value });
};
const handlePatientContactChange = (value) => {
  setEditedPatientDetails({ ...editedPatientDetails, contact_no: value });
};
const handlePatientLocationChange = (value) => {
  setEditedPatientDetails({ ...editedPatientDetails, location: value });
};
const handlePatientGenderChange = (value) => {
  setEditedPatientDetails({ ...editedPatientDetails, gender: value });
};
```

---

### Task 3: Add submit handler for the edit-details modal

**Files:**
- Modify: `src/Components/Pages/PatientDetails/PatientDetails.js` (after the 4 handlers above)

- [ ] **Step 1: Add `onSubmitEditedPatientDetails` function**

```js
const onSubmitEditedPatientDetails = async () => {
  let errors = {
    name: false,
    nameErr: "",
    contact_no: false,
    contact_noErr: "",
    location: false,
    locationErr: "",
    gender: false,
    genderErr: "",
  };
  Object.keys(editedPatientDetails).forEach((field) => {
    if (editedPatientDetails[field] === "") {
      errors = {
        ...errors,
        [field]: true,
        [field + "Err"]: "Please enter here!",
      };
    }
  });
  const hasError = Object.keys(editedPatientDetails).some(
    (field) => errors[field]
  );
  if (!hasError) {
    try {
      const token = contxt.loggedIn.token;
      const updatedData = {
        ...location.state.rowdata,
        name: editedPatientDetails.name,
        contact_no: editedPatientDetails.contact_no,
        location: editedPatientDetails.location,
        gender: editedPatientDetails.gender,
      };
      await window.api.invoke(
        "patients:update",
        token,
        location.state.rowdata.id,
        updatedData
      );
      const alldata = await window.api.invoke("patients:getAll", token);
      contxt.setPatientList(alldata);
      setActiveEditDetails(false);
    } catch (e) {
      console.log(e);
    }
  }
  setEditedPatientDetailsError(errors);
};
```

---

### Task 4: Add "Edit Details" button to the Patient Details card

**Files:**
- Modify: `src/Components/Pages/PatientDetails/PatientDetails.js:248-262`

- [ ] **Step 1: Find the `LegacyCard title="Patient Details"` section (around line 248)**

Current JSX:
```jsx
<LegacyCard title="Patient Details" sectioned>
  <div className="flex-horizon-btw">
    <div>
      <p>Mobile No.: {location.state.rowdata.contact_no}</p>
      <p>Location : {location.state.rowdata.location}</p>
      <p>Gender : {location.state.rowdata.gender}</p>
    </div>
    <Button size="slim" onClick={() => {
      setEditedData({ date: new Date().toISOString().split("T")[0], symptoms: "", medicines: "" });
      setActiveAdd(true);
    }}>
      Add New Details
    </Button>
  </div>
</LegacyCard>
```

- [ ] **Step 2: Replace it with the version that includes the Edit Details button**

```jsx
<LegacyCard title="Patient Details" sectioned>
  <div className="flex-horizon-btw">
    <div>
      <p>Mobile No.: {location.state.rowdata.contact_no}</p>
      <p>Location : {location.state.rowdata.location}</p>
      <p>Gender : {location.state.rowdata.gender}</p>
    </div>
    <div style={{ display: "flex", gap: "8px" }}>
      <Button
        size="slim"
        onClick={() => {
          setEditedPatientDetails({
            name: location.state.rowdata.name,
            contact_no: location.state.rowdata.contact_no,
            location: location.state.rowdata.location,
            gender: location.state.rowdata.gender,
          });
          setEditedPatientDetailsError({
            name: false, nameErr: "",
            contact_no: false, contact_noErr: "",
            location: false, locationErr: "",
            gender: false, genderErr: "",
          });
          setActiveEditDetails(true);
        }}
      >
        Edit Details
      </Button>
      <Button
        size="slim"
        onClick={() => {
          setEditedData({ date: new Date().toISOString().split("T")[0], symptoms: "", medicines: "" });
          setActiveAdd(true);
        }}
      >
        Add New Details
      </Button>
    </div>
  </div>
</LegacyCard>
```

---

### Task 5: Add the Edit Details modal to the JSX

**Files:**
- Modify: `src/Components/Pages/PatientDetails/PatientDetails.js` (after the existing delete modal `</div>`, before the closing `</div>` of the component)

- [ ] **Step 1: Add the modal JSX after the delete modal block (after line ~434)**

```jsx
<div style={{ height: "500px" }}>
  <Modal
    open={activeEditDetails}
    onClose={() => setActiveEditDetails(false)}
    title="Edit Patient Details"
    primaryAction={{
      content: "Save",
      onAction: () => onSubmitEditedPatientDetails(),
    }}
    secondaryActions={{
      content: "Cancel",
      onAction: () => setActiveEditDetails(false),
    }}
  >
    <Modal.Section>
      <LegacyStack vertical>
        <LegacyStack.Item>
          <TextContainer>
            <TextField
              label="Name"
              value={editedPatientDetails.name}
              error={editedPatientDetailsError.name}
              onChange={handlePatientNameChange}
              helpText={
                <span style={{ color: "red" }}>
                  {editedPatientDetailsError.nameErr}
                </span>
              }
            />
            <TextField
              label="Mobile No."
              value={editedPatientDetails.contact_no}
              error={editedPatientDetailsError.contact_no}
              onChange={handlePatientContactChange}
              helpText={
                <span style={{ color: "red" }}>
                  {editedPatientDetailsError.contact_noErr}
                </span>
              }
            />
            <TextField
              label="Location"
              value={editedPatientDetails.location}
              error={editedPatientDetailsError.location}
              onChange={handlePatientLocationChange}
              helpText={
                <span style={{ color: "red" }}>
                  {editedPatientDetailsError.locationErr}
                </span>
              }
            />
            <TextField
              label="Gender"
              value={editedPatientDetails.gender}
              error={editedPatientDetailsError.gender}
              onChange={handlePatientGenderChange}
              helpText={
                <span style={{ color: "red" }}>
                  {editedPatientDetailsError.genderErr}
                </span>
              }
            />
          </TextContainer>
        </LegacyStack.Item>
      </LegacyStack>
    </Modal.Section>
  </Modal>
</div>
```

---

### Task 6: Manual verification and commit

- [ ] **Step 1: Run the app**

```bash
npm start
```

- [ ] **Step 2: Verify the following manually**

1. Open any patient → "Patient Details" card mein "Edit Details" button dikh raha ho
2. "Edit Details" click karo → Modal khule jisme Name, Mobile No., Location, Gender pre-filled hon
3. Koi field empty karo → Save click karo → "Please enter here!" error aaye
4. Sahi values bharo → Save click karo → Modal band ho, data update ho
5. "Add New Details" button abhi bhi kaam kare (untouched)

- [ ] **Step 3: Commit**

```bash
git add src/Components/Pages/PatientDetails/PatientDetails.js
git commit -m "feat: add edit details button and modal for patient info"
```
