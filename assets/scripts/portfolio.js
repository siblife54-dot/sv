// Progressive enhancement: case figures, links and audio work without JavaScript.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const pauseAudio = (container = document) => {
  container.querySelectorAll("audio").forEach((audio) => audio.pause());
};

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
    message.textContent = "Не удалось загрузить аудио. Проверьте соединение и обновите страницу, чтобы попробовать снова.";
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
    const video = content.querySelector("video");
    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
    }
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
      if (link.dataset.localVideo) {
        const video = document.createElement("video");
        video.controls = true;
        video.playsInline = true;
        video.preload = "none";
        video.setAttribute("aria-label", title);
        video.poster = link.dataset.poster;
        video.src = link.dataset.localVideo;
        status.textContent = "Нажмите воспроизведение, чтобы посмотреть отзыв.";
        video.addEventListener("waiting", () => { status.textContent = "Видео загружается… Если связь медленная, попробуйте открыть файл по ссылке ниже."; });
        video.addEventListener("playing", () => { status.textContent = ""; });
        video.addEventListener("error", () => { status.textContent = "Не удалось загрузить видео. Откройте файл напрямую или посмотрите отзыв в VK."; });
        fallback.textContent = "Открыть видеофайл";
        const vkLink = document.createElement("a");
        vkLink.href = link.dataset.vkUrl;
        vkLink.target = "_blank";
        vkLink.rel = "noopener";
        vkLink.className = "media-fallback";
        vkLink.textContent = "Смотреть в VK";
        const actions = document.createElement("div");
        actions.className = "media-actions";
        actions.append(fallback, vkLink);
        content.append(video, status, actions);
      } else if (link.dataset.video) {
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
        image.addEventListener("error", () => { status.textContent = "Не удалось загрузить изображение. Закройте просмотр и попробуйте снова."; });
        image.src = link.href;
        const stage = document.createElement("div");
        stage.className = "media-image-stage";
        stage.tabIndex = 0;
        stage.setAttribute("role", "region");
        stage.setAttribute("aria-label", "Скриншот. Используйте прокрутку для просмотра изображения.");
        stage.append(image);
        content.append(stage, status);
      }
      dialog.showModal();
    });
  });
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
