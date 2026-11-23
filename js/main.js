/* ==========================================================================
   Damodar Joshi — Personal Networking Portfolio
   main.js: small, dependency-free scripts shared by every page.
   Loaded with `defer`, so the HTML is already parsed when it runs.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  initTheme();
  initBackground();
  initNavToggle();
  initContactForm();
  initScrollEffects();
  initScrollReveal();
  initCardSpotlight();
  initCliName();
  initPageTransitions();
  initImageFallbacks();
  initFooterYear();
  renderIcons();
});

/* --------------------------------------------------------------------------
   Mobile navigation
   Below 768px the nav links live in a hidden panel that this button opens
   and closes. The button's aria-expanded attribute is the source of truth,
   and it also drives which icon (menu / X) is visible via CSS.
   -------------------------------------------------------------------------- */
function initNavToggle() {
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("nav-menu");

  if (!toggle || !menu) return; // not on a page with a navbar

  function setMenu(open) {
    menu.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  toggle.addEventListener("click", function () {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });

  // Close after tapping a link, so the panel doesn't cover the page
  menu.addEventListener("click", function (event) {
    if (event.target.closest("a")) setMenu(false);
  });

  // Close with the Escape key
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setMenu(false);
  });

  // Close when clicking anywhere outside the menu and the button
  document.addEventListener("click", function (event) {
    if (!menu.contains(event.target) && !toggle.contains(event.target)) {
      setMenu(false);
    }
  });

  // If the window grows past the mobile breakpoint, reset to the closed state
  window.addEventListener("resize", function () {
    if (window.innerWidth >= 768) setMenu(false);
  });
}

/* --------------------------------------------------------------------------
   Footer year (keeps the copyright notice from going stale)
   -------------------------------------------------------------------------- */
function initFooterYear() {
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

/* --------------------------------------------------------------------------
   Lucide icons
   The Lucide CDN script loads before this file and swaps every
   <i data-lucide="name"> element for an inline SVG.
   -------------------------------------------------------------------------- */
function renderIcons() {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

/* --------------------------------------------------------------------------
   Contact form
   Validates the name / email / message fields before anything is sent, shows
   a friendly message under each invalid field, and then posts to Formspree.
   The form's action is a placeholder until a real Formspree ID is added; in
   that case we say so instead of pretending the message was sent.
   -------------------------------------------------------------------------- */
function initContactForm() {
  var form = document.getElementById("contact-form");
  if (!form) return; // not on the contact page

  var status = document.getElementById("form-status");

  var fields = {
    name: {
      input: document.getElementById("name"),
      error: document.getElementById("name-error")
    },
    email: {
      input: document.getElementById("email"),
      error: document.getElementById("email-error")
    },
    message: {
      input: document.getElementById("message"),
      error: document.getElementById("message-error")
    }
  };

  // Each rule returns an error message, or "" when the value is fine.
  var rules = {
    name: function (value) {
      if (!value) return "Please tell me your name.";
      if (value.length < 2) return "That name looks a little short.";
      return "";
    },
    email: function (value) {
      if (!value) return "Please add an email address so I can reply.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return "That email address doesn't look right.";
      }
      return "";
    },
    message: function (value) {
      if (!value) return "Please write a short message.";
      if (value.length < 10) return "Could you add a little more detail? (at least 10 characters)";
      return "";
    }
  };

  function showError(name, message) {
    fields[name].error.textContent = message;
    fields[name].input.setAttribute("aria-invalid", "true");
  }

  function clearError(name) {
    fields[name].error.textContent = "";
    fields[name].input.removeAttribute("aria-invalid");
  }

  // Returns true when the field is valid.
  function validateField(name) {
    var value = fields[name].input.value.trim();
    var message = rules[name](value);

    if (message) {
      showError(name, message);
      return false;
    }

    clearError(name);
    return true;
  }

  function showStatus(message, type) {
    status.textContent = message;
    status.className = "form-status" + (type ? " is-" + type : "");
  }

  // Validate when a field loses focus, and clear the error as it's corrected.
  Object.keys(fields).forEach(function (name) {
    fields[name].input.addEventListener("blur", function () {
      validateField(name);
    });
    fields[name].input.addEventListener("input", function () {
      if (fields[name].error.textContent) clearError(name);
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var firstInvalid = null;

    Object.keys(fields).forEach(function (name) {
      var valid = validateField(name);
      if (!valid && !firstInvalid) firstInvalid = fields[name].input;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    var action = form.getAttribute("action") || "";

    // No real Formspree endpoint yet: be honest instead of losing the message.
    if (action.indexOf("YOUR_FORM_ID") !== -1) {
      showStatus(
        "This form isn't connected to Formspree yet, so your message wasn't sent. " +
        "Please email me at damodarj36@gmail.com in the meantime.",
        "error"
      );
      return;
    }

    showStatus("Sending your message...", "");

    // Formspree accepts JSON responses when we ask for them this way.
    fetch(action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" }
    })
      .then(function (response) {
        if (!response.ok) throw new Error("Request failed");
        form.reset();
        showStatus("Thanks — your message is on its way. I'll get back to you as soon as I can.", "success");
      })
      .catch(function () {
        showStatus(
          "Something went wrong while sending. Please try again, or email me at " +
          "damodarj36@gmail.com.",
          "error"
        );
      });
  });
}

/* --------------------------------------------------------------------------
   Shared motion preference
   Returns true when the visitor asked their system for reduced motion.
   -------------------------------------------------------------------------- */
function prefersReducedMotion() {
  return window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* --------------------------------------------------------------------------
   Scroll effects: navbar shadow + back to top button
   Both react to the same scroll event, so the handler is throttled with
   requestAnimationFrame to keep it cheap.
   -------------------------------------------------------------------------- */
function initScrollEffects() {
  var header = document.querySelector(".site-header");
  var button = createBackToTopButton();
  var progress = createScrollProgress();

  function update() {
    var scrolled = window.scrollY || window.pageYOffset;

    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.setProperty("--progress", max > 0 ? Math.min(scrolled / max, 1).toFixed(4) : 0);
    }

    if (header) header.classList.toggle("is-scrolled", scrolled > 8);
    if (button) button.classList.toggle("is-visible", scrolled > 420);
  }

  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      update();
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  update();

  if (button) {
    button.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion() ? "auto" : "smooth"
      });
    });
  }
}

