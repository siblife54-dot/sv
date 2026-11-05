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

if (siteConfig.telegramUrl) {
  try {
    const url = new URL(siteConfig.telegramUrl);
    if (url.protocol === "https:" && ["t.me", "telegram.me"].includes(url.hostname)
      && url.pathname.length > 1 && !url.username && !url.password) {
      activateLink("contact-action", url.href, "contact-note");
    }
  } catch { /* An invalid destination leaves the honest disabled state intact. */ }
}
const cases = document.getElementById(siteConfig.casesSectionId);
if (cases) activateLink("cases-action", `#${encodeURIComponent(cases.id)}`, "cases-note");
if (!document.querySelector(".action-notes span:not([hidden])")) {
  document.querySelector(".action-notes")?.setAttribute("hidden", "");
}

// Small depth response only on a fine pointer; no continuous animation loop.
const stage = document.getElementById("hero-stage");
const motion = matchMedia("(prefers-reduced-motion: reduce)");
const pointer = matchMedia("(hover: hover) and (pointer: fine)");
let frame = 0;
function resetDepth() {
  cancelAnimationFrame(frame);
  stage?.style.removeProperty("--portrait-x");
  stage?.style.removeProperty("--portrait-y");
}
stage?.addEventListener("pointermove", (event) => {
  if (motion.matches || !pointer.matches) return;
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    const bounds = stage.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - .5) * 8;
    const y = ((event.clientY - bounds.top) / bounds.height - .5) * 6;
    stage.style.setProperty("--portrait-x", `${x.toFixed(2)}px`);
    stage.style.setProperty("--portrait-y", `${y.toFixed(2)}px`);
  });
}, { passive: true });
stage?.addEventListener("pointerleave", resetDepth);
motion.addEventListener("change", resetDepth);
pointer.addEventListener("change", resetDepth);
