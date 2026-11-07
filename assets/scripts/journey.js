// The route and radio controls work without JS. JS adds a finite light journey.
const scene = document.querySelector(".journey-scene");
if (scene) {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = window.matchMedia("(max-width: 700px)");
  const replay = scene.querySelector(".journey-replay");
  const map = scene.querySelector(".journey-map");
  let frame = 0;
  let hasPlayed = false;
  let onScreen = false;
  let running = false;
  const geometries = new Map();

  function geometry() {
    const variant = mobile.matches ? "mobile" : "desktop";
    if (geometries.has(variant)) return geometries.get(variant);
    const svg = scene.querySelector(`.journey-art--${variant}`);
    const path = svg.querySelector(`#route-${variant}`);
    const length = path.getTotalLength();
    const nodes = [...svg.querySelectorAll(".journey-node")].map((node) => {
      const circle = node.querySelector("circle");
      const x = circle.cx.baseVal.value;
      const y = circle.cy.baseVal.value;
      let position = 0;
      let distance = Infinity;
      for (let step = 0; step <= 180; step++) {
        const fraction = step / 180;
        const point = path.getPointAtLength(fraction * length);
        const nextDistance = (point.x - x) ** 2 + (point.y - y) ** 2;
        if (nextDistance < distance) { distance = nextDistance; position = fraction; }
      }
      return { element: node, position, activated: false };
    });
    const result = { path, length, nodes, signal: svg.querySelector(".journey-signal"), trace: svg.querySelector(".journey-trace") };
    geometries.set(variant, result);
    return result;
  }

  function stop(arrived = false) {
    cancelAnimationFrame(frame);
    frame = 0;
    running = false;
    replay.firstChild.textContent = "Повторить путь ";
    scene.classList.toggle("is-arrived", arrived);
    geometries.forEach(({ signal, trace, nodes }) => {
      signal.setAttribute("hidden", "");
      trace.style.opacity = arrived ? ".65" : "0";
      trace.style.strokeDasharray = "none";
      nodes.forEach((node) => { node.element.classList.remove("is-active"); node.activated = false; });
    });
  }

  function play() {
    if (motion.matches || document.hidden) return;
    stop();
    const { path, length, signal, trace, nodes } = geometry();
    const started = performance.now();
    const duration = 4600;
    running = true;
    hasPlayed = true;
    replay.firstChild.textContent = "Остановить движение ";
    signal.removeAttribute("hidden");
    trace.style.opacity = ".9";
    function draw(now) {
      const progress = Math.min((now - started) / duration, 1);
      const point = path.getPointAtLength(progress * length);
      signal.setAttribute("transform", `translate(${point.x} ${point.y})`);
      trace.style.strokeDasharray = `${progress * length} ${length}`;
      nodes.forEach((node) => {
        if (progress >= node.position && !node.activated) {
          nodes.forEach((other) => other.element.classList.remove("is-active"));
          node.element.classList.add("is-active");
          node.activated = true;
        }
      });
      if (progress < 1) frame = requestAnimationFrame(draw);
      else stop(true);
    }
    frame = requestAnimationFrame(draw);
  }

  replay.hidden = motion.matches;
  replay.addEventListener("click", () => {
    if (running) stop();
    else {
      if (!motion.matches) map.scrollIntoView({ block: "center", behavior: "smooth" });
      play();
    }
  });
  scene.querySelectorAll(".journey-choice").forEach((choice) => choice.addEventListener("change", () => stop()));
  motion.addEventListener("change", () => { stop(); replay.hidden = motion.matches; });
  mobile.addEventListener("change", () => stop());
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      onScreen = entry.isIntersecting;
      if (!onScreen) stop();
      else if (entry.intersectionRatio >= .25 && !hasPlayed && !motion.matches) play();
    }, { threshold: [0, .25] });
    observer.observe(scene);
  }
}
