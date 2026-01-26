
// Auth State Management

export function isLoggedIn() {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    return token !== null && user !== null;
}

export function getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

export function saveTokens(newAccessToken, newRefreshToken) {
    localStorage.setItem('access_token', newAccessToken);
    localStorage.setItem('refresh_token', newRefreshToken);
}

export function saveUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

export function getCurrentUser() {
    return JSON.parse(localStorage.getItem('user') || 'null');
}

export function clearAuthData() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
}

export async function handleAuthError(response, showLoginCallback) {
    if (response.status === 401) {
        clearAuthData();
        if (showLoginCallback) showLoginCallback();
        return true;
    }
    return false;
}
