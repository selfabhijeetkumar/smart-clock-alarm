/**
 * Digital Clock with Alarm
 * A beginner-friendly digital clock with alarm functionality
 * Built with vanilla HTML, CSS, and JavaScript
 * 
 * Modular Architecture:
 * - updateClock: Updates the clock display
 * - setAlarm: Sets a new alarm
 * - checkAlarm: Checks if alarm should trigger
 * - playAlarm: Plays alarm sound
 * - stopAlarm: Stops alarm sound
 * - toggleTheme: Toggles dark/light theme
 * - init: Initializes the application
 */

// ==========================================
// Configuration & State
// ==========================================

const CONFIG = {
    alarmCheckInterval: 1000, // Check alarm every second
    audioLoop: true, // Loop alarm until stopped
    localStorageKeys: {
        theme: 'clock-theme',
        alarm: 'clock-alarm',
        alarmTime: 'clock-alarm-time'
    }
};

// Application state
const state = {
    currentTime: new Date(),
    alarmTime: null,
    isAlarmPlaying: false,
    isAlarmSet: false,
    theme: 'light',
    audioContext: null,
    oscillator: null,
    beepInterval: null
};

// ==========================================
// DOM Elements
// ==========================================

const elements = {
    // Clock elements
    hours: document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds'),
    ampm: document.getElementById('ampm'),
    clockDate: document.getElementById('clock-date'),
    clockDisplay: document.getElementById('clock-time'),
    
    // Alarm elements
    alarmTimeInput: document.getElementById('alarm-time'),
    setAlarmBtn: document.getElementById('set-alarm'),
    clearAlarmBtn: document.getElementById('clear-alarm'),
    stopAlarmBtn: document.getElementById('stop-alarm'),
    alarmStatus: document.getElementById('alarm-status'),
    alarmAudio: document.getElementById('alarm-audio'),
    alarmList: document.getElementById('alarm-list'),
    
    // Theme toggle
    themeToggle: document.getElementById('theme-toggle'),
    themeIcon: document.querySelector('.theme-icon')
};

// ==========================================
// Utility Functions
// ==========================================

/**
 * Pad a number with leading zero
 * @param {number} num - Number to pad
 * @returns {string} Padded number
 */
function padZero(num) {
    return num.toString().padStart(2, '0');
}

/**
 * Format time in 12-hour format with AM/PM
 * @param {Date} date - Date object
 * @returns {object} Formatted time components
 */
function formatTime12Hour(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    
    return {
        hours: padZero(hours),
        minutes: padZero(minutes),
        seconds: padZero(seconds),
        ampm: ampm
    };
}

/**
 * Format date as human-readable string
 * @param {Date} date - Date object
 * @returns {string} Formatted date
 */
function formatDate(date) {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Get time string from Date object (HH:MM format)
 * @param {Date} date - Date object
 * @returns {string} Time string in HH:MM format
 */
function getTimeString(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Save data to localStorage with error handling
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 */
function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

/**
 * Load data from localStorage with error handling
 * @param {string} key - Storage key
 * @returns {any} Stored value or null
 */
function loadFromStorage(key) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return null;
    }
}

/**
 * Show error message to user
 * @param {string} message - Error message
 */
function showError(message) {
    console.error(message);
    elements.alarmStatus.textContent = `Error: ${message}`;
    elements.alarmStatus.classList.remove('active', 'playing');
    elements.alarmStatus.classList.add('error');
}

// ==========================================
// Web Audio API Fallback (Beep Sound)
// ==========================================

/**
 * Initialize Web Audio API context for fallback alarm sound
 */
