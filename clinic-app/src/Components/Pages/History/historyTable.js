import {
  Card,
  DataTable,
  Scrollable,
  Autocomplete,
  Icon,
  Button,
} from "@shopify/polaris";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { SearchMinor } from "@shopify/polaris-icons";
import { contxtname } from "../../../Context/appcontext";
import { useNavigate } from "react-router-dom";
const HistoryTable = () => {
  const contxt = React.useContext(contxtname);
  const [rows, setRows] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    const ax = async () => {
      try {
        let temp = [];
        contxt.patientList?.map((rowdata,index) => {
          temp.push([
            <Button key={index} plain
            onClick={()=>navigate("/patientdetails", { state: rowdata })}
            >{rowdata.id}</Button>,
            rowdata.name,
            rowdata.date,
            rowdata.symptoms,
            rowdata.location,
          ]);
        });
        setRows(temp);
      } catch (e) {
        console.log("Error :", e);
      }
    };
    ax();
  }, [contxt]);
  
  const deselectedOptions = useMemo(
    () => [
      { value: "rustic", label: "Rustic" },
      { value: "antique", label: "Antique" },
      { value: "vinyl", label: "Vinyl" },
      { value: "vintage", label: "Vintage" },
      { value: "refurbished", label: "Refurbished" },
    ],
    []
  );
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState(deselectedOptions);

  const updateText = useCallback(
    (value) => {
      setInputValue(value);

      if (value === "") {
        setOptions(deselectedOptions);
        return;
      }

      const filterRegex = new RegExp(value, "i");
      const resultOptions = deselectedOptions.filter((option) =>
        option.label.match(filterRegex)
      );
      setOptions(resultOptions);
    },
    [deselectedOptions]
  );

  const updateSelection = useCallback(
    (selected) => {
      const selectedValue = selected.map((selectedItem) => {
        const matchedOption = options.find((option) => {
          return option.value.match(selectedItem);
        });
        return matchedOption && matchedOption.label;
      });

      setSelectedOptions(selected);
      setInputValue(selectedValue[0]);
    },
    [options]
  );

  const textField = (
    <Autocomplete.TextField
      onChange={updateText}
      placeholder="Search by Name, Reg no"
      value={inputValue}
      prefix={<Icon source={SearchMinor} color="base" />}
    />
  );
  return (
    <div className="container">
      <div className="form-horizon-btw p25">
        <div className="form-horizon-start">
          <img alt="history pic" src="history.png" className="patient-pic" />
          <h1 className="page-heading">History of Patients</h1>
        </div>
        <div className="form-horizon child-mar-15">
          <Autocomplete
            options={options}
            selected={selectedOptions}
            onSelect={updateSelection}
            textField={textField}
          />
        </div>
      </div>
      <div className="p25">
        <>
          <Scrollable shadow style={{ height: "80vh" }}>
            <Card>
              <DataTable
                columnContentTypes={["text", "text", "text", "text", "text"]}
                headings={[
                  "Registration no.",
                  "Name",
                  "Date",
                  "Desiese",
                  "Location",
                ]}
                rows={rows}
                //   totals={['', '', '', 255, '$155,830.00']}
              />
            </Card>
          </Scrollable>
        </>
      </div>
    </div>
  );
};

export default HistoryTable;
