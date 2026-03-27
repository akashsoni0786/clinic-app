# Custom Suggestions Feature — Design Spec

**Date:** 2026-03-27

## Overview

Allow doctors to add their own custom Medicines, Symptoms, and Diseases suggestions from the Settings page. Custom suggestions merge with existing defaults and appear in autocomplete dropdowns throughout the app.

## Data Storage

Custom suggestions stored in the existing `data.json` (lowdb) under a new `customSuggestions` key — same file as patients/users, so it is automatically included in Export/Import backups.

```json
{
  "users": [...],
  "patients": [...],
  "customSuggestions": {
    "medicines": [],
    "symptoms": [],
    "diseases": []
  }
}
```

## Backend Changes (`electron/main.js`)

1. Add `customSuggestions: { medicines: [], symptoms: [], diseases: [] }` to `db.defaults(...).write()`
2. Add IPC handler `suggestions:get` — returns `db.get('customSuggestions').value()`
3. Add IPC handler `suggestions:save` — accepts `{ medicines, symptoms, diseases }`, writes to DB, returns updated value
4. Add both channels to `preload.js` allowedChannels whitelist

## App Context (`src/Context/appcontext.js`)

- Add `customSuggestions` state: `{ medicines: [], symptoms: [], diseases: [] }`
- Add `setCustomSuggestions` setter
- On app startup (where `patients:getAll` is called), also call `suggestions:get` and populate context

## Settings Page (`src/Components/Pages/Settings/Settings.js`)

Add three new `Card` sections below existing cards:

### Each section (Medicines / Symptoms / Diseases):
- TextField to type a new item
- "Add" button — appends to local list, calls `suggestions:save`
- List of existing custom items, each with a delete (×) button — removes item, calls `suggestions:save`
- On mount: load from `contxt.customSuggestions`

## MedicineField (`src/Components/common/MedicineField.js`)

- Accept new prop `customData: string[]` (optional)
- Merge `customData` with default `medicines` array before filtering suggestions:
  ```js
  const allItems = [...medicines, ...(customData || [])];
  ```

## PatientForm (`src/Components/Pages/PatientForm/patientForm.js`)

- Import `contxtname` to access `customSuggestions`
- Pass `customData={contxt.customSuggestions.medicines}` to medicines MedicineField
- Pass `customData={contxt.customSuggestions.symptoms}` to symptoms MedicineField
- Pass `data={homeopathyDiseases}` + `customData={contxt.customSuggestions.diseases}` to disease MedicineField

## New Data File (`src/data/homeopathyDiseases.js`)

Create a basic list of common diseases so the disease field has its own proper defaults (currently it incorrectly uses medicines list).

## PatientDetails (`src/Components/Pages/PatientDetails/PatientDetails.js`)

- Same pattern as PatientForm — pass `customData` props to MedicineField components for symptoms and medicines modals

## Files Changed

| File | Change |
|------|--------|
| `electron/main.js` | Add DB default + 2 IPC handlers |
| `electron/preload.js` | Whitelist 2 new channels |
| `src/Context/appcontext.js` | Add customSuggestions state, load on startup |
| `src/Components/Pages/Settings/Settings.js` | Add 3 suggestion management cards |
| `src/Components/common/MedicineField.js` | Add `customData` prop, merge with defaults |
| `src/Components/Pages/PatientForm/patientForm.js` | Pass customData props |
| `src/Components/Pages/PatientDetails/PatientDetails.js` | Pass customData props |
| `src/data/homeopathyDiseases.js` | New file — basic diseases list |
