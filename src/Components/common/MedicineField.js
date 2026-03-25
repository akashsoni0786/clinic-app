import React, { useMemo } from "react";
import { TextField } from "@shopify/polaris";
import defaultMedicines from "../../data/homeopathyMedicines";

const MedicineField = ({ label, value, onChange, error, helpText, data }) => {
  const medicines = data || defaultMedicines;
  // Get the last line the doctor is currently typing
  const lastLine = useMemo(() => {
    const lines = (value || "").split("\n");
    return lines[lines.length - 1].trim();
  }, [value]);

  // Show suggestions only when at least 2 chars typed on current line
  const suggestions = useMemo(() => {
    if (lastLine.length < 2) return [];
    const regex = new RegExp(lastLine, "i");
    return medicines.filter((m) => regex.test(m)).slice(0, 10);
  }, [lastLine, medicines]);

  const handleSelect = (medicine) => {
    const lines = (value || "").split("\n");
    // Replace the last (partial) line with the selected medicine
    lines[lines.length - 1] = medicine;
    onChange(lines.join("\n"));
  };

  return (
    <div>
      <TextField
        label={label}
        value={value}
        onChange={onChange}
        type="text"
        multiline={5}
        error={error}
        helpText={helpText}
        autoComplete="off"
      />
      {suggestions.length > 0 && (
        <div style={{ marginTop: "6px" }}>
          <p style={{ fontSize: "12px", color: "#6d7175", marginBottom: "4px" }}>
            Suggestions:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {suggestions.map((med) => (
              <button
                key={med}
                type="button"
                onClick={() => handleSelect(med)}
                style={{
                  padding: "4px 10px",
                  fontSize: "12px",
                  border: "1px solid #c9cccf",
                  borderRadius: "20px",
                  background: "#f6f6f7",
                  cursor: "pointer",
                  color: "#202223",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#e4e5e7";
                  e.target.style.borderColor = "#8c9196";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#f6f6f7";
                  e.target.style.borderColor = "#c9cccf";
                }}
              >
                {med}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineField;
