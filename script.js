//You can edit ALL of the code here
function setup() {
  const allEpisodes = getAllEpisodes();
  makePageForEpisodes(allEpisodes);
}

function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  const episodes = [];

  for (const episode of episodeList) {
    const card = createEpisodeCard(episode);
    episodes.push(card);
  }

  rootElem.append(...episodes);
}

function createEpisodeCard(episode) {
  const card = document.getElementById("episode-card").content.cloneNode(true);

  card.querySelector("h3").textContent = episode.name;
  card.querySelector("img").src = episode.image.medium;

  const seasonNumber = String(episode.season).padStart(2, "0");
  const episodeNumber = String(episode.number).padStart(2, "0");
  card.querySelector("[data-season-episode-number]").textContent = `${seasonNumber}${episodeNumber}`;

  card.querySelector("time").textContent = `${episode.runtime} minutes`;
  card.querySelector("[data-episode-summary]").textContent = episode.summary.replace(/^<p>|<\/p>$/g, "");

  return card;
}

window.onload = setup;
