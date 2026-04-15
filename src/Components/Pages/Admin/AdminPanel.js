import React, { useState, useEffect } from "react";
import { contxtname } from "../../../Context/appcontext";

const AdminPanel = () => {
  const contxt = React.useContext(contxtname);
  const token = contxt.loggedIn.token;
  const currentUserId = contxt.loggedIn.id;

  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState({ msg: "", type: "success" });

  // Add user modal
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newRole, setNewRole] = useState("staff");
  const [addError, setAddError] = useState("");

  // Change password modal
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [changePwdUserId, setChangePwdUserId] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [showChangePwdPassword, setShowChangePwdPassword] = useState(false);
  const [changePwdError, setChangePwdError] = useState("");

  const fetchUsers = async () => {
    const result = await window.api.invoke("users:getAll", token);
    if (Array.isArray(result)) setUsers(result);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAddUser = async () => {
    const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const isValidPhone = (value) => /^\+?[0-9]{7,15}$/.test(value);
    if (!newName.trim() || !newUsername.trim() || !newEmail.trim() || !newContact.trim() || !newPassword) {
      setAddError("All fields are required."); return;
    }
    if (!isValidEmail(newEmail.trim())) {
      setAddError("Please enter a valid email address."); return;
    }
    if (!isValidPhone(newContact.trim())) {
      setAddError("Please enter a valid contact number (digits only, 7-15 characters)."); return;
    }
    const result = await window.api.invoke("users:add", token, {
      name: newName.trim(), username: newUsername.trim(), email: newEmail.trim(), contact: newContact.trim(), password: newPassword, role: newRole,
    });
    if (result.error) { setAddError(result.error); return; }
    setShowAdd(false);
    setNewName(""); setNewUsername(""); setNewEmail(""); setNewContact(""); setNewPassword(""); setNewRole("staff"); setAddError("");
    await fetchUsers();
    setFeedback({ msg: "User added successfully.", type: "success" });
  };

  const handleDelete = async (id) => {
    const result = await window.api.invoke("users:delete", token, id);
    if (result.error) { setFeedback({ msg: result.error, type: "critical" }); return; }
    await fetchUsers();
    setFeedback({ msg: "User deleted.", type: "success" });
  };

  const handleChangePassword = async () => {
    if (!newPwd || newPwd.length < 6) {
      setChangePwdError("Password must be at least 6 characters."); return;
    }
    const result = await window.api.invoke("users:changePassword", token, changePwdUserId, newPwd);
    if (result.error) { setChangePwdError(result.error); return; }
    setShowChangePwd(false); setNewPwd(""); setChangePwdError("");
    setFeedback({ msg: "Password changed successfully.", type: "success" });
  };

  return (
    <div className="container p25">
      <div className="form-horizon-btw mb-5">
        <h1 className="page-heading">User Management</h1>
        <button
          type="button"
          className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
          onClick={() => setShowAdd(true)}
        >
          Add User
        </button>
      </div>
      {feedback.msg && (
        <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${feedback.type === 'critical' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {feedback.msg}
          <button
            type="button"
            className="ml-4 font-semibold"
            onClick={() => setFeedback({ msg: "", type: "success" })}
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Username</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-4">{u.name}</td>
                <td className="px-4 py-4">{u.username}</td>
                <td className="px-4 py-4">{u.email || '—'}</td>
                <td className="px-4 py-4">{u.contact || '—'}</td>
                <td className="px-4 py-4">{u.role}</td>
                <td className="px-4 py-4 space-x-2">
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200"
                    onClick={() => {
                      setChangePwdUserId(u.id);
                      setNewPwd("");
                      setChangePwdError("");
                      setShowChangePwd(true);
                    }}
                  >
                    Change Password
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={u.id === currentUserId}
                    onClick={() => handleDelete(u.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="modal-overlay">
          <div className="modal-panel">
            <h2 className="text-lg font-semibold text-slate-900">Add New User</h2>
            {addError && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{addError}</div>}
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="input-base mt-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="input-base mt-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="input-base mt-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Contact Number</label>
                <input
                  type="tel"
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  placeholder="e.g. +911234567890"
                  className="input-base mt-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-base mt-2 pr-20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((current) => !current)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    {showNewPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="input-base mt-2"
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setShowAdd(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                onClick={handleAddUser}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {showChangePwd && (
        <div className="modal-overlay">
          <div className="modal-panel">
            <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
            {changePwdError && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {changePwdError}
              </div>
            )}
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700">New Password</label>
              <div className="relative">
                <input
                  type={showChangePwdPassword ? "text" : "password"}
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  className="input-base mt-2 pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowChangePwdPassword((current) => !current)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
                >
                  {showChangePwdPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setShowChangePwd(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                onClick={handleChangePassword}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;