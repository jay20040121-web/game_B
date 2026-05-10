import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('desktopWindow', {
  setContentSize: (width, height) => ipcRenderer.invoke('desktop:set-content-size', { width, height })
})
