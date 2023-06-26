import React from "react";
import {
  Form,
  FormLayout,
  TextField,
  Button,
  Spinner,
  InlineError,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [errorUserEmpty, setErrorUserEmpty] = useState(false);
  const [errorPasswordEmpty, setErrorPasswordEmpty] = useState(false);
  const [errorUserWrong, setErrorUserWrong] = useState(false);
  const [errorPasswordWrong, setErrorPasswordWrong] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [clicked, setClicked] = useState("no");
  const navigate = useNavigate();
  const handleEmailChange = useCallback((value) => setUser(value), []);
  const handleSubmit = async (event) => {
    setErrorUserEmpty(false);
    setErrorPasswordEmpty(false);
    setErrorUserWrong(false);
    setErrorPasswordWrong(false);
    setClicked("yes");
    event.preventDefault();
    if (user === "" && pass === "") {
      setClicked("no");
      setErrorUserEmpty(true);
      setErrorPasswordEmpty(true);
    } else {
      if (user === "") {
        setClicked("no");
        setErrorUserEmpty(true);
      } else if (pass === "") {
        setClicked("no");
        setErrorPasswordEmpty(true);
      } else {
        if (user === "admin" && pass === "password123") {
          navigate("/patientform");
        } else {
          if (user !== "admin") {
            setClicked("no");
            setErrorUserWrong(true);
          }
          if (pass !== "password") {
            setClicked("no");
            setErrorPasswordWrong(true);
          }
        }
      }
    }
  };

  return (
    <div className="container">
      <div className="flex-vertical login-page">
      <h1 className="welcome-heading">Welcome to Akash's Clinic</h1>
      <div className="flex-horizon login-form">
      <img alt='welcome pic' src='welcome.png' className="welcome-pic"/>
          <Form onSubmit={handleSubmit}>
            <FormLayout>
              <TextField
                error={
                  (errorUserEmpty === true || errorUserWrong === true) && true
                }
                requiredIndicator
                value={user}
                onChange={handleEmailChange}
                label="Email"
                autoComplete="email"
                helpText={
                  <span>We’ll use this email address to authenticate you.</span>
                }
              />
              {errorUserEmpty && (
                <InlineError
                  message="Empty field of username"
                  fieldID="myFieldID"
                />
              )}
              {errorUserWrong && (
                <InlineError message="Invalid username" fieldID="myFieldID" />
              )}
              <TextField
                error={
                  (errorPasswordEmpty === true ||
                    errorPasswordWrong === true) &&
                  true
                }
                requiredIndicator
                onChange={(e) => setPass(e)}
                label="Password"
                type="password"
                value={pass}
                helpText={
                  <span>We’ll use this password to authenticate you.</span>
                }
              />
              {errorPasswordEmpty && (
                <InlineError
                  message="Empty field of password"
                  fieldID="myFieldID"
                />
              )}
              {errorPasswordWrong && (
                <InlineError message="Invalid password" fieldID="myFieldID" />
              )}
              <Button primary submit>
                {clicked === "no" ? (
                  <>Submit</>
                ) : (
                  <Spinner accessibilityLabel="Spinner example" size="small" />
                )}
              </Button>
            </FormLayout>
          </Form>{" "}
      </div>
      </div>
    </div>
  );
};


export default Login;