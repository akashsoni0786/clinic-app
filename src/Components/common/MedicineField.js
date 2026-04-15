import React, { useEffect, useMemo, useRef, useState } from "react";
import defaultMedicines from "../../data/homeopathyMedicines";

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
  caretSpan.textContent = "\u200b";
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

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const MedicineField = ({ label, value, onChange, error, helpText, data, customData }) => {
  const medicines = useMemo(
    () => [...(data || defaultMedicines), ...(customData || [])],
    [data, customData]
  );
  const wrapperRef = useRef(null);
  const [caretPos, setCaretPos] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const lastLine = useMemo(() => {
    const lines = (value || "").split("\n");
    const parts = lines[lines.length - 1].split(",");
    return parts[parts.length - 1].trim();
  }, [value]);

  const suggestions = useMemo(() => {
    if (lastLine.length < 2) return [];
    const regex = new RegExp(escapeRegExp(lastLine), "i");
    return medicines.filter((m) => regex.test(m)).slice(0, 8);
  }, [lastLine, medicines]);

  useEffect(() => {
    setActiveIndex(0);
  }, [suggestions.length, lastLine]);

  const handleChange = (event) => {
    onChange(event.target.value);
    window.requestAnimationFrame(() => {
      const textarea = wrapperRef.current?.querySelector("textarea");
      if (textarea) setCaretPos(getCaretPixelPos(textarea));
    });
  };

  const handleSelect = (medicine) => {
    const lines = (value || "").split("\n");
    const parts = lines[lines.length - 1].split(",");
    parts[parts.length - 1] = " " + medicine;
    lines[lines.length - 1] = parts.join(",");
    onChange(lines.join("\n"));
    setCaretPos(null);
    setActiveIndex(0);
  };

  const handleKeyDown = (e) => {
    if (suggestions.length > 0 && caretPos) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((current) => (current + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((current) => (current === 0 ? suggestions.length - 1 : current - 1));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        handleSelect(suggestions[activeIndex]);
        return;
      }
    }

    if (e.key === "Escape") setCaretPos(null);
  };

  return (
    <div ref={wrapperRef} className="mb-6">
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      <textarea
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        rows={5}
        className={`input-base min-h-[140px] ${error ? "border-red-500" : "border-slate-300"}`}
        autoComplete="off"
      />
      {helpText && <p className="mt-2 text-sm text-red-600">{helpText}</p>}
      {suggestions.length > 0 && caretPos && (
        <div
          style={{
            position: "fixed",
            top: caretPos.top,
            left: caretPos.left,
            zIndex: 9999,
            background: "#fff",
            border: "1px solid #c9cccf",
            borderRadius: "0.5rem",
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            padding: "0.25rem 0",
            minWidth: "180px",
            maxWidth: "300px",
            maxHeight: "220px",
            overflowY: "auto",
          }}
        >
          {suggestions.map((med, index) => (
            <button
              key={med}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(med);
              }}
              onMouseEnter={() => setActiveIndex(index)}
              className={`block w-full px-4 py-2 text-left text-sm ${index === activeIndex ? "bg-slate-100 text-slate-900" : "text-slate-800"}`}
            >
              {med}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicineField;
