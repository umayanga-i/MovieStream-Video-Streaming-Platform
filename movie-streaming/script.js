// ===== CONFIGURATION =====
// Backend API Configuration
const BACKEND_API_URL = 'http://localhost:8080/api';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_URL = 'https://image.tmdb.org/t/p/original';

// ===== STATE MANAGEMENT =====
let state = {
    currentPage: 1,
    totalPages: 1,
    currentCategory: 'trending',
    searchQuery: '',
    selectedGenre: '',
    selectedRating: '',
    selectedYear: '',
    sortBy: 'popularity.desc',
    favorites: [],
    genres: [],
    allYears: [],
    isAuthenticated: !!localStorage.getItem('jwt_token'),
    userId: localStorage.getItem('user_id'),
    username: localStorage.getItem('username'),
    jwtToken: localStorage.getItem('jwt_token'),
};

// ===== ELEMENTS =====
const elements = {
    moviesGrid: document.getElementById('moviesGrid'),
    loading: document.getElementById('loading'),
    pagination: document.getElementById('pagination'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    pageNumber: document.getElementById('pageNumber'),
    totalPages: document.getElementById('totalPages'),
    searchInput: document.getElementById('searchInput'),
    movieModal: document.getElementById('movieModal'),
    modalOverlay: document.getElementById('modalOverlay'),
    closeModal: document.getElementById('closeModal'),
    modalContent: document.getElementById('movieModal').querySelector('.modal-content'),
    genreFilter: document.getElementById('genreFilter'),
    ratingFilter: document.getElementById('ratingFilter'),
    yearFilter: document.getElementById('yearFilter'),
    sortFilter: document.getElementById('sortFilter'),
    resetBtn: document.getElementById('resetBtn'),
    navItems: document.querySelectorAll('.nav-item'),
    favoriteBtn: document.getElementById('favoriteBtn'),
    favoritesModal: document.getElementById('favoritesModal'),
    closeFavoritesModal: document.getElementById('closeFavoritesModal'),
    favoritesList: document.getElementById('favoritesList'),
    favoritesOverlay: document.getElementById('favoritesOverlay'),
    hero: document.getElementById('hero'),
    heroTitle: document.getElementById('heroTitle'),
    heroDescription: document.getElementById('heroDescription'),
    heroRating: document.getElementById('heroRating'),
    heroYear: document.getElementById('heroYear'),
    heroGenre: document.getElementById('heroGenre'),
};

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', async () => {
    await loadGenres();
    await loadYears();
    await loadMovies();
    setupEventListeners();
    updateFavoriteCount();
    updateAuthUI();
    if (state.isAuthenticated) {
        await loadWatchlistFromServer();
    }
});

