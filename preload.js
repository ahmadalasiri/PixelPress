const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  selectFolder: (title) => ipcRenderer.invoke("select-folder", title),
  processImages: (options) => ipcRenderer.invoke("process-images", options),
  showErrorDialog: (title, content) =>
    ipcRenderer.invoke("show-error-dialog", title, content),
  showInfoDialog: (title, content) =>
    ipcRenderer.invoke("show-info-dialog", title, content),
  onProcessingProgress: (callback) => {
    ipcRenderer.on("processing-progress", (event, progress) =>
      callback(progress)
    );
  },
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
});
