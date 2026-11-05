import { siteConfig } from "./config.js";

function activateLink(buttonId, href) {
  const button = document.getElementById(buttonId);
  if (!button) return;
  const link = document.createElement("a");
  link.id = button.id;
  link.className = button.className;
  link.href = href;
  link.append(...button.childNodes);
  button.replaceWith(link);
}

const cases = document.getElementById(siteConfig.casesSectionId);
if (cases) activateLink("cases-action", `#${encodeURIComponent(cases.id)}`);
