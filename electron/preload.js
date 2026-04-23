// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

const allowedChannels = [
  'auth:login',
  'auth:logout',
  'auth:firstRun',
  'auth:checkFirstRun',
  'auth:sendResetOtp',
  'auth:resetPassword',
  'auth:sendVerificationOtp',
  'auth:verifyEmailOtp',
  'patients:getAll',
  'patients:add',
  'patients:update',
  'patients:delete',
  'billing:generateBill',
  'billing:openPdf',
  'billing:getPdfData',
  'users:getAll',
  'users:add',
  'users:delete',
  'users:changePassword',
  'settings:getEmailConfig',
  'settings:saveEmailConfig',
  'settings:getClinicConfig',
  'settings:saveClinicConfig',
  'settings:sendTestEmail',
  'data:export',
  'data:import',
  'suggestions:get',
  'suggestions:save',
  'update:install',
];

contextBridge.exposeInMainWorld('api', {
  invoke: (channel, ...args) => {
    if (allowedChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    return Promise.reject(new Error(`Channel not allowed: ${channel}`));
  },
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update:available', callback);
    return () => ipcRenderer.removeListener('update:available', callback);
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update:downloaded', callback);
    return () => ipcRenderer.removeListener('update:downloaded', callback);
  },
});