function setupEventListeners() {
    // Navigation
    elements.navItems.forEach(item => {
        item.addEventListener('click', () => {
            elements.navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            state.currentCategory = item.dataset.category;
            state.currentPage = 1;
            loadMovies();
        });
    });

    // Search
    elements.searchInput.addEventListener('input', debounce(() => {
        state.searchQuery = elements.searchInput.value;
        state.currentPage = 1;
        loadMovies();
    }, 500));

    // Filters
    elements.genreFilter.addEventListener('change', () => {
        state.selectedGenre = elements.genreFilter.value;
        state.currentPage = 1;
        loadMovies();
    });

    elements.ratingFilter.addEventListener('change', () => {
        state.selectedRating = elements.ratingFilter.value;
        state.currentPage = 1;
        loadMovies();
    });

    elements.yearFilter.addEventListener('change', () => {
        state.selectedYear = elements.yearFilter.value;
        state.currentPage = 1;
        loadMovies();
    });

    elements.sortFilter.addEventListener('change', () => {
        state.sortBy = elements.sortFilter.value;
        state.currentPage = 1;
        loadMovies();
    });

    // Reset filters
    elements.resetBtn.addEventListener('click', () => {
        state.selectedGenre = '';
        state.selectedRating = '';
        state.selectedYear = '';
        state.sortBy = 'popularity.desc';
        state.searchQuery = '';
        elements.genreFilter.value = '';
        elements.ratingFilter.value = '';
        elements.yearFilter.value = '';
        elements.sortFilter.value = 'popularity.desc';
        elements.searchInput.value = '';
        state.currentPage = 1;
        loadMovies();
    });

    // Pagination
    elements.prevBtn.addEventListener('click', () => {
        if (state.currentPage > 1) {
            state.currentPage--;
            loadMovies();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    elements.nextBtn.addEventListener('click', () => {
        if (state.currentPage < state.totalPages) {
            state.currentPage++;
            loadMovies();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    // Modal
    elements.closeModal.addEventListener('click', () => {
        elements.movieModal.classList.remove('active');
    });

    elements.modalOverlay.addEventListener('click', () => {
        elements.movieModal.classList.remove('active');
    });

    elements.modalContent.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Favorites
    elements.favoriteBtn.addEventListener('click', () => {
        if (!state.isAuthenticated) {
            alert('Please login to view your favorites!');
            document.getElementById('loginModal').classList.add('active');
            return;
        }
        elements.favoritesModal.classList.add('active');
        displayFavorites();
    });

    elements.closeFavoritesModal.addEventListener('click', () => {
        elements.favoritesModal.classList.remove('active');
    });

    elements.favoritesOverlay.addEventListener('click', () => {
        elements.favoritesModal.classList.remove('active');
    });

    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target === elements.modalOverlay) {
            elements.movieModal.classList.remove('active');
        }
        if (e.target === elements.favoritesOverlay) {
            elements.favoritesModal.classList.remove('active');
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            elements.movieModal.classList.remove('active');
            elements.favoritesModal.classList.remove('active');
            document.getElementById('loginModal').classList.remove('active');
            document.getElementById('registerModal').classList.remove('active');
        }
    });

    // Authentication buttons
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const closeLoginModal = document.getElementById('closeLoginModal');
    const closeRegisterModal = document.getElementById('closeRegisterModal');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToLogin = document.getElementById('switchToLogin');
    const loginOverlay = document.getElementById('loginOverlay');
    const registerOverlay = document.getElementById('registerOverlay');

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            loginModal.classList.add('active');
        });
    }

    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            registerModal.classList.add('active');
        });
    }

    if (closeLoginModal) {
        closeLoginModal.addEventListener('click', () => {
            loginModal.classList.remove('active');
        });
    }

    if (closeRegisterModal) {
        closeRegisterModal.addEventListener('click', () => {
            registerModal.classList.remove('active');
        });
    }

    if (loginOverlay) {
        loginOverlay.addEventListener('click', () => {
            loginModal.classList.remove('active');
        });
    }

    if (registerOverlay) {
        registerOverlay.addEventListener('click', () => {
            registerModal.classList.remove('active');
        });
    }

    if (switchToRegister) {
        switchToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.classList.remove('active');
            registerModal.classList.add('active');
        });
    }

    if (switchToLogin) {
        switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            registerModal.classList.remove('active');
            loginModal.classList.add('active');
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logout();
            updateAuthUI();
            alert('Logged out successfully!');
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            const errorDiv = document.getElementById('loginError');
            
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';

            const result = await login(username, password);
            if (result.success) {
                loginModal.classList.remove('active');
                updateAuthUI();
                loginForm.reset();
                alert('Login successful!');
            } else {
                errorDiv.textContent = result.message;
                errorDiv.style.display = 'block';
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('registerUsername').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const errorDiv = document.getElementById('registerError');
            
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';

            const result = await register(username, email, password);
            if (result.success) {
                registerModal.classList.remove('active');
                updateAuthUI();
                registerForm.reset();
                alert('Registration successful!');
            } else {
                errorDiv.textContent = result.message;
                errorDiv.style.display = 'block';
            }
        });
    }
}

// ===== API CALLS =====
async function loadMovies() {
    try {
        elements.loading.classList.add('active');
        elements.moviesGrid.innerHTML = '';

        let url = `${BACKEND_API_URL}/movies`;
        
        if (state.searchQuery) {
            url = `${BACKEND_API_URL}/movies/search?query=${encodeURIComponent(state.searchQuery)}&page=${state.currentPage}`;
        } else {
            url = `${url}/${state.currentCategory}?page=${state.currentPage}`;
            
            // Add filters
            let hasFilters = false;
            let filterParams = [];
            
            if (state.selectedGenre) {
                filterParams.push(`genre=${state.selectedGenre}`);
                hasFilters = true;
            }
            if (state.selectedRating) {
                filterParams.push(`rating=${state.selectedRating}`);
                hasFilters = true;
            }
            if (state.selectedYear) {
                filterParams.push(`year=${state.selectedYear}`);
                hasFilters = true;
            }
            
            if (hasFilters) {
                url = `${BACKEND_API_URL}/movies/filter?category=${state.currentCategory}&page=${state.currentPage}&${filterParams.join('&')}`;
            }
        }

        const response = await fetch(url);
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            elements.moviesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">No movies found. Try adjusting your filters.</p>';
        } else {
            data.results.forEach((movie, index) => {
                if (movie.poster_path) {
                    const movieCard = createMovieCard(movie);
                    elements.moviesGrid.appendChild(movieCard);
                }
            });

            // Set hero movie
            if (data.results[0]) {
                setHeroMovie(data.results[0]);
            }
        }

        state.totalPages = data.total_pages > 500 ? 500 : data.total_pages;
        updatePagination();

        elements.loading.classList.remove('active');
    } catch (error) {
        console.error('Error loading movies:', error);
        elements.loading.classList.remove('active');
        elements.moviesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ff6b6b;">Failed to load movies. Please try again.</p>';
    }
}

