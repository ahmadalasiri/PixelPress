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
const dragDropZone = document.getElementById("dragDropZone");
const droppedFiles = document.getElementById("droppedFiles");
const summaryReport = document.getElementById("summaryReport");
const totalProcessed = document.getElementById("totalProcessed");
const totalSaved = document.getElementById("totalSaved");
const avgCompression = document.getElementById("avgCompression");
const fileResults = document.getElementById("fileResults");
const endBtn = document.getElementById("endBtn");

// State
let isProcessing = false;
let selectedFiles = [];

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

  // Check if we have files or folder
  const hasFiles = selectedFiles.length > 0;
  const hasFolder = sourceFolder.value.trim();

  if (!hasFiles && !hasFolder) {
    showError("Please select a source folder or drag and drop some images");
    return;
  }

  if (!destFolder.value.trim()) {
    showError("Please select a destination folder");
    return;
  }

  if (hasFolder && sourceFolder.value === destFolder.value) {
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
  hideSummaryReport();
  showProgress();

  try {
    const options = {
      sourcePath: sourceFolder.value || null,
      destinationPath: destFolder.value,
      targetFormat: targetFormat.value,
      maxSizeKB: parseInt(maxSize.value),
      files: selectedFiles.length > 0 ? selectedFiles.map((f) => f.path) : null,
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

    // Show detailed summary
    showSummaryReport(result);
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

function showSummaryReport(result) {
  if (!result.detailedResults || result.detailedResults.length === 0) {
    return;
  }

  const results = result.detailedResults;

  // Calculate totals
  let totalSpaceSaved = 0;
  let totalCompressionRatio = 0;
  let successfulCompressions = 0;

  results.forEach((item) => {
    if (item.success && !item.skipped) {
      totalSpaceSaved += item.inputSize - item.outputSize;
      totalCompressionRatio += item.compressionRatio;
      successfulCompressions++;
    }
  });

  const avgCompRatio =
    successfulCompressions > 0
      ? totalCompressionRatio / successfulCompressions
      : 0;

  // Update summary stats
  totalProcessed.textContent = result.processedCount;
  totalSaved.textContent = formatFileSize(totalSpaceSaved);
  avgCompression.textContent = Math.round(avgCompRatio) + "%";

  // Generate file results HTML
  const resultsHtml = results
    .map((item) => {
      const compressionClass = getCompressionClass(item.compressionRatio);
      const statusClass = item.success ? "success" : "skipped";

      if (item.skipped || !item.success) {
        return `
        <div class="result-item ${statusClass}">
          <div class="result-filename">${item.filename}</div>
          <div class="skipped-reason">${
            item.reason || "Processing failed"
          }</div>
        </div>
      `;
      }

      return `
      <div class="result-item ${statusClass}">
        <div class="result-filename">${item.filename}</div>
        <div class="result-sizes">
          <span class="size-before">${formatFileSize(item.inputSize)}</span>
          <span class="size-arrow">→</span>
          <span class="size-after">${formatFileSize(item.outputSize)}</span>
          <span class="compression-percent ${compressionClass}">
            ${Math.round(item.compressionRatio)}%
          </span>
        </div>
      </div>
    `;
    })
    .join("");

  fileResults.innerHTML = resultsHtml;
  summaryReport.classList.add("visible");
}

function getCompressionClass(ratio) {
  if (ratio >= 50) return "high";
  if (ratio >= 25) return "medium";
  return "low";
}

function hideSummaryReport() {
  summaryReport.classList.remove("visible");
}

function showValidationError(element, message) {
  const formGroup = element.closest(".form-group");
  formGroup.classList.add("has-error");

  // Remove existing validation message
  const existingMessage = formGroup.querySelector(".validation-message");
  if (existingMessage) {
    existingMessage.remove();
  }

  // Add new validation message
  const validationDiv = document.createElement("div");
  validationDiv.className = "validation-message error";
  validationDiv.textContent = message;

  const infoText = formGroup.querySelector(".info-text");
  if (infoText) {
    infoText.parentNode.insertBefore(validationDiv, infoText.nextSibling);
  } else {
    formGroup.appendChild(validationDiv);
  }
}

function clearValidationError(element) {
  const formGroup = element.closest(".form-group");
  formGroup.classList.remove("has-error");

  const validationMessage = formGroup.querySelector(".validation-message");
  if (validationMessage) {
    validationMessage.remove();
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Set initial state
  processBtn.classList.add("not-processing");

  // Validate max size input on blur (when user finishes typing)
  maxSize.addEventListener("blur", (e) => {
    const value = parseInt(e.target.value);
    if (isNaN(value) || value < 10) {
      e.target.value = 10;
      showValidationError(e.target, "Minimum size is 10 KB");
    } else if (value > 10000) {
      e.target.value = 10000;
      showValidationError(e.target, "Maximum size is 10000 KB");
    } else {
      clearValidationError(e.target);
    }
  });

  // Clear validation on input
  maxSize.addEventListener("input", (e) => {
    clearValidationError(e.target);
  });

  // Allow only numbers in max size input
  maxSize.addEventListener("keypress", (e) => {
    // Allow: backspace, delete, tab, escape, enter, and .
    if (
      [46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (e.keyCode === 65 && e.ctrlKey === true) ||
      (e.keyCode === 67 && e.ctrlKey === true) ||
      (e.keyCode === 86 && e.ctrlKey === true) ||
      (e.keyCode === 88 && e.ctrlKey === true)
    ) {
      return;
    }
    // Ensure that it is a number and stop the keypress
    if (
      (e.shiftKey || e.keyCode < 48 || e.keyCode > 57) &&
      (e.keyCode < 96 || e.keyCode > 105)
    ) {
      e.preventDefault();
    }
  });

  // Clear status message when form changes
  [sourceFolder, destFolder, targetFormat, maxSize].forEach((element) => {
    element.addEventListener("change", hideStatusMessage);
  });

  // Initialize drag and drop
  setupDragAndDrop();

  // End button functionality
  endBtn.addEventListener("click", () => {
    hideSummaryReport();
    hideStatusMessage();
    // Reset the form for new processing
    clearAllFiles();
    sourceFolder.value = "";
    sourceFolder.classList.remove("selected");
  });
});

// Drag and Drop functionality
function setupDragAndDrop() {
  // Prevent default drag behaviors
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dragDropZone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

  // Highlight drop zone when item is dragged over it
  ["dragenter", "dragover"].forEach((eventName) => {
    dragDropZone.addEventListener(eventName, highlight, false);
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dragDropZone.addEventListener(eventName, unhighlight, false);
  });

  // Handle dropped files
  dragDropZone.addEventListener("drop", handleDrop, false);

  // Click to select files
  dragDropZone.addEventListener("click", () => {
    if (selectedFiles.length === 0) {
      selectFiles();
    }
  });
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function highlight(e) {
  dragDropZone.classList.add("drag-over");
}

function unhighlight(e) {
  dragDropZone.classList.remove("drag-over");
}

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  handleFiles(files);
}

async function selectFiles() {
  try {
    const files = await window.electronAPI.selectFiles();
    if (files && files.length > 0) {
      handleFiles(files);
    }
  } catch (error) {
    showError("Error selecting files: " + error.message);
  }
}

async function handleFiles(files) {
  const imageFiles = Array.from(files).filter((file) => {
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/avif",
      "image/tiff",
      "image/bmp",
      "image/gif",
    ];
    return (
      validTypes.includes(file.type) ||
      /\.(jpg|jpeg|png|webp|avif|tiff|tif|bmp|gif)$/i.test(file.name)
    );
  });

  if (imageFiles.length === 0) {
    showError("No valid image files found. Please select image files.");
    return;
  }

  // Add new files to selectedFiles array
  for (const file of imageFiles) {
    const filePath = file.path || file.webkitRelativePath || file.name;

    // Check if file already exists
    const exists = selectedFiles.some((f) => f.path === filePath);
    if (!exists) {
      const fileObj = {
        name: file.name,
        size: file.size || 0, // Use File API size first
        path: filePath,
        type: file.type,
      };

      selectedFiles.push(fileObj);
    }
  }

  // If we have file paths (not just names), get actual file sizes
  const filePaths = selectedFiles
    .filter((f) => f.size === 0 && f.path && f.path !== f.name)
    .map((f) => f.path);

  if (filePaths.length > 0) {
    try {
      const fileStats = await window.electronAPI.getFileStats(filePaths);
      fileStats.forEach((stat) => {
        const fileIndex = selectedFiles.findIndex((f) => f.path === stat.path);
        if (fileIndex !== -1) {
          selectedFiles[fileIndex].size = stat.size;
        }
      });
    } catch (error) {
      console.error("Error getting file sizes:", error);
    }
  }

  updateFilesList();
  clearSourceFolder();
  hideStatusMessage();
}

function updateFilesList() {
  if (selectedFiles.length === 0) {
    dragDropZone.classList.remove("has-files");
    droppedFiles.innerHTML = "";
    return;
  }

  dragDropZone.classList.add("has-files");

  const filesHtml = `
    <div class="files-header">
      <span class="files-count">${selectedFiles.length} file${
    selectedFiles.length > 1 ? "s" : ""
  } selected</span>
      <span class="clear-all" onclick="clearAllFiles()">Clear All</span>
    </div>
    ${selectedFiles
      .map(
        (file, index) => `
      <div class="file-item">
        <span class="file-name" title="${file.name}">${file.name}</span>
        <span class="file-size">${formatFileSize(file.size)}</span>
        <span class="remove-file" onclick="removeFile(${index})">×</span>
      </div>
    `
      )
      .join("")}
  `;

  droppedFiles.innerHTML = filesHtml;
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  updateFilesList();
}

function clearAllFiles() {
  selectedFiles = [];
  updateFilesList();
}

function clearSourceFolder() {
  sourceFolder.value = "";
  sourceFolder.classList.remove("selected");
}

// Make functions global for onclick handlers
window.removeFile = removeFile;
window.clearAllFiles = clearAllFiles;
