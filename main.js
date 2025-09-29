const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const { processImages } = require("./imageProcessor");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "assets", "icon.png"),
    resizable: true,
    minWidth: 600,
    minHeight: 500,
  });

  mainWindow.loadFile("index.html");

  // Open DevTools in development
  if (process.argv.includes("--dev")) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers
ipcMain.handle("select-folder", async (event, title = "Select Folder") => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title,
    properties: ["openDirectory"],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle("process-images", async (event, options) => {
  try {
    const { sourcePath, destinationPath, targetFormat, maxSizeKB } = options;

    // Validate paths exist
    try {
      await fs.access(sourcePath);
      await fs.access(destinationPath);
    } catch (error) {
      throw new Error(
        "Source or destination folder does not exist or is not accessible"
      );
    }

    // Start processing with progress updates
    const result = await processImages(
      sourcePath,
      destinationPath,
      targetFormat,
      maxSizeKB,
      (progress) => {
        // Send progress updates to renderer
        mainWindow.webContents.send("processing-progress", progress);
      }
    );

    return result;
  } catch (error) {
    console.error("Error processing images:", error);
    throw error;
  }
});

ipcMain.handle("show-error-dialog", async (event, title, content) => {
  return dialog.showErrorBox(title, content);
});

ipcMain.handle("show-info-dialog", async (event, title, content) => {
  return dialog.showMessageBox(mainWindow, {
    type: "info",
    title,
    message: content,
    buttons: ["OK"],
  });
});
