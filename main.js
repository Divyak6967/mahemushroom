// MaheMushroom prototype — demo interactions only (no backend).
(() => {
  document.documentElement.classList.add("js");


  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ---------- Header: solid once the opening section has scrolled past ---------- */
  const header = $("[data-header]");
  const hero = $("[data-hero]");
  new IntersectionObserver(
    ([entry]) => header.classList.toggle("is-solid", !entry.isIntersecting),
    // turn solid before the cream wave at the bottom of the opening reaches the header,
    // otherwise light nav text would sit on a light background
    { rootMargin: "-190px 0px 0px 0px" }
  ).observe(hero);

  /* ---------- Smooth wheel scrolling ----------
     Mouse wheels move in hard ~100px steps, which makes scroll-driven scenes judder.
     Wheel notches set a target and the page eases towards it with time-based
     smoothing (same feel at 60/120/144 Hz, settles in ~0.4s).
     Touchpads already scroll smoothly, so their small fractional deltas stay native,
     as do keyboard, scrollbar, touch and in-page links. */
  const smooth = { target: scrollY, current: scrollY, running: false, last: 0 };
  const maxScroll = () => document.documentElement.scrollHeight - innerHeight;
  const TAU = 110; // ms: time constant of the ease-out
  const glide = (now) => {
    const dt = Math.min(64, now - (smooth.last || now - 16));
    smooth.last = now;
    smooth.current += (smooth.target - smooth.current) * (1 - Math.exp(-dt / TAU));
    if (Math.abs(smooth.target - smooth.current) < 0.5) smooth.current = smooth.target;
    scrollTo({ top: smooth.current, behavior: "instant" });
    if (smooth.current !== smooth.target) requestAnimationFrame(glide);
    else { smooth.running = false; smooth.last = 0; }
  };
  const isMouseWheel = (e) => e.deltaMode !== 0 || (Number.isInteger(e.deltaY) && Math.abs(e.deltaY) >= 50);
  addEventListener("wheel", (e) => {
    const skip = e.ctrlKey || !isMouseWheel(e) || Math.abs(e.deltaX) > Math.abs(e.deltaY) ||
      document.body.classList.contains("menu-open") || $("dialog[open]");
    if (skip) return;
    e.preventDefault();
    const step = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
    if (!smooth.running) smooth.current = scrollY; // pick up any native scroll since the last glide
    smooth.target = Math.min(maxScroll(), Math.max(0, (smooth.running ? smooth.target : scrollY) + step));
    if (!smooth.running) { smooth.running = true; requestAnimationFrame(glide); }
  }, { passive: false });

  /* ---------- Homepage hero: spores + depth ---------- */
  // animations play for every visitor (owner's decision), including devices set to reduce motion
  const spores = $("[data-spores]");
  if (spores) {
    const count = matchMedia("(max-width: 820px)").matches ? 10 : 22;
    const rand = (min, max) => min + Math.random() * (max - min);
    for (let i = 0; i < count; i++) {
      const s = document.createElement("span");
      const size = rand(2, 5.5);
      s.className = "spore";
      s.style.cssText = `left:${rand(2, 98)}%;width:${size}px;height:${size}px;--t:${rand(9, 17)}s;--delay:${-rand(0, 17)}s;--dx:${rand(-60, 60)}px;--o:${rand(0.35, 0.85)}`;
      spores.append(s);
    }
  }

  // a few small leaves drifting down the banner's open lanes (between headline and photo, and the far right edge)
  const leafFall = $("[data-leaf-fall]");
  if (leafFall) {
    const phone = matchMedia("(max-width: 820px)").matches;
    const lanes = phone ? [88] : [47, 53, 94];
    const rand = (min, max) => min + Math.random() * (max - min);
    lanes.forEach((left, i) => {
      const leaf = document.createElement("span");
      leaf.className = "falling-leaf";
      leaf.style.cssText = `left:${left}%;--s:${rand(34, 46)}px;--t:${rand(13, 17)}s;--delay:${3 + i * 2.6}s;--dx:${rand(-30, 20)}px`;
      leaf.innerHTML = '<img src="assets/leaf.webp" alt="" width="181" height="145" />';
      leafFall.append(leaf);
    });
  }

  // mouse parallax (desktop pointers only) and a slower-than-scroll photo
  const heroEl = $(".hero");
  if (heroEl && matchMedia("(pointer: fine) and (min-width: 821px)").matches) {
    heroEl.addEventListener("pointermove", (e) => {
      const r = heroEl.getBoundingClientRect();
      heroEl.style.setProperty("--mx", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
      heroEl.style.setProperty("--my", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
    });
    heroEl.addEventListener("pointerleave", () => {
      heroEl.style.setProperty("--mx", 0);
      heroEl.style.setProperty("--my", 0);
    });
    let pending = false;
    addEventListener("scroll", () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        if (scrollY < innerHeight * 1.2) heroEl.style.setProperty("--sy", (scrollY * 0.08).toFixed(1));
      });
    }, { passive: true });
  }

  /* ---------- Scroll parallax: [data-parallax="factor"] drifts against its frame ---------- */
  const drifters = $$("[data-parallax]");
  if (drifters.length) {
    let queuedDrift = false;
    const drift = () => {
      queuedDrift = false;
      drifters.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const offset = (r.top + r.height / 2 - innerHeight / 2) * parseFloat(el.dataset.parallax);
        el.style.setProperty("--py", `${offset.toFixed(1)}px`);
      });
    };
    addEventListener("scroll", () => {
      if (!queuedDrift) { queuedDrift = true; requestAnimationFrame(drift); }
    }, { passive: true });
    drift();
  }

  /* ---------- Scroll-spy for the main nav (homepage) ---------- */
  const spyLinks = $$("[data-spy]");
  if (spyLinks.length) {
    const setCurrent = (id) =>
      spyLinks.forEach((el) => {
        if (el.dataset.spy === id) el.setAttribute("aria-current", "true");
        else el.removeAttribute("aria-current");
      });
    const spy = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setCurrent(e.target.dataset.spySection)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    $$("[data-spy-section]").forEach((s) => spy.observe(s));
  }

  /* ---------- Products dropdown ---------- */
  const menuBtn = $(".nav-menu-btn");
  const dropdown = $("#products-menu");
  const hasMenu = $(".has-menu");
  const setDropdown = (open) => {
    menuBtn.setAttribute("aria-expanded", String(open));
    dropdown.hidden = !open;
  };
  menuBtn.addEventListener("click", () => setDropdown(dropdown.hidden));
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".has-menu")) setDropdown(false);
  });
  hasMenu.addEventListener("focusout", (e) => {
    if (!hasMenu.contains(e.relatedTarget)) setDropdown(false);
  });

  /* ---------- Product showcase (homepage) ----------
     Tabs switch the stage photo and the detail panel. It auto-advances while in view
     (the active tab's progress bar ends -> next product) until the visitor picks one. */
  const showcase = $("[data-showcase]");
  const selectProduct = (key, { focus = false, scroll = false } = {}) => {
    if (!showcase) return;
    const tabs = $$('[role="tab"]', showcase);
    if (!tabs.some((t) => t.dataset.tab === key)) return;
    tabs.forEach((t) => {
      const on = t.dataset.tab === key;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = $("#" + t.getAttribute("aria-controls"));
      panel.hidden = !on;
      panel.classList.toggle("is-active", on);
      if (on && focus) t.focus();
    });
    $$(".stage-img", showcase).forEach((img) => img.classList.toggle("is-active", img.dataset.stage === key));
    if (scroll) $("#products").scrollIntoView({ behavior: "smooth" });
  };
  if (showcase) {
    const tabs = $$('[role="tab"]', showcase);
    const stopAuto = () => showcase.classList.remove("is-auto");
    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => { stopAuto(); selectProduct(tab.dataset.tab); });
      tab.addEventListener("keydown", (e) => {
        const keys = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
        if (!(e.key in keys)) return;
        e.preventDefault();
        stopAuto();
        selectProduct(tabs[(keys[e.key] + tabs.length) % tabs.length].dataset.tab, { focus: true });
      });
      tab.addEventListener("animationend", (e) => {
        if (e.animationName === "tab-progress" && showcase.classList.contains("is-auto")) {
          selectProduct(tabs[(i + 1) % tabs.length].dataset.tab);
        }
      });
    });
    // interacting inside a panel (a recipe link, the order button) also stops the carousel
    showcase.addEventListener("focusin", (e) => { if (!e.target.matches('[role="tab"]')) stopAuto(); });
    new IntersectionObserver(([e]) => showcase.classList.toggle("in-view", e.isIntersecting), { threshold: 0.35 }).observe(showcase);
  }

  // Products menu: pick that product in the showcase
  $$("[data-jump-card]").forEach((link) =>
    link.addEventListener("click", (e) => {
      e.preventDefault();
      setDropdown(false);
      showcase?.classList.remove("is-auto");
      selectProduct(link.getAttribute("href").slice(9), { scroll: true });
    })
  );
  // arriving from another page's Products menu (index.html#product-paneer)
  if (location.hash.startsWith("#product-") && showcase) {
    showcase.classList.remove("is-auto");
    selectProduct(location.hash.slice(9));
    setTimeout(() => $("#products").scrollIntoView(), 50);
  }

  /* ---------- Mobile menu ---------- */
  const toggle = $("[data-menu-toggle]");
  const mobileMenu = $("[data-mobile-menu]");
  // everything behind the open menu is made inert so focus stays inside it
  const behind = $$("main, footer");
  const setMenu = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    $("use", toggle).setAttribute("href", open ? "#i-close" : "#i-menu");
    mobileMenu.hidden = !open;
    behind.forEach((el) => (el.inert = open));
    document.body.classList.toggle("menu-open", open);
    if (open) $("a", mobileMenu).focus();
  };
  toggle.addEventListener("click", () => setMenu(mobileMenu.hidden));
  mobileMenu.addEventListener("click", (e) => {
    if (e.target.closest("a, button")) setMenu(false);
  });

  /* ---------- Escape closes whichever menu is open ---------- */
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!dropdown.hidden) {
      setDropdown(false);
      menuBtn.focus();
    }
    if (!mobileMenu.hidden) {
      setMenu(false);
      toggle.focus();
    }
  });

  /* ---------- Process journey: full-screen slides that play by themselves ----------
     The page scrolls past normally. The gold bar on the current step card is the timer:
     when its fill animation ends, the next step shows. A status chip says whether it is
     playing; play/pause and arrow buttons, step cards and swipes all steer it. It only
     waits while off screen or when paused with the button. */
  const journey = $("[data-journey]");
  if (journey) {
    const steps = $$(".journey-step", journey);
    const scenes = $$(".journey-scene", journey);
    const stops = $$("[data-go]", journey);
    const names = stops.map((b) => $(".journey-label > span", b).textContent);
    const status = $("[data-journey-status]", journey);
    const toggle = $("[data-journey-toggle]", journey);
    const n = steps.length;
    let current = 0;
    let inView = false, userPaused = false;

    const label = () => {
      status.textContent = userPaused ? "Paused · press play to continue" : `Auto-playing · Next: ${names[(current + 1) % n]}`;
    };
    const show = (i) => {
      current = (i + n) % n;
      [steps, scenes].forEach((group) =>
        group.forEach((el, k) => el.classList.toggle("is-active", k === current))
      );
      stops.forEach((b, k) => {
        b.classList.toggle("is-current", k === current);
        b.classList.toggle("is-past", k < current);
        if (k === current) b.setAttribute("aria-current", "step");
        else b.removeAttribute("aria-current");
      });
      label();
    };
    const sync = () => {
      journey.classList.toggle("is-paused", !inView || userPaused);
      journey.classList.toggle("is-user-paused", userPaused);
      toggle.setAttribute("aria-label", userPaused ? "Play the slideshow" : "Pause the slideshow");
      label();
    };
    show(0);

    stops.forEach((b, i) => {
      b.addEventListener("click", () => show(i));
      $(".journey-bar > span", b).addEventListener("animationend", () => {
        if (i === current) show(current + 1);
      });
    });
    $("[data-journey-prev]", journey).addEventListener("click", () => show(current - 1));
    $("[data-journey-next]", journey).addEventListener("click", () => show(current + 1));
    toggle.addEventListener("click", () => { userPaused = !userPaused; sync(); });

    // play only while at least half the section is on screen
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync(); }, { threshold: 0.5 }).observe(journey);
    sync();

    // swipe left / right on phones
    let x0 = null, y0 = 0;
    journey.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    journey.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) show(current + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  /* ---------- WhatsApp order ----------
     The order window asks where to deliver (apartment or street / house), checks the
     required details, then opens WhatsApp with a ready-to-send message.
     The address is remembered on this device for the next order. */
  const WHATSAPP = "918124834607"; // +91 81248 34607
  const dialog = $("[data-order-dialog]");
  const form = $("[data-order-form]");
  const message = $("[data-order-message]");
  const orderLink = $("[data-order-link]");
  const cart = $("[data-order-cart]");
  const totalEl = $("[data-order-total]");
  const orderError = $("[data-order-error]");
  // price list (₹): each product comes in a 200 g pack and by the kg
  const CATALOG = {
    "Mushroom": { photo: "assets/img/product-mushroom.webp", packs: [["200 g pack", 60], ["1 kg", 300]] },
    "Baby Corn": { photo: "assets/img/product-babycorn.webp", packs: [["200 g pack", 60], ["1 kg", 300]] },
    "Paneer": { photo: "assets/img/product-paneer.webp", packs: [["200 g pack", 100], ["1 kg", 500]] },
  };
  const SAVED = "mahe-order-address";
  const order = { products: [], recipe: "", qty: {} }; // qty["Mushroom|0"] = number of 200 g packs
  const rupees = (n) => `₹${n.toLocaleString("en-IN")}`;
  const lines = () =>
    order.products.flatMap((p) =>
      CATALOG[p].packs.map(([label, price], i) => ({ p, label, price, n: order.qty[`${p}|${i}`] || 0 })).filter((l) => l.n)
    );
  const total = () => lines().reduce((sum, l) => sum + l.n * l.price, 0);

  const renderCart = () => {
    cart.innerHTML = order.products.map((p) => `
      <div class="cart-product">
        <p class="cart-head"><img src="${CATALOG[p].photo}" alt="" width="900" height="720" />${p}</p>
        ${CATALOG[p].packs.map(([label, price], i) => `
        <div class="cart-row" data-key="${p}|${i}">
          <span>${label} <small>${rupees(price)}</small></span>
          <span class="stepper">
            <button type="button" data-step="-1" aria-label="One less ${p} ${label}">−</button>
            <output aria-label="${p} ${label} quantity">0</output>
            <button type="button" data-step="1" aria-label="One more ${p} ${label}">+</button>
          </span>
          <span class="cart-line"></span>
        </div>`).join("")}
      </div>`).join("");
    updateCart();
  };
  const updateCart = () => {
    $$(".cart-row", cart).forEach((row) => {
      const n = order.qty[row.dataset.key] || 0;
      const price = CATALOG[row.dataset.key.split("|")[0]].packs[row.dataset.key.split("|")[1]][1];
      $("output", row).textContent = n;
      $('[data-step="-1"]', row).disabled = n === 0;
      $(".cart-line", row).textContent = n ? rupees(n * price) : "";
    });
    $$(".cart-product", cart).forEach((box) => box.classList.toggle("has-items", $$("output", box).some((o) => o.textContent !== "0")));
    const items = lines().reduce((s, l) => s + l.n, 0);
    totalEl.hidden = !items;
    totalEl.innerHTML = `<span>${items} item${items === 1 ? "" : "s"}</span><b>${rupees(total())}</b>`;
  };
  cart.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-step]");
    if (!btn) return;
    const key = btn.closest(".cart-row").dataset.key;
    order.qty[key] = Math.max(0, Math.min(50, (order.qty[key] || 0) + Number(btn.dataset.step)));
    if (lines().length) orderError.textContent = "";
    updateCart();
    refresh();
  });

  const place = () => form.elements.place.value; // "apartment" | "street"
  const val = (name) => form.elements[name].value.trim();
  // required fields that are currently shown (the town, plus the apartment or street group)
  const visibleRequired = () => $$("[data-required]", form).filter((el) => !el.closest("[hidden]"));

  // WhatsApp formatting: *bold* labels; the address lines follow the chosen place type
  const buildMessage = () => {
    const out = ["Hello MaheMushroom,", "", "I'd like to place an order.", ""];
    if (order.recipe) out.push(`*For the recipe:* ${order.recipe}`);
    out.push("*Order:*");
    lines().forEach((l) => out.push(`• ${l.p} – ${l.label} × ${l.n} = ${rupees(l.n * l.price)}`));
    out.push(`*Total:* ${rupees(total())}`, "", `*Town:* ${val("town")}`);
    if (place() === "apartment") {
      out.push("*Delivery to:* Apartment", `*Apartment:* ${val("apartment")}`, `*Block / flat:* ${val("flat")}`);
    } else {
      out.push("*Delivery to:* Street / House", `*Address:* ${[val("door"), val("street")].filter(Boolean).join(", ")}`);
    }
    if (val("landmark")) out.push(`*Landmark:* ${val("landmark")}`);
    out.push("", "Please confirm availability and delivery. Thank you!");
    return out.join("\n");
  };
  // the on-site preview mirrors how WhatsApp renders the bold labels
  const previewHtml = (text) =>
    text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]).replace(/\*(.+?)\*/g, "<strong>$1</strong>");
  const refresh = () => {
    const text = buildMessage();
    message.innerHTML = previewHtml(text);
    orderLink.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
  };
  const showPlace = () => {
    $$("[data-fields]", form).forEach((group) => (group.hidden = group.dataset.fields !== place()));
    orderError.textContent = "";
    $$("[aria-invalid]", form).forEach((input) => input.removeAttribute("aria-invalid"));
  };

  // bring back the last address used on this device
  try {
    const saved = JSON.parse(localStorage.getItem(SAVED) || "null");
    if (saved) {
      Object.entries(saved).forEach(([name, value]) => {
        const field = form.elements[name];
        if (!field) return;
        if (name === "place") form.querySelector(`[name="place"][value="${value}"]`).checked = true;
        else field.value = value;
      });
    }
  } catch {}
  showPlace();

  form.addEventListener("change", (e) => {
    if (e.target.name === "place") showPlace();
    if (e.target.name === "town") { $("[data-town-pick]").classList.remove("is-invalid"); orderError.textContent = ""; }
    refresh();
  });
  form.addEventListener("input", (e) => {
    if (e.target.value.trim()) e.target.removeAttribute("aria-invalid");
    refresh();
  });
  $("[data-order-close]").addEventListener("click", () => dialog.close());

  // send: stop and point at the first missing detail, otherwise remember the address and open WhatsApp
  orderLink.addEventListener("click", (e) => {
    if (!lines().length) {
      e.preventDefault();
      orderError.textContent = "Please add at least one pack to your order";
      $('[data-step="1"]', cart).focus();
      return;
    }
    const townPick = $("[data-town-pick]");
    townPick.classList.toggle("is-invalid", !val("town"));
    if (!val("town")) {
      e.preventDefault();
      orderError.textContent = "Please choose your town — we deliver to these towns only";
      $("input", townPick).focus();
      return;
    }
    const missing = visibleRequired().filter((input) => !input.value.trim());
    visibleRequired().forEach((input) => input.toggleAttribute("aria-invalid", !input.value.trim()));
    if (missing.length) {
      e.preventDefault();
      missing.forEach((input) => input.setAttribute("aria-invalid", "true"));
      orderError.textContent = missing[0].dataset.required;
      missing[0].focus();
      return;
    }
    refresh();
    try {
      const keep = { place: place() };
      ["town", "apartment", "flat", "door", "street", "landmark"].forEach((n) => (keep[n] = val(n)));
      localStorage.setItem(SAVED, JSON.stringify(keep));
    } catch {}
    dialog.close();
  });

  $$("[data-order]").forEach((btn) =>
    btn.addEventListener("click", () => {
      // "Mushroom, Baby Corn and Paneer" → ["Mushroom", "Baby Corn", "Paneer"]; a general Order button offers all three
      const picked = btn.dataset.order ? btn.dataset.order.split(/, | and /) : [];
      order.products = picked.length ? picked : Object.keys(CATALOG);
      order.recipe = btn.dataset.orderFor || "";
      // start with one 200 g pack of each named product; a general order starts empty
      order.qty = Object.fromEntries(picked.map((p) => [`${p}|0`, 1]));
      orderError.textContent = "";
      renderCart();
      refresh();
      dialog.showModal();
    })
  );
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close(); // backdrop click
  });

  /* ---------- Back to top ---------- */
  const toTop = $("[data-to-top]");
  if (toTop) toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------- Scroll reveal ---------- */
  const reveal = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        reveal.unobserve(e.target);
      }),
    { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
  );
  $$("[data-reveal]").forEach((el) => reveal.observe(el));
})();
