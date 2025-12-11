// Application state
const state = {
	allEpisodes: [],
	searchTerm: '',
	selectedEpisodeID: '',
};

function setup() {
	state.allEpisodes = getAllEpisodes();
	makePageForEpisodes(state.allEpisodes);
	setupSearch();
	setupEpisodeSelector();
}

function makePageForEpisodes(episodeList) {
	const rootElem = document.getElementById('root');
	rootElem.innerHTML = '';
	const episodes = [];

	for (const episode of episodeList) {
		const card = createEpisodeCard(episode);
		episodes.push(card);
	}

	rootElem.append(...episodes);

	// Add class for single episode display
	if (episodeList.length === 1) {
		rootElem.classList.add('single-episode');
	} else {
		rootElem.classList.remove('single-episode');
	}

	updateEpisodeCount(episodeList.length, state.allEpisodes.length);
}

function createEpisodeCard(episode) {
	const card = document
		.getElementById('episode-card')
		.content.cloneNode(true);

	card.querySelector('h3').textContent = episode.name;
	const img = card.querySelector('img');
	img.src = episode.image.medium;
	img.alt = `${episode.name} - Season ${episode.season} Episode ${episode.number}`;

	const seasonNumber = String(episode.season).padStart(2, '0');
	const episodeNumber = String(episode.number).padStart(2, '0');
	card.querySelector(
		'[data-season-episode-number]'
	).textContent = `S${seasonNumber}E${episodeNumber}`;

	card.querySelector('time').textContent = `${episode.runtime} minutes`;
	card.querySelector('time').setAttribute(
		'datetime',
		`PT${episode.runtime}M`
	);
	card.querySelector('[data-episode-summary]').textContent = episode.summary
		.replace(/<\/?p>/g, '')
		.trim();
	card.querySelector('[data-episode-link]').href = episode.url;

	return card;
}

function setupSearch() {
	const searchInput = document.getElementById('search-input');
	const selector = document.getElementById('episode-selector');

	searchInput.addEventListener('input', (event) => {
		state.searchTerm = event.target.value.toLowerCase();
		const filteredEpisodes = filterEpisodes();
		state.selectedEpisodeId = '';
		selector.value = '';
		makePageForEpisodes(filteredEpisodes);
	});
}

function filterEpisodes() {
	if (!state.searchTerm) {
		return state.allEpisodes;
	}

	return state.allEpisodes.filter((episode) => {
		const nameMatch = episode.name.toLowerCase().includes(state.searchTerm);
		const summaryMatch = episode.summary
			.toLowerCase()
			.includes(state.searchTerm);
		return nameMatch || summaryMatch;
	});
}

function setupEpisodeSelector() {
	const selector = document.getElementById('episode-selector');

	// Populate the selector with episodes
	state.allEpisodes.forEach((episode) => {
		const option = document.createElement('option');
		const seasonNumber = String(episode.season).padStart(2, '0');
		const episodeNumber = String(episode.number).padStart(2, '0');
		option.value = `s${seasonNumber}e${episodeNumber}`;
		option.textContent = `S${seasonNumber}E${episodeNumber} - ${episode.name}`;
		selector.appendChild(option);
	});

	// Handle selection changes
	selector.addEventListener('change', (event) => {
		const selectedValue = event.target.value;
		const searchInput = document.getElementById('search-input');

		if (selectedValue === '') {
			// Show all episodes
			state.selectedEpisodeId = '';
			state.searchTerm = '';
			searchInput.value = '';
			makePageForEpisodes(state.allEpisodes);
		} else {
			// Find and display only the selected episode
			const selectedEpisode = state.allEpisodes.find((episode) => {
				const seasonNumber = String(episode.season).padStart(2, '0');
				const episodeNumber = String(episode.number).padStart(2, '0');
				return `s${seasonNumber}e${episodeNumber}` === selectedValue;
			});

			if (selectedEpisode) {
				state.selectedEpisodeId = selectedValue;
				state.searchTerm = '';
				searchInput.value = '';
				makePageForEpisodes([selectedEpisode]);
			}
		}
	});
}

function updateEpisodeCount(displayed, total) {
	const countElement = document.getElementById('episode-count');
	countElement.textContent = `Displaying ${displayed} / ${total} episodes`;
}

window.onload = setup;
