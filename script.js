const header = document.querySelector("[data-header]");
const reveals = document.querySelectorAll(".reveal");
const stats = document.querySelectorAll("[data-count]");
const languageButtons = document.querySelectorAll("[data-lang-toggle]");
const languageSwitcher = document.querySelector(".language-switcher");
const translatable = document.querySelectorAll("[data-en][data-ne]");
const meetingPhotos = Array.from(document.querySelectorAll(".meeting-photo"));
const lightbox = document.querySelector("[data-lightbox]");
const lightboxFrame = document.querySelector(".lightbox-frame");
const lightboxImage = document.querySelector("[data-lightbox-image]");
const lightboxCaption = document.querySelector("[data-lightbox-caption]");
const lightboxClose = document.querySelector("[data-lightbox-close]");
const lightboxPrev = document.querySelector("[data-lightbox-prev]");
const lightboxNext = document.querySelector("[data-lightbox-next]");
const contactForm = document.querySelector(".contact-form");
const formStatus = document.querySelector("[data-form-status]");
const contactSubmit = document.querySelector(".contact-submit");
const menuToggle = document.querySelector("[data-menu-toggle]");
const navLinks = document.querySelector(".nav-links");
const meetingMenu = document.querySelector("[data-meeting-menu]");
const meetingMenuToggle = document.querySelector("[data-meeting-toggle]");
const meetingPreviewButtons = document.querySelectorAll("[data-meeting-preview]");
const meetingPreviewModal = document.querySelector("[data-meeting-preview-modal]");
const meetingPreviewTitle = document.querySelector("[data-meeting-preview-title]");
const meetingPreviewDate = document.querySelector("[data-meeting-preview-date]");
const meetingPreviewSummary = document.querySelector("[data-meeting-preview-summary]");
const meetingPreviewLink = document.querySelector("[data-meeting-preview-link]");
const meetingPreviewCloseButtons = document.querySelectorAll("[data-meeting-preview-close]");
const meetingRecords = Array.from(document.querySelectorAll("[data-meeting-record]"));

let activeMeetingPhoto = 0;
let activeMeetingPreview = null;
let selectedMeetingRecord = null;

const getMeetingDate = (item) => {
  return item.dataset.meetingDate || item.querySelector("time")?.getAttribute("datetime") || "";
};

const sortMeetingChildren = (container, selector) => {
  if (!container) return;

  Array.from(container.children)
    .filter((item) => item.matches(selector))
    .sort((first, second) => getMeetingDate(second).localeCompare(getMeetingDate(first)))
    .forEach((item) => container.append(item));
};

const sortMeetingsNewestFirst = () => {
  document.querySelectorAll(".nav-dropdown-panel").forEach((panel) => {
    sortMeetingChildren(panel, "[data-meeting-preview]");
  });

  document.querySelectorAll(".meeting-card-grid").forEach((grid) => {
    sortMeetingChildren(grid, ".meeting-card");
  });

  if (meetingRecords.length > 1) {
    const recordsContainer = meetingRecords[0].parentElement;
    [...meetingRecords]
      .sort((first, second) => getMeetingDate(second).localeCompare(getMeetingDate(first)))
      .forEach((record) => recordsContainer?.append(record));
  }
};

const closeMobileMenu = () => {
  header?.classList.remove("is-menu-open");
  menuToggle?.setAttribute("aria-expanded", "false");
};

const closeLanguageMenu = () => {
  if (languageSwitcher && "open" in languageSwitcher) {
    languageSwitcher.open = false;
  }
};

const closeMeetingMenu = () => {
  meetingMenu?.classList.remove("is-open");
  meetingMenuToggle?.setAttribute("aria-expanded", "false");
};

const renderMeetingPreview = (trigger) => {
  if (!trigger || !meetingPreviewTitle || !meetingPreviewDate || !meetingPreviewSummary || !meetingPreviewLink) {
    return;
  }

  const language = document.documentElement.lang === "ne" ? "ne" : "en";
  const title = language === "ne" ? trigger.dataset.titleNe : trigger.dataset.titleEn;
  const date = language === "ne" ? trigger.dataset.dateNe : trigger.dataset.dateEn;
  const summary = language === "ne" ? trigger.dataset.summaryNe : trigger.dataset.summaryEn;

  meetingPreviewTitle.textContent = title || "";
  meetingPreviewDate.textContent = date || "";
  meetingPreviewSummary.textContent = summary || "";
  meetingPreviewLink.href = trigger.dataset.page || "meetings.html";
};

