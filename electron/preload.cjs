const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopWindow', {
  setContentSize: (width, height) => ipcRenderer.invoke('desktop:set-content-size', { width, height })
});

contextBridge.exposeInMainWorld('desktopStorage', {
  loadSaveSync: () => ipcRenderer.sendSync('desktop-save:load-sync'),
  setSave: (saveText) => ipcRenderer.invoke('desktop-save:set', saveText),
  clearSave: () => ipcRenderer.invoke('desktop-save:clear')
});