/* Thin bar at the top of the window that fills as the page is read. */
function createScrollProgress() {
  var bar = document.createElement("div");
  bar.className = "scroll-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  window.addEventListener("resize", function () {
    window.dispatchEvent(new Event("scroll"));
  }, { passive: true });
  return bar;
}

/* Builds the floating "back to top" button and adds it to the page. */
function createBackToTopButton() {
  if (document.querySelector(".back-to-top")) return document.querySelector(".back-to-top");

  var button = document.createElement("button");
  button.type = "button";
  button.className = "back-to-top";
  button.setAttribute("aria-label", "Back to top");
  button.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M12 19V5"></path><path d="M5 12l7-7 7 7"></path></svg>';

  document.body.appendChild(button);
  return button;
}

/* --------------------------------------------------------------------------
   Scroll reveal
   Cards and section blocks fade up the first time they enter the viewport.
   The .reveal-ready class on <html> is what activates the CSS, so if this
   script never runs the content simply stays visible.
   -------------------------------------------------------------------------- */
function initScrollReveal() {
  if (!("IntersectionObserver" in window)) return;
  if (prefersReducedMotion()) return;

  var targets = document.querySelectorAll(
    ".card, .section-title, .connect-panel, .about-intro, .contact-intro, " +
    ".page-header, .skill-group, .timeline-item, .preferred-note"
  );

  if (!targets.length) return;

  document.documentElement.classList.add("reveal-ready");

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target); // reveal once, then stop watching
    });
  }, {
    threshold: 0.12,
    rootMargin: "0px 0px -40px 0px"
  });

  Array.prototype.forEach.call(targets, function (element) {
    element.classList.add("reveal");

    // Stagger by position inside the parent, so each row of a grid ripples in
    // from left to right instead of everything popping at once.
    var position = 0;
    var sibling = element.previousElementSibling;
    while (sibling && position < 6) {
      position++;
      sibling = sibling.previousElementSibling;
    }
    element.style.setProperty("--reveal-delay", (position % 3) * 110 + "ms");
    observer.observe(element);
  });
}

