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
    show: false, // Don't show until ready
  });

  mainWindow.loadFile("index.html");

  // Show window when ready to prevent flash
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (process.argv.includes("--dev")) {
    mainWindow.webContents.openDevTools();
  }
}

// Disable hardware acceleration to prevent GPU errors (optional)
app.disableHardwareAcceleration();

app.whenReady().then(() => {
  createWindow();
});

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

ipcMain.handle("select-files", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Select Image Files",
    properties: ["openFile", "multiSelections"],
    filters: [
      {
        name: "Images",
        extensions: [
          "jpg",
          "jpeg",
          "png",
          "webp",
          "avif",
          "tiff",
          "tif",
          "bmp",
          "gif",
        ],
      },
    ],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filesWithStats = await Promise.all(
      result.filePaths.map(async (filePath) => {
        try {
          const stats = await fs.stat(filePath);
          return {
            name: path.basename(filePath),
            path: filePath,
            size: stats.size,
            type: `image/${path.extname(filePath).substring(1)}`,
          };
        } catch (error) {
          return {
            name: path.basename(filePath),
            path: filePath,
            size: 0,
            type: `image/${path.extname(filePath).substring(1)}`,
          };
        }
      })
    );
    return filesWithStats;
  }
  return null;
});

ipcMain.handle("get-file-stats", async (event, filePaths) => {
  try {
    const filesWithStats = await Promise.all(
      filePaths.map(async (filePath) => {
        try {
          const stats = await fs.stat(filePath);
          return {
            path: filePath,
            size: stats.size,
          };
        } catch (error) {
          return {
            path: filePath,
            size: 0,
          };
        }
      })
    );
    return filesWithStats;
  } catch (error) {
    console.error("Error getting file stats:", error);
    return [];
  }
});

ipcMain.handle("process-images", async (event, options) => {
  try {
    const { sourcePath, destinationPath, targetFormat, maxSizeKB, files } =
      options;

    // Validate destination path exists
    try {
      await fs.access(destinationPath);
    } catch (error) {
      throw new Error("Destination folder does not exist or is not accessible");
    }

    // Validate source path if provided
    if (sourcePath) {
      try {
        await fs.access(sourcePath);
      } catch (error) {
        throw new Error("Source folder does not exist or is not accessible");
      }
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
      },
      files
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
