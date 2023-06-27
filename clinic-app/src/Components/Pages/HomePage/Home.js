import {
  Card,
  DataTable,
  Scrollable,
  Autocomplete,
  Icon,
  Button,
  Modal,
  LegacyStack,
  TextContainer,
} from "@shopify/polaris";
import apicall from "../../../database/db";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { SearchMinor} from "@shopify/polaris-icons";
import { contxtname } from "../../../Context/appcontext";
import { useNavigate } from "react-router-dom";
const Home = () => {
  const navigate = useNavigate();


  return (
    <div className="container">
      <div className="form-horizon-btw p25">
        <div className="form-horizon-start">
          <img alt="history pic" src="home.png" className="patient-pic" />
          <h1 className="page-heading">My clinic</h1>
        </div>
        
      </div>
      <div className="p25">
        <>
         
        </>
      </div>
     
    </div>
  );
};

export default Home;
