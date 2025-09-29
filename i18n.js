// Internationalization (i18n) system for PixelPress
class I18n {
  constructor() {
    this.currentLanguage = "en";
    this.translations = {
      en: {
        app: {
          title: "PixelPress",
          subtitle: "Compress and convert your images with ease",
        },
        dragDrop: {
          title: "Drag & Drop Images Here",
          or: "— OR —",
        },
        form: {
          sourceFolder: "Source Folder",
          optional: "(Optional - use drag & drop instead)",
          sourcePlaceholder: "Select source folder containing images...",
          sourceInfo: "Choose the folder containing images you want to process",
          destFolder: "Destination Folder",
          destPlaceholder: "Select destination folder for processed images...",
          destInfo: "Choose where to save the processed images",
          targetFormat: "Target Format",
          formatInfo: "Output image format",
          maxSize: "Max Size (KB)",
          maxSizeInfo: "Maximum file size limit (10-10000 KB)",
          browse: "Browse",
          startProcessing: "Start Processing",
        },
        progress: {
          preparing: "Preparing...",
          scanning: "Scanning files... Found {count} images",
          processing: "Processing {current}/{total} images",
          processingFile: "Processing {current}/{total} images - {filename}",
          complete: "Complete! Processed {current}/{total} images",
        },
        messages: {
          selectSource:
            "Please select a source folder or drag and drop some images",
          selectDest: "Please select a destination folder",
          sameFolders: "Source and destination folders cannot be the same",
          invalidSize: "Maximum size must be between 10 and 10000 KB",
          minSize: "Minimum size is 10 KB",
          maxSize: "Maximum size is 10000 KB",
          noValidImages:
            "No valid image files found. Please select image files.",
          processingFailed: "Processing failed: {error}",
          successMessage:
            "Successfully processed {processed} images! {skipped} files were skipped.",
          errorSelectingSource: "Error selecting source folder: {error}",
          errorSelectingDest: "Error selecting destination folder: {error}",
          errorSelectingFiles: "Error selecting files: {error}",
          processingFailed: "Processing failed",
        },
        summary: {
          title: "📊 Compression Summary",
          processed: "Processed",
          spaceSaved: "Space Saved",
          avgCompression: "Avg Compression",
          end: "End",
        },
        fileList: {
          filesSelected: "{count} file{plural} selected",
          clearAll: "Clear All",
          alreadyOptimized: "Already optimized",
        },
      },
      ar: {
        app: {
          title: "بيكسل برس",
          subtitle: "اضغط وحول صورك بسهولة",
        },
        dragDrop: {
          title: "اسحب وأفلت الصور هنا",
          or: "— أو —",
        },
        form: {
          sourceFolder: "مجلد المصدر",
          optional: "(اختياري - استخدم السحب والإفلات بدلاً من ذلك)",
          sourcePlaceholder: "اختر مجلد المصدر الذي يحتوي على الصور...",
          sourceInfo: "اختر المجلد الذي يحتوي على الصور التي تريد معالجتها",
          destFolder: "مجلد الوجهة",
          destPlaceholder: "اختر مجلد الوجهة للصور المعالجة...",
          destInfo: "اختر مكان حفظ الصور المعالجة",
          targetFormat: "تنسيق الهدف",
          formatInfo: "تنسيق الصورة الناتجة",
          maxSize: "الحد الأقصى للحجم (كيلوبايت)",
          maxSizeInfo: "الحد الأقصى لحجم الملف (10-10000 كيلوبايت)",
          browse: "تصفح",
          startProcessing: "بدء المعالجة",
        },
        progress: {
          preparing: "جاري التحضير...",
          scanning: "جاري فحص الملفات... تم العثور على {count} صورة",
          processing: "معالجة {current}/{total} صورة",
          processingFile: "معالجة {current}/{total} صورة - {filename}",
          complete: "مكتمل! تم معالجة {current}/{total} صورة",
        },
        messages: {
          selectSource: "يرجى اختيار مجلد مصدر أو سحب وإفلات بعض الصور",
          selectDest: "يرجى اختيار مجلد الوجهة",
          sameFolders: "لا يمكن أن يكون مجلد المصدر ومجلد الوجهة نفس المجلد",
          invalidSize: "يجب أن يكون الحد الأقصى للحجم بين 10 و 10000 كيلوبايت",
          minSize: "الحد الأدنى للحجم هو 10 كيلوبايت",
          maxSize: "الحد الأقصى للحجم هو 10000 كيلوبايت",
          noValidImages:
            "لم يتم العثور على ملفات صور صالحة. يرجى اختيار ملفات صور.",
          processingFailed: "فشلت المعالجة: {error}",
          successMessage:
            "تم معالجة {processed} صورة بنجاح! تم تخطي {skipped} ملف.",
          errorSelectingSource: "خطأ في اختيار مجلد المصدر: {error}",
          errorSelectingDest: "خطأ في اختيار مجلد الوجهة: {error}",
          errorSelectingFiles: "خطأ في اختيار الملفات: {error}",
          processingFailed: "فشلت المعالجة",
        },
        summary: {
          title: "📊 ملخص الضغط",
          processed: "معالج",
          spaceSaved: "مساحة محفوظة",
          avgCompression: "متوسط الضغط",
          end: "إنهاء",
        },
        fileList: {
          filesSelected: "تم اختيار {count} ملف{plural}",
          clearAll: "مسح الكل",
          alreadyOptimized: "محسن بالفعل",
        },
      },
    };

    // Load saved language preference
    const savedLang = localStorage.getItem("pixelpress-language");
    if (savedLang && this.translations[savedLang]) {
      this.currentLanguage = savedLang;
    }
  }

  // Get translation for a key
  t(key, params = {}) {
    const keys = key.split(".");
    let translation = this.translations[this.currentLanguage];

    // Navigate through the translation object
    for (const k of keys) {
      if (
        translation &&
        typeof translation === "object" &&
        translation[k] !== undefined
      ) {
        translation = translation[k];
      } else {
        // Fallback to English if translation not found
        // Fallback to English silently
        translation = this.translations.en;
        for (const fallbackKey of keys) {
          if (
            translation &&
            typeof translation === "object" &&
            translation[fallbackKey] !== undefined
          ) {
            translation = translation[fallbackKey];
          } else {
            // Translation not found
            return key; // Return key if no translation found
          }
        }
        break;
      }
    }

    if (typeof translation === "string") {
      // Replace parameters in translation
      return translation.replace(/\{(\w+)\}/g, (match, param) => {
        return params[param] !== undefined ? params[param] : match;
      });
    }

    // Translation is not a string
    return key; // Return key if translation is not a string
  }

  // Set language and update UI
  setLanguage(lang) {
    if (this.translations[lang]) {
      this.currentLanguage = lang;
      localStorage.setItem("pixelpress-language", lang);
      this.updateUI();
      this.updateDirection();
    } else {
      console.error("Language not found:", lang);
    }
  }

  // Update UI text based on current language
  updateUI() {
    // Update elements with data-i18n attribute
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.getAttribute("data-i18n");
      const translation = this.t(key);
      element.textContent = translation;
    });

    // Update placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      const key = element.getAttribute("data-i18n-placeholder");
      element.placeholder = this.t(key);
    });

    // Update language switcher buttons
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lang === this.currentLanguage);
    });
  }

  // Update text direction for RTL languages
  updateDirection() {
    const isRTL = this.currentLanguage === "ar";
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = this.currentLanguage;
  }

  // Get current language
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  // Check if current language is RTL
  isRTL() {
    return this.currentLanguage === "ar";
  }
}

// Create global i18n instance
window.i18n = new I18n();

// Test function to verify language switching
window.testLanguageSwitch = function () {
  console.log("Current language:", window.i18n.getCurrentLanguage());
  console.log("Available languages:", Object.keys(window.i18n.translations));

  // Test Arabic
  window.i18n.setLanguage("ar");
  console.log("After switching to Arabic:");
  console.log("- Current language:", window.i18n.getCurrentLanguage());
  console.log("- App title:", window.i18n.t("app.title"));
  console.log("- App subtitle:", window.i18n.t("app.subtitle"));

  // Test English
  window.i18n.setLanguage("en");
  console.log("After switching to English:");
  console.log("- Current language:", window.i18n.getCurrentLanguage());
  console.log("- App title:", window.i18n.t("app.title"));
  console.log("- App subtitle:", window.i18n.t("app.subtitle"));
};
