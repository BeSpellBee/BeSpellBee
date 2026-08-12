// ============================================
// SHARED TRACKING CODE - Include on ALL pages
// ============================================

const TRACKING_API = 'https://bespellbee-backend-en6l.onrender.com/api';
const authToken = localStorage.getItem('authToken');
const sessionId = localStorage.getItem('sessionId') || generateSessionId();
let currentPage = 'home';
let pageStartTime = Date.now();
let isTrackingEnabled = !!authToken;

function generateSessionId() {
    const id = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sessionId', id);
    return id;
}

function getHeaders() {
    return {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'X-Session-Id': sessionId
    };
}

function trackActivity(action, data = {}) {
    if (!isTrackingEnabled || !authToken) return;

    const duration = Math.floor((Date.now() - pageStartTime) / 1000);
    pageStartTime = Date.now();

    fetch(`${TRACKING_API}/track/page-view`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
            page: document.title || 'BeSpellBee',
            url: window.location.href,
            duration: duration,
            action: action,
            ...data
        })
    }).catch(() => {});
}

// ============================================
// TRACK LINK CLICKS - Paste this on all pages
// ============================================

function trackLink(linkName) {
    if (isTrackingEnabled) {
        const duration = Math.floor((Date.now() - pageStartTime) / 1000);
        pageStartTime = Date.now();

        trackActivity('link_click', {
            link: linkName,
            destination: linkName.toLowerCase().replace(' ', '-') + '.html',
            duration: duration
        });
    }
}

// ============================================
// PAGE VIEW ON LOAD - Paste this on all pages
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (isTrackingEnabled) {
            trackActivity('page_view', {
                page: document.title || 'BeSpellBee',
                url: window.location.href
            });
        }
    }, 1000);
});
