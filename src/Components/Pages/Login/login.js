import React, { useState } from "react";
import { Form, FormLayout, TextField, Button, Spinner, Banner } from "@shopify/polaris";
import { contxtname } from "../../../Context/appcontext";

const Login = () => {
  const contxt = React.useContext(contxtname);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter username and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await window.api.invoke("auth:login", { username, password });
      if (result.error) {
        setError(result.error);
      } else {
        contxt.setLoggedIn({
          id: result.user.id,
          username: result.user.username,
          name: result.user.name,
          role: result.user.role,
          token: result.token,
          loggedin: true,
        });
      }
    } catch (err) {
      setError("Login failed. Please restart the app and try again.");
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
          <p className="welcome-heading">Welcome back — please sign in</p>
        </div>
        <div className="flex-horizon" style={{ gap: "60px", alignItems: "flex-start", flexWrap: "wrap" }}>
          <div className="login-form">
            <Form onSubmit={handleSubmit}>
              <FormLayout>
                {error && <Banner status="critical">{error}</Banner>}
                <TextField
                  requiredIndicator
                  value={username}
                  onChange={setUsername}
                  label="Username"
                  autoComplete="username"
                />
                <TextField
                  requiredIndicator
                  value={password}
                  onChange={setPassword}
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                />
                <Button primary submit disabled={loading} fullWidth>
                  {loading ? <Spinner accessibilityLabel="Logging in" size="small" /> : "Login"}
                </Button>
              </FormLayout>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
