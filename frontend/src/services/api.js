import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://fantasy-rugby-league-amber.vercel.app';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth
export const signup = (username, password, teamName) =>
    api.post('/api/auth/signup', { username, password, teamName });

export const login = (username, password) =>
    api.post('/api/auth/login', { username, password });

export const getCurrentUser = () =>
    api.get('/api/auth/me');

export const changePassword = (currentPassword, newPassword) =>
    api.put('/api/auth/change-password', { currentPassword, newPassword });

export const changeTeamName = (teamName) =>
    api.put('/api/auth/change-team-name', { teamName });

// Players
export const getPlayers = (filters = {}) => {
    // Handle multi-word positions by encoding them properly
    const params = new URLSearchParams();
    
    if (filters.team) params.append('team', filters.team);
    if (filters.position) params.append('position', filters.position);
    if (filters.search) params.append('search', filters.search);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.page) params.append('page', filters.page);
    if (filters.pageSize) params.append('pageSize', filters.pageSize);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    
    return api.get(`/api/players?${params.toString()}`);
};

export const getPlayer = (id) =>
    api.get(`/api/players/${id}`);

export const getTeams = () =>
    api.get('/api/players/teams/all');

export const getPositions = () =>
    api.get('/api/players/positions/all');

// Team Management
export const getMyTeam = () =>
    api.get('/api/teams/my-team');

export const selectTeam = (starters, bench, captainId) =>
    api.post('/api/teams/select', { starters, bench, captainId });

export const getTeamHistory = () =>
    api.get('/api/teams/history');

export const getUserTeam = (userId) =>
    api.get(`/api/teams/user/${userId}`);

// Transfers
export const getAvailableTransfers = () =>
    api.get('/api/transfers/available');

export const makeTransfer = (playerOutId, playerInId) =>
    api.post('/api/transfers/make', { playerOutId, playerInId });

export const getTransferHistory = () =>
    api.get('/api/transfers/history');

// Leagues
export const createLeague = (name) =>
    api.post('/api/leagues/create', { name });

export const joinLeague = (code) =>
    api.post('/api/leagues/join', { code });

export const getMyLeagues = () =>
    api.get('/api/leagues/my-leagues');

export const getLeagueStandings = (leagueId) =>
    api.get(`/api/leagues/${leagueId}/standings`);

export const getOverallStandings = (page = 1) =>
    api.get('/api/leagues/overall/standings', { params: { page } });

// Gameweeks
export const getGameweeks = () =>
    api.get('/api/gameweeks');

export const getCurrentGameweek = () =>
    api.get('/api/gameweeks/current');

// Admin
export const getAllUsers = () =>
    api.get('/api/admin/users');

export const resetUserPassword = (userId, newPassword) =>
    api.post(`/api/admin/users/${userId}/reset-password`, { newPassword });

export const getAllPlayersAdmin = (page = 1) =>
    api.get('/api/admin/players', { params: { page } });

export const updatePlayerPrice = (playerId, price) =>
    api.put(`/api/admin/players/${playerId}`, { price });

export const getScoringSystem = () =>
    api.get('/api/admin/scoring');

export const updateScoringSystem = (scoring) =>
    api.put('/api/admin/scoring', { scoring });

export const createGameweek = (roundNumber, deadline) =>
    api.post('/api/admin/gameweeks', { roundNumber, deadline });

export const setCurrentGameweek = (gameweekId) =>
    api.put(`/api/admin/gameweeks/${gameweekId}/set-current`);

export default api;