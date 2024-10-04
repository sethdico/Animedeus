let currentEpisode = 1;
let totalEpisodes = 0;
let animeDetails = null;
let currentEpisodeRange = 1;
let isFallbackMode = false;

const API_BASE_URL = 'https://animeapi-delta.vercel.app';

document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadInitialContent();
});

const initializeEventListeners = () => {
    const elements = {
        prevEpisodeButton: document.getElementById('prevEpisode'),
        nextEpisodeButton: document.getElementById('nextEpisode'),
        fallbackButton: document.getElementById('fallbackButton'),
        searchInput: document.getElementById('searchInput'),
        animeListSearchInput: document.getElementById('animeListSearch'),
        dubSubSelect: document.getElementById('dubSub')
    };

    elements.prevEpisodeButton?.addEventListener('click', () => changeEpisode(-1));
    elements.nextEpisodeButton?.addEventListener('click', () => changeEpisode(1));
    elements.fallbackButton?.addEventListener('click', toggleFallback);
    elements.searchInput?.addEventListener('keyup', handleSearchKeyUp);
    elements.animeListSearchInput?.addEventListener('keyup', handleAnimeListSearchKeyUp);
    elements.dubSubSelect?.addEventListener('change', updatePlayer);

    loadAnimeFromUrl();
};

const loadInitialContent = async () => {
    try {
        await Promise.all([
            displayTopAiring(),
            displayTopMovies(),
            displayTopTVSeries(),
            displayGenres()
        ]);
    } catch (error) {
        console.error('Error loading initial content:', error);
        showError('Failed to load content. Please refresh the page.');
    }
};

const handleSearchKeyUp = (event) => {
    if (event.key === 'Enter') {
        searchAnime();
    }
};

const handleAnimeListSearchKeyUp = (event) => {
    if (event.key === 'Enter') {
        searchAnimeList();
    }
};

const loadAnimeFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const malId = urlParams.get('id');
    const episode = urlParams.get('episode');
    if (malId) {
        const malIdInput = document.getElementById('malId');
        if (malIdInput) malIdInput.value = malId;
        currentEpisode = parseInt(episode) || 1;
        loadAnime();
    }
};

const searchAnime = async () => {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    const searchTerm = searchInput.value.trim();
    if (!searchTerm) {
        showError('Please enter a search term');
        return;
    }

    showLoading(true);
    clearError();

    try {
        const response = await fetch(`${API_BASE_URL}/meta/anilist/${encodeURIComponent(searchTerm)}`);
        if (!response.ok) throw new Error('Search failed');
        const data = await response.json();
        displaySearchResults(data.results);
    } catch (err) {
        console.error('Search error:', err);
        showError('An error occurred while searching. Please try again.');
    } finally {
        showLoading(false);
    }
};

const searchAnimeList = async () => {
    const searchInput = document.getElementById('animeListSearch');
    if (!searchInput) return;

    const searchTerm = searchInput.value.trim();
    if (!searchTerm) {
        showError('Please enter a search term');
        return;
    }

    showLoading(true);
    clearError();

    try {
        const response = await fetch(`${API_BASE_URL}/meta/anilist/${encodeURIComponent(searchTerm)}`);
        if (!response.ok) throw new Error('Search failed');
        const data = await response.json();
        displayAnimeListResults(data.results);
    } catch (err) {
        console.error('Anime list search error:', err);
        showError('An error occurred while searching the anime list. Please try again.');
    } finally {
        showLoading(false);
    }
};

const displaySearchResults = (results) => {
    const searchResults = document.getElementById('searchResults');
    if (!searchResults) return;

    searchResults.innerHTML = '';

    results.forEach(anime => {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'search-result';
        resultDiv.innerHTML = `
            <h3>${anime.title}</h3>
            <p>Type: ${anime.type || 'N/A'}</p>
            <p>ID: ${anime.id}</p>
            <p>Episodes: ${anime.totalEpisodes || 'Unknown'}</p>
            <p>Score: ${anime.rating || 'N/A'}</p>
        `;
        resultDiv.onclick = () => {
            window.location.href = `anime-list.html?id=${anime.id}&title=${encodeURIComponent(anime.title)}`;
        };
        searchResults.appendChild(resultDiv);
    });
};

const displayAnimeListResults = (results) => {
    const animeListResults = document.getElementById('animeListResults');
    if (!animeListResults) return;

    animeListResults.innerHTML = '';

    results.forEach(anime => {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'search-result';
        resultDiv.innerHTML = `
            <h3>${anime.title}</h3>
            <p>Type: ${anime.type || 'N/A'}</p>
            <p>ID: ${anime.id}</p>
            <p>Episodes: ${anime.totalEpisodes || 'Unknown'}</p>
            <p>Score: ${anime.rating || 'N/A'}</p>
        `;
        resultDiv.onclick = () => {
            const malIdInput = document.getElementById('malId');
            if (malIdInput) malIdInput.value = anime.id;
            animeListResults.innerHTML = '';
            loadAnime();
        };
        animeListResults.appendChild(resultDiv);
    });
};

const loadAnime = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const animeId = urlParams.get('id') || document.getElementById('malId')?.value;
    if (!animeId) return;

    const malIdInput = document.getElementById('malId');
    if (malIdInput) malIdInput.value = animeId;

    currentEpisode = parseInt(urlParams.get('episode') || document.getElementById('episode')?.value) || 1;
    showLoading(true);
    clearError();

    try {
        const response = await fetch(`${API_BASE_URL}/meta/anilist/info/${animeId}`);
        if (!response.ok) throw new Error('Failed to load anime details');
        animeDetails = await response.json();
        totalEpisodes = animeDetails.totalEpisodes || 9999;  // Use 9999 if episodes are unknown
        currentEpisodeRange = Math.ceil(currentEpisode / 100);
        generateEpisodeNav();
        generateEpisodeButtons();
        updatePlayer();
        displayAnimeDetails();
    } catch (err) {
        console.error('Error loading anime:', err);
        showError('An error occurred while loading the anime. Please try again.');
    } finally {
        showLoading(false);
    }
};

// ... (keep the rest of your functions like generateEpisodeNav, generateEpisodeButtons, updatePlayer, etc.)

const displayTopAiring = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/meta/anilist/trending`);
        if (!response.ok) throw new Error('Failed to fetch top airing anime');
        const data = await response.json();
        displayHorizontalAnimeCards(data.results, 'topAiringContainer', 'Top Airing Anime');
    } catch (error) {
        console.error('Error fetching top airing anime:', error);
    }
};

const displayTopMovies = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/meta/anilist/advanced-search?format=MOVIE&sort=POPULARITY_DESC`);
        if (!response.ok) throw new Error('Failed to fetch top movies');
        const data = await response.json();
        displayHorizontalAnimeCards(data.results, 'topMoviesContainer', 'Top Anime Movies');
    } catch (error) {
        console.error('Error fetching top movies:', error);
    }
};

const displayTopTVSeries = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/meta/anilist/advanced-search?format=TV&sort=POPULARITY_DESC`);
        if (!response.ok) throw new Error('Failed to fetch top TV series');
        const data = await response.json();
        displayHorizontalAnimeCards(data.results, 'topTVSeriesContainer', 'Top TV Series');
    } catch (error) {
        console.error('Error fetching top TV series:', error);
    }
};

const displayGenres = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/meta/anilist/genre`);
        if (!response.ok) throw new Error('Failed to fetch genres');
        const genres = await response.json();
        displayGenreButtons(genres, 'genresContainer', 'Genres');
    } catch (error) {
        console.error('Error fetching genres:', error);
    }
};

const displayHorizontalAnimeCards = (animeList, containerId, title) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `<h2>${title}</h2><div class="anime-cards"></div>`;
    const cardsContainer = container.querySelector('.anime-cards');

    animeList.forEach(anime => {
        const card = document.createElement('div');
        card.className = 'anime-card';
        card.innerHTML = `
            <img src="${anime.image}" alt="${anime.title}">
            <h3>${anime.title}</h3>
            <p>${anime.releaseDate}</p>
        `;
        card.onclick = () => {
            window.location.href = `anime-list.html?id=${anime.id}&title=${encodeURIComponent(anime.title)}`;
        };
        cardsContainer.appendChild(card);
    });
};

const displayGenreButtons = (genres, containerId, title) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `<h2>${title}</h2><div class="genre-buttons"></div>`;
    const buttonsContainer = container.querySelector('.genre-buttons');

    genres.forEach(genre => {
        const button = document.createElement('button');
        button.textContent = genre;
        button.onclick = () => searchByGenre(genre);
        buttonsContainer.appendChild(button);
    });
};

const searchByGenre = async (genre) => {
    try {
        const response = await fetch(`${API_BASE_URL}/meta/anilist/advanced-search?genres=["${genre}"]&sort=POPULARITY_DESC`);
        if (!response.ok) throw new Error('Failed to search by genre');
        const data = await response.json();
        displaySearchResults(data.results);
    } catch (error) {
        console.error('Error searching by genre:', error);
        showError('An error occurred while searching by genre. Please try again.');
    }
};

// ... (keep your existing utility functions like showError, clearError, showLoading, etc.)
