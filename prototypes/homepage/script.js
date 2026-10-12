(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Navbar: more opaque once the page is scrolled
  function initNav() {
    const nav = document.getElementById("nav");
    const update = () => nav.classList.toggle("is-scrolled", window.scrollY > 16);
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  // Scroll reveal: fade elements in as they enter the viewport
  function initReveal() {
    const elements = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      elements.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    elements.forEach((el) => observer.observe(el));
  }

  // Chaos icons: drift, bounce off the walls and move away from the cursor
  function initChaos() {
    const area = document.getElementById("chaos-area");
    if (!area) return;

    const SIZE = 52;
    const BASE_SPEED = 0.6;
    const REPEL_RADIUS = 110;
    const REPEL_FORCE = 0.9;
    const MAX_SPEED = 6;

    let width = area.clientWidth;
    let height = area.clientHeight;
    const mouse = { x: 0, y: 0, active: false };

    const icons = Array.from(area.querySelectorAll(".chaos__icon")).map((el, i, all) => {
      // Start spread over a loose grid so icons don't overlap at first
      const cols = 4;
      const rows = Math.ceil(all.length / cols);
      const cellW = width / cols;
      const cellH = height / rows;
      const angle = Math.random() * Math.PI * 2;
      return {
        el,
        x: (i % cols) * cellW + Math.random() * Math.max(cellW - SIZE, 0),
        y: Math.floor(i / cols) * cellH + Math.random() * Math.max(cellH - SIZE, 0),
        vx: Math.cos(angle) * BASE_SPEED,
        vy: Math.sin(angle) * BASE_SPEED,
        rotation: Math.random() * 30 - 15,
        spin: (Math.random() - 0.5) * 0.4,
        phase: Math.random() * Math.PI * 2,
      };
    });

    function render(icon, time) {
      const scale = 1 + Math.sin(time / 900 + icon.phase) * 0.06;
      icon.el.style.transform =
        `translate3d(${icon.x}px, ${icon.y}px, 0) rotate(${icon.rotation}deg) scale(${scale})`;
    }

    function step(icon) {
      if (mouse.active) {
        const dx = icon.x + SIZE / 2 - mouse.x;
        const dy = icon.y + SIZE / 2 - mouse.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < REPEL_RADIUS) {
          const push = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_FORCE;
          icon.vx += (dx / dist) * push;
          icon.vy += (dy / dist) * push;
        }
      }

      // Ease back toward a gentle drift speed after being pushed
      const speed = Math.hypot(icon.vx, icon.vy) || 1;
      const target = Math.min(speed * 0.97 + BASE_SPEED * 0.03, MAX_SPEED);
      icon.vx = (icon.vx / speed) * target;
      icon.vy = (icon.vy / speed) * target;

      icon.x += icon.vx;
      icon.y += icon.vy;

      const maxX = width - SIZE;
      const maxY = height - SIZE;
      // Point velocity away from the wall so a pushed icon can't stick to it
      if (icon.x <= 0 || icon.x >= maxX) {
        icon.vx = icon.x <= 0 ? Math.abs(icon.vx) : -Math.abs(icon.vx);
        icon.x = Math.min(Math.max(icon.x, 0), maxX);
        icon.spin *= -1;
      }
      if (icon.y <= 0 || icon.y >= maxY) {
        icon.vy = icon.y <= 0 ? Math.abs(icon.vy) : -Math.abs(icon.vy);
        icon.y = Math.min(Math.max(icon.y, 0), maxY);
      }

      // Keep rotation subtle
      icon.rotation += icon.spin;
      if (Math.abs(icon.rotation) > 20) icon.spin *= -1;
    }

    let frame = null;
    let visible = true;

    function tick(time) {
      icons.forEach((icon) => {
        step(icon);
        render(icon, time);
      });
      frame = requestAnimationFrame(tick);
    }

    function start() {
      if (frame === null && visible && !reducedMotion.matches) {
        frame = requestAnimationFrame(tick);
      }
    }

    function stop() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    }

    area.addEventListener("pointermove", (event) => {
      const rect = area.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
      mouse.active = true;
    });
    area.addEventListener("pointerleave", () => {
      mouse.active = false;
    });

    window.addEventListener("resize", () => {
      width = area.clientWidth;
      height = area.clientHeight;
      icons.forEach((icon) => {
        icon.x = Math.min(icon.x, width - SIZE);
        icon.y = Math.min(icon.y, height - SIZE);
        render(icon, performance.now());
      });
    });

    // Pause while the hero is off screen
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      }).observe(area);
    }

    reducedMotion.addEventListener("change", () => {
      if (reducedMotion.matches) stop();
      else start();
    });

    icons.forEach((icon) => render(icon, 0));
    start();
  }

  // AI tags: pop in one at a time when the editor scrolls into view
  function initTags() {
    const list = document.getElementById("ai-tags");
    if (!list || reducedMotion.matches || !("IntersectionObserver" in window)) return;

    const tags = Array.from(list.children);
    list.classList.add("is-animated");

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        tags.forEach((tag, i) => {
          setTimeout(() => tag.classList.add("is-shown"), 600 + i * 180);
        });
      },
      { threshold: 0.5 }
    );
    observer.observe(list);
  }

  // Pricing: monthly / yearly toggle
  function initPricing() {
    const options = document.querySelectorAll(".billing-toggle__option");
    const amount = document.getElementById("pro-amount");
    const period = document.getElementById("pro-period");
    const note = document.getElementById("pro-note");

    const plans = {
      monthly: { amount: "$8", period: "/month", note: "or $72 billed yearly" },
      yearly: { amount: "$72", period: "/year", note: "$6/month, billed yearly" },
    };

    options.forEach((option) => {
      option.addEventListener("click", () => {
        const plan = plans[option.dataset.period];
        options.forEach((other) => {
          const active = other === option;
          other.classList.toggle("is-active", active);
          other.setAttribute("aria-pressed", String(active));
        });
        amount.textContent = plan.amount;
        period.textContent = plan.period;
        note.textContent = plan.note;
      });
    });
  }

  function initYear() {
    document.getElementById("year").textContent = String(new Date().getFullYear());
  }

  initNav();
  initReveal();
  initChaos();
  initTags();
  initPricing();
  initYear();
})();
