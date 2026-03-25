import React, { useState, useEffect } from "react";
import {
  Card, DataTable, Button, Modal, Form, FormLayout,
  TextField, Select, Banner
} from "@shopify/polaris";
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
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("staff");
  const [addError, setAddError] = useState("");

  // Change password modal
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [changePwdUserId, setChangePwdUserId] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [changePwdError, setChangePwdError] = useState("");

  const fetchUsers = async () => {
    const result = await window.api.invoke("users:getAll", token);
    if (Array.isArray(result)) setUsers(result);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAddUser = async () => {
    if (!newName || !newUsername || !newPassword) {
      setAddError("All fields are required."); return;
    }
    const result = await window.api.invoke("users:add", token, {
      name: newName, username: newUsername, password: newPassword, role: newRole,
    });
    if (result.error) { setAddError(result.error); return; }
    setShowAdd(false);
    setNewName(""); setNewUsername(""); setNewPassword(""); setNewRole("staff"); setAddError("");
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

  const rows = users.map((u) => [
    u.name,
    u.username,
    u.role,
    <div key={u.id} style={{ display: "flex", gap: "8px" }}>
      <Button size="slim" onClick={() => { setChangePwdUserId(u.id); setShowChangePwd(true); }}>
        Change Password
      </Button>
      <Button
        size="slim"
        destructive
        disabled={u.id === currentUserId}
        onClick={() => handleDelete(u.id)}
      >
        Delete
      </Button>
    </div>,
  ]);

  return (
    <div className="container p25">
      <div className="form-horizon-btw" style={{ marginBottom: "20px" }}>
        <h1 className="page-heading">User Management</h1>
        <Button primary onClick={() => setShowAdd(true)}>Add User</Button>
      </div>
      {feedback.msg && (
        <Banner status={feedback.type} onDismiss={() => setFeedback({ msg: "", type: "success" })}>
          {feedback.msg}
        </Banner>
      )}
      <Card>
        <DataTable
          columnContentTypes={["text", "text", "text", "text"]}
          headings={["Name", "Username", "Role", "Actions"]}
          rows={rows}
        />
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New User"
        primaryAction={{ content: "Add", onAction: handleAddUser }}
        secondaryActions={[{ content: "Cancel", onAction: () => setShowAdd(false) }]}>
        <Modal.Section>
          {addError && <Banner status="critical">{addError}</Banner>}
          <Form>
            <FormLayout>
              <TextField label="Full Name" value={newName} onChange={setNewName} autoComplete="off" />
              <TextField label="Username" value={newUsername} onChange={setNewUsername} autoComplete="off" />
              <TextField label="Password" value={newPassword} onChange={setNewPassword} type="password" autoComplete="new-password" />
              <Select label="Role"
                options={[{ label: "Staff", value: "staff" }, { label: "Admin", value: "admin" }]}
                value={newRole} onChange={setNewRole} />
            </FormLayout>
          </Form>
        </Modal.Section>
      </Modal>

      <Modal open={showChangePwd} onClose={() => setShowChangePwd(false)} title="Change Password"
        primaryAction={{ content: "Save", onAction: handleChangePassword }}
        secondaryActions={[{ content: "Cancel", onAction: () => setShowChangePwd(false) }]}>
        <Modal.Section>
          {changePwdError && <Banner status="critical">{changePwdError}</Banner>}
          <TextField label="New Password" value={newPwd} onChange={setNewPwd} type="password" autoComplete="new-password" />
        </Modal.Section>
      </Modal>
    </div>
  );
};

export default AdminPanel;