const form = document.getElementById("consent-form");
const statusEl = document.getElementById("status");
const logoEl = document.getElementById("brand-logo");
const pickFolderButton = document.getElementById("pick-folder");
const folderStatusEl = document.getElementById("folder-status");
const continueLink = document.getElementById("continue-link");
const submitButton = document.getElementById("submit-consent");

const CONSENT_HANDLE_KEY = "consent-directory";
const CONSENT_FOLDER_NAME = "consent forms";
const DB_NAME = "consent-pwa";
const STORE_NAME = "handles";
const LOGO_PNG = "assets/logo_trans.png";
const PHOTOGRAPHER_URL = "photographer.json";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js");
  });
}

const setToday = () => {
  const dateInput = form?.querySelector("input[name='sessionDate']");
  if (dateInput && !dateInput.value) {
    dateInput.valueAsDate = new Date();
  }
};

const ensureLogo = () => {
  if (!logoEl) return;
  const expectedSrc = "./assets/logo_trans.svg";
  if (!logoEl.getAttribute("src")?.includes("logo_trans.svg")) {
    logoEl.setAttribute("src", expectedSrc);
  }
  logoEl.addEventListener("error", () => {
    logoEl.setAttribute("src", expectedSrc);
  });
};

const showStatus = (message, isError = false) => {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.classList.add("visible");
  statusEl.style.background = isError ? "#fee2e2" : "#dcfce7";
  statusEl.style.color = isError ? "#991b1b" : "#166534";
  if (statusEl.dataset.hideTimer) {
    clearTimeout(Number(statusEl.dataset.hideTimer));
  }
  const timer = window.setTimeout(() => {
    statusEl.classList.remove("visible");
  }, 5000);
  statusEl.dataset.hideTimer = String(timer);
};

const setFolderStatus = (message, isError = false) => {
  if (!folderStatusEl) return;
  folderStatusEl.textContent = message;
  folderStatusEl.style.color = isError ? "#fca5a5" : "#cbd5f5";
};

const openDb = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const setHandle = async (key, handle) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(handle, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const getHandle = async (key) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const verifyPermission = async (handle) => {
  if (!handle) return false;
  const options = { mode: "readwrite" };
  if ((await handle.queryPermission(options)) === "granted") {
    return true;
  }
  return (await handle.requestPermission(options)) === "granted";
};

const todayFolderName = () => new Date().toISOString().slice(0, 10);
const formatDate = (date) => date.toISOString().slice(0, 10);

const hasText = (value) => (typeof value === "string" ? value.trim().length > 0 : Boolean(value));

const consentSections = (data) => {
  const socialMediaEntries = [
    ["Fabswinger.com", data.fabswinger],
    ["SpicyMatch", data.spicymatch],
    ["Instagram", data.instagram],
  ]
    .filter(([, value]) => hasText(value))
    .map(([label, value]) => `${label}: ${String(value).trim()}`);

  const consentAgreementParagraphs = [
    "The Client hereby grants the Photographer permission to create and deliver photographs as part of the agreed session. The Client confirms that they provide explicit, informed consent under UK GDPR for the processing of their personal data solely for the purposes of conducting the session and delivering the photographs.",
  ];

  if (hasText(data.notes)) {
    consentAgreementParagraphs.push(`Client restrictions or notes: ${String(data.notes).trim()}`);
    consentAgreementParagraphs.push(
      "The Photographer acknowledges and agrees to follow the above restrictions or notes.",
    );
  }

  return [
  {
    title: "A. Client Information",
    rows: [
      ["Full Name", data.fullName],
      ["Email Address", data.email],
      ["Telephone Number", data.phone],
      ["Photo Session Date", data.sessionDate],
    ],
  },
  {
    title: "B. Photographer Information",
    rows: [
      ["Photographer Name", data.photographerName || ""],
      ["Business / Trading Name", data.businessName || ""],
      ["Email", data.photographerEmail || ""],
      ["Telephone", data.photographerPhone || ""],
      ["Instagram", data.photograpgerInstagram || ""],
    ],
  },
  {
    title: "C. Consent Agreement",
    paragraphs: consentAgreementParagraphs,
  },
  {
    title: "D. Permitted Uses of Photographs",
    checkboxes: [
      ["Delivery of photographs to the Client (mandatory)", true],
      ["Use in Photographer offline portfolio", data.usagePortfolio || false],
      ["Use on Photographer website or social media", data.usageWeb || false],
      ["Sharing with third‑party publishers (e.g., magazines)", data.usagePublishers || false],
    ],
    paragraphs: ["Permitted social media sites and usernames (if applicable):"],
    bullets: socialMediaEntries,
  },
  {
    title: "E. Data Protection Notice (UK GDPR)",
    bullets: [
      "Personal data will be processed lawfully, fairly, and transparently.",
      "No personal data or photographs will be shared with third parties without explicit written consent.",
      "All photographs will be permanently deleted once the Client confirms successful receipt.",
      "The Client has the right to access, correct, delete, or withdraw consent at any time.",
    ],
  },
  {
    title: "F. Withdrawal of Consent",
    paragraphs: [
      "The Client may withdraw consent at any time by providing written notice to the Photographer. Following withdrawal, all retained photographs and personal data will be deleted without undue delay.",
    ],
  },
  {
    title: "G. Signatures",
    rows: [
      ["Client Name", data.fullName],
      ["Client Digital Signature", data.signature],
      ["Client Date", data.sessionDate],
      ["Photographer Name", data.photographerName || ""],
      ["Photographer Digital Signature", data.photographerName || ""],
      ["Photographer Date", data.sessionDate || ""],
    ],
  },
  ];
};

const sanitizeText = (text) =>
  text
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u00A0]/g, " ");

