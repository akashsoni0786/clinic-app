# Patient Details Edit Feature — Design Spec

**Date:** 2026-03-27

## Overview

Add an "Edit Details" button inside the "Patient Details" card on the PatientDetails page. Clicking it opens a modal where the user can edit core patient info (Name, Mobile No., Location, Gender) and save it back to the database.

## UI Changes

- **Button placement:** Inside `LegacyCard title="Patient Details"`, next to the existing "Add New Details" button.
- **Button label:** "Edit Details"

## Modal

- **Title:** "Edit Patient Details"
- **Fields (pre-filled from `location.state.rowdata`):**
  - Name (TextField, type: text)
  - Mobile No. (TextField, type: text)
  - Location (TextField, type: text)
  - Gender (TextField, type: text)
- **Primary action:** "Save" → calls `onSubmitEditedPatientDetails()`
- **Secondary action:** "Cancel" → closes modal

## State

| State | Type | Purpose |
|---|---|---|
| `activeEditDetails` | boolean | Controls modal open/close |
| `editedPatientDetails` | object | Holds name, contact_no, location, gender |
| `editedPatientDetailsError` | object | Validation errors for each field |

## Data Flow

1. User clicks "Edit Details"
2. `editedPatientDetails` pre-filled from `location.state.rowdata`
3. `activeEditDetails = true` → modal opens
4. User edits fields → local state updates
5. User clicks Save → validate all fields non-empty
6. On success: `patients:update` called with updated data
7. `patients:getAll` fetches fresh data → `contxt.setPatientList` updated
8. Modal closes, display reflects new values

## Validation

All 4 fields required. Empty field shows "Please enter here!" error inline.

## Files Changed

- `src/Components/Pages/PatientDetails/PatientDetails.js` — only file modified
