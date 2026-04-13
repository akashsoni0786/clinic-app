import React, { useState } from "react";
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
      <div className="flex min-h-[calc(100vh-110px)] flex-col items-center justify-center gap-8 py-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <img src="logo.png" alt="MediTrack" className="login-brand-logo" />
          <span className="login-brand-name">MediTrack</span>
          <p className="welcome-heading">Welcome back — please sign in</p>
        </div>
        <div className="w-full max-w-md rounded-[1.5rem] bg-white p-8 shadow-xl">
          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
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
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-base"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
