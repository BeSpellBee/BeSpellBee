// ============================================
// SHARED TRACKING CODE - Include on ALL pages
// ============================================

const TRACKING_API = 'https://bespellbee-backend-en6l.onrender.com/api';
const authToken = localStorage.getItem('authToken');
const sessionId = localStorage.getItem('sessionId') || generateSessionId();
let currentPage = 'home';
let pageStartTime = Date.now();
let isTrackingEnabled = !!authToken;

console.log('✅ tracking.js loaded!');

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

// ============================================
// PAGE VIEW TRACKING
// ============================================

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
// DEDICATED LINK CLICK TRACKING
// ============================================

// ============================================
// DEDICATED LINK CLICK TRACKING (FIXED)
// ============================================

function trackLink(elementOrName, event) {
    if (!isTrackingEnabled || !authToken) {
        console.log('🔒 Not logged in - link tracking skipped');
        return;
    }

    let linkName = '';
    let destination = '';

    // If an HTML element was passed (e.g. onclick="trackLink(this, event)")
    if (elementOrName instanceof HTMLElement) {
        linkName = elementOrName.innerText.trim();
        destination = elementOrName.getAttribute('href') || '';
    } else {
        // Fallback for direct string calls
        linkName = String(elementOrName);
        destination = linkName.toLowerCase().replace(/\s+/g, '-') + '.html';
    }

    const duration = Math.floor((Date.now() - pageStartTime) / 1000);
    pageStartTime = Date.now();

    const payload = JSON.stringify({
        link: linkName,
        destination: destination,
        duration: duration
    });

    const endpoint = `${TRACKING_API}/track/link-click`;

    console.log(`🔗 Tracking link: ${linkName} -> ${destination} (${duration}s)`);

    // 1. Primary method: navigator.sendBeacon (Guarantees delivery before page changes)
    if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        const success = navigator.sendBeacon(endpoint, blob);
        if (success) {
            console.log(`✅ Link tracked via Beacon: ${linkName}`);
            return;
        }
    }

    // 2. Fallback method: fetch with keepalive: true
    fetch(endpoint, {
        method: 'POST',
        headers: getHeaders(),
        body: payload,
        keepalive: true // Keeps request alive even if window/tab changes
    })
    .then(res => res.json())
    .then(data => {
        console.log(`✅ Link tracked via Fetch: ${linkName}`, data);
    })
    .catch(err => {
        console.error('❌ Link tracking error:', err);
    });
}

// ============================================
// PAGE VIEW ON LOAD
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

// ============================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================

window.trackLink = trackLink;
window.trackActivity = trackActivity;
window.generateSessionId = generateSessionId;
window.getHeaders = getHeaders;
