// ============================================
// SHARED TRACKING CODE - Include on ALL pages
// ============================================

const TRACKING_API = 'https://bespellbee-backend-en6l.onrender.com/api';
const authToken = localStorage.getItem('authToken');
const sessionId = localStorage.getItem('sessionId') || generateSessionId();
let currentPage = 'home';
let pageStartTime = Date.now();
let isTrackingEnabled = !!authToken;

// ✅ Track which pages have already been tracked in this session
let pageViewTracked = false;
let sessionStarted = Date.now();

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
// CHECK IF CURRENT PAGE IS LMS DASHBOARD
// ============================================

function isLmsDashboard() {
    const url = window.location.href;
    const title = document.title || '';
    
    // Check URL patterns
    if (url.includes('student-dashboard.html') || 
        url.includes('lms-dashboard.html') ||
        url.includes('dashboard.html') ||
        url.includes('/dashboard')) {
        return true;
    }
    
    // Check title patterns
    if (title.includes('Dashboard') || 
        title.includes('LMS') || 
        title.includes('BeSpellBee - Student Dashboard')) {
        return true;
    }
    
    // Check if there's a course selector on the page
    if (document.getElementById('courseSelector')) {
        return true;
    }
    
    return false;
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

function trackLink(linkName) {
    if (!isTrackingEnabled || !authToken) {
        console.log('🔒 Not logged in - link tracking skipped');
        return;
    }

    // ✅ Skip link tracking on LMS pages (handled by dashboard's global listener)
    if (isLmsDashboard()) {
        console.log('⏭️ LMS page detected - skipping link tracking (handled by dashboard)');
        return;
    }

    const duration = Math.floor((Date.now() - pageStartTime) / 1000);
    pageStartTime = Date.now();

    console.log(`🔗 Tracking link: ${linkName} (${duration}s)`);

    fetch(`${TRACKING_API}/track/link-click`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
            link: linkName,
            destination: linkName.toLowerCase().replace(' ', '-') + '.html',
            duration: duration
        }),
        keepalive: true
    })
    .then(res => res.json())
    .then(data => {
        console.log(`✅ Link tracked: ${linkName}`, data);
    })
    .catch(err => {
        console.error('❌ Link tracking error:', err);
    });
}

// ============================================
// PAGE VIEW ON LOAD (with duplicate prevention)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // ✅ Skip auto-tracking on LMS dashboard (handled by dashboard code)
    if (isLmsDashboard()) {
        console.log('⏭️ LMS page detected - skipping auto page view tracking (handled by dashboard)');
        return;
    }

    // ✅ Skip if we already tracked this page view in this session
    if (pageViewTracked) {
        console.log('⏭️ Page view already tracked this session');
        return;
    }

    setTimeout(() => {
        if (isTrackingEnabled && !pageViewTracked) {
            pageViewTracked = true;
            trackActivity('page_view', {
                page: document.title || 'BeSpellBee',
                url: window.location.href
            });
            console.log('📊 Page view tracked:', document.title);
        }
    }, 1000);
});

// ============================================
// RESET PAGE VIEW FLAG ON PAGE REFRESH
// ============================================

// Reset the flag when the page is actually refreshed/reloaded
window.addEventListener('beforeunload', function() {
    // If the page is being reloaded, reset the flag for the next load
    // The flag will be reset anyway because the script reloads, but this ensures clean state
});

// ============================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================

window.trackLink = trackLink;
window.trackActivity = trackActivity;
window.generateSessionId = generateSessionId;
window.getHeaders = getHeaders;
window.isLmsDashboard = isLmsDashboard;

console.log('✅ tracking.js ready - LMS detection active');
