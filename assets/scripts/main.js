import { siteConfig } from "./config.js";

function activateLink(buttonId, href, noteId) {
  const button = document.getElementById(buttonId);
  if (!button) return;
  const link = document.createElement("a");
  link.id = button.id;
  link.className = button.className;
  link.href = href;
  link.append(...button.childNodes);
  button.replaceWith(link);
  document.getElementById(noteId)?.setAttribute("hidden", "");
}

// Only an explicitly configured HTTPS Telegram destination can enable contact.
if (siteConfig.telegramUrl) {
  try {
    const url = new URL(siteConfig.telegramUrl);
    if (url.protocol === "https:" && ["t.me", "telegram.me"].includes(url.hostname)
      && url.pathname.length > 1 && !url.username && !url.password) {
      activateLink("contact-action", url.href, "contact-note");
    }
  } catch { /* Keep the honest disabled state for malformed configuration. */ }
}

// A future section must actually exist before the case-study link is enabled.
const cases = document.getElementById(siteConfig.casesSectionId);
if (cases) activateLink("cases-action", `#${encodeURIComponent(cases.id)}`, "cases-note");

if (siteConfig.portrait?.src && siteConfig.portrait?.alt) {
  const figure = document.getElementById("portrait");
  const image = new Image();
  image.className = "portrait-image";
  image.alt = siteConfig.portrait.alt;
  image.decoding = "async";
  image.addEventListener("load", () => {
    figure.querySelector(".portrait-fallback")?.replaceWith(image);
  }, { once: true });
  image.src = siteConfig.portrait.src;
}
