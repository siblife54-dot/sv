// Progressive enhancement: case figures, links and audio work without JavaScript.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const pauseAudio = (container = document) => {
  container.querySelectorAll("audio").forEach((audio) => audio.pause());
};

document.querySelectorAll("[data-case-tabs]").forEach((workspace) => {
  const tablist = workspace.querySelector(".case-tabs");
  const tabs = [...tablist.querySelectorAll("button")];
  const panels = [...workspace.querySelectorAll("[data-case-panel]")];
  function select(tab, focus = false) {
    const current = panels.find((panel) => panel.id === tab.dataset.panel);
    tabs.forEach((item) => {
      item.setAttribute("aria-selected", String(item === tab));
      item.tabIndex = item === tab ? 0 : -1;
    });
    panels.forEach((panel) => {
      panel.hidden = panel !== current;
      panel.classList.toggle("panel-enter", panel === current);
      if (panel.hidden) pauseAudio(panel);
    });
    if (focus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", tab.dataset.panel);
    const panel = document.getElementById(tab.dataset.panel);
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tab.id);
    panel.tabIndex = 0;
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", (event) => {
      const destinations = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 };
      if (!(event.key in destinations)) return;
      event.preventDefault();
      select(tabs[destinations[event.key]], true);
    });
  });
  workspace.classList.add("is-enhanced");
  tablist.setAttribute("role", "tablist");
  tablist.hidden = false;
  const hashPanel = tabs.find((tab) => `#${tab.dataset.panel}` === window.location.hash);
  select(hashPanel || tabs[0]);
  workspace.closest("article").querySelector("[data-review-jump]").addEventListener("click", (event) => {
    event.preventDefault();
    const tab = document.getElementById(event.currentTarget.dataset.reviewJump);
    select(tab, true);
  });
});

document.querySelectorAll("audio").forEach((audio) => {
  audio.addEventListener("play", () => {
    document.querySelectorAll("audio").forEach((other) => { if (other !== audio) other.pause(); });
  });
  audio.addEventListener("error", () => {
    const container = audio.closest(".audio-review");
    if (container.querySelector("[role=status]")) return;
    const message = document.createElement("p");
    message.className = "media-status";
    message.setAttribute("role", "status");
    message.textContent = "Не удалось загрузить аудио. Попробуйте открыть файл по ссылке ниже.";
    audio.after(message);
  });
});

const dialog = document.querySelector(".media-dialog");
const content = document.getElementById("media-content");
let mediaTrigger;
let mediaTimeout;
if (dialog && typeof dialog.showModal === "function") {
  function closeMedia() {
    clearTimeout(mediaTimeout);
    content.replaceChildren(); // Removing the iframe stops playback and network work.
    mediaTrigger?.focus({ preventScroll: true });
  }
  dialog.addEventListener("close", closeMedia);
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  document.querySelectorAll("[data-video], [data-image]").forEach((link) => {
    link.addEventListener("click", (event) => {
      // Preserve open-in-new-tab / download gestures and ordinary link fallback.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      pauseAudio();
      mediaTrigger = link;
      const title = link.dataset.title || link.dataset.caption;
      document.getElementById("media-title").textContent = title;
      const status = document.createElement("p");
      status.className = "media-status";
      status.setAttribute("role", "status");
      const fallback = document.createElement("a");
      fallback.className = "media-fallback";
      fallback.href = link.href;
      fallback.target = "_blank";
      fallback.rel = "noopener";
      content.replaceChildren();
      if (link.dataset.video) {
        const iframe = document.createElement("iframe");
        iframe.title = title;
        iframe.allow = "encrypted-media; fullscreen; picture-in-picture";
        iframe.allowFullscreen = true;
        iframe.referrerPolicy = "strict-origin-when-cross-origin";
        status.textContent = "Загружаем плеер VK…";
        fallback.textContent = "Если плеер недоступен — открыть видео в VK";
        iframe.addEventListener("load", () => {
          clearTimeout(mediaTimeout);
          status.textContent = "Нажмите воспроизведение в плеере. Если видео не открылось, воспользуйтесь ссылкой ниже.";
        });
        mediaTimeout = setTimeout(() => { status.textContent = "Загрузка занимает больше времени. Можно открыть видео напрямую в VK."; }, 12000);
        iframe.src = link.dataset.video; // No autoplay. No requests before this click.
        content.append(iframe, status, fallback);
      } else {
        const image = document.createElement("img");
        image.alt = title;
        status.textContent = "Загружаем изображение…";
        image.addEventListener("load", () => { status.hidden = true; });
        image.addEventListener("error", () => { status.textContent = "Не удалось загрузить изображение. Попробуйте открыть оригинал."; });
        image.src = link.href;
        fallback.textContent = "Открыть оригинал в новой вкладке";
        content.append(image, status, fallback);
      }
      dialog.showModal();
    });
  });
}

const track = document.querySelector(".testimonials-track");
const controls = document.querySelector(".gallery-controls");
if (track && controls) {
  const previous = controls.querySelector("[data-gallery-prev]");
  const next = controls.querySelector("[data-gallery-next]");
  const syncControls = () => {
    previous.disabled = track.scrollLeft < 2;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  };
  const scroll = (direction) => {
    const cards = track.querySelectorAll(".testimonial");
    const step = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth;
    track.scrollBy({ left: direction * step, behavior: reducedMotion.matches ? "instant" : "smooth" });
  };
  previous.addEventListener("click", () => scroll(-1));
  next.addEventListener("click", () => scroll(1));
  track.addEventListener("keydown", (event) => {
    if (event.target !== track || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Home" || event.key === "End") track.scrollTo({ left: event.key === "Home" ? 0 : track.scrollWidth, behavior: "instant" });
    else scroll(event.key === "ArrowLeft" ? -1 : 1);
  });
  track.addEventListener("scroll", syncControls, { passive: true });
  window.addEventListener("resize", syncControls, { passive: true });
  controls.hidden = false;
  syncControls();
}

if ("IntersectionObserver" in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("entered");
      observer.unobserve(entry.target);
    });
  }, { threshold: .15 });
  document.querySelectorAll(".portfolio-intro").forEach((element) => observer.observe(element));
}
