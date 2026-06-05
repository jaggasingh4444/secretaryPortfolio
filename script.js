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

let activeMeetingPhoto = 0;

const syncHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 24);
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


const setFormStatus = (english, nepali) => {
  if (!formStatus) return;

  formStatus.dataset.en = english;
  formStatus.dataset.ne = nepali;
  formStatus.textContent = document.documentElement.lang === "ne" ? nepali : english;
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

reveals.forEach((item) => revealObserver.observe(item));
stats.forEach((item) => countObserver.observe(item));
languageButtons.forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.langToggle));
});
contactForm?.addEventListener("submit", (event) => {
  if (window.location.protocol !== "file:") return;

  event.preventDefault();
  setFormStatus(
    "Local file mode detected. Opening your email app with this message.",
    "स्थानीय फाइलबाट खोलिएको छ। यो सन्देशसहित इमेल एप खुल्दैछ।"
  );
  window.location.href = buildMailtoUrl(contactForm);
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
