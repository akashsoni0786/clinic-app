// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

const allowedChannels = [
  'auth:login',
  'auth:logout',
  'auth:firstRun',
  'auth:checkFirstRun',
  'patients:getAll',
  'patients:add',
  'patients:update',
  'patients:delete',
  'users:getAll',
  'users:add',
  'users:delete',
  'users:changePassword',
  'data:export',
  'data:import',
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
