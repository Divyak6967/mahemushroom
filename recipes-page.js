// Renders the Recipes listing and the single-recipe page from recipes-data.js.
// Loaded before main.js so the order buttons and reveal animations it creates get wired up there.
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const { RECIPES, PRODUCTS } = window;

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const link = (r) => `recipe.html?r=${encodeURIComponent(r.slug)}`;
  const meta = (r) => `${r.minutes} min · Serves ${r.serves} · ${r.level}`;
  const productList = (keys) => {
    const names = keys.map((k) => PRODUCTS[k]);
    return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names[0];
  };

  const card = (r, i) => `
    <li class="recipe-item" data-uses="${r.uses.join(" ")}" data-reveal style="--d:${i % 3}">
      <a href="${link(r)}">
        <div class="recipe-item-media">
          <img src="${r.image}" alt="${esc(r.alt)}" width="1200" height="960" loading="lazy" />
          <ul class="recipe-uses" role="list">${r.uses.map((k) => `<li>${PRODUCTS[k]}</li>`).join("")}</ul>
        </div>
        <p class="recipe-meta">${meta(r)}</p>
        <h3>${esc(r.title)}</h3>
        <p class="recipe-summary">${esc(r.summary)}</p>
      </a>
    </li>`;

  /* ---------- Listing ---------- */
  const grid = $("[data-recipe-grid]");
  if (grid) {
    const featured = RECIPES.find((r) => r.featured) || RECIPES[0];
    const feat = $("[data-featured]");
    feat.href = link(featured);
    $("[data-featured-img]").alt = featured.alt;
    $("[data-featured-title]").textContent = featured.title;
    $("[data-featured-meta]").textContent = meta(featured);

    grid.innerHTML = RECIPES.map(card).join("");

    // ingredient filter: show/hide rather than re-render, so reveal state is kept
    const chips = $$("[data-filter-value]");
    const status = $("[data-filter-status]");
    chips.forEach((chip) => {
      const v = chip.dataset.filterValue;
      const n = v === "all" ? RECIPES.length : RECIPES.filter((r) => r.uses.includes(v)).length;
      chip.insertAdjacentHTML("beforeend", ` <span class="chip-count">${n}</span>`);
      chip.addEventListener("click", () => {
        chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
        let shown = 0;
        $$(".recipe-item", grid).forEach((item) => {
          const match = v === "all" || item.dataset.uses.split(" ").includes(v);
          item.hidden = !match;
          if (match) shown++;
        });
        status.textContent = `Showing ${shown} recipe${shown === 1 ? "" : "s"}`;
      });
    });
  }

  /* ---------- Single recipe ---------- */
  const steps = $("[data-steps]");
  if (steps) {
    const slug = new URLSearchParams(location.search).get("r");
    const r = RECIPES.find((x) => x.slug === slug);

    if (!r) {
      $("[data-title]").textContent = "Recipe not found";
      $("[data-crumb]").textContent = "Not found";
      $("[data-summary]").innerHTML = 'This recipe may have moved. <a class="text-link" href="recipes.html">See all recipes</a>.';
      [".recipe-hero-media", ".recipe-body", ".sample-note", "[data-facts]", "[data-uses]"].forEach((s) => $(s).remove());
      $("[data-more]").innerHTML = RECIPES.slice(0, 3).map(card).join("");
    } else {
      document.title = `${r.title} — MaheMushroom`;
      $("[data-crumb]").textContent = r.title;
      $("[data-title]").textContent = r.title;
      $("[data-summary]").textContent = r.summary;
      const img = $("[data-image]");
      img.src = r.image;
      img.alt = r.alt;
      $("[data-uses]").innerHTML = r.uses.map((k) => `<li>${PRODUCTS[k]}</li>`).join("");
      $("[data-facts]").innerHTML = [
        ["i-clock", `${r.minutes} min`],
        ["i-users", `Serves ${r.serves}`],
        ["i-level", r.level],
      ].map(([icon, text]) => `<li><svg class="icon"><use href="#${icon}"/></svg>${text}</li>`).join("");

      // ingredient checklist with a running "ready" count
      const list = $("[data-ingredients]");
      list.innerHTML = r.ingredients.map((ing, i) => `
        <li>
          <label class="check">
            <input type="checkbox" id="ing-${i}" />
            <span class="check-box" aria-hidden="true"><svg class="icon icon--sm"><use href="#i-check"/></svg></span>
            <span class="check-text">${esc(ing)}</span>
          </label>
        </li>`).join("");
      const progress = $("[data-progress]");
      const update = () => {
        const done = $$("input:checked", list).length;
        progress.textContent = done === r.ingredients.length ? "All set — happy cooking!" : `${done} of ${r.ingredients.length} ready`;
      };
      list.addEventListener("change", update);
      update();

      const orderBtn = $("[data-recipe-order]");
      orderBtn.dataset.order = productList(r.uses);
      orderBtn.dataset.orderFor = r.title;

      steps.innerHTML = r.steps.map((s) => `<li><p>${esc(s)}</p></li>`).join("");

      // three other recipes, preferring ones that share a product
      const others = RECIPES.filter((x) => x !== r)
        .sort((a, b) => b.uses.filter((u) => r.uses.includes(u)).length - a.uses.filter((u) => r.uses.includes(u)).length)
        .slice(0, 3);
      $("[data-more]").innerHTML = others.map(card).join("");
    }
  }
})();
