// Application state
const state = {
  allEpisodes: [],
  searchTerm: "",
  selectedEpisodeID: "",
  selectedShowID: "",
  //data cache
  showCache: [],
  episodeCache: {}, // stored by show id
};

async function getAllShows() {
  // Check if already cached
  if (state.showCache && state.showCache.length > 0) {
    return state.showCache;
  }

  const url = "https://api.tvmaze.com/shows";
  const response = await fetch(url);
  const data = await response.json();
  state.showCache = data;
  return data;
}

async function getAllEpisodes(showId) {
  const url = `https://api.tvmaze.com/shows/${showId}/episodes`;
  const response = await fetch(url);
  const data = await response.json();
  state.episodeCache[showId] = data; // cache the data
  return data;
}

// Helper function to get sorted shows
function getSortedShows() {
  return [...state.showCache].sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
}

async function setup() {
  const placeholder = document.getElementById("placeholder");

  try {
    placeholder.textContent = "Loading...";
    await getAllShows(); //preload shows

    const sortedShows = getSortedShows();
    const firstShowId = sortedShows[0].id;
    state.selectedShowID = firstShowId;

    state.allEpisodes = await getAllEpisodes(firstShowId);
    placeholder.style.display = "none";
  } catch (error) {
    placeholder.textContent = "There was an error fetching TV shows. Please try again.";
  }

  makePageForEpisodes(state.allEpisodes);
  setupSearch();
  setupEpisodeSelector();
  setupShowSelector();
}

function setupShowSelector() {
  const showSelector = document.getElementById("show-selector");
  const sortedShows = getSortedShows();
  sortedShows.forEach((show) => {
    const option = document.createElement("option");
    option.value = show.id;
    option.textContent = show.name;
    showSelector.appendChild(option);
  });

  showSelector.addEventListener("change", async (event) => {
    const selectedShowID = event.target.value;
    state.selectedShowID = selectedShowID;

    if (state.episodeCache[selectedShowID]) {
      state.allEpisodes = state.episodeCache[selectedShowID];
    } else {
      state.allEpisodes = await getAllEpisodes(selectedShowID);
    }

    state.searchTerm = "";
    state.selectedEpisodeID = "";
    document.getElementById("search-input").value = "";
    document.getElementById("episode-selector").value = "";

    makePageForEpisodes(state.allEpisodes);
    populateEpisodeSelector();
  });
}

function makePageForTVShows(tvShows) {
  const rootElement = document.getElementById("root");
  rootElement.innerHTML = "";

  const shows = [];

  for (const tvShow of tvShows) {
    const card = createTVShowCard(tvShow);
    shows.push(card);
  }

  rootElement.append(...shows);
}

function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = "";
  const episodes = [];

  for (const episode of episodeList) {
    const card = createEpisodeCard(episode);
    episodes.push(card);
  }

  rootElem.append(...episodes);

  // Add class for single episode display
  if (episodeList.length === 1) {
    rootElem.classList.add("single-episode");
  } else {
    rootElem.classList.remove("single-episode");
  }

  updateEpisodeCount(episodeList.length, state.allEpisodes.length);
}

function createTVShowCard(tvShow) {
  const card = document.getElementById("tv-show-card").content.cloneNode(true);

  card.querySelector("h3").textContent = tvShow.name;
  card.querySelector("img").src = tvShow.image.medium;
  card.querySelector("[data-tv-show-summary]").innerHTML = tvShow.summary.replace(/<\/?p>/g, "")?.trim();
  card.querySelector("[data-tv-show-genres]").textContent = tvShow.genres.join(", ");
  card.querySelector("[data-tv-show-status]").textContent = tvShow.status;
  card.querySelector("[data-tv-show-rating]").textContent = tvShow.rating.average;
  card.querySelector("[data-tv-show-runtime]").textContent = tvShow.runtime;

  return card;
}

function createEpisodeCard(episode) {
  const card = document.getElementById("episode-card").content.cloneNode(true);

  card.querySelector("h3").textContent = episode.name;
  const img = card.querySelector("img");
  img.src =
    episode.image?.medium ||
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%25" height="100%25" fill="%23cccccc"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" fill="%23666666">No Image</text></svg>';
  img.alt = `${episode.name} - Season ${episode.season} Episode ${episode.number}`;

  const seasonNumber = String(episode.season).padStart(2, "0");
  const episodeNumber = String(episode.number).padStart(2, "0");
  card.querySelector("[data-season-episode-number]").textContent = `S${seasonNumber}E${episodeNumber}`;

  card.querySelector("time").textContent = `${episode.runtime} minutes`;
  card.querySelector("time").setAttribute("datetime", `PT${episode.runtime}M`);
  card.querySelector("[data-episode-summary]").textContent = episode.summary?.replace(/<\/?p>/g, "")?.trim() || "No summary available.";
  card.querySelector("[data-episode-link]").href = episode.url;

  return card;
}

function setupSearch() {
  const searchInput = document.getElementById("search-input");
  const selector = document.getElementById("episode-selector");

  searchInput.addEventListener("input", (event) => {
    state.searchTerm = event.target.value.toLowerCase();
    const filteredEpisodes = filterEpisodes();
    state.selectedEpisodeId = "";
    selector.value = "";
    makePageForEpisodes(filteredEpisodes);
  });
}

function filterEpisodes() {
  if (!state.searchTerm) {
    return state.allEpisodes;
  }

  return state.allEpisodes.filter((episode) => {
    const nameMatch = episode.name.toLowerCase().includes(state.searchTerm);
    const summaryMatch = episode.summary.toLowerCase().includes(state.searchTerm);
    return nameMatch || summaryMatch;
  });
}

function populateEpisodeSelector() {
  const selector = document.getElementById("episode-selector");

  selector.innerHTML = '<option value="">All episodes</option>';

  state.allEpisodes.forEach((episode) => {
    const option = document.createElement("option");
    const seasonNumber = String(episode.season).padStart(2, "0");
    const episodeNumber = String(episode.number).padStart(2, "0");
    option.value = `s${seasonNumber}e${episodeNumber}`;
    option.textContent = `S${seasonNumber}E${episodeNumber} - ${episode.name}`;
    selector.appendChild(option);
  });
}

function setupEpisodeSelector() {
  const selector = document.getElementById("episode-selector");

  // Initial population based on the currently loaded episodes
  populateEpisodeSelector();

  selector.addEventListener("change", (event) => {
    const selectedValue = event.target.value;
    const searchInput = document.getElementById("search-input");

    if (selectedValue === "") {
      // Show all episodes
      state.selectedEpisodeId = "";
      state.searchTerm = "";
      searchInput.value = "";
      makePageForEpisodes(state.allEpisodes);
    } else {
      // Find and display only the selected episode
      const selectedEpisode = state.allEpisodes.find((episode) => {
        const seasonNumber = String(episode.season).padStart(2, "0");
        const episodeNumber = String(episode.number).padStart(2, "0");
        return `s${seasonNumber}e${episodeNumber}` === selectedValue;
      });

      if (selectedEpisode) {
        state.selectedEpisodeId = selectedValue;
        state.searchTerm = "";
        searchInput.value = "";
        makePageForEpisodes([selectedEpisode]);
      }
    }
  });
}

function updateEpisodeCount(displayed, total) {
  const countElement = document.getElementById("episode-count");
  countElement.textContent = `Displaying ${displayed} / ${total} episodes`;
}

window.onload = setup;