/* --------------------------------------------------------------------------
   Missing-image fallback
   The about page shows a monogram behind the profile photo. If the image
   file hasn't been added yet, hide the broken <img> so the monogram shows
   cleanly instead of unstyled alt text.
   -------------------------------------------------------------------------- */
function initImageFallbacks() {
  var images = document.querySelectorAll(".profile-photo img");

  Array.prototype.forEach.call(images, function (img) {
    function hide() {
      img.remove();
    }

    // The error may have fired before this script ran, so check that too.
    if (img.complete && img.naturalWidth === 0) {
      hide();
      return;
    }

    img.addEventListener("error", hide);
  });
}

/* --------------------------------------------------------------------------
   Terminal-style name
   The home and about pages mark the name with data-cli-name. We wrap each
   letter in a span so CSS can fade them in one at a time (a typewriter
   effect) and add a blinking block cursor after it.
   The original text is kept for screen readers via aria-label, and if this
   script or the CSS animation never runs the plain text stays visible.
   -------------------------------------------------------------------------- */
function initCliName() {
  var names = document.querySelectorAll("[data-cli-name]");

  if (!names.length) return;
  if (prefersReducedMotion()) return; // leave the name static

  Array.prototype.forEach.call(names, function (element) {
    var text = element.textContent.trim();

    element.setAttribute("aria-label", text);
    element.textContent = "";

    var fragment = document.createDocumentFragment();
    var index = 0;

    // One wrapper per word, so a narrow screen can wrap between words
    // instead of splitting a letter off in the middle of the name.
    text.split(" ").forEach(function (word, wordIndex) {
      if (wordIndex > 0) fragment.appendChild(document.createTextNode(" "));

      var wordEl = document.createElement("span");
      wordEl.className = "cli-word";

      for (var i = 0; i < word.length; i++) {
        var character = document.createElement("span");
        character.className = "cli-char";
        character.style.setProperty("--i", index);
        character.textContent = word.charAt(i);
        wordEl.appendChild(character);
        index++;
      }

      fragment.appendChild(wordEl);
    });

    // Blinking block cursor, like the one in a terminal. It appears once the
    // last letter is in, so it never floats ahead of the text being typed.
    var caret = document.createElement("span");
    caret.className = "cli-caret";
    caret.style.setProperty("--caret-delay", index * 55 + 80 + "ms");
    caret.setAttribute("aria-hidden", "true");
    fragment.appendChild(caret);

    element.appendChild(fragment);
  });
}

/* --------------------------------------------------------------------------
   Page transitions
   Every page fades its <main> in via CSS. For link clicks we also fade the
   page out for a moment before navigating, so switching pages feels smooth
   instead of flashing. New tabs, downloads, mail links and hash links are
   left to the browser, and visitors with reduced motion get instant loads.
   -------------------------------------------------------------------------- */
