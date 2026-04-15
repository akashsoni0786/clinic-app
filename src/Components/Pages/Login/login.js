import React, { useState } from "react";
import { contxtname } from "../../../Context/appcontext";

const Login = () => {
  const contxt = React.useContext(contxtname);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetMode, setResetMode] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetUsername, setResetUsername] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
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

  const handleSendResetOtp = async () => {
    if (!resetUsername.trim()) {
      setResetMessage("Enter your username to receive the OTP.");
      return;
    }
    setResetMessage("");
    setResetLoading(true);
    try {
      const result = await window.api.invoke("auth:sendResetOtp", resetUsername.trim());
      if (result.error) {
        setResetMessage(result.error);
      } else {
        setResetStep(2);
        setResetMessage("OTP sent. Check your email and enter it below.");
      }
    } catch (err) {
      setResetMessage(err?.message || "Unable to send OTP. Please check email settings or contact support.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetUsername.trim() || !resetCode.trim() || !resetPassword || !resetConfirm) {
      setResetMessage("Please fill in all reset fields.");
      return;
    }
    if (resetPassword !== resetConfirm) {
      setResetMessage("Passwords do not match.");
      return;
    }
    setResetMessage("");
    setResetLoading(true);
    try {
      const result = await window.api.invoke(
        "auth:resetPassword",
        resetUsername.trim(),
        resetCode.trim(),
        resetPassword,
      );
      if (result.error) {
        setResetMessage(result.error);
      } else {
        setResetMessage("Password updated successfully. You can now login.");
        setResetMode(false);
        setResetStep(1);
        setResetUsername("");
        setResetCode("");
        setResetPassword("");
        setResetConfirm("");
      }
    } catch (err) {
      setResetMessage("Unable to reset password. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="flex min-h-[calc(100vh-110px)] flex-col items-center justify-center gap-8 py-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <img src="logo.png" alt="Medryon" className="login-brand-logo" />
          <span className="login-brand-name">Medryon</span>
          <p className="welcome-heading">Welcome back — please sign in</p>
        </div>
        <div className="w-full max-w-md rounded-[1.5rem] bg-white p-8 shadow-xl">
          {(error || resetMessage) && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {resetMode ? resetMessage : error}
            </div>
          )}

          {resetMode ? (
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Username</label>
                <input
                  type="text"
                  autoComplete="username"
                  value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)}
                  className="input-base"
                />
              </div>
              {resetStep === 1 ? (
                <div>
                  <p className="mb-3 text-sm text-slate-600">
                    Enter your username to receive a password reset OTP on your registered email.
                  </p>
                  <button
                    type="button"
                    disabled={resetLoading}
                    className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={handleSendResetOtp}
                  >
                    {resetLoading ? "Sending OTP..." : "Send OTP"}
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">OTP Code</label>
                    <input
                      type="text"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      className="input-base"
                    />
                  </div>
                      <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">New Password</label>
                    <div className="relative">
                      <input
                        type={showResetPassword ? "text" : "password"}
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        className="input-base pr-20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetPassword((current) => !current)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        {showResetPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showResetConfirm ? "text" : "password"}
                        value={resetConfirm}
                        onChange={(e) => setResetConfirm(e.target.value)}
                        className="input-base pr-20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetConfirm((current) => !current)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        {showResetConfirm ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={resetLoading}
                    className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={handleResetPassword}
                  >
                    {resetLoading ? "Updating..." : "Reset Password"}
                  </button>
                </div>
              )}
              <button
                type="button"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setResetMode(false);
                  setResetStep(1);
                  setResetMessage("");
                  setResetCode("");
                  setResetPassword("");
                  setResetConfirm("");
                }}
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Username</label>
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-base"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-base pr-20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((current) => !current)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    {showLoginPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
              <button
                type="button"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setResetMode(true);
                  setResetMessage("");
                  setResetStep(1);
                }}
              >
                Forgot Password?
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
