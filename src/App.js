import "./App.css";
import Login from "./Components/Pages/Login/login";
import FirstRun from "./Components/Pages/FirstRun/FirstRun";
import { Navigate, Route, Routes } from "react-router-dom";
import Panel from "./Panel";
import { contxtname } from "./Context/appcontext";
import React, { useEffect, useState } from "react";

function App() {
  const contxt = React.useContext(contxtname);
  const [isFirstRun, setIsFirstRun] = useState(null); // null = loading

  useEffect(() => {
    window.api.invoke("auth:checkFirstRun").then((result) => {
      setIsFirstRun(result.isFirstRun);
    });
  }, []);

  if (isFirstRun === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="spinner" aria-label="Loading" />
      </div>
    );
  }

  if (isFirstRun) {
    return <FirstRun onComplete={() => setIsFirstRun(false)} />;
  }

  return (
    <div>
      <div
        className="watermark"
        style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/logo.png)` }}
      />
      {contxt.loggedIn.loggedin ? (
        <Panel />
      ) : (
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      )}
    </div>
  );
}

export default App;
