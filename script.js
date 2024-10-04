let currentEpisode = 1;
let totalEpisodes = 0;
let animeDetails = null;
let currentEpisodeRange = 1;
let isFallbackMode = false;

document.addEventListener('DOMContentLoaded', function() {
    const prevEpisodeButton = document.getElementById('prevEpisode');
    const nextEpisodeButton = document.getElementById('nextEpisode');
    const fallbackButton = document.getElementById('fallbackButton');
    const searchInput = document.getElementById('searchInput');
    const animeListSearchInput = document.getElementById('animeListSearch');

    if (prevEpisodeButton) prevEpisodeButton.addEventListener('click', () => changeEpisode(-1));
    if (nextEpisodeButton) nextEpisodeButton.addEventListener('click', () => changeEpisode(1));
    if (fallbackButton) fallbackButton.addEventListener('click', toggleFallback);
    if (searchInput) searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            searchMAL();
        }
    });
    if (animeListSearchInput) animeListSearchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            searchAnimeList();
        }
    });

    const urlParams = new URLSearchParams(window.location.search);
    const malId = urlParams.get('id');
    const episode = urlParams.get('episode');
    if (malId) {
        const malIdInput = document.getElementById('malId');
        if (malIdInput) malIdInput.value = malId;
        currentEpisode = parseInt(episode) || 1;
        loadAnime();
    }
});

const searchMAL = async () => {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    const searchTerm = searchInput.value;
    showLoading(true);
    clearError();

    try {
        const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(searchTerm)}&limit=5`);
        if (!response.ok) throw new Error('Search failed');
        const data = await response.json();
        displaySearchResults(data.data);
    } catch (err) {
        showError('An error occurred while searching. Please try again.');
    } finally {
        showLoading(false);
    }
};

const searchAnimeList = async () => {
    const searchInput = document.getElementById('animeListSearch');
    if (!searchInput) return;

    const searchTerm = searchInput.value;
    showLoading(true);
    clearError();

    try {
        const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(searchTerm)}&limit=10`);
        if (!response.ok) throw new Error('Search failed');
        const data = await response.json();
        displayAnimeListResults(data.data);
    } catch (err) {
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
            <p>English Title: ${anime.title_english || 'N/A'}</p>
            <p>MAL ID: ${anime.mal_id}</p>
            <p>Episodes: ${anime.episodes || 'Unknown'}</p>
            <p>Score: ${anime.score || 'N/A'}</p>
        `;
        resultDiv.onclick = () => {
            window.location.href = `anime-list.html?id=${anime.mal_id}&title=${encodeURIComponent(anime.title)}`;
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
            <p>English Title: ${anime.title_english || 'N/A'}</p>
            <p>MAL ID: ${anime.mal_id}</p>
            <p>Episodes: ${anime.episodes || 'Unknown'}</p>
            <p>Score: ${anime.score || 'N/A'}</p>
        `;
        resultDiv.onclick = () => {
            const malIdInput = document.getElementById('malId');
            if (malIdInput) malIdInput.value = anime.mal_id;
            animeListResults.innerHTML = '';
            loadAnime();
        };
        animeListResults.appendChild(resultDiv);
    });
};

const loadAnime = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const malId = urlParams.get('id') || document.getElementById('malId')?.value;
    if (!malId) return;

    const malIdInput = document.getElementById('malId');
    if (malIdInput) malIdInput.value = malId;

    currentEpisode = parseInt(urlParams.get('episode') || document.getElementById('episode')?.value) || 1;
    showLoading(true);
    clearError();

    try {
        const response = await fetch(`https://api.jikan.moe/v4/anime/${malId}`);
        if (!response.ok) throw new Error('Failed to load anime details');
        const data = await response.json();
        animeDetails = data.data;
        totalEpisodes = animeDetails.episodes || 9999;  // Use 9999 if episodes are unknown
        currentEpisodeRange = Math.ceil(currentEpisode / 100);
        generateEpisodeNav();
        generateEpisodeButtons();
        updatePlayer();
        displayAnimeDetails();
    } catch (err) {
        showError('An error occurred while loading the anime. Please try again.');
    } finally {
        showLoading(false);
    }
};

const generateEpisodeNav = () => {
    const episodeNav = document.getElementById('episodeNav');
    if (!episodeNav) return;

    episodeNav.innerHTML = '';

    if (totalEpisodes > 100) {
        const prevButton = document.createElement('button');
        prevButton.innerHTML = '&laquo;';
        prevButton.onclick = () => changeEpisodeRange(-1);
        episodeNav.appendChild(prevButton);

        const rangeSpan = document.createElement('span');
        rangeSpan.id = 'currentRange';
        rangeSpan.textContent = `${(currentEpisodeRange - 1) * 100 + 1}-${Math.min(currentEpisodeRange * 100, totalEpisodes)}`;
        episodeNav.appendChild(rangeSpan);

        const nextButton = document.createElement('button');
        nextButton.innerHTML = '&raquo;';
        nextButton.onclick = () => changeEpisodeRange(1);
        episodeNav.appendChild(nextButton);
    }
};

