import React, { useState } from "react";
import { Form, FormLayout, TextField, Button, Spinner, Banner } from "@shopify/polaris";

const FirstRun = ({ onComplete }) => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !username || !password || !confirm) {
      setError("All fields are required."); return;
    }
    if (password !== confirm) {
      setError("Passwords do not match."); return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters."); return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await window.api.invoke("auth:firstRun", { name, username, password });
      if (result.error) {
        setError(result.error);
      } else {
        onComplete();
      }
    } catch (err) {
      setError("Setup failed. Please restart the app and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="flex-vertical login-page">
        <div className="login-brand">
          <img src="logo.png" alt="MediTrack" className="login-brand-logo" />
          <span className="login-brand-name">MediTrack</span>
          <p className="welcome-heading">First time setup — create your admin account</p>
        </div>
        <div className="login-form">
          <Form onSubmit={handleSubmit}>
            <FormLayout>
              {error && <Banner status="critical">{error}</Banner>}
              <TextField requiredIndicator value={name} onChange={setName} label="Full Name" autoComplete="name" />
              <TextField requiredIndicator value={username} onChange={setUsername} label="Username" autoComplete="username" />
              <TextField requiredIndicator value={password} onChange={setPassword} label="Password" type="password" autoComplete="new-password" />
              <TextField requiredIndicator value={confirm} onChange={setConfirm} label="Confirm Password" type="password" autoComplete="new-password" />
              <Button primary submit disabled={loading}>
                {loading ? <Spinner accessibilityLabel="Creating" size="small" /> : "Create Admin Account"}
              </Button>
            </FormLayout>
          </Form>
        </div>
      </div>
    </div>
  );
};


export default FirstRun;