function initPageTransitions() {
  // Coming back with the browser's back/forward cache: clear the fade-out
  // class, otherwise the restored page would stay invisible.
  window.addEventListener("pageshow", function () {
    document.documentElement.classList.remove("page-leaving");
  });

  if (prefersReducedMotion()) return;

  document.addEventListener("click", function (event) {
    // Let modified clicks (new tab, new window, download) behave normally
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    var link = event.target.closest ? event.target.closest("a") : null;
    if (!link) return;

    var href = link.getAttribute("href");
    if (!href || link.target === "_blank" || link.hasAttribute("download")) return;
    if (/^(mailto:|tel:|#)/i.test(href)) return;

    // Only animate between pages of this site
    if (link.origin !== window.location.origin) return;

    // Same page with an anchor: let the browser scroll instead
    if (link.pathname === window.location.pathname && link.hash) return;

    event.preventDefault();

    var destination = link.href;
    document.documentElement.classList.add("page-leaving");

    window.setTimeout(function () {
      window.location.href = destination;
    }, 180);
  });
}

/* --------------------------------------------------------------------------
   Theme (light / dark)
   Order of precedence:
     1. the visitor's saved choice (localStorage "theme"), set by the switch
     2. otherwise the system setting (prefers-color-scheme), kept live: if the
        phone or computer flips between light and dark, the site follows
   An inline script in every <head> applies the theme before first paint; this
   function wires up the switch and keeps everything else in sync.
   -------------------------------------------------------------------------- */
function initTheme() {
  var root = document.documentElement;
  var query = window.matchMedia ? window.matchMedia("(prefers-color-scheme: light)") : null;
  var buttons = document.querySelectorAll(".theme-toggle");
  var colors = { dark: "#0a0b0d", light: "#f6f8fb" };
  var animTimer = null;

  function saved() {
    try {
      var value = localStorage.getItem("theme");
      return value === "light" || value === "dark" ? value : null;
    } catch (error) {
      return null; // storage blocked (private mode, strict settings)
    }
  }

  function system() {
    return query && query.matches ? "light" : "dark";
  }

  function apply(theme, animate) {
    if (animate && !prefersReducedMotion()) {
      root.classList.add("theme-anim");
      window.clearTimeout(animTimer);
      animTimer = window.setTimeout(function () {
        root.classList.remove("theme-anim");
      }, 450);
    }

    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;

    // Browser UI color (address bar on phones) follows the chosen theme
    Array.prototype.forEach.call(
      document.querySelectorAll('meta[name="theme-color"]'),
      function (meta) {
        meta.removeAttribute("media");
        meta.setAttribute("content", colors[theme]);
      }
    );

    Array.prototype.forEach.call(buttons, function (button) {
      button.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      );
      button.setAttribute("title", theme === "dark" ? "Light mode" : "Dark mode");
    });
  }

  apply(root.getAttribute("data-theme") || saved() || system(), false);

  Array.prototype.forEach.call(buttons, function (button) {
    button.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      apply(next, true);
      try {
        localStorage.setItem("theme", next);
      } catch (error) {
        /* not saved, but the switch still works for this visit */
      }
    });
  });

  // Follow the system only while the visitor hasn't picked a theme themselves
  function onSystemChange() {
    if (!saved()) apply(system(), true);
  }

  if (query) {
    if (query.addEventListener) query.addEventListener("change", onSystemChange);
    else if (query.addListener) query.addListener(onSystemChange);
  }

  // A choice made in another tab applies here too
  window.addEventListener("storage", function (event) {
    if (event.key === "theme") apply(saved() || system(), true);
  });
}

/* --------------------------------------------------------------------------
   Card spotlight
   A soft glow follows the mouse across a card. We only store the pointer
   position in two CSS variables; the CSS does the drawing.
   -------------------------------------------------------------------------- */
function initCardSpotlight() {
  if (!window.matchMedia || !window.matchMedia("(hover: hover)").matches) return;

  document.addEventListener("pointermove", function (event) {
    if (event.pointerType && event.pointerType !== "mouse") return;

    var card = event.target.closest ? event.target.closest(".card, .skill-group") : null;
    if (!card) return;

    var rect = card.getBoundingClientRect();
    card.style.setProperty("--mx", event.clientX - rect.left + "px");
    card.style.setProperty("--my", event.clientY - rect.top + "px");
  }, { passive: true });
}

/* --------------------------------------------------------------------------
   Live background: a small network
   Nodes drift across the screen. Nodes that come close are joined by a link,
   and little packets hop from node to node along those links, like traffic
   on a real network. The mouse acts as one more node. Colors come from the
   CSS tokens, so the animation re-colors itself when the theme changes.

   Care taken so it stays cheap:
   - it pauses while the tab is hidden
   - node count scales with screen size (fewer on phones)
   - with reduced motion it draws a single still frame and never loops
   -------------------------------------------------------------------------- */