const generateEpisodeButtons = () => {
    const episodeButtonsContainer = document.getElementById('episodeButtons');
    if (!episodeButtonsContainer) return;

    episodeButtonsContainer.innerHTML = '';

    const start = (currentEpisodeRange - 1) * 100 + 1;
    const end = Math.min(currentEpisodeRange * 100, totalEpisodes);

    for (let i = start; i <= end; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.classList.add('episode-button');
        if (i === currentEpisode) button.classList.add('current-episode');
        button.onclick = () => {
            currentEpisode = i;
            updatePlayer();
        };
        episodeButtonsContainer.appendChild(button);
    }
};

const updatePlayer = () => {
    const videoPlayer = document.getElementById('videoPlayer');
    const dubSubSelect = document.getElementById('dubSub');
    if (!videoPlayer || !dubSubSelect || !animeDetails) return;

    const dubSub = dubSubSelect.value;
    const url = `https://vidlink.pro/anime/${animeDetails.mal_id}/${currentEpisode}/${dubSub}${isFallbackMode ? '?fallback=true' : ''}`;

    videoPlayer.src = url;

    const episodeInput = document.getElementById('episode');
    if (episodeInput) episodeInput.value = currentEpisode;

    const episodeButtons = document.querySelectorAll('.episode-button');
    episodeButtons.forEach(button => {
        if (parseInt(button.textContent) === currentEpisode) {
            button.classList.add('current-episode');
        } else {
            button.classList.remove('current-episode');
        }
    });

    displayAnimeDetails();
};

const displayAnimeDetails = () => {
    const detailsDiv = document.getElementById('animeDetails');
    if (!detailsDiv || !animeDetails) return;

    detailsDiv.innerHTML = `
        <h2>Now Playing</h2>
        <p><strong>Title:</strong> ${animeDetails.title_english || animeDetails.title}; ${animeDetails.title_japanese}</p>
        <p><strong>MAL ID:</strong> ${animeDetails.mal_id}</p>
        <p><strong>Episode:</strong> ${currentEpisode}</p>
        <p><strong>Type:</strong> ${document.getElementById('dubSub')?.value || 'N/A'}</p>
        <p><strong>Year:</strong> ${animeDetails.year || 'N/A'}</p>
        <p><strong>Studios:</strong> ${animeDetails.studios.map(studio => studio.name).join(', ') || 'N/A'}</p>
        <p><strong>Genres:</strong> ${animeDetails.genres.map(genre => genre.name).join(', ') || 'N/A'}</p>
        <p><strong>Synopsis:</strong> ${animeDetails.synopsis || 'N/A'}</p>
    `;
};

const changeEpisode = (delta) => {
    const newEpisode = currentEpisode + delta;
    if (newEpisode >= 1 && newEpisode <= totalEpisodes) {
        currentEpisode = newEpisode;
        if (currentEpisode > currentEpisodeRange * 100) {
            changeEpisodeRange(1);
        } else if (currentEpisode <= (currentEpisodeRange - 1) * 100) {
            changeEpisodeRange(-1);
        }
        updatePlayer();
    }
};

const changeEpisodeRange = (delta) => {
    const newRange = currentEpisodeRange + delta;
    if (newRange >= 1 && (newRange - 1) * 100 < totalEpisodes) {
        currentEpisodeRange = newRange;
        generateEpisodeButtons();
        const currentRangeSpan = document.getElementById('currentRange');
        if (currentRangeSpan) {
            currentRangeSpan.textContent = `${(currentEpisodeRange - 1) * 100 + 1}-${Math.min(currentEpisodeRange * 100, totalEpisodes)}`;
        }
    }
};

const toggleFallback = () => {
    isFallbackMode = !isFallbackMode;
    const fallbackButton = document.getElementById('fallbackButton');
    if (fallbackButton) {
        fallbackButton.textContent = `Fallback: ${isFallbackMode ? 'On' : 'Off'}`;
        fallbackButton.classList.toggle('fallback-on', isFallbackMode);
    }
    updatePlayer();
};

const showError = (message) => {
    const errorElement = document.getElementById('error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
};

const clearError = () => {
    const errorElement = document.getElementById('error');
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
};

const showLoading = (isLoading) => {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        if (isLoading) {
            loadingElement.textContent = 'Loading...';
            loadingElement.style.display = 'block';
        } else {
            loadingElement.textContent = '';
            loadingElement.style.display = 'none';
        }
    }
};