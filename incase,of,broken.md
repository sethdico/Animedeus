<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Animedeus</title>
    <style>
        :root {
            --primary-color: #B20710;
            --secondary-color: #1E1E1E;
            --background-color: #121212;
            --text-color: #E0E0E0;
            --button-color: #2A2A2A;
            --button-hover-color: #B20710;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Roboto', Arial, sans-serif;
            background-color: var(--background-color);
            color: var(--text-color);
            line-height: 1.6;
        }

        .container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
        }

        h1, h2 {
            text-align: center;
            color: var(--primary-color);
            margin: 20px 0;
        }

        .video-container {
            position: relative;
            width: 100%;
            padding-top: 56.25%;
            margin-bottom: 20px;
        }

        .video-container iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: 2px solid var(--primary-color);
            border-radius: 8px;
        }

        .controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .episode-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            justify-content: center;
            margin-bottom: 20px;
        }

        button {
            background-color: var(--button-color);
            color: var(--text-color);
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s;
        }

        button:hover {
            background-color: var(--button-hover-color);
        }

        .episode-button {
            width: 40px;
            height: 40px;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .current-episode {
            background-color: var(--primary-color);
        }

        input, select {
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
            background-color: var(--secondary-color);
            color: var(--text-color);
            border: 1px solid var(--button-color);
            border-radius: 5px;
        }

        .search-results {
            background-color: var(--secondary-color);
            border-radius: 5px;
            margin-top: 10px;
            max-height: 200px;
            overflow-y: auto;
        }

        .search-result {
            padding: 10px;
            cursor: pointer;
            transition: background-color 0.3s;
        }

        .search-result:hover {
            background-color: var(--button-hover-color);
        }

        .anime-details {
            background-color: var(--secondary-color);
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
        }

        .error {
            color: var(--primary-color);
            text-align: center;
            margin-top: 20px;
        }

        .loading {
            text-align: center;
            margin-top: 20px;
        }

        .alternative-link {
            text-align: center;
            margin-top: 20px;
        }

        .alternative-link a {
            color: var(--primary-color);
            text-decoration: none;
        }

        .alternative-link a:hover {
            text-decoration: underline;
        }

        .creator-info {
            text-align: center;
            margin-top: 10px;
            font-size: 0.9em;
            color: var(--text-color);
        }

        .episode-nav {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 10px;
        }

        .episode-nav button {
            background-color: transparent;
            border: none;
            color: var(--text-color);
            font-size: 24px;
            cursor: pointer;
            padding: 0 10px;
        }

        .episode-nav span {
            margin: 0 10px;
        }

        .fallback-on {
            background-color: var(--primary-color);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Animedeus</h1>
        <div id="left"> </div>

        <div class="video-container">
            <iframe id="videoPlayer" allowfullscreen></iframe>
        </div>

        <div class="controls">
            <button id="prevEpisode">Previous</button>
            <button id="fallbackButton">Fallback: Off</button>
            <button id="nextEpisode">Next</button>
        </div>

        <div id="episodeNav" class="episode-nav"></div>
        <div id="episodeButtons" class="episode-buttons"></div>

        <input type="text" id="searchInput" placeholder="Search anime">
        <button onclick="searchMAL()">Search</button>
        <div id="searchResults" class="search-results"></div>

        <input type="text" id="malId" placeholder="MAL ID">
        <input type="number" id="episode" placeholder="Episode">
        <select id="dubSub">
            <option value="sub">Sub</option>
            <option value="dub">Dub</option>
        </select>
        <button onclick="loadAnime()">Load Anime</button>

        <div id="animeDetails" class="anime-details"></div>

        <div id="error" class="error"></div>
        <div id="loading" class="loading"></div>

        <div class="alternative-link">
            <a href="https://kuroiru.co" target="_blank">If error, you can use this website: kuroiru.co</a>
        </div>
        <div class="creator-info">
            made by <a href="https://github.com/sethdico" target="_blank">https://github.com/sethdico</a> aka amadeus
        </div>
    </div>

    <script>
        let currentEpisode = 1;
        let totalEpisodes = 0;
        let animeDetails = null;
        let currentEpisodeRange = 1;
        let isFallbackMode = false;

        const searchMAL = async () => {
            const searchTerm = document.getElementById('searchInput').value;
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

        const displaySearchResults = (results) => {
            const searchResults = document.getElementById('searchResults');
            searchResults.innerHTML = '';

            results.forEach(anime => {
                const resultDiv = document.createElement('div');
                resultDiv.className = 'search-result';
                resultDiv.textContent = `${anime.title} (${anime.title_english || anime.title}) (ID: ${anime.mal_id})`;
                resultDiv.onclick = () => {
                    document.getElementById('malId').value = anime.mal_id;
                    document.getElementById('searchInput').value = anime.title;
                    searchResults.innerHTML = '';
                };
                searchResults.appendChild(resultDiv);
            });
        };

        const loadAnime = async () => {
            const malId = document.getElementById('malId').value;
            currentEpisode = parseInt(document.getElementById('episode').value) || 1;
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

        const changeEpisodeRange = (delta) => {
            const newRange = currentEpisodeRange + delta;
            if (newRange >= 1 && (newRange - 1) * 100 < totalEpisodes) {
                currentEpisodeRange = newRange;
                generateEpisodeButtons();
                document.getElementById('currentRange').textContent = 
                    `${(currentEpisodeRange - 1) * 100 + 1}-${Math.min(currentEpisodeRange * 100, totalEpisodes)}`;
            }
        };

        const generateEpisodeButtons = () => {
            const episodeButtonsContainer = document.getElementById('episodeButtons');
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
            const dubSub = document.getElementById('dubSub').value;
            const videoPlayer = document.getElementById('videoPlayer');
            const url = `https://vidlink.pro/anime/${animeDetails.mal_id}/${currentEpisode}/${dubSub}${isFallbackMode ? '?fallback=true' : ''}`;
            
            videoPlayer.src = url;

            document.getElementById('episode').value = currentEpisode;

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
            detailsDiv.innerHTML = `
                <h2>Now Playing</h2>
                <p><strong>Title:</strong> ${animeDetails.title_english}; ${animeDetails.title_japanese}</p>
                <p><strong>MAL ID:</strong> ${animeDetails.mal_id}</p>
                <p><strong>Episode:</strong> ${currentEpisode}</p>
                <p><strong>Type:</strong> ${document.getElementById('dubSub').value}</p>
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

        const toggleFallback = () => {
            isFallbackMode = !isFallbackMode;
            const fallbackButton = document.getElementById('fallbackButton');
            fallbackButton.textContent = `Fallback: ${isFallbackMode ? 'On' : 'Off'}`;
            fallbackButton.classList.toggle('fallback-on', isFallbackMode);
            updatePlayer();
        };

        document.getElementById('prevEpisode').addEventListener('click', () => changeEpisode(-1));
        document.getElementById('nextEpisode').addEventListener('click', () => changeEpisode(1));
        document.getElementById('fallbackButton').addEventListener('click', toggleFallback);

        const showError = (message) => {
            document.getElementById('error').textContent = message;
        };

        const clearError = () => {
            document.getElementById('error').textContent = '';
        };

        const showLoading = (isLoading) => {
            document.getElementById('loading').textContent = isLoading ? 'Loading...' : '';
        };
    </script>
</body>
</html>