async function loadGenres() {
    try {
        const response = await fetch(`${BACKEND_API_URL}/movies/genres`);
        const data = await response.json();
        state.genres = data.genres || [];

        // Populate genre filter
        (state.genres || []).forEach(genre => {
            const option = document.createElement('option');
            option.value = genre.id;
            option.textContent = genre.name;
            elements.genreFilter.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading genres:', error);
    }
}

async function loadYears() {
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 1980; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        elements.yearFilter.appendChild(option);
    }
}

async function getMovieDetails(movieId) {
    try {
        const response = await fetch(`${BACKEND_API_URL}/movies/details/${movieId}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching movie details:', error);
    }
}

// ===== AUTHENTICATION =====
async function login(username, password) {
    try {
        const response = await fetch(`${BACKEND_API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        
        console.log('Login response:', data);
        
        if (data.success === true || data.success === "true") {
            // Store token and user info
            localStorage.setItem('jwt_token', data.token);
            localStorage.setItem('user_id', data.userId);
            localStorage.setItem('username', username);
            
            state.isAuthenticated = true;
            state.jwtToken = data.token;
            state.userId = data.userId;
            state.username = username;
            
            // Load watchlist from server
            await loadWatchlistFromServer();
            
            return { success: true, message: 'Login successful' };
        } else {
            return { success: false, message: data.message || 'Login failed' };
        }
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Login failed: ' + error.message };
    }
}

async function register(username, email, password) {
    try {
        const response = await fetch(`${BACKEND_API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        const data = await response.json();
        
        console.log('Register response:', data);
        
        if (data.success === true || data.success === "true") {
            // Store token and user info
            localStorage.setItem('jwt_token', data.token);
            localStorage.setItem('user_id', data.userId);
            localStorage.setItem('username', username);
            
            state.isAuthenticated = true;
            state.jwtToken = data.token;
            state.userId = data.userId;
            state.username = username;
            
            return { success: true, message: 'Registration successful' };
        } else {
            return { success: false, message: data.message || 'Registration failed' };
        }
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, message: 'Registration failed: ' + error.message };
    }
}

function logout() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    
    state.isAuthenticated = false;
    state.jwtToken = null;
    state.userId = null;
    state.username = null;
    state.favorites = [];
}

async function loadWatchlistFromServer() {
    if (!state.isAuthenticated || !state.jwtToken) return;
    
    try {
        const response = await fetch(`${BACKEND_API_URL}/watchlist`, {
            headers: {
                'Authorization': `Bearer ${state.jwtToken}`
            }
        });
        const data = await response.json();
        
        if (data.success === "true" && Array.isArray(data.data)) {
            state.favorites = data.data.map(item => ({
                id: item.movieId,
                title: item.movieTitle,
                poster_path: item.moviePosterPath,
                vote_average: item.movieRating,
                release_date: item.releaseDate
            }));
            updateFavoriteCount();
        }
    } catch (error) {
        console.error('Error loading watchlist:', error);
    }
}

function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const userGreeting = document.getElementById('userGreeting');

    if (state.isAuthenticated) {
        if (authButtons) authButtons.style.display = 'none';
        if (userMenu) {
            userMenu.style.display = 'flex';
            if (userGreeting) userGreeting.textContent = `Welcome, ${state.username}!`;
        }
    } else {
        if (authButtons) authButtons.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
    }
}

// ===== UTILITY FUNCTIONS =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== UI CREATION =====
function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';

    const posterUrl = movie.poster_path ? `${IMG_URL}${movie.poster_path}` : 'https://via.placeholder.com/220x330?text=No+Image';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';

    const isFavorite = state.favorites.some(fav => fav.id === movie.id);

    card.innerHTML = `
        <div class="movie-poster">
            <img src="${posterUrl}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/220x330?text=No+Image'">
            <div class="movie-overlay">
                <div class="overlay-buttons">
                    <button class="overlay-btn play-btn" title="Watch Trailer">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="overlay-btn favorite-card-btn" title="Add to Favorites">
                        <i class="fas fa-${isFavorite ? 'bookmark' : 'bookmark'}"></i>
                    </button>
                    <button class="overlay-btn info-btn" title="More Info">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </div>
            </div>
        </div>
        <div class="movie-info">
            <h3 class="movie-title">${movie.title}</h3>
            <div class="movie-meta">
                <span class="movie-rating">
                    <i class="fas fa-star"></i> ${rating}
                </span>
                <span>${year}</span>
            </div>
            <span class="movie-badge">${movie.media_type === 'tv' ? 'TV' : 'Movie'}</span>
        </div>
    `;

    // Event listeners
    card.querySelector('.info-btn').addEventListener('click', () => showMovieDetails(movie.id));
    card.querySelector('.play-btn').addEventListener('click', () => playTrailer(movie.id));
    card.querySelector('.favorite-card-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(movie);
        updateFavoriteButton(card, movie);
    });

    return card;
}

function updateFavoriteButton(card, movie) {
    const isFavorite = state.favorites.some(fav => fav.id === movie.id);
    const btn = card.querySelector('.favorite-card-btn');
    btn.innerHTML = `<i class="fas fa-${isFavorite ? 'bookmark' : 'bookmark'}"></i>`;
}

async function showMovieDetails(movieId) {
    try {
        const movie = await getMovieDetails(movieId);

        // Fill modal
        document.getElementById('modalTitle').textContent = movie.title;
        document.getElementById('modalDescription').textContent = movie.overview;
        document.getElementById('modalYear').textContent = new Date(movie.release_date).getFullYear();
        document.getElementById('modalDuration').textContent = movie.runtime ? `${movie.runtime} min` : 'N/A';
        document.getElementById('modalRating').textContent = `${movie.vote_average.toFixed(1)}/10`;
        document.getElementById('modalRatingPercent').textContent = `${Math.round(movie.vote_average * 10)}%`;
        document.getElementById('modalPopularityPercent').textContent = `${Math.round(Math.min(movie.popularity, 100))}%`;

        // Rating bar
        const ratingWidth = (movie.vote_average / 10) * 100;
        document.getElementById('modalRatingBar').style.width = `${ratingWidth}%`;

        // Popularity bar
        const popularityWidth = Math.min(movie.popularity, 100);
        document.getElementById('modalPopularityBar').style.width = `${popularityWidth}%`;

        // Poster
        const posterUrl = movie.poster_path ? `${IMG_URL}${movie.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image';
        document.getElementById('modalPoster').src = posterUrl;

        // Genres
        const genresHtml = movie.genres.map(genre => `<span class="genre-tag">${genre.name}</span>`).join('');
        document.getElementById('modalGenres').innerHTML = genresHtml;

        // Cast
        const castHtml = movie.credits.cast.slice(0, 8).map(actor => `
            <div class="cast-member">
                <img src="${actor.profile_path ? `${IMG_URL}${actor.profile_path}` : 'https://via.placeholder.com/70x100?text=No+Image'}" 
                     alt="${actor.name}" class="cast-avatar" onerror="this.src='https://via.placeholder.com/70x100?text=No+Image'">
                <p class="cast-name">${actor.name}</p>
            </div>
        `).join('');

        const castSection = document.getElementById('modalCast');
        if (castHtml) {
            castSection.innerHTML = `<div class="cast-title">Cast</div><div class="cast-list">${castHtml}</div>`;
        } else {
            castSection.innerHTML = '';
        }

        // Buttons
        document.getElementById('modalPlayBtn').onclick = () => playTrailer(movieId);
        
        const isFavorite = state.favorites.some(fav => fav.id === movie.id);
        document.getElementById('modalFavoriteBtn').textContent = isFavorite ? '✓ In Favorites' : '+ Add to Favorites';
        document.getElementById('modalFavoriteBtn').onclick = () => {
            toggleFavorite(movie);
            document.getElementById('modalFavoriteBtn').textContent = state.favorites.some(fav => fav.id === movie.id) ? '✓ In Favorites' : '+ Add to Favorites';
            updateFavoriteCount();
        };

        elements.movieModal.classList.add('active');
    } catch (error) {
        console.error('Error showing movie details:', error);
    }
}

function setHeroMovie(movie) {
    const backdropUrl = movie.backdrop_path ? `${BACKDROP_URL}${movie.backdrop_path}` : '';
    elements.hero.style.backgroundImage = `linear-gradient(135deg, rgba(34, 31, 31, 0.9) 0%, rgba(229, 9, 20, 0.2) 100%), url('${backdropUrl}')`;
    elements.heroTitle.textContent = movie.title;
    elements.heroDescription.textContent = movie.overview.substring(0, 150) + '...';
    elements.heroRating.textContent = `${movie.vote_average.toFixed(1)}/10`;
    elements.heroYear.textContent = new Date(movie.release_date).getFullYear();

    // Get genres
    if (state.genres.length > 0 && movie.genre_ids) {
        const genreNames = movie.genre_ids
            .map(id => state.genres.find(g => g.id === id)?.name)
            .filter(Boolean)
            .slice(0, 3)
            .join(', ');
        elements.heroGenre.textContent = genreNames || 'N/A';
    }

    document.getElementById('playBtn').onclick = () => playTrailer(movie.id);
    document.getElementById('infoBtn').onclick = () => showMovieDetails(movie.id);
}

function playTrailer(movieId) {
    alert('🎬 Trailer playback feature would launch here!\n\nIn a production app, this would:\n- Fetch the movie trailer video\n- Open a video player\n- Display high-quality streaming');
}

function updatePagination() {
    elements.pageNumber.textContent = state.currentPage;
    elements.totalPages.textContent = state.totalPages;
    elements.prevBtn.disabled = state.currentPage === 1;
    elements.nextBtn.disabled = state.currentPage === state.totalPages;
}

function toggleFavorite(movie) {
    if (!state.isAuthenticated) {
        alert('Please login to add movies to your favorites!');
        document.getElementById('loginModal').classList.add('active');
        return;
    }

    const index = state.favorites.findIndex(fav => fav.id === movie.id);
    if (index > -1) {
        removeFromWatchlist(movie.id);
    } else {
        addToWatchlist(movie);
    }
}

async function addToWatchlist(movie) {
    try {
        const response = await fetch(`${BACKEND_API_URL}/watchlist/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.jwtToken}`
            },
            body: JSON.stringify({
                movieId: movie.id,
                movieTitle: movie.title,
                moviePosterPath: movie.poster_path,
                movieRating: movie.vote_average,
                releaseDate: movie.release_date
            })
        });
        const data = await response.json();
        if (data.success === "true") {
            // Add to local favorites
            state.favorites.push({
                id: movie.id,
                title: movie.title,
                poster_path: movie.poster_path,
                vote_average: movie.vote_average,
                release_date: movie.release_date,
            });
            updateFavoriteCount();
        }
    } catch (error) {
        console.error('Error adding to watchlist:', error);
    }
}

async function removeFromWatchlist(movieId) {
    try {
        const response = await fetch(`${BACKEND_API_URL}/watchlist/remove/${movieId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${state.jwtToken}`
            }
        });
        const data = await response.json();
        if (data.success === "true") {
            // Remove from local favorites
            const index = state.favorites.findIndex(fav => fav.id === movieId);
            if (index > -1) {
                state.favorites.splice(index, 1);
            }
            updateFavoriteCount();
        }
    } catch (error) {
        console.error('Error removing from watchlist:', error);
    }
}

function updateFavoriteCount() {
    document.getElementById('favoriteCount').textContent = state.favorites.length;
}

function displayFavorites() {
    if (state.favorites.length === 0) {
        elements.favoritesList.innerHTML = '<p class="empty-message">No favorites yet. Add your favorite movies!</p>';
        return;
    }

    const favoritesHtml = state.favorites.map(movie => {
        const posterUrl = movie.poster_path ? `${IMG_URL}${movie.poster_path}` : 'https://via.placeholder.com/220x330?text=No+Image';
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

        return `
            <div class="movie-card">
                <div class="movie-poster">
                    <img src="${posterUrl}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/220x330?text=No+Image'">
                    <div class="movie-overlay">
                        <div class="overlay-buttons">
                            <button class="overlay-btn" onclick="removeFavorite(${movie.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                            <button class="overlay-btn" onclick="showMovieDetails(${movie.id})">
                                <i class="fas fa-info-circle"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="movie-info">
                    <h3 class="movie-title">${movie.title}</h3>
                    <div class="movie-meta">
                        <span class="movie-rating">
                            <i class="fas fa-star"></i> ${rating}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    elements.favoritesList.innerHTML = favoritesHtml;
}

async function removeFavorite(movieId) {
    if (state.isAuthenticated && state.jwtToken) {
        await removeFromWatchlist(movieId);
        displayFavorites();
    }
}

// ===== UTILITIES =====
function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

// ===== ERROR HANDLING =====
window.addEventListener('error', (error) => {
    console.error('Global error:', error);
});

// Allow these functions to be called from HTML
window.showMovieDetails = showMovieDetails;
window.playTrailer = playTrailer;
window.removeFavorite = removeFavorite;
