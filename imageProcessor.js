const sharp = require("sharp");
const fs = require("fs").promises;
const path = require("path");

// Supported image extensions
const SUPPORTED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
  ".tiff",
  ".tif",
  ".bmp",
  ".gif",
];

/**
 * Get all image files recursively from a directory
 * @param {string} dirPath - Directory path to scan
 * @param {Array} fileList - Array to store found files
 * @returns {Promise<Array>} Array of image file paths
 */
async function getImageFiles(dirPath, fileList = []) {
  try {
    const files = await fs.readdir(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = await fs.stat(filePath);

      if (stat.isDirectory()) {
        // Recursively scan subdirectories
        await getImageFiles(filePath, fileList);
      } else if (stat.isFile()) {
        const ext = path.extname(file).toLowerCase();
        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          fileList.push(filePath);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error.message);
  }

  return fileList;
}

/**
 * Ensure directory exists, create if it doesn't
 * @param {string} dirPath - Directory path
 */
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch (error) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Get the relative path structure to maintain folder hierarchy
 * @param {string} filePath - Full file path
 * @param {string} basePath - Base directory path
 * @returns {string} Relative path
 */
function getRelativePath(filePath, basePath) {
  return path.relative(basePath, filePath);
}

/**
 * Compress and resize image to meet size requirements
 * @param {Buffer} inputBuffer - Input image buffer
 * @param {string} targetFormat - Target format (webp, avif, jpeg, png)
 * @param {number} maxSizeKB - Maximum file size in KB
 * @returns {Promise<Buffer>} Compressed image buffer
 */
async function compressImage(inputBuffer, targetFormat, maxSizeKB) {
  const maxSizeBytes = maxSizeKB * 1024;
  let quality = 90;
  let width = null;

  // Get original image metadata
  const metadata = await sharp(inputBuffer).metadata();
  const originalWidth = metadata.width;

  while (quality >= 10) {
    let sharpInstance = sharp(inputBuffer);

    // Resize if width is set
    if (width && width < originalWidth) {
      sharpInstance = sharpInstance.resize(width, null, {
        withoutEnlargement: true,
        fit: "inside",
      });
    }

    // Apply format-specific compression
    switch (targetFormat) {
      case "webp":
        sharpInstance = sharpInstance.webp({
          quality,
          effort: 6,
          smartSubsample: true,
        });
        break;
      case "avif":
        sharpInstance = sharpInstance.avif({
          quality,
          effort: 4,
          chromaSubsampling: "4:2:0",
        });
        break;
      case "jpeg":
        sharpInstance = sharpInstance.jpeg({
          quality,
          progressive: true,
          mozjpeg: true,
        });
        break;
      case "png":
        sharpInstance = sharpInstance.png({
          quality,
          compressionLevel: 9,
          adaptiveFiltering: true,
        });
        break;
      default:
        throw new Error(`Unsupported format: ${targetFormat}`);
    }

    const outputBuffer = await sharpInstance.toBuffer();

    // Check if size is acceptable
    if (outputBuffer.length <= maxSizeBytes) {
      return outputBuffer;
    }

    // If still too large, try reducing quality or size
    if (quality > 60) {
      quality -= 10;
    } else if (quality > 30) {
      quality -= 5;
    } else {
      // Start reducing dimensions
      if (!width) {
        width = Math.floor(originalWidth * 0.9);
      } else {
        width = Math.floor(width * 0.9);
      }

      // Reset quality for new dimensions
      if (width < originalWidth * 0.3) {
        // If we've reduced too much, break to avoid infinite loop
        break;
      }
      quality = 80;
    }
  }

  // If we still can't meet the size requirement, return the last attempt
  let finalSharp = sharp(inputBuffer);
  if (width && width < originalWidth) {
    finalSharp = finalSharp.resize(width, null, {
      withoutEnlargement: true,
      fit: "inside",
    });
  }

  switch (targetFormat) {
    case "webp":
      return await finalSharp.webp({ quality: 10, effort: 6 }).toBuffer();
    case "avif":
      return await finalSharp.avif({ quality: 10, effort: 4 }).toBuffer();
    case "jpeg":
      return await finalSharp
        .jpeg({ quality: 10, progressive: true })
        .toBuffer();
    case "png":
      return await finalSharp
        .png({ quality: 10, compressionLevel: 9 })
        .toBuffer();
    default:
      throw new Error(`Unsupported format: ${targetFormat}`);
  }
}

/**
 * Process a single image file
 * @param {string} inputPath - Input file path
 * @param {string} outputPath - Output file path
 * @param {string} targetFormat - Target format
 * @param {number} maxSizeKB - Maximum size in KB
 * @returns {Promise<Object>} Processing result with details
 */
async function processImage(inputPath, outputPath, targetFormat, maxSizeKB) {
  try {
    // Read input file
    const inputBuffer = await fs.readFile(inputPath);
    const inputSize = inputBuffer.length;

    // Check if file is already small enough and in correct format
    const currentExt = path.extname(inputPath).toLowerCase().substring(1);
    if (currentExt === targetFormat && inputBuffer.length <= maxSizeKB * 1024) {
      // Just copy the file
      await fs.copyFile(inputPath, outputPath);
      return {
        success: true,
        inputSize,
        outputSize: inputSize,
        compressionRatio: 0,
        skipped: false,
        reason: "Already optimized",
      };
    }

    // Compress and convert
    const outputBuffer = await compressImage(
      inputBuffer,
      targetFormat,
      maxSizeKB
    );

    // Ensure output directory exists
    await ensureDirectoryExists(path.dirname(outputPath));

    // Write output file
    await fs.writeFile(outputPath, outputBuffer);

    const outputSize = outputBuffer.length;
    const compressionRatio = ((inputSize - outputSize) / inputSize) * 100;

    return {
      success: true,
      inputSize,
      outputSize,
      compressionRatio: Math.max(0, compressionRatio),
      skipped: false,
    };
  } catch (error) {
    console.error(`Error processing ${inputPath}:`, error.message);
    return {
      success: false,
      inputSize: 0,
      outputSize: 0,
      compressionRatio: 0,
      skipped: true,
      reason: error.message,
    };
  }
}

/**
 * Main function to process all images in a directory or specific files
 * @param {string} sourcePath - Source directory path (optional if files provided)
 * @param {string} destinationPath - Destination directory path
 * @param {string} targetFormat - Target format (webp, avif, jpeg, png)
 * @param {number} maxSizeKB - Maximum file size in KB
 * @param {Function} progressCallback - Progress callback function
 * @param {Array} files - Array of specific file paths to process (optional)
 * @returns {Promise<Object>} Processing results
 */
async function processImages(
  sourcePath,
  destinationPath,
  targetFormat,
  maxSizeKB,
  progressCallback,
  files = null
) {
  try {
    // Validate inputs
    if (!destinationPath) {
      throw new Error("Destination path is required");
    }

    if (!sourcePath && !files) {
      throw new Error("Either source path or files array is required");
    }

    if (!SUPPORTED_EXTENSIONS.includes(`.${targetFormat}`)) {
      throw new Error(`Unsupported target format: ${targetFormat}`);
    }

    if (maxSizeKB < 10 || maxSizeKB > 10000) {
      throw new Error("Maximum size must be between 10 and 10000 KB");
    }

    // Get image files list
    let imageFiles = [];

    if (files && files.length > 0) {
      // Use provided files
      imageFiles = files;
      progressCallback({
        current: files.length,
        total: files.length,
        stage: "scanning",
      });
    } else {
      // Scan directory for image files
      progressCallback({ current: 0, total: 0, stage: "scanning" });
      imageFiles = await getImageFiles(sourcePath);

      if (imageFiles.length === 0) {
        throw new Error(
          "No supported image files found in the source directory"
        );
      }

      progressCallback({
        current: imageFiles.length,
        total: imageFiles.length,
        stage: "scanning",
      });
    }

    // Process each image
    let processedCount = 0;
    let skippedCount = 0;
    const detailedResults = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const inputPath = imageFiles[i];
      let outputPath;

      if (files && files.length > 0) {
        // For individual files, save directly to destination folder
        const fileName = path.basename(inputPath, path.extname(inputPath));
        const outputFileName = `${fileName}.${targetFormat}`;
        outputPath = path.join(destinationPath, outputFileName);
      } else {
        // For folder processing, maintain directory structure
        const relativePath = getRelativePath(inputPath, sourcePath);
        const parsedPath = path.parse(relativePath);
        const outputFileName = `${parsedPath.name}.${targetFormat}`;
        outputPath = path.join(destinationPath, parsedPath.dir, outputFileName);
      }

      progressCallback({
        current: i + 1,
        total: imageFiles.length,
        currentFile: inputPath,
        stage: "processing",
      });

      const result = await processImage(
        inputPath,
        outputPath,
        targetFormat,
        maxSizeKB
      );

      // Store detailed result
      detailedResults.push({
        filename: path.basename(inputPath),
        inputPath,
        outputPath,
        ...result,
      });

      if (result.success && !result.skipped) {
        processedCount++;
      } else {
        skippedCount++;
      }
    }

    progressCallback({
      current: imageFiles.length,
      total: imageFiles.length,
      stage: "complete",
    });

    return {
      processedCount,
      skippedCount,
      totalFiles: imageFiles.length,
      detailedResults,
    };
  } catch (error) {
    console.error("Error in processImages:", error);
    throw error;
  }
}

module.exports = {
  processImages,
  getImageFiles,
  compressImage,
  SUPPORTED_EXTENSIONS,
};
