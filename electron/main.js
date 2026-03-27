// electron/main.js
'use strict';

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
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

  const adapter = new FileSync(dbPath);
  db = low(adapter);
  db.defaults({ users: [], patients: [], customSuggestions: { medicines: [], symptoms: [], diseases: [] }, migrationDone: false }).write();

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

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'MediTrack',
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

ipcMain.handle('auth:firstRun', async (event, { name, username, password }) => {
  if (db.get('users').value().length > 0) return { error: 'Setup already complete' };
  const hashed = await bcrypt.hash(password, 10);
  const user = { id: Date.now().toString(), name, username, password: hashed, role: 'admin' };
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
  return db.get('users').map(u => ({ id: u.id, name: u.name, username: u.username, role: u.role })).value();
});

ipcMain.handle('users:add', async (event, token, { name, username, password, role }) => {
  requireAdmin(token);
  if (db.get('users').find({ username }).value()) return { error: 'Username already exists' };
  const hashed = await bcrypt.hash(password, 10);
  const user = { id: Date.now().toString(), name, username, password: hashed, role };
  db.get('users').push(user).write();
  return { id: user.id, name, username, role };
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

ipcMain.handle('data:export', async (event, token) => {
  requireAdmin(token);
  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export MediTrack Data',
    defaultPath: 'meditrack-backup.json',
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
  });
  if (canceled || !filePath) return { canceled: true };
  fs.copyFileSync(dbPath, filePath);
  return { success: true, filePath };
});

ipcMain.handle('data:import', async (event, token) => {
  requireAdmin(token);
  const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
    title: 'Import MediTrack Data',
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