const openMeetingPreview = (trigger) => {
  if (!meetingPreviewModal) return;

  activeMeetingPreview = trigger;
  renderMeetingPreview(trigger);
  closeMeetingMenu();
  closeMobileMenu();
  meetingPreviewModal.classList.add("is-open");
  meetingPreviewModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("meeting-preview-open");
  meetingPreviewLink?.focus();
};

const closeMeetingPreview = (restoreFocus = true) => {
  if (!meetingPreviewModal?.classList.contains("is-open")) return;

  meetingPreviewModal.classList.remove("is-open");
  meetingPreviewModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("meeting-preview-open");
  if (restoreFocus) {
    activeMeetingPreview?.focus();
  }
};

const selectRequestedMeeting = () => {
  if (!meetingRecords.length) return;

  const meetingNumber = new URLSearchParams(window.location.search).get("meeting");
  if (!meetingNumber) return;

  const requestedRecord = meetingRecords.find((record) => record.dataset.meetingRecord === meetingNumber);
  if (!requestedRecord) return;

  selectedMeetingRecord = requestedRecord;
  document.body.classList.add("single-meeting-view");
  meetingRecords.forEach((record) => {
    record.hidden = record !== requestedRecord;
  });
};

const syncHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 24);
};

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

const countObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const target = Number(entry.target.dataset.count);
      const duration = 900;
      const started = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - started) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        entry.target.textContent = Math.round(target * eased).toLocaleString();

        if (progress < 1) {
          requestAnimationFrame(tick);
        }
      };

      requestAnimationFrame(tick);
      countObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.5 }
);

const getPhotoCaption = (photo) => {
  return photo.querySelector("figcaption")?.textContent.trim() || "";
};

const updateMeetingPhotoLabels = () => {
  const openLabel = document.documentElement.lang === "ne" ? "फोटो खोल्नुहोस्" : "Open photo";

  meetingPhotos.forEach((photo) => {
    const caption = getPhotoCaption(photo);
    photo.setAttribute("role", "button");
    photo.setAttribute("tabindex", "0");
    photo.setAttribute("aria-label", caption ? `${openLabel}: ${caption}` : openLabel);
  });
};

const renderLightboxPhoto = () => {
  if (!lightboxImage || !lightboxCaption || !lightboxFrame) return;

  const photo = meetingPhotos[activeMeetingPhoto];
  const image = photo?.querySelector("img");
  if (!image) return;

  lightboxFrame.classList.add("is-switching");
  lightboxImage.src = image.currentSrc || image.src;
  lightboxImage.alt = image.alt;
  lightboxCaption.textContent = getPhotoCaption(photo);

  window.setTimeout(() => {
    lightboxFrame.classList.remove("is-switching");
  }, 120);
};

const openLightbox = (index) => {
  if (!lightbox || !meetingPhotos.length) return;

  activeMeetingPhoto = index;
  renderLightboxPhoto();
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("lightbox-open");
  lightboxClose?.focus();
};

const closeLightbox = () => {
  if (!lightbox) return;

  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lightbox-open");
};

const moveLightbox = (direction) => {
  if (!meetingPhotos.length) return;

  activeMeetingPhoto = (activeMeetingPhoto + direction + meetingPhotos.length) % meetingPhotos.length;
  renderLightboxPhoto();
};


let formStatusTimer;

const setFormStatus = (english, nepali, type = "info") => {
  if (!formStatus) return;

  window.clearTimeout(formStatusTimer);
  formStatus.dataset.en = english;
  formStatus.dataset.ne = nepali;
  formStatus.textContent = document.documentElement.lang === "ne" ? nepali : english;
  formStatus.classList.remove("is-success", "is-error", "is-info");
  formStatus.classList.add("is-visible", `is-${type}`);

  formStatusTimer = window.setTimeout(() => {
    formStatus.classList.remove("is-visible");
  }, 5200);
};

