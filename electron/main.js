// electron/main.js
'use strict';

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { autoUpdater } = require('electron-updater');
const { randomUUID } = require('crypto');

// db, dbPath, backupPath initialized inside app.whenReady() — app.getPath() throws before ready
let db;
let dbPath;
let backupPath;
const sessions = {};

function requireAuth(token) {
  const session = sessions[token];
  if (!session) throw new Error('Unauthorized');
  return session;
}

function requireAdmin(token) {
  const session = requireAuth(token);
  if (session.role !== 'admin') throw new Error('Forbidden');
  return session;
}

function initDatabase() {
  const low = require('lowdb');
  const FileSync = require('lowdb/adapters/FileSync');

  const userDataPath = app.getPath('userData');
  dbPath = path.join(userDataPath, 'data.json');
  backupPath = path.join(userDataPath, 'data.backup.json');

  const legacyDbPath = path.join(app.getPath('appData'), 'meditrack', 'data.json');
  if (!fs.existsSync(dbPath) && fs.existsSync(legacyDbPath)) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.copyFileSync(legacyDbPath, dbPath);
    console.log(`Migrated existing data from legacy meditrack path to ${dbPath}`);
  }

  const adapter = new FileSync(dbPath);
  db = low(adapter);
  db.defaults({
    users: [],
    patients: [],
    customSuggestions: { medicines: [], symptoms: [], diseases: [] },
    emailSettings: { host: "", port: 587, secure: false, user: "", pass: "", from: "" },
    clinicName: "",
    passwordResets: [],
    emailVerifications: [],
    migrationDone: false,
  }).write();

  if (!db.get('migrationDone').value()) {
    const oldDbPath = path.join(__dirname, '../../api/db.json');
    if (fs.existsSync(oldDbPath)) {
      try {
        const oldData = JSON.parse(fs.readFileSync(oldDbPath, 'utf-8'));
        if (Array.isArray(oldData.patients) && oldData.patients.length > 0) {
          db.set('patients', oldData.patients).write();
          console.log(`Migrated ${oldData.patients.length} patients from old db.json`);
        }
      } catch (e) {
        console.log('Migration skipped:', e.message);
      }
    }
    db.set('migrationDone', true).write();
  }
}