function initAudioContext() {
    try {
        if (!state.audioContext) {
            state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return state.audioContext;
    } catch (error) {
        console.error('Web Audio API not supported:', error);
        return null;
    }
}

/**
 * Play beep sound using Web Audio API as fallback when alarm.mp3 is unavailable
 */
function playBeepFallback() {
    try {
        const ctx = initAudioContext();
        if (!ctx) return false;
        
        // Resume context if suspended (browser autoplay policy)
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        
        // Create oscillator for beep sound
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        // Configure beep sound - alternating frequencies
        oscillator.type = 'square';
        const freq = state.beepCount % 2 === 0 ? 880 : 440;
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
        
        // Create pulsing effect
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        
        // Start and stop the beep
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
        
        state.beepCount = (state.beepCount || 0) + 1;
        
        return true;
    } catch (error) {
        console.error('Error playing beep fallback:', error);
        return false;
    }
}

/**
 * Start repeating beep for alarm
 */
function startBeepFallback() {
    state.beepCount = 0;
    playBeepFallback();
    state.beepInterval = setInterval(() => {
        if (state.isAlarmPlaying) {
            playBeepFallback();
        }
    }, 500);
}

/**
 * Stop the beep fallback sound
 */
function stopBeepFallback() {
    try {
        if (state.beepInterval) {
            clearInterval(state.beepInterval);
            state.beepInterval = null;
        }
        state.beepCount = 0;
    } catch (error) {
        console.error('Error stopping beep:', error);
    }
}

// ==========================================
// Clock Functions
// ==========================================

/**
 * Update the clock display with current time
 * Called every second to keep the display accurate
 */
function updateClock() {
    try {
        state.currentTime = new Date();
        
        const time = formatTime12Hour(state.currentTime);
        
        // Update time display
        elements.hours.textContent = time.hours;
        elements.minutes.textContent = time.minutes;
        elements.seconds.textContent = time.seconds;
        elements.ampm.textContent = time.ampm;
        
        // Update date display
        elements.clockDate.textContent = formatDate(state.currentTime);
        
        // Check if alarm should trigger
        checkAlarm();
        
    } catch (error) {
        console.error('Error updating clock:', error);
    }
}

// ==========================================
// Alarm Functions
// ==========================================

/**
 * Validate alarm time input
 * @param {string} time - Time string in HH:MM format
 * @returns {boolean} True if valid
 */
function isValidAlarmTime(time) {
    if (!time) return false;
    
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
}

/**
 * Check if new alarm overlaps with existing alarm
 * @param {string} newTime - New alarm time in HH:MM format
 * @returns {boolean} True if overlapping
 */
function isAlarmOverlapping(newTime) {
    if (!state.isAlarmSet || !state.alarmTime) return false;
    
    return state.alarmTime === newTime;
}

/**
 * Set an alarm
 * Handles setting, clearing previous alarm, and validation
 */
function setAlarm() {
    try {
        const alarmTime = elements.alarmTimeInput.value;
        
        // Validate input
        if (!isValidAlarmTime(alarmTime)) {
            showError('Please enter a valid time');
            return;
        }
        
        // Check for overlapping alarm
        if (isAlarmOverlapping(alarmTime)) {
            showError('This alarm is already set');
            return;
        }
        
        // Stop any playing alarm first
        if (state.isAlarmPlaying) {
            stopAlarm();
        }
        
        // Set the alarm
        state.alarmTime = alarmTime;
        state.isAlarmSet = true;
        
        // Save to localStorage
        saveToStorage(CONFIG.localStorageKeys.alarmTime, alarmTime);
        saveToStorage(CONFIG.localStorageKeys.alarm, true);
        
        // Update UI
        updateAlarmUI();
        
        console.log(`Alarm set for ${alarmTime}`);
        
    } catch (error) {
        console.error('Error setting alarm:', error);
        showError('Failed to set alarm');
    }
}

/**
 * Clear the current alarm
 * Stops alarm if playing and removes the alarm
 */
function clearAlarm() {
    try {
        // Stop alarm if playing
        if (state.isAlarmPlaying) {
            stopAlarm();
        }
        
        // Clear alarm state
        state.alarmTime = null;
        state.isAlarmSet = false;
        
        // Clear localStorage
        localStorage.removeItem(CONFIG.localStorageKeys.alarmTime);
        localStorage.removeItem(CONFIG.localStorageKeys.alarm);
        
        // Reset input
        elements.alarmTimeInput.value = '';
        
        // Update UI
        updateAlarmUI();
        
        console.log('Alarm cleared');
        
    } catch (error) {
        console.error('Error clearing alarm:', error);
        showError('Failed to clear alarm');
    }
}

/**
 * Check if current time matches alarm time
 * Called every second by updateClock
 */
function checkAlarm() {
    if (!state.isAlarmSet || state.isAlarmPlaying) return;
    
    try {
        const currentTimeString = getTimeString(state.currentTime);
        
        if (currentTimeString === state.alarmTime) {
            playAlarm();
        }
    } catch (error) {
        console.error('Error checking alarm:', error);
    }
}

/**
 * Play the alarm sound
 * Tries MP3 first, falls back to Web Audio API beep
 */
function playAlarm() {
    try {
        if (state.isAlarmPlaying) return;
        
        state.isAlarmPlaying = true;
        
        // Set up audio
        elements.alarmAudio.loop = CONFIG.audioLoop;
        
        // Try to play the alarm
        const playPromise = elements.alarmAudio.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('Alarm playing (MP3)');
                })
                .catch(() => {
                    // MP3 failed, use fallback beep
                    console.log('MP3 not found, using beep fallback');
                    startBeepFallback();
                });
        } else {
            // Browser doesn't support play() promise
            startBeepFallback();
        }
        
        // Update UI
        updateAlarmUI();
        
    } catch (error) {
        console.error('Error in playAlarm:', error);
        // Try fallback
        state.isAlarmPlaying = true;
        startBeepFallback();
        updateAlarmUI();
    }
}

/**
 * Stop the alarm sound
 * Resets the alarm state
 */
function stopAlarm() {
    try {
        // Pause and reset audio
        elements.alarmAudio.pause();
        elements.alarmAudio.currentTime = 0;
        
        // Stop beep fallback if playing
        stopBeepFallback();
        
        state.isAlarmPlaying = false;
        
        // Update UI
        updateAlarmUI();
        
        console.log('Alarm stopped');
        
    } catch (error) {
        console.error('Error stopping alarm:', error);
        showError('Failed to stop alarm');
    }
}

