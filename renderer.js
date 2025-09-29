// DOM elements
const sourceFolder = document.getElementById("sourceFolder");
const destFolder = document.getElementById("destFolder");
const browseSrcBtn = document.getElementById("browseSrc");
const browseDestBtn = document.getElementById("browseDest");
const targetFormat = document.getElementById("targetFormat");
const maxSize = document.getElementById("maxSize");
const processBtn = document.getElementById("processBtn");
const imageForm = document.getElementById("imageForm");
const progressContainer = document.getElementById("progressContainer");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const statusMessage = document.getElementById("statusMessage");

// State
let isProcessing = false;

// Event listeners
browseSrcBtn.addEventListener("click", async () => {
  try {
    const folderPath = await window.electronAPI.selectFolder(
      "Select Source Folder"
    );
    if (folderPath) {
      sourceFolder.value = folderPath;
      sourceFolder.classList.add("selected");
    }
  } catch (error) {
    showError("Error selecting source folder: " + error.message);
  }
});

browseDestBtn.addEventListener("click", async () => {
  try {
    const folderPath = await window.electronAPI.selectFolder(
      "Select Destination Folder"
    );
    if (folderPath) {
      destFolder.value = folderPath;
      destFolder.classList.add("selected");
    }
  } catch (error) {
    showError("Error selecting destination folder: " + error.message);
  }
});

imageForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (isProcessing) return;

  // Validate form
  if (!sourceFolder.value.trim()) {
    showError("Please select a source folder");
    return;
  }

  if (!destFolder.value.trim()) {
    showError("Please select a destination folder");
    return;
  }

  if (sourceFolder.value === destFolder.value) {
    showError("Source and destination folders cannot be the same");
    return;
  }

  const maxSizeValue = parseInt(maxSize.value);
  if (isNaN(maxSizeValue) || maxSizeValue < 10 || maxSizeValue > 10000) {
    showError("Maximum size must be between 10 and 10000 KB");
    return;
  }

  // Start processing
  await startProcessing();
});

async function startProcessing() {
  isProcessing = true;
  updateProcessingState(true);
  hideStatusMessage();
  showProgress();

  try {
    const options = {
      sourcePath: sourceFolder.value,
      destinationPath: destFolder.value,
      targetFormat: targetFormat.value,
      maxSizeKB: parseInt(maxSize.value),
    };

    // Set up progress listener
    window.electronAPI.onProcessingProgress((progress) => {
      updateProgress(progress);
    });

    const result = await window.electronAPI.processImages(options);

    // Show success message
    showSuccess(
      `Successfully processed ${result.processedCount} images! ${result.skippedCount} files were skipped.`
    );
  } catch (error) {
    console.error("Processing error:", error);
    showError("Processing failed: " + error.message);
  } finally {
    isProcessing = false;
    updateProcessingState(false);
    hideProgress();

    // Clean up progress listener
    window.electronAPI.removeAllListeners("processing-progress");
  }
}

function updateProcessingState(processing) {
  processBtn.disabled = processing;

  if (processing) {
    processBtn.classList.add("processing");
    processBtn.classList.remove("not-processing");
  } else {
    processBtn.classList.remove("processing");
    processBtn.classList.add("not-processing");
  }
}

function updateProgress(progress) {
  const { current, total, currentFile, stage } = progress;

  let percentage = 0;
  let text = "Preparing...";

  if (total > 0) {
    percentage = Math.round((current / total) * 100);

    switch (stage) {
      case "scanning":
        text = `Scanning files... Found ${current} images`;
        break;
      case "processing":
        text = `Processing ${current}/${total} images`;
        if (currentFile) {
          const fileName = currentFile.split(/[\\/]/).pop();
          text += ` - ${fileName}`;
        }
        break;
      case "complete":
        text = `Complete! Processed ${current}/${total} images`;
        percentage = 100;
        break;
      default:
        text = `Processing ${current}/${total} images`;
    }
  }

  progressFill.style.width = percentage + "%";
  progressText.textContent = text;
}

function showProgress() {
  progressContainer.classList.add("visible");
  progressFill.style.width = "0%";
  progressText.textContent = "Preparing...";
}

function hideProgress() {
  progressContainer.classList.remove("visible");
}

function showSuccess(message) {
  statusMessage.textContent = message;
  statusMessage.className = "status-message success visible";
}

function showError(message) {
  statusMessage.textContent = message;
  statusMessage.className = "status-message error visible";
}

function hideStatusMessage() {
  statusMessage.classList.remove("visible");
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Set initial state
  processBtn.classList.add("not-processing");

  // Validate max size input
  maxSize.addEventListener("input", (e) => {
    const value = parseInt(e.target.value);
    if (isNaN(value) || value < 10) {
      e.target.value = 10;
    } else if (value > 10000) {
      e.target.value = 10000;
    }
  });

  // Clear status message when form changes
  [sourceFolder, destFolder, targetFormat, maxSize].forEach((element) => {
    element.addEventListener("change", hideStatusMessage);
  });
});