function getEmailTransporter() {
  const settings = db.get('emailSettings').value();
  if (!settings || !settings.host || !settings.user || !settings.pass) {
    throw new Error('Email service is not configured. Please set SMTP settings in Settings.');
  }
  return nodemailer.createTransport({
    host: settings.host,
    port: Number(settings.port) || 587,
    secure: Boolean(settings.secure),
    auth: {
      user: settings.user,
      pass: settings.pass,
    },
  });
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function pruneExpiredResets() {
  const now = Date.now();
  db.set('passwordResets', db.get('passwordResets').value().filter((entry) => entry.expiresAt > now && !entry.used)).write();
}

function pruneExpiredVerifications() {
  const now = Date.now();
  db.set('emailVerifications', db.get('emailVerifications').value().filter((entry) => entry.expiresAt > now && !entry.used)).write();
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Medryon',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }
}

app.whenReady().then(() => {
  initDatabase();
  createWindow();
  if (process.env.NODE_ENV !== 'development') {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

autoUpdater.on('update-available', () => {
  if (mainWindow) mainWindow.webContents.send('update:available');
});
autoUpdater.on('update-downloaded', () => {
  if (mainWindow) mainWindow.webContents.send('update:downloaded');
});
ipcMain.handle('update:install', () => {
  autoUpdater.quitAndInstall();
});

ipcMain.handle('auth:checkFirstRun', () => {
  return { isFirstRun: db.get('users').value().length === 0 };
});

ipcMain.handle('auth:firstRun', async (event, { name, username, password, email, contact }) => {
  if (db.get('users').value().length > 0) return { error: 'Setup already complete' };
  if (!name || !username || !password || !email || !contact) return { error: 'All fields are required, including email and contact number.' };
  const hashed = await bcrypt.hash(password, 10);
  const user = { id: Date.now().toString(), name, username, email, contact, password: hashed, role: 'admin' };
  db.get('users').push(user).write();
  return { success: true };
});

ipcMain.handle('auth:login', async (event, { username, password }) => {
  const user = db.get('users').find({ username }).value();
  if (!user) return { error: 'Invalid username or password' };
  const match = await bcrypt.compare(password, user.password);
  if (!match) return { error: 'Invalid username or password' };
  const token = randomUUID();
  sessions[token] = { id: user.id, name: user.name, username: user.username, role: user.role };
  return { success: true, token, user: { id: user.id, name: user.name, username: user.username, role: user.role } };
});

ipcMain.handle('auth:logout', (event, token) => {
  delete sessions[token];
  return { success: true };
});

ipcMain.handle('auth:sendResetOtp', async (event, username) => {
  pruneExpiredResets();
  if (!username || !username.trim()) {
    return { error: 'Please enter your username.' };
  }
  const user = db.get('users').find({ username: username.trim() }).value();
  if (!user || !user.email) {
    return { error: 'No email found for that username. Please contact another admin.' };
  }
  try {
    const transporter = getEmailTransporter();
    const settings = db.get('emailSettings').value();
    const code = generateOtp();
    const expiresAt = Date.now() + 15 * 60 * 1000;
    db.get('passwordResets').push({ username: user.username, code, expiresAt, used: false }).write();
    const fromValue = settings.user;
    const fromAddress = `${fromValue} <${fromValue}>`;
    console.log("fromAddress", fromAddress);
    await transporter.sendMail({
      to: user.email,
      from: fromAddress,
      subject: 'Medryon Password Reset Code',
      text: `Your Medryon password reset code is ${code}. It expires in 15 minutes. If you did not request this, ignore this email.`,
    });
    return { success: true };
  } catch (error) {
    console.error('Password reset send failed', error);
    return { error: 'Failed to send OTP email. Check SMTP settings and try again.' };
  }
});

ipcMain.handle('auth:resetPassword', async (event, username, code, newPassword) => {
  pruneExpiredResets();
  if (!username || !code || !newPassword) {
    return { error: 'Missing username, code, or new password.' };
  }
  if (newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }
  const resetEntry = db.get('passwordResets')
    .find({ username: username.trim(), code: String(code).trim(), used: false })
    .value();
  if (!resetEntry) {
    return { error: 'Invalid or expired OTP code.' };
  }
  if (resetEntry.expiresAt < Date.now()) {
    return { error: 'OTP code has expired. Please request a new one.' };
  }
  const hashed = await bcrypt.hash(newPassword, 10);
  db.get('users').find({ username: username.trim() }).assign({ password: hashed }).write();
  db.get('passwordResets')
    .find({ username: username.trim(), code: String(code).trim(), used: false })
    .assign({ used: true })
    .write();
  return { success: true };
});

ipcMain.handle('auth:sendVerificationOtp', async (event, { email }) => {
  if (!email || typeof email !== 'string') {
    return { error: 'Valid email is required.' };
  }
  const trimmedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return { error: 'Please enter a valid email address.' };
  }
  try {
    const transporter = getEmailTransporter();
    const settings = db.get('emailSettings').value();
    const code = generateOtp();
    const expiresAt = Date.now() + 15 * 60 * 1000;
    db.get('emailVerifications').push({ email: trimmedEmail, code, expiresAt, used: false }).write();
    const fromValue = settings.user;
    const fromAddress = `${fromValue} <${fromValue}>`;
    await transporter.sendMail({
      to: trimmedEmail,
      from: fromAddress,
      subject: 'Medryon Email Verification Code',
      text: `Your Medryon email verification code is ${code}. It expires in 15 minutes. If you did not request this, ignore this email.`,
    });
    return { success: true };
  } catch (error) {
    console.error('Email verification send failed', error);
    return { error: 'Failed to send verification code. Check SMTP settings and try again.' };
  }
});

ipcMain.handle('auth:verifyEmailOtp', (event, { email, code }) => {
  pruneExpiredVerifications();
  if (!email || !code) {
    return { error: 'Email and code are required.' };
  }
  const trimmedEmail = String(email).trim().toLowerCase();
  const trimmedCode = String(code).trim();
  const entry = db.get('emailVerifications').find({ email: trimmedEmail, code: trimmedCode, used: false }).value();
  if (!entry) {
    return { error: 'Invalid or expired verification code.' };
  }
  db.get('emailVerifications').find({ email: trimmedEmail, code: trimmedCode, used: false }).assign({ used: true }).write();
  return { success: true };
});

ipcMain.handle('patients:getAll', (event, token) => {
  requireAuth(token);
  return db.get('patients').value();
});

ipcMain.handle('patients:add', (event, token, patient) => {
  requireAuth(token);
  if (!patient.id) patient.id = Date.now().toString();
  db.get('patients').push(patient).write();
  return patient;
});

ipcMain.handle('billing:generateBill', async (event, payload) => {
  if (!payload || !payload.patient || !payload.bill) {
    return { error: 'Invalid patient or bill data for bill generation.' };
  }
  const { patient, bill } = payload;
  try {
    const billsDir = path.join(app.getPath('userData'), 'bills');
    if (!fs.existsSync(billsDir)) fs.mkdirSync(billsDir, { recursive: true });
    const billNumber = bill.billNumber || `BILL-${patient.id}`;
    const pdfPath = path.join(billsDir, `${billNumber}.pdf`);
    const clinicName = db.get('clinicName').value() || 'Medryon Clinic';
    const total = Number(bill.billTotal || patient.fee) || 0;
    const billDate = new Date(bill.billGeneratedAt || Date.now()).toLocaleString();
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${billNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 32px; color: #111827; }
    .invoice-wrap { max-width: 900px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; }
    .invoice-header { background: #0f172a; color: #ffffff; padding: 32px; }
    .invoice-header h1 { margin: 0; font-size: 36px; letter-spacing: 0.02em; }
    .invoice-header p { margin: 8px 0 0; font-size: 14px; color: #cbd5e1; }
    .invoice-body { background: #ffffff; padding: 32px; }
    .grid { display: grid; gap: 24px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .section-title { font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; color: #64748b; margin-bottom: 8px; }
    .field-label { font-size: 14px; color: #334155; margin-bottom: 6px; }
    .field-value { font-size: 16px; color: #0f172a; line-height: 1.6; }
    .table-wrap { margin-top: 24px; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 16px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; color: #475569; font-size: 14px; }
    .total-row td { border-top: 2px solid #e2e8f0; }
    .total-label { font-weight: 700; color: #0f172a; }
    .total-amount { font-size: 24px; font-weight: 700; color: #0f172a; }
    .note { margin-top: 32px; padding: 20px; background: #f1f5f9; border-radius: 16px; font-size: 14px; color: #475569; }
  </style>
</head>
<body>
  <div class="invoice-wrap">
    <div class="invoice-header">
      <h1>${clinicName}</h1>
      <p>Invoice generated by Medryon</p>
    </div>
    <div class="invoice-body">
      <div class="grid">
        <div>
          <div class="section-title">Invoice</div>
          <div class="field-label">Invoice No.</div>
          <div class="field-value">${billNumber}</div>
          <div class="field-label">Date</div>
          <div class="field-value">${billDate}</div>
        </div>
        <div>
          <div class="section-title">Patient</div>
          <div class="field-label">Name</div>
          <div class="field-value">${patient.name || 'N/A'}</div>
          <div class="field-label">Contact</div>
          <div class="field-value">${patient.contact_no ? '+91 ' + patient.contact_no : 'N/A'}</div>
          <div class="field-label">Location</div>
          <div class="field-value">${patient.location || 'N/A'}</div>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Consultation Fee</td>
              <td>1</td>
              <td>₹${total}</td>
              <td>₹${total}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="3" class="total-label">Total</td>
              <td class="total-amount">₹${total}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div class="note">
        Thank you for visiting ${clinicName}. Please contact us if you need any follow-up consultation.
      </div>
    </div>
  </div>
</body>
</html>`;

    const pdfWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        offscreen: true,
      },
    });
    await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    await new Promise((resolve, reject) => {
      const wc = pdfWindow.webContents;
      wc.once('did-finish-load', resolve);
      wc.once('did-fail-load', (event, errorCode, errorDescription) => reject(new Error(`${errorDescription} (${errorCode})`)));
    });
    const pdfBuffer = await pdfWindow.webContents.printToPDF({
      marginsType: 1,
      printBackground: true,
      pageSize: 'A4',
    });
    fs.writeFileSync(pdfPath, pdfBuffer);
    pdfWindow.close();
    return { success: true, filePath: pdfPath, billNumber };
  } catch (error) {
    console.error('Bill generation failed', error);
    return { error: 'Failed to generate bill file.' };
  }
});

ipcMain.handle('billing:openPdf', async (event, pdfPath) => {
  if (!pdfPath || !fs.existsSync(pdfPath)) {
    return { error: 'PDF file not found.' };
  }
  try {
    const result = await shell.openPath(pdfPath);
    if (result) {
      console.warn('shell.openPath failed, retrying with openExternal:', result);
      const url = `file://${pdfPath}`;
      const externalResult = await shell.openExternal(url);
      if (externalResult) {
        return { error: externalResult };
      }
    }
    return { success: true };
  } catch (error) {
    console.error('Open PDF failed in main process:', error);
    return { error: 'Unable to open PDF file.' };
  }
});

ipcMain.handle('patients:update', (event, token, id, data) => {
  requireAuth(token);
  db.get('patients').find({ id }).assign(data).write();
  return db.get('patients').find({ id }).value();
});

ipcMain.handle('patients:delete', (event, token, id) => {
  requireAuth(token);
  db.get('patients').remove({ id }).write();
  return { success: true };
});

ipcMain.handle('suggestions:get', (event, token) => {
  requireAuth(token);
  return db.get('customSuggestions').value();
});

ipcMain.handle('suggestions:save', (event, token, data) => {
  requireAuth(token);
  if (
    !data ||
    !Array.isArray(data.medicines) ||
    !Array.isArray(data.symptoms) ||
    !Array.isArray(data.diseases)
  ) {
    throw new Error('Invalid suggestions payload');
  }
  const isValidList = (arr) =>
    arr.every((item) => typeof item === 'string' && item.trim().length > 0 && item.length <= 200);
  if (!isValidList(data.medicines) || !isValidList(data.symptoms) || !isValidList(data.diseases)) {
    throw new Error('Invalid suggestions payload');
  }
  const payload = {
    medicines: data.medicines,
    symptoms: data.symptoms,
    diseases: data.diseases,
  };
  db.set('customSuggestions', payload).write();
  return db.get('customSuggestions').value();
});

ipcMain.handle('users:getAll', (event, token) => {
  requireAdmin(token);
  return db.get('users').map(u => ({ id: u.id, name: u.name, username: u.username, email: u.email, contact: u.contact, role: u.role })).value();
});

ipcMain.handle('users:add', async (event, token, { name, username, email, contact, password, role }) => {
  requireAdmin(token);
  if (!name || !username || !email || !contact || !password) return { error: 'Name, username, email, contact number, and password are required.' };
  if (db.get('users').find({ username }).value()) return { error: 'Username already exists' };
  const hashed = await bcrypt.hash(password, 10);
  const user = { id: Date.now().toString(), name, username, email, contact, password: hashed, role };
  db.get('users').push(user).write();
  return { id: user.id, name: user.name, username: user.username, role: user.role, email: user.email, contact: user.contact };
});

ipcMain.handle('users:delete', (event, token, id) => {
  const session = requireAdmin(token);
  if (session.id === id) return { error: 'Cannot delete your own account' };
  const targetUser = db.get('users').find({ id }).value();
  if (targetUser && targetUser.role === 'admin') {
    const adminCount = db.get('users').filter({ role: 'admin' }).value().length;
    if (adminCount <= 1) return { error: 'Cannot delete the last admin account' };
  }
  db.get('users').remove({ id }).write();
  return { success: true };
});

ipcMain.handle('users:changePassword', async (event, token, id, newPassword) => {
  requireAdmin(token);
  const hashed = await bcrypt.hash(newPassword, 10);
  db.get('users').find({ id }).assign({ password: hashed }).write();
  return { success: true };
});

ipcMain.handle('settings:getEmailConfig', (event, token) => {
  requireAdmin(token);
  return db.get('emailSettings').value();
});

ipcMain.handle('settings:saveEmailConfig', (event, token, settings) => {
  requireAdmin(token);
  const sanitized = {
    host: String(settings.host || '').trim(),
    port: Number(settings.port) || 587,
    secure: Boolean(settings.secure),
    user: String(settings.user || '').trim(),
    pass: String(settings.pass || '').trim(),
    from: String(settings.from || '').trim(),
  };
  if (!sanitized.host || !sanitized.user || !sanitized.pass) {
    return { error: 'Please complete all SMTP fields.' };
  }
  db.set('emailSettings', sanitized).write();
  return { success: true, emailSettings: sanitized };
});

ipcMain.handle('settings:getClinicConfig', (event, token) => {
  requireAdmin(token);
  return { clinicName: db.get('clinicName').value() || '' };
});

ipcMain.handle('settings:saveClinicConfig', (event, token, config) => {
  requireAdmin(token);
  const clinicName = String(config?.clinicName || '').trim();
  db.set('clinicName', clinicName).write();
  return { success: true, clinicName };
});

ipcMain.handle('settings:sendTestEmail', async (event, token) => {
  requireAdmin(token);
  try {
    const transporter = getEmailTransporter();
    const settings = db.get('emailSettings').value();
    const fromValue = settings.from || settings.user;
    const fromAddress = `${fromValue} <${fromValue}>`;
    await transporter.sendMail({
      to: settings.from || settings.user,
      from: fromAddress,
      subject: 'Medryon SMTP Setup Test',
      text: 'This is a test email from Medryon. If you receive this, your SMTP settings are correct.',
    });
    return { success: true };
  } catch (error) {
    console.error('SMTP test email failed', error);
    return { error: 'SMTP test email failed. ' + (error.message || 'Check config.') };
  }
});

ipcMain.handle('data:export', async (event, token) => {
  requireAdmin(token);
  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Medryon Data',
    defaultPath: 'medryon-backup.json',
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
  });
  if (canceled || !filePath) return { canceled: true };
  fs.copyFileSync(dbPath, filePath);
  return { success: true, filePath };
});

ipcMain.handle('data:import', async (event, token) => {
  requireAdmin(token);
  const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
    title: 'Import Medryon Data',
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
    properties: ['openFile'],
  });
  if (canceled || filePaths.length === 0) return { canceled: true };

  let imported;
  try {
    imported = JSON.parse(fs.readFileSync(filePaths[0], 'utf-8'));
  } catch {
    return { error: 'Invalid JSON file. Import failed.' };
  }
  if (!Array.isArray(imported.users) || !Array.isArray(imported.patients)) {
    return { error: 'Invalid data format. File must contain "users" and "patients" arrays.' };
  }

  if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, backupPath);
  }

  try {
    fs.writeFileSync(dbPath, JSON.stringify(imported, null, 2), 'utf-8');
    db.read();
    Object.keys(sessions).forEach(k => delete sessions[k]);
    return { success: true };
  } catch (err) {
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, dbPath);
      db.read();
    }
    return { error: 'Failed to import data. Previous data restored.' };
  }
});