/**
 * Update alarm UI based on current state
 * Handles button states, status display, and visual feedback
 */
function updateAlarmUI() {
    // Update buttons
    elements.setAlarmBtn.disabled = state.isAlarmSet;
    elements.clearAlarmBtn.disabled = !state.isAlarmSet;
    elements.stopAlarmBtn.disabled = !state.isAlarmPlaying;
    
    // Update status
    elements.alarmStatus.classList.remove('active', 'playing', 'error');
    
    if (state.isAlarmPlaying) {
        elements.alarmStatus.textContent = '🔔 Alarm playing!';
        elements.alarmStatus.classList.add('playing');
        elements.clockDisplay.closest('.clock-display').classList.add('alarm-active');
    } else if (state.isAlarmSet) {
        elements.alarmStatus.textContent = `Alarm set for ${state.alarmTime}`;
        elements.alarmStatus.classList.add('active');
        elements.clockDisplay.closest('.clock-display').classList.remove('alarm-active');
    } else {
        elements.alarmStatus.textContent = 'No alarm set';
        elements.clockDisplay.closest('.clock-display').classList.remove('alarm-active');
    }
}

// ==========================================
// Theme Functions
// ==========================================

/**
 * Toggle between dark and light themes
 * Updates CSS variables and saves preference
 */
function toggleTheme() {
    try {
        // Toggle theme
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', state.theme);
        
        // Update theme icon
        elements.themeIcon.textContent = state.theme === 'dark' ? '☀️' : '🌙';
        
        // Save preference
        saveToStorage(CONFIG.localStorageKeys.theme, state.theme);
        
        console.log(`Theme changed to ${state.theme}`);
        
    } catch (error) {
        console.error('Error toggling theme:', error);
    }
}

/**
 * Load saved theme preference
 */
function loadTheme() {
    const savedTheme = loadFromStorage(CONFIG.localStorageKeys.theme);
    
    if (savedTheme) {
        state.theme = savedTheme;
    } else {
        // Check for system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            state.theme = 'dark';
        }
    }
    
    // Apply theme
    document.documentElement.setAttribute('data-theme', state.theme);
    elements.themeIcon.textContent = state.theme === 'dark' ? '☀️' : '🌙';
}

// ==========================================
// Multiple Alarms Data Structure (Extension Ready)
// ==========================================

/**
 * Data structure for multiple alarms (future implementation)
 * This provides the foundation for expanding to multiple alarms
 * 
 * @typedef {Object} Alarm
 * @property {string} id - Unique identifier
 * @property {string} time - Time in HH:MM format
 * @property {boolean} enabled - Whether alarm is active
 * @property {string} label - Optional label for the alarm
 * @property {string[]} days - Days of week (future feature)
 * 
 * @example
 * const alarms = [
 *   {
 *     id: 'alarm-1',
 *     time: '07:00',
 *     enabled: true,
 *     label: 'Wake up',
 *     days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
 *   }
 * ];
 */

// ==========================================
// Event Listeners
// ==========================================

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    try {
        // Theme toggle
        elements.themeToggle.addEventListener('click', toggleTheme);
        
        // Alarm buttons
        elements.setAlarmBtn.addEventListener('click', setAlarm);
        elements.clearAlarmBtn.addEventListener('click', clearAlarm);
        elements.stopAlarmBtn.addEventListener('click', stopAlarm);
        
        // Keyboard support for alarm input
        elements.alarmTimeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                setAlarm();
            }
        });
        
        // Handle audio errors
        elements.alarmAudio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            showError('Alarm sound file not found');
        });
        
        // Handle visibility change (pause alarm when tab is hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && state.isAlarmPlaying) {
                // Alarm continues but user might not see it
                console.log('Alarm playing while tab is hidden');
            }
        });
        
        // Load saved alarm on page load
        const savedAlarmTime = loadFromStorage(CONFIG.localStorageKeys.alarmTime);
        const savedAlarm = loadFromStorage(CONFIG.localStorageKeys.alarm);
        
        if (savedAlarm && savedAlarmTime) {
            state.alarmTime = savedAlarmTime;
            state.isAlarmSet = true;
            elements.alarmTimeInput.value = savedAlarmTime;
            updateAlarmUI();
        }
        
        console.log('Event listeners set up successfully');
        
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

// ==========================================
// Initialization
// ==========================================

/**
 * Initialize the application
 * Sets up clock, theme, event listeners, and starts the update interval
 */
function init() {
    try {
        console.log('Initializing Digital Clock with Alarm...');
        
        // Load saved theme
        loadTheme();
        
        // Initial clock update
        updateClock();
        
        // Set up event listeners
        setupEventListeners();
        
        // Start clock update interval
        setInterval(updateClock, CONFIG.alarmCheckInterval);
        
        console.log('Digital Clock initialized successfully!');
        console.log('Theme:', state.theme);
        console.log('Alarm set:', state.isAlarmSet);
        
    } catch (error) {
        console.error('Error initializing application:', error);
        showError('Failed to initialize application');
    }
}

// ==========================================
// Start the Application
// ==========================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM already loaded
    init();
}
