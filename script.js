// ==============================
// Application state
// ==============================
const state = {
  view: "shows", // "shows" | "episodes"
  showCache: [],
  episodeCache: {},

  selectedShowID: "",
  allEpisodes: [],
  searchTerm: "",
};

// ==============================
// Data fetching (cached)
// ==============================
async function getAllShows() {
  if (state.showCache.length > 0) return state.showCache;

  const response = await fetch("https://api.tvmaze.com/shows");
  const data = await response.json();
  state.showCache = data;
  return data;
}

async function getAllEpisodes(showId) {
  if (state.episodeCache[showId]) return state.episodeCache[showId];

  const response = await fetch(`https://api.tvmaze.com/shows/${showId}/episodes`);
  const data = await response.json();
  state.episodeCache[showId] = data;
  return data;
}

// ==============================
// Helpers
// ==============================
function getSortedShows() {
  return [...state.showCache].sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
}

// ==============================
// Setup
// ==============================
async function setup() {
  const placeholder = document.getElementById("placeholder");

  try {
    placeholder.textContent = "Loading...";
    await getAllShows();
    placeholder.style.display = "none";
  } catch {
    placeholder.textContent = "Error loading shows.";
    return;
  }

  setupBackNavigation();
  setupShowSelector();
  setupEpisodeSelector();
  setupSearch();

  state.view = "shows";
  makePageForTVShows(getSortedShows());
  toggleControlsForShows();
}

window.onload = setup;

// ==============================
// Navigation
// ==============================
function setupBackNavigation() {
  document.getElementById("back-to-shows").addEventListener("click", () => {
    state.view = "shows";
    state.selectedShowID = "";
    state.allEpisodes = [];
    state.searchTerm = "";

    document.getElementById("search-input").value = "";
    document.getElementById("episode-selector").value = "";
    document.getElementById("show-selector").value = "";

    makePageForTVShows(getSortedShows());
    toggleControlsForShows();
  });
}

function toggleControlsForShows() {
  document.getElementById("back-to-shows").hidden = true;
  document.getElementById("episode-selector").disabled = true;
  document.getElementById("search-input").value = "";
  document.getElementById("episode-count").textContent = "";
}

function toggleControlsForEpisodes() {
  document.getElementById("back-to-shows").hidden = false;
  document.getElementById("episode-selector").disabled = false;
}

// ==============================
// Show selector (dropdown)
// ==============================
function setupShowSelector() {
  const selector = document.getElementById("show-selector");
  selector.innerHTML = `<option value="">All Shows</option>`;

  getSortedShows().forEach((show) => {
    const option = document.createElement("option");
    option.value = show.id;
    option.textContent = show.name;
    selector.appendChild(option);
  });

  selector.addEventListener("change", async (e) => {
    if (!e.target.value) return;

    state.selectedShowID = e.target.value;
    state.view = "episodes";

    state.allEpisodes = await getAllEpisodes(state.selectedShowID);

    makePageForEpisodes(state.allEpisodes);
    populateEpisodeSelector();
    toggleControlsForEpisodes();
  });
}

// ==============================
// Rendering
// ==============================
function makePageForTVShows(shows) {
  const root = document.getElementById("root");
  root.innerHTML = "";
  root.classList.remove("single-episode");

  shows.forEach((show) => {
    root.appendChild(createTVShowCard(show));
  });
}

function makePageForEpisodes(episodes) {
  const root = document.getElementById("root");
  root.innerHTML = "";

  episodes.forEach((ep) => {
    root.appendChild(createEpisodeCard(ep));
  });

  updateEpisodeCount(episodes.length, state.allEpisodes.length);

  if (episodes.length === 1) {
    root.classList.add("single-episode");
  } else {
    root.classList.remove("single-episode");
  }
}

// ==============================
// Cards
// ==============================
function createTVShowCard(show) {
  const card = document.getElementById("tv-show-card").content.cloneNode(true);

  const section = card.querySelector("section");
  section.style.cursor = "pointer";

  section.addEventListener("click", async () => {
    state.selectedShowID = show.id;
    state.view = "episodes";

    document.getElementById("show-selector").value = show.id;

    state.allEpisodes = await getAllEpisodes(show.id);

    makePageForEpisodes(state.allEpisodes);
    populateEpisodeSelector();
    toggleControlsForEpisodes();
  });

  card.querySelector("h3").textContent = show.name;
  card.querySelector("img").src = show.image?.medium || "";
  card.querySelector("[data-tv-show-summary]").innerHTML = show.summary?.replace(/<\/?p>/g, "") || "";
  card.querySelector("[data-tv-show-genres]").textContent = show.genres.join(", ");
  card.querySelector("[data-tv-show-status]").textContent = show.status;
  card.querySelector("[data-tv-show-rating]").textContent = show.rating?.average ?? "N/A";
  card.querySelector("[data-tv-show-runtime]").textContent = `${show.runtime} minutes`;

  return card;
}

function createEpisodeCard(ep) {
  const card = document.getElementById("episode-card").content.cloneNode(true);

  card.querySelector("h3").textContent = ep.name;

  const img = card.querySelector("img");
  img.src = ep.image?.medium || "";
  img.alt = ep.name;

  const s = String(ep.season).padStart(2, "0");
  const e = String(ep.number).padStart(2, "0");

  card.querySelector("[data-season-episode-number]").textContent = `S${s}E${e}`;
  card.querySelector("time").textContent = `${ep.runtime} minutes`;
  card.querySelector("[data-episode-summary]").textContent = ep.summary?.replace(/<\/?p>/g, "") || "No summary.";
  card.querySelector("[data-episode-link]").href = ep.url;

  return card;
}

// ==============================
// Episode selector
// ==============================
function setupEpisodeSelector() {
  document.getElementById("episode-selector").addEventListener("change", (e) => {
    if (!e.target.value) {
      makePageForEpisodes(state.allEpisodes);
      return;
    }

    const selected = state.allEpisodes.find((ep) => {
      const s = String(ep.season).padStart(2, "0");
      const n = String(ep.number).padStart(2, "0");
      return `s${s}e${n}` === e.target.value;
    });

    if (selected) makePageForEpisodes([selected]);
  });
}

function populateEpisodeSelector() {
  const selector = document.getElementById("episode-selector");
  selector.innerHTML = `<option value="">All episodes</option>`;

  state.allEpisodes.forEach((ep) => {
    const s = String(ep.season).padStart(2, "0");
    const n = String(ep.number).padStart(2, "0");

    const option = document.createElement("option");
    option.value = `s${s}e${n}`;
    option.textContent = `S${s}E${n} - ${ep.name}`;
    selector.appendChild(option);
  });
}

// ==============================
// Search
// ==============================
function setupSearch() {
  document.getElementById("search-input").addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();

    if (state.view === "shows") {
      const filtered = state.showCache.filter(
        (show) => show.name.toLowerCase().includes(term) || show.genres.join(" ").toLowerCase().includes(term) || show.summary?.toLowerCase().includes(term)
      );
      makePageForTVShows(filtered);
    } else {
      const filtered = state.allEpisodes.filter((ep) => ep.name.toLowerCase().includes(term) || ep.summary?.toLowerCase().includes(term));
      makePageForEpisodes(filtered);
    }
  });
}

// ==============================
// Episode count
// ==============================
function updateEpisodeCount(displayed, total) {
  document.getElementById("episode-count").textContent = `Displaying ${displayed} / ${total} episodes`;
}
