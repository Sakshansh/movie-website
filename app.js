// ============ State ============
const state = {
  view: "browse",          // "browse" | "favourites"
  genre: "All",
  query: "",
  sort: "rating",
  minRating: 0,
  favourites: new Set(loadFavourites()),
  featured: null,
};

const $ = (sel) => document.querySelector(sel);
const grid = $("#movieGrid");

// ============ Favourites (saved in localStorage) ============
function loadFavourites() {
  try { return JSON.parse(localStorage.getItem("lumiere-favs")) || []; }
  catch { return []; }
}
function saveFavourites() {
  try { localStorage.setItem("lumiere-favs", JSON.stringify([...state.favourites])); } catch {}
}
function toggleFavourite(id) {
  const movie = MOVIES.find((m) => m.id === id);
  if (state.favourites.has(id)) {
    state.favourites.delete(id);
    toast(`Removed “${movie.title}” from favourites`);
  } else {
    state.favourites.add(id);
    toast(`♥ Added “${movie.title}” to favourites`);
  }
  saveFavourites();
  updateFavUI();
  if (state.view === "favourites") render();
}

// ============ Poster generator ============
// Builds a minimalist SVG poster from each film's colours + motif,
// so the site works fully offline with no external images.
let uid = 0;
function rand(seed) {
  let s = seed * 9301 + 49297;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}
function esc(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function wrapTitle(title, max = 13) {
  const words = title.replace(/:/g, "").split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > max && line) { lines.push(line); line = w; }
    else line = (line + " " + w).trim();
  }
  lines.push(line);
  return lines.slice(0, 4);
}

function motifSVG(m, a, r) {
  switch (m.motif) {
    case "orb":
      return `<circle cx="100" cy="125" r="62" fill="${a}" opacity=".95"/>
              <circle cx="100" cy="125" r="85" fill="none" stroke="${a}" stroke-width=".6" opacity=".5"/>
              <circle cx="100" cy="125" r="110" fill="none" stroke="${a}" stroke-width=".4" opacity=".3"/>
              <ellipse cx="100" cy="125" rx="120" ry="14" fill="none" stroke="${a}" stroke-width="1.2" opacity=".7"/>`;
    case "sun": {
      let stripes = "";
      for (let i = 0; i < 6; i++) stripes += `<rect x="0" y="${150 + i * 9}" width="200" height="${2 + i * 0.6}" fill="url(#bg${uid})"/>`;
      return `<circle cx="100" cy="150" r="58" fill="${a}"/>${stripes}
              <line x1="20" y1="205" x2="180" y2="205" stroke="${a}" stroke-width=".8" opacity=".6"/>`;
    }
    case "grid": {
      let g = "";
      for (let i = 0; i <= 10; i++) g += `<line x1="100" y1="90" x2="${-60 + i * 32}" y2="300" stroke="${a}" stroke-width=".6" opacity=".55"/>`;
      for (let i = 0; i < 7; i++) { const y = 110 + Math.pow(i, 1.8) * 5.5; g += `<line x1="0" y1="${y}" x2="200" y2="${y}" stroke="${a}" stroke-width=".6" opacity=".45"/>`; }
      return g + `<rect x="80" y="60" width="40" height="50" fill="${a}" opacity=".9"/>`;
    }
    case "stars": {
      let s = "";
      for (let i = 0; i < 40; i++) s += `<circle cx="${r() * 200}" cy="${r() * 200}" r="${r() * 1.4 + .3}" fill="${a}" opacity="${r() * .8 + .2}"/>`;
      return s + `<circle cx="130" cy="80" r="30" fill="${a}"/><circle cx="142" cy="72" r="27" fill="url(#bg${uid})"/>`;
    }
    case "dunes":
      return `<circle cx="140" cy="80" r="26" fill="${a}"/>
              <path d="M0 170 Q60 130 120 165 T200 150 V300 H0Z" fill="${a}" opacity=".35"/>
              <path d="M0 200 Q70 160 140 195 T200 185 V300 H0Z" fill="${a}" opacity=".55"/>
              <path d="M0 230 Q50 205 110 225 T200 220 V300 H0Z" fill="${a}" opacity=".8"/>`;
    case "arch":
      return `<path d="M55 230 V120 A45 45 0 0 1 145 120 V230Z" fill="${a}" opacity=".9"/>
              <path d="M75 230 V130 A25 25 0 0 1 125 130 V230Z" fill="url(#bg${uid})"/>
              <line x1="20" y1="230" x2="180" y2="230" stroke="${a}" stroke-width="1"/>`;
    case "rings": {
      let c = "";
      for (let i = 1; i <= 9; i++) c += `<circle cx="100" cy="130" r="${i * 11}" fill="none" stroke="${a}" stroke-width="${i % 3 === 0 ? 2 : .7}" opacity="${1 - i * .08}"/>`;
      return c + `<circle cx="100" cy="130" r="5" fill="${a}"/>`;
    }
    case "eye":
      return `<path d="M20 130 Q100 50 180 130 Q100 210 20 130Z" fill="none" stroke="${a}" stroke-width="1.5"/>
              <circle cx="100" cy="130" r="34" fill="${a}"/><circle cx="100" cy="130" r="13" fill="#000"/>
              <circle cx="108" cy="122" r="4" fill="#fff" opacity=".8"/>`;
    case "comet": {
      let s = "";
      for (let i = 0; i < 30; i++) s += `<circle cx="${r() * 200}" cy="${r() * 220}" r="${r() + .3}" fill="#fff" opacity="${r() * .7}"/>`;
      return s + `<line x1="20" y1="30" x2="135" y2="150" stroke="${a}" stroke-width="2" stroke-linecap="round" opacity=".9"/>
              <line x1="30" y1="20" x2="140" y2="145" stroke="${a}" stroke-width=".6" opacity=".5"/>
              <circle cx="138" cy="152" r="7" fill="#fff"/>
              <path d="M0 220 Q100 190 200 220 V300 H0Z" fill="${a}" opacity=".35"/>`;
    }
    case "city": {
      let b = "";
      let x = 0;
      while (x < 200) { const w = 14 + r() * 22, h = 50 + r() * 120; b += `<rect x="${x}" y="${230 - h}" width="${w - 2}" height="${h + 70}" fill="${a}" opacity="${.25 + r() * .5}"/>`; x += w; }
      return `<circle cx="100" cy="70" r="22" fill="${a}" opacity=".9"/>` + b;
    }
    case "waves": {
      let w = "";
      for (let i = 0; i < 12; i++) { const y = 80 + i * 12; w += `<path d="M0 ${y} Q25 ${y - 14} 50 ${y} T100 ${y} T150 ${y} T200 ${y}" fill="none" stroke="${a}" stroke-width="${1.6 - i * .1}" opacity="${1 - i * .07}"/>`; }
      return w;
    }
    case "mountain":
      return `<circle cx="100" cy="100" r="40" fill="${a}" opacity=".9"/>
              <path d="M-10 240 L60 140 L100 190 L140 120 L210 240Z" fill="${a}" opacity=".5"/>
              <path d="M-10 250 L40 190 L90 230 L150 170 L210 250 V300 H-10Z" fill="${a}" opacity=".8"/>`;
    case "balloons": {
      let b = "";
      for (let i = 0; i < 14; i++) {
        const cx = 55 + r() * 90, cy = 50 + r() * 80, rr = 9 + r() * 9;
        b += `<line x1="${cx}" y1="${cy + rr}" x2="100" y2="190" stroke="${a}" stroke-width=".4" opacity=".6"/>
              <ellipse cx="${cx}" cy="${cy}" rx="${rr * .85}" ry="${rr}" fill="${a}" opacity="${.55 + r() * .45}"/>`;
      }
      return b + `<path d="M85 190 L100 178 L115 190 V210 H85Z" fill="${a}"/>`;
    }
    default:
      return "";
  }
}

function makePoster(m) {
  uid++;
  const [base, accent] = m.colors;
  const r = rand(m.id);
  const lines = wrapTitle(m.title);
  const fontSize = lines.length > 2 ? 17 : 21;
  const startY = 288 - (lines.length - 1) * (fontSize + 1) - 8;
  const titleSVG = lines.map((l, i) =>
    `<text x="16" y="${startY + i * (fontSize + 1)}" font-family="Fraunces, Georgia, serif" font-style="italic" font-size="${fontSize}" fill="#fff8ee" letter-spacing="-.4">${esc(l)}</text>`
  ).join("");

  return `<svg viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-label="${esc(m.title)} poster" role="img">
    <defs>
      <linearGradient id="bg${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${base}"/><stop offset="1" stop-color="${shade(base, -40)}"/>
      </linearGradient>
      <linearGradient id="fade${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/>
      </linearGradient>
    </defs>
    <rect width="200" height="300" fill="url(#bg${uid})"/>
    ${motifSVG(m, accent, r)}
    <rect width="200" height="300" fill="url(#fade${uid})"/>
    <text x="16" y="24" font-family="Inter, sans-serif" font-size="6.5" letter-spacing="2" fill="#fff8ee" opacity=".75">${esc(m.director.toUpperCase())}</text>
    <text x="184" y="24" text-anchor="end" font-family="Inter, sans-serif" font-size="6.5" letter-spacing="1" fill="#fff8ee" opacity=".75">${m.year}</text>
    ${titleSVG}
  </svg>`;
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, v + amt));
  return "#" + [(n >> 16) + 0, (n >> 8) & 255, n & 255].map(c).map((v) => v.toString(16).padStart(2, "0")).join("");
}

// ============ Filtering & sorting ============
function getVisibleMovies() {
  const q = state.query.trim().toLowerCase();
  let list = MOVIES.filter((m) => {
    if (state.view === "favourites" && !state.favourites.has(m.id)) return false;
    if (state.genre !== "All" && !m.genres.includes(state.genre)) return false;
    if (m.rating < state.minRating) return false;
    if (!q) return true;
    const haystack = [m.title, m.director, m.cast, m.desc, ...m.genres, String(m.year)].join(" ").toLowerCase();
    return q.split(/\s+/).every((word) => haystack.includes(word));
  });

  const sorters = {
    rating: (a, b) => b.rating - a.rating,
    newest: (a, b) => b.year - a.year,
    oldest: (a, b) => a.year - b.year,
    title:  (a, b) => a.title.localeCompare(b.title),
  };
  return list.sort(sorters[state.sort]);
}

// ============ Recommendations ============
// Scores every other film by shared genres, same director and similar rating.
function recommend(movie, count = 4) {
  return MOVIES
    .filter((m) => m.id !== movie.id)
    .map((m) => {
      const shared = m.genres.filter((g) => movie.genres.includes(g)).length;
      const score = shared * 3 + (m.director === movie.director ? 2 : 0) - Math.abs(m.rating - movie.rating);
      return { m, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((x) => x.m);
}

// ============ Rendering ============
const heartSVG = `<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.2 4.2 2.3h2c.6-1.1 2.1-2.3 4.2-2.3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z" stroke-linejoin="round"/></svg>`;

function renderChips() {
  const genres = ["All", ...new Set(MOVIES.flatMap((m) => m.genres))].sort((a, b) => (a === "All" ? -1 : b === "All" ? 1 : a.localeCompare(b)));
  $("#genreChips").innerHTML = genres
    .map((g) => `<button class="chip ${g === state.genre ? "active" : ""}" data-genre="${g}" role="tab">${g}</button>`)
    .join("");
}

function render() {
  const list = getVisibleMovies();
  const isFav = state.view === "favourites";

  $("#sectionTitle").textContent = isFav
    ? "Your favourites"
    : state.genre === "All" ? "All films" : state.genre;
  $("#resultCount").textContent = `${list.length} ${list.length === 1 ? "film" : "films"}`;
  $("#hero").style.display = isFav ? "none" : "";

  grid.innerHTML = list.map((m, i) => `
    <article class="card" data-id="${m.id}" style="animation-delay:${Math.min(i * 40, 600)}ms" tabindex="0">
      <div class="poster">
        ${makePoster(m)}
        <span class="rating-badge">★ ${m.rating.toFixed(1)}</span>
        <button class="fav-btn ${state.favourites.has(m.id) ? "active" : ""}" data-fav="${m.id}" aria-label="Toggle favourite">${heartSVG}</button>
        <div class="poster-overlay">
          <div class="mini-tags">${m.genres.map((g) => `<span>${g}</span>`).join("")}</div>
          <p>${m.desc}</p>
        </div>
      </div>
      <div class="card-info">
        <h3 class="card-title">${m.title}</h3>
        <p class="card-sub">${m.year} · ${m.genres[0]} · ${formatRuntime(m.runtime)}</p>
      </div>
    </article>`).join("");

  const empty = $("#emptyState");
  empty.hidden = list.length > 0;
  if (!list.length) {
    $("#emptyTitle").textContent = isFav && state.favourites.size === 0 ? "No favourites yet" : "No films found";
    $("#emptyText").textContent = isFav && state.favourites.size === 0
      ? "Tap the ♡ on any poster to save it here."
      : "Try a different search, genre or rating.";
  }
}

function renderHero() {
  // Pick a random highly rated film as tonight's pick
  const pool = MOVIES.filter((m) => m.rating >= 8);
  const m = pool[Math.floor(Math.random() * pool.length)];
  state.featured = m;
  $("#heroTitle").textContent = m.title;
  $("#heroMeta").innerHTML = `<span class="star">★ ${m.rating}</span> &nbsp;·&nbsp; ${m.year} &nbsp;·&nbsp; ${m.genres.join(", ")} &nbsp;·&nbsp; ${formatRuntime(m.runtime)}`;
  $("#heroDesc").textContent = m.desc;
  $("#heroPoster").innerHTML = makePoster(m);
  $("#heroBg").style.background = `radial-gradient(circle at 70% 40%, ${m.colors[1]}, transparent 55%), radial-gradient(circle at 30% 60%, ${m.colors[0]}, transparent 60%)`;
  updateFavUI();
}

function updateFavUI() {
  $("#favCount").textContent = state.favourites.size;
  if (state.featured) {
    const fav = state.favourites.has(state.featured.id);
    const btn = $("#heroFav");
    btn.textContent = fav ? "♥ In favourites" : "♡ Add to favourites";
    btn.classList.toggle("is-fav", fav);
  }
  document.querySelectorAll("[data-fav]").forEach((b) => b.classList.toggle("active", state.favourites.has(+b.dataset.fav)));
  if (openMovieId) updateModalFav();
}

const formatRuntime = (min) => `${Math.floor(min / 60)}h ${min % 60}m`;

// ============ Modal ============
let openMovieId = null;

function openModal(id) {
  const m = MOVIES.find((x) => x.id === id);
  openMovieId = id;
  $("#modalPoster").innerHTML = makePoster(m);
  $("#modalGenres").innerHTML = m.genres.map((g) => `<span>${g}</span>`).join("");
  $("#modalTitle").textContent = m.title;
  $("#modalMeta").textContent = `★ ${m.rating} / 10  ·  ${m.year}  ·  ${formatRuntime(m.runtime)}`;
  $("#modalDesc").textContent = m.desc;
  $("#modalCast").innerHTML = `<b>Director</b> ${m.director}<br><b>Starring</b> ${m.cast}`;
  $("#modalRatingFill").style.width = "0%";
  updateModalFav();

  $("#recRow").innerHTML = recommend(m).map((r) => `
    <div class="rec" data-rec="${r.id}">
      <div class="rec-poster">${makePoster(r)}</div>
      <p>${r.title}</p>
      <small>★ ${r.rating} · ${r.year}</small>
    </div>`).join("");

  const modal = $("#modal");
  modal.hidden = false;
  modal.querySelector(".modal-card").scrollTop = 0;
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => ($("#modalRatingFill").style.width = `${m.rating * 10}%`));
}

function updateModalFav() {
  const fav = state.favourites.has(openMovieId);
  const btn = $("#modalFav");
  btn.textContent = fav ? "♥ Saved to favourites" : "♡ Add to favourites";
  btn.classList.toggle("is-fav", fav);
}

function closeModal() {
  $("#modal").hidden = true;
  openMovieId = null;
  document.body.style.overflow = "";
}

// ============ Toast ============
let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

// ============ Events ============
let searchTimer;
$("#searchInput").addEventListener("input", (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { state.query = e.target.value; render(); }, 120);
});

$("#sortSelect").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
$("#ratingSelect").addEventListener("change", (e) => { state.minRating = +e.target.value; render(); });

$("#genreChips").addEventListener("click", (e) => {
  const chip = e.target.closest("[data-genre]");
  if (!chip) return;
  state.genre = chip.dataset.genre;
  renderChips();
  render();
});

document.querySelectorAll(".nav-link").forEach((btn) =>
  btn.addEventListener("click", () => {
    state.view = btn.dataset.view;
    document.querySelectorAll(".nav-link").forEach((b) => b.classList.toggle("active", b === btn));
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  })
);

$("#brandLink").addEventListener("click", (e) => {
  e.preventDefault();
  document.querySelector('[data-view="browse"]').click();
});

grid.addEventListener("click", (e) => {
  const favBtn = e.target.closest("[data-fav]");
  if (favBtn) {
    e.stopPropagation();
    favBtn.classList.remove("pop"); void favBtn.offsetWidth; favBtn.classList.add("pop");
    toggleFavourite(+favBtn.dataset.fav);
    return;
  }
  const card = e.target.closest(".card");
  if (card) openModal(+card.dataset.id);
});
grid.addEventListener("keydown", (e) => {
  const card = e.target.closest(".card");
  if (card && e.key === "Enter" && e.target === card) openModal(+card.dataset.id);
});

$("#heroDetails").addEventListener("click", () => openModal(state.featured.id));
$("#heroFav").addEventListener("click", () => toggleFavourite(state.featured.id));
$("#modalFav").addEventListener("click", () => toggleFavourite(openMovieId));

$("#modal").addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) return closeModal();
  const rec = e.target.closest("[data-rec]");
  if (rec) openModal(+rec.dataset.rec);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && openMovieId) closeModal();
  if (e.key === "/" && document.activeElement.tagName !== "INPUT") {
    e.preventDefault();
    $("#searchInput").focus();
  }
});

// ============ Init ============
renderChips();
renderHero();
render();