const buildMailtoUrl = (form) => {
  const formData = new FormData(form);
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const subject = "New message from Aakriti Secretariat website";
  const body = [
    `Name: ${name}`,
    `Phone: ${phone || "Not provided"}`,
    `Email: ${email}`,
    "",
    "Message:",
    message,
  ].join("\n");

  return `mailto:secretariatofaakriti@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

const setLanguage = (language) => {
  const nextLanguage = language === "ne" ? "ne" : "en";

  document.documentElement.lang = nextLanguage;
  languageSwitcher?.setAttribute("data-lang-current", nextLanguage);

  translatable.forEach((item) => {
    item.innerHTML = item.dataset[nextLanguage];
  });

  updateMeetingPhotoLabels();
  if (lightbox?.classList.contains("is-open")) {
    renderLightboxPhoto();
  }
  if (meetingPreviewModal?.classList.contains("is-open") && activeMeetingPreview) {
    renderMeetingPreview(activeMeetingPreview);
  }

  if (selectedMeetingRecord) {
    const selectedTitle = selectedMeetingRecord.querySelector("h2");
    const pageTitle = selectedTitle?.dataset[nextLanguage] || selectedTitle?.textContent.trim();
    if (pageTitle) {
      document.title = `${pageTitle} | Aakriti Awasthi Secretariat`;
    }
  }

  languageButtons.forEach((button) => {
    const isActive = button.dataset.langToggle === nextLanguage;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  try {
    localStorage.setItem("aakriti-language", nextLanguage);
  } catch {
    // The toggle still works when browser storage is unavailable.
  }
};

sortMeetingsNewestFirst();
selectRequestedMeeting();
reveals.forEach((item) => revealObserver.observe(item));
stats.forEach((item) => countObserver.observe(item));
languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setLanguage(button.dataset.langToggle);
    closeLanguageMenu();
  });
});

menuToggle?.addEventListener("click", () => {
  const isOpen = header.classList.toggle("is-menu-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

meetingMenuToggle?.addEventListener("click", (event) => {
  event.stopPropagation();
  const isOpen = meetingMenu?.classList.toggle("is-open") || false;
  meetingMenuToggle.setAttribute("aria-expanded", String(isOpen));
});

meetingPreviewButtons.forEach((button) => {
  button.addEventListener("click", () => openMeetingPreview(button));
});

meetingPreviewCloseButtons.forEach((button) => {
  button.addEventListener("click", closeMeetingPreview);
});

meetingPreviewLink?.addEventListener("click", () => closeMeetingPreview(false));

navLinks?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMobileMenu);
});

document.addEventListener("click", (event) => {
  if (!languageSwitcher?.contains(event.target)) {
    closeLanguageMenu();
  }
  if (!meetingMenu?.contains(event.target)) {
    closeMeetingMenu();
  }
});
contactForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (window.location.protocol === "file:") {
    setFormStatus(
      "Local file mode detected. Opening your email app with this message.",
      "स्थानीय फाइलबाट खोलिएको छ। यो सन्देशसहित इमेल एप खुल्दैछ।",
      "info"
    );
    window.location.href = buildMailtoUrl(contactForm);
    return;
  }

  contactSubmit?.setAttribute("disabled", "true");
  setFormStatus("Sending message...", "सन्देश पठाउँदै...", "info");

  try {
    const response = await fetch(contactForm.action, {
      method: contactForm.method,
      body: new FormData(contactForm),
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Form submission failed");
    }

    contactForm.reset();
    setFormStatus(
      "Message sent successfully. Thank you.",
      "सन्देश सफलतापूर्वक पठाइयो। धन्यवाद।",
      "success"
    );
  } catch {
    setFormStatus(
      "Message could not be sent. Please email or call directly.",
      "सन्देश पठाउन सकिएन। कृपया इमेल वा फोनबाट सिधै सम्पर्क गर्नुहोस्।",
      "error"
    );
  } finally {
    contactSubmit?.removeAttribute("disabled");
  }
});

meetingPhotos.forEach((photo, index) => {
  photo.addEventListener("click", () => openLightbox(index));
  photo.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openLightbox(index);
    }
  });
});
lightboxClose?.addEventListener("click", closeLightbox);
lightboxPrev?.addEventListener("click", () => moveLightbox(-1));
lightboxNext?.addEventListener("click", () => moveLightbox(1));
lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMobileMenu();
    closeLanguageMenu();
    closeMeetingMenu();
    closeMeetingPreview();
  }

  if (!lightbox?.classList.contains("is-open")) return;

  if (event.key === "Escape") {
    closeLightbox();
  }

  if (event.key === "ArrowLeft") {
    moveLightbox(-1);
  }

  if (event.key === "ArrowRight") {
    moveLightbox(1);
  }
});

let savedLanguage = "en";
try {
  savedLanguage = localStorage.getItem("aakriti-language") || "en";
} catch {
  savedLanguage = "en";
}

setLanguage(savedLanguage);
syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });
