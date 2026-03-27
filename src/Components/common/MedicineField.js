import React, { useMemo, useRef, useState } from "react";
import { TextField } from "@shopify/polaris";
import defaultMedicines from "../../data/homeopathyMedicines";

// Mirror div technique: textarea ki exact styles copy karke caret ka
// pixel-perfect position nikalte hain
const getCaretPixelPos = (textarea) => {
  const computed = window.getComputedStyle(textarea);
  const mirror = document.createElement("div");

  [
    "boxSizing", "width", "fontFamily", "fontSize", "fontWeight",
    "lineHeight", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
    "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
    "whiteSpace", "wordWrap", "overflowWrap",
  ].forEach((prop) => {
    mirror.style[prop] = computed[prop];
  });

  mirror.style.position = "absolute";
  mirror.style.top = "0";
  mirror.style.left = "-9999px";
  mirror.style.visibility = "hidden";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.wordWrap = "break-word";

  mirror.textContent = textarea.value.substring(0, textarea.selectionStart);

  const caretSpan = document.createElement("span");
  caretSpan.textContent = "\u200b"; // zero-width space marks caret position
  mirror.appendChild(caretSpan);

  document.body.appendChild(mirror);

  const textareaRect = textarea.getBoundingClientRect();
  const mirrorRect = mirror.getBoundingClientRect();
  const spanRect = caretSpan.getBoundingClientRect();
  const lineHeight = parseFloat(computed.lineHeight) || 20;

  document.body.removeChild(mirror);

  return {
    top: textareaRect.top + (spanRect.top - mirrorRect.top) + lineHeight,
    left: textareaRect.left + (spanRect.left - mirrorRect.left),
  };
};

const MedicineField = ({ label, value, onChange, error, helpText, data, customData }) => {
  const medicines = [...(data || defaultMedicines), ...(customData || [])];
  const wrapperRef = useRef(null);
  const [caretPos, setCaretPos] = useState(null);

  const lastLine = useMemo(() => {
    const lines = (value || "").split("\n");
    const parts = lines[lines.length - 1].split(",");
    return parts[parts.length - 1].trim();
  }, [value]);

  const suggestions = useMemo(() => {
    if (lastLine.length < 2) return [];
    const regex = new RegExp(lastLine, "i");
    return medicines.filter((m) => regex.test(m)).slice(0, 8);
  }, [lastLine, medicines]);

  const handleChange = (newValue) => {
    onChange(newValue);
    // setTimeout 0: browser ko DOM update karne dete hain pehle
    setTimeout(() => {
      const textarea = wrapperRef.current?.querySelector("textarea");
      if (textarea) setCaretPos(getCaretPixelPos(textarea));
    }, 0);
  };

  const handleSelect = (medicine) => {
    const lines = (value || "").split("\n");
    const parts = lines[lines.length - 1].split(",");
    parts[parts.length - 1] = " " + medicine;
    lines[lines.length - 1] = parts.join(",");
    onChange(lines.join("\n"));
    setCaretPos(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") setCaretPos(null);
  };

  return (
    <div ref={wrapperRef}>
      <TextField
        label={label}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        type="text"
        multiline={5}
        error={error}
        helpText={helpText}
        autoComplete="off"
      />
      {suggestions.length > 0 && caretPos && (
        <div
          style={{
            position: "fixed",
            top: caretPos.top,
            left: caretPos.left,
            zIndex: 9999,
            background: "#fff",
            border: "1px solid #c9cccf",
            borderRadius: "8px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
            padding: "4px 0",
            minWidth: "180px",
            maxWidth: "300px",
            maxHeight: "220px",
            overflowY: "auto",
          }}
        >
          {suggestions.map((med) => (
            <div
              key={med}
              onMouseDown={(e) => {
                e.preventDefault(); // textarea ka focus nahi jaata
                handleSelect(med);
              }}
              style={{
                padding: "7px 14px",
                cursor: "pointer",
                fontSize: "13px",
                color: "#202223",
                borderRadius: "4px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f1f2f3";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {med}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicineField;