const fetchPhotographerDetails = async () => {
  try {
    const response = await fetch(PHOTOGRAPHER_URL, { cache: "no-cache" });
    if (!response.ok) {
      return {};
    }
    return response.json();
  } catch (error) {
    return {};
  }
};

const wrapText = (text, font, fontSize, maxWidth) => {
  const words = sanitizeText(text).split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(test, fontSize);
    if (width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
};


const buildConsentPdf = async (data) => {
  if (!window.PDFLib) {
    throw new Error("PDF library not loaded.");
  }

  const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
  const pdfDoc = await PDFDocument.create();
  const pageSize = [595.28, 841.89]; // A4
  let page = pdfDoc.addPage(pageSize);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const margin = 48;
  const contentWidth = page.getWidth() - margin * 2;
  let cursorY = page.getHeight() - margin;

  const newPage = () => {
    page = pdfDoc.addPage(pageSize);
    cursorY = page.getHeight() - margin;
  };

  const ensureSpace = (heightNeeded) => {
    if (cursorY - heightNeeded < margin) {
      newPage();
    }
  };

  try {
    const logoBytes = await fetch(LOGO_PNG).then((res) => res.arrayBuffer());
    const logoImage = await pdfDoc.embedPng(logoBytes);
    const logoWidth = 90;
    const logoHeight = (logoImage.height / logoImage.width) * logoWidth;
    page.drawImage(logoImage, {
      x: margin,
      y: cursorY - logoHeight,
      width: logoWidth,
      height: logoHeight,
    });
    cursorY -= logoHeight + 16;
  } catch (error) {
    cursorY -= 16;
  }

  page.drawText(sanitizeText("Legal Consent Form"), {
    x: margin,
    y: cursorY,
    size: 18,
    font: fontBold,
    color: rgb(0.98, 0.77, 0.38),
  });
  cursorY -= 24;

  cursorY -= 4;

  const photographerDetails = await fetchPhotographerDetails();
  const hasSocialHandle = [data.fabswinger, data.spicymatch, data.instagram].some(hasText);
  const mergedData = {
    ...data,
    photographerName: data.photographerName || photographerDetails.photographerName || "",
    businessName: data.businessName || photographerDetails.businessName || "",
    photographerEmail: data.photographerEmail || photographerDetails.email || "",
    photographerPhone: data.photographerPhone || photographerDetails.telephone || "",
    photograpgerInstagram: data.photographerInstagram || photographerDetails.Instagram || "",
    usageWeb: hasText(data.usageWeb) || hasSocialHandle,
    usagePortfolio: hasText(data.usagePortfolio),
    usagePublishers: hasText(data.usagePublishers),
  };

  const sections = consentSections(mergedData);
  for (const section of sections) {
    ensureSpace(20);
    page.drawText(sanitizeText(section.title), {
      x: margin,
      y: cursorY,
      size: 12,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    cursorY -= 16;

    if (section.rows) {
      for (const [label, value] of section.rows) {
        const line = sanitizeText(`${label}: ${value || ""}`);
        const lines = wrapText(line, font, 10, contentWidth);
        for (const textLine of lines) {
          ensureSpace(14);
          page.drawText(textLine, {
            x: margin,
            y: cursorY,
            size: 10,
            font,
            color: rgb(0, 0, 0),
          });
          cursorY -= 12;
        }
      }
      cursorY -= 6;
    }

    if (section.checkboxes) {
      for (const [label, checked] of section.checkboxes) {
        const box = checked ? "[x]" : "[ ]";
        const lines = wrapText(`${box} ${sanitizeText(label)}`, font, 10, contentWidth);
        for (const line of lines) {
          ensureSpace(14);
          page.drawText(line, {
            x: margin,
            y: cursorY,
            size: 10,
            font,
            color: rgb(0, 0, 0),
          });
          cursorY -= 12;
        }
      }
      cursorY -= 6;
    }

    if (section.paragraphs) {
      for (const paragraph of section.paragraphs) {
        const lines = wrapText(sanitizeText(paragraph), font, 10, contentWidth);
        for (const line of lines) {
          ensureSpace(14);
          page.drawText(line, {
            x: margin,
            y: cursorY,
            size: 10,
            font,
            color: rgb(0, 0, 0),
          });
          cursorY -= 12;
        }
        cursorY -= 6;
      }
    }

    if (section.bullets) {
      for (const bulletText of section.bullets) {
        const lines = wrapText(`• ${sanitizeText(bulletText)}`, font, 10, contentWidth);
        for (const line of lines) {
          ensureSpace(14);
          page.drawText(line, {
            x: margin,
            y: cursorY,
            size: 10,
            font,
            color: rgb(0, 0, 0),
          });
          cursorY -= 12;
        }
      }
      cursorY -= 6;
    }
  }

  return pdfDoc.save();
};

const ensureDateFolder = async (consentHandle) => {
  if (!consentHandle) return null;
  return consentHandle.getDirectoryHandle(todayFolderName(), { create: true });
};

const initConsentFolder = async () => {
  if (!("showDirectoryPicker" in window)) {
    setFolderStatus("Folder saving is not supported in this browser.", true);
    return null;
  }

  try {
    const storedHandle = await getHandle(CONSENT_HANDLE_KEY);
    if (!storedHandle) {
      setFolderStatus("No save folder selected.");
      return null;
    }
    const hasPermission = await verifyPermission(storedHandle);
    if (!hasPermission) {
      setFolderStatus("Permission needed to access save folder.", true);
      return null;
    }
    await ensureDateFolder(storedHandle);
    setFolderStatus(`Saving to: ${CONSENT_FOLDER_NAME}/${todayFolderName()}`);
    return storedHandle;
  } catch (error) {
    setFolderStatus("Could not access saved folder.", true);
    return null;
  }
};

const pickConsentFolder = async () => {
  if (!("showDirectoryPicker" in window)) {
    setFolderStatus("Folder saving is not supported in this browser.", true);
    return null;
  }

  try {
    const rootHandle = await window.showDirectoryPicker();
    const consentHandle = rootHandle.name?.toLowerCase() === CONSENT_FOLDER_NAME
      ? rootHandle
      : await rootHandle.getDirectoryHandle(CONSENT_FOLDER_NAME, { create: true });
    await setHandle(CONSENT_HANDLE_KEY, consentHandle);
    await verifyPermission(consentHandle);
    await ensureDateFolder(consentHandle);
    setFolderStatus(`Saving to: ${CONSENT_FOLDER_NAME}/${todayFolderName()}`);
    return consentHandle;
  } catch (error) {
    setFolderStatus(`Folder selection cancelled or blocked. ${error?.message ?? ""}`.trim());
    return null;
  }
};

const redirectToStartupIfNeeded = async () => {
  const isStartup = window.location.pathname.endsWith("startup.html");
  const isConsent = window.location.pathname.endsWith("index.html") || window.location.pathname === "/";
  if (!isConsent || isStartup) return;

  const handle = await initConsentFolder();
  if (!handle) {
    window.location.href = "startup.html";
  }
};

const updateContinueLink = async () => {
  if (!continueLink) return;
  const handle = await initConsentFolder();
  continueLink.style.pointerEvents = handle ? "auto" : "none";
  continueLink.style.opacity = handle ? "1" : "0.5";
};

const saveConsentToFolder = async (data, consentHandle) => {
  try {
    if (!consentHandle) {
      return { ok: false, errorMessage: "Save folder not configured." };
    }
    const hasPermission = await verifyPermission(consentHandle);
    if (!hasPermission) {
      showStatus("Folder permission denied. Please reselect the save folder.", true);
      return { ok: false, errorMessage: "Folder permission denied. Please reselect the save folder." };
    }
    const dateFolder = await ensureDateFolder(consentHandle);
    if (!dateFolder) {
      return { ok: false, errorMessage: "Could not create date folder." };
    }

    const safeName = (data.fullName || "consent")
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/(^-|-$)/g, "")
      .toLowerCase();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${safeName || "consent"}-${timestamp}.pdf`;
    const fileHandle = await dateFolder.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    const pdfBytes = await buildConsentPdf(data);
    const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
    await writable.write(pdfBlob);
    await writable.close();
    return { ok: true, filename };
  } catch (error) {
    const message = `Save failed: ${error?.name ?? "Error"} ${error?.message ?? "Unknown error"}`;
    return { ok: false, errorMessage: message };
  }
};

const syncSignature = () => {
  if (!form) return;
  const nameInput = form.querySelector("input[name='fullName']");
  const signatureInput = form.querySelector("input[name='signature']");
  if (!nameInput || !signatureInput) return;

  nameInput.addEventListener("input", () => {
    if (!signatureInput.value || signatureInput.value === nameInput.dataset.lastValue) {
      signatureInput.value = nameInput.value;
    }
    nameInput.dataset.lastValue = nameInput.value;
  });
};

const toggleSubmitButton = () => {
  if (!form || !submitButton) return;
  const acceptTerms = form.querySelector("input[name='acceptTerms']");
  const isChecked = acceptTerms?.checked ?? false;
  submitButton.disabled = !isChecked;
  submitButton.setAttribute("aria-disabled", String(!isChecked));
};

const collectFormData = (formElement) => {
  const data = Object.fromEntries(new FormData(formElement).entries());
  return {
    ...data,
    acceptTerms: formElement.acceptTerms?.checked ?? false,
    usageWeb: formElement.usageWeb?.checked ?? false,
  };
};

const validate = (data) => {
  if (!data.fullName || !data.email || !data.phone || !data.sessionDate) {
    return "Please complete all required fields.";
  }
  if (!data.acceptTerms) {
    return "Please confirm you agree to the terms and conditions.";
  }
  return "";
};

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = collectFormData(form);
  const error = validate(data);

  if (error) {
    showStatus(error, true);
    return;
  }

  localStorage.setItem("photoConsentDraft", JSON.stringify(data));

  const consentHandle = await initConsentFolder();
  let savedFilename = false;
  if (!consentHandle) {
    showStatus("Save folder not configured. Please choose a folder on setup.", true);
    window.location.href = "startup.html";
    return;
  }

  const saveResult = await saveConsentToFolder(data, consentHandle);
  if (!saveResult || !saveResult.ok) {
    showStatus(saveResult?.errorMessage || "Consent could not be saved to the selected folder.", true);
    return;
  }

  if (saveResult?.filename) {
    showStatus(
      `Saved ${saveResult.filename} in ${CONSENT_FOLDER_NAME}/${todayFolderName()}.`,
    );
  }
  form.reset();
  setToday();
});

setToday();
ensureLogo();
syncSignature();
initConsentFolder();
redirectToStartupIfNeeded();
updateContinueLink();
toggleSubmitButton();

pickFolderButton?.addEventListener("click", async () => {
  await pickConsentFolder();
  updateContinueLink();
});

form?.addEventListener("change", (event) => {
  if (event.target?.name === "acceptTerms") {
    toggleSubmitButton();
  }
});