function initBackground() {
  if (document.querySelector(".bg-canvas")) return;

  var glow = document.createElement("div");
  glow.className = "bg-glow";
  glow.setAttribute("aria-hidden", "true");

  var canvas = document.createElement("canvas");
  canvas.className = "bg-canvas";
  canvas.setAttribute("aria-hidden", "true");

  document.body.insertBefore(canvas, document.body.firstChild);
  document.body.insertBefore(glow, canvas);

  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var reduced = prefersReducedMotion();
  var width = 0;
  var height = 0;
  var ratio = 1;
  var linkDistance = 150;
  var nodes = [];
  var packets = [];
  var pointer = { x: -9999, y: -9999, active: false };
  var colors = { main: "91, 157, 255", alt: "79, 209, 197", light: false };
  var running = false;
  var lastTime = 0;
  var spawnTimer = 0;

  function readColors() {
    var style = window.getComputedStyle(document.documentElement);
    colors.main = style.getPropertyValue("--net-rgb").trim() || colors.main;
    colors.alt = style.getPropertyValue("--net-rgb-2").trim() || colors.alt;
    colors.light = document.documentElement.getAttribute("data-theme") === "light";
  }

  function makeNode() {
    var speed = 0.12 + Math.random() * 0.22; // pixels per frame at 60fps
    var angle = Math.random() * Math.PI * 2;
    var isRouter = Math.random() < 0.14;

    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: isRouter ? 3.2 : 1.5 + Math.random() * 1.1,
      router: isRouter
    };
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    ratio = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    var small = width < 700;
    linkDistance = small ? 110 : 160;

    var target = Math.round((width * height) / (small ? 17000 : 21000));
    target = Math.max(small ? 16 : 24, Math.min(target, small ? 34 : 64));

    while (nodes.length < target) nodes.push(makeNode());
    if (nodes.length > target) nodes.length = target;

    // Anything that ended up off-screen after a resize comes back in
    nodes.forEach(function (node) {
      if (node.x > width) node.x = Math.random() * width;
      if (node.y > height) node.y = Math.random() * height;
    });

    if (reduced) {
      step(0);
      draw();
    }
  }

  function neighbours(node) {
    var list = [];
    for (var i = 0; i < nodes.length; i++) {
      var other = nodes[i];
      if (other === node) continue;
      var dx = other.x - node.x;
      var dy = other.y - node.y;
      if (dx * dx + dy * dy < linkDistance * linkDistance) list.push(other);
    }
    return list;
  }

  function spawnPacket() {
    if (packets.length >= (width < 700 ? 6 : 11)) return;

    var from = nodes[Math.floor(Math.random() * nodes.length)];
    var options = neighbours(from);
    if (!options.length) return;

    packets.push({
      from: from,
      to: options[Math.floor(Math.random() * options.length)],
      t: 0,
      speed: 0.006 + Math.random() * 0.006, // share of a link per frame
      hops: 1 + Math.floor(Math.random() * 4),
      alt: Math.random() < 0.35
    });
  }

  // Moves everything forward. "scale" is 1 at 60fps, so motion looks the same
  // on 30, 60 or 144Hz screens.
  function step(scale) {
    var i;

    for (i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      node.x += node.vx * scale;
      node.y += node.vy * scale;

      // Wrap around the edges (with a margin so nodes slide in and out)
      if (node.x < -20) node.x = width + 20;
      else if (node.x > width + 20) node.x = -20;
      if (node.y < -20) node.y = height + 20;
      else if (node.y > height + 20) node.y = -20;

      // The mouse gently pulls nearby nodes toward it
      if (pointer.active) {
        var dx = pointer.x - node.x;
        var dy = pointer.y - node.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < 22500 && d2 > 1) {
          var pull = (1 - Math.sqrt(d2) / 150) * 0.012 * scale;
          node.x += dx * pull;
          node.y += dy * pull;
        }
      }
    }

    for (i = packets.length - 1; i >= 0; i--) {
      var packet = packets[i];
      packet.t += packet.speed * scale;

      var ldx = packet.to.x - packet.from.x;
      var ldy = packet.to.y - packet.from.y;
      var broken = ldx * ldx + ldy * ldy > linkDistance * linkDistance * 1.3;

      if (broken) {
        packets.splice(i, 1);
      } else if (packet.t >= 1) {
        // Arrived: forward it to another neighbour, or let it end here
        packet.hops--;
        var next = packet.hops > 0 ? neighbours(packet.to) : [];
        next = next.filter(function (candidate) { return candidate !== packet.from; });

        if (next.length) {
          packet.from = packet.to;
          packet.to = next[Math.floor(Math.random() * next.length)];
          packet.t = 0;
        } else {
          packets.splice(i, 1);
        }
      }
    }

    if (scale > 0) {
      spawnTimer -= scale;
      if (spawnTimer <= 0) {
        spawnPacket();
        spawnTimer = 24 + Math.random() * 40;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Light backgrounds need slightly stronger strokes to read the same
    var gain = colors.light ? 1.25 : 1;
    var i;
    var j;

    // Links between nodes that are close enough
    ctx.lineWidth = 1;
    for (i = 0; i < nodes.length; i++) {
      for (j = i + 1; j < nodes.length; j++) {
        var dx = nodes[i].x - nodes[j].x;
        var dy = nodes[i].y - nodes[j].y;
        var d2 = dx * dx + dy * dy;
        if (d2 > linkDistance * linkDistance) continue;

        var strength = 1 - Math.sqrt(d2) / linkDistance;
        ctx.strokeStyle = "rgba(" + colors.main + "," + (strength * 0.3 * gain).toFixed(3) + ")";
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();
      }
    }

    // Links from the mouse to nearby nodes
    if (pointer.active) {
      for (i = 0; i < nodes.length; i++) {
        var pdx = nodes[i].x - pointer.x;
        var pdy = nodes[i].y - pointer.y;
        var pd2 = pdx * pdx + pdy * pdy;
        if (pd2 > 28900) continue; // 170px

        ctx.strokeStyle = "rgba(" + colors.alt + "," + ((1 - Math.sqrt(pd2) / 170) * 0.45 * gain).toFixed(3) + ")";
        ctx.beginPath();
        ctx.moveTo(pointer.x, pointer.y);
        ctx.lineTo(nodes[i].x, nodes[i].y);
        ctx.stroke();
      }
    }

    // Nodes: routers get a ring, everything else is a plain dot
    for (i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      ctx.fillStyle = "rgba(" + colors.main + "," + (node.router ? 0.7 : 0.42) * gain + ")";
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fill();

      if (node.router) {
        ctx.strokeStyle = "rgba(" + colors.main + "," + 0.28 * gain + ")";
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Packets: a bright head with a short fading tail
    for (i = 0; i < packets.length; i++) {
      var packet = packets[i];
      var px = packet.from.x + (packet.to.x - packet.from.x) * packet.t;
      var py = packet.from.y + (packet.to.y - packet.from.y) * packet.t;
      var tailT = Math.max(packet.t - 0.18, 0);
      var tx = packet.from.x + (packet.to.x - packet.from.x) * tailT;
      var ty = packet.from.y + (packet.to.y - packet.from.y) * tailT;
      var rgb = packet.alt ? colors.alt : colors.main;

      var gradient = ctx.createLinearGradient(tx, ty, px, py);
      gradient.addColorStop(0, "rgba(" + rgb + ",0)");
      gradient.addColorStop(1, "rgba(" + rgb + "," + 0.85 * gain + ")");
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(px, py);
      ctx.stroke();

      ctx.fillStyle = "rgba(" + rgb + "," + Math.min(0.95 * gain, 1) + ")";
      ctx.beginPath();
      ctx.arc(px, py, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(" + rgb + ",0.16)";
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.lineWidth = 1;
  }

  function frame(time) {
    if (!running) return;

    // Cap the step so returning to a tab doesn't make everything jump
    var delta = lastTime ? Math.min(time - lastTime, 50) : 16.7;
    lastTime = time;

    step(delta / 16.7);
    draw();
    window.requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduced) return;
    running = true;
    lastTime = 0;
    window.requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
  }

  readColors();
  resize();

  // Re-color when the theme changes (switch, system setting, other tab)
  new MutationObserver(function () {
    readColors();
    if (reduced) draw();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 120);
  });

  // Mouse as a node (not on touch screens)
  if (window.matchMedia && window.matchMedia("(hover: hover)").matches) {
    window.addEventListener("pointermove", function (event) {
      if (event.pointerType && event.pointerType !== "mouse") return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    }, { passive: true });

    document.documentElement.addEventListener("mouseleave", function () {
      pointer.active = false;
    });
  }

  // Pause when the tab isn't visible
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else start();
  });

  // Back/forward cache: the loop was paused with the page, so restart it
  window.addEventListener("pageshow", function () {
    if (!document.hidden) start();
  });

  start();
}
