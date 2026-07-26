/**
 * Weekly Countdown Timer - counts down to end of week (Sunday 23:59:59)
 */
(function () {
    'use strict';

    /**
     * Get the end of current week (Sunday at 23:59:59)
     */
    function getEndOfWeek() {
        var now = new Date();
        var dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        
        // Calculate days until Sunday
        var daysUntilSunday = dayOfWeek === 0 ? 7 : (7 - dayOfWeek);
        
        // Create end of week date (Sunday 23:59:59)
        var endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() + daysUntilSunday);
        endOfWeek.setHours(23, 59, 59, 999);
        
        return endOfWeek;
    }

    /**
     * Format number to always show 2 digits (e.g., 05, 12)
     */
    function pad(num) {
        return num < 10 ? '0' + num : num;
    }

    /**
     * Update countdown display
     */
    function updateCountdown() {
        var now = new Date();
        var endOfWeek = getEndOfWeek();
        var timeRemaining = endOfWeek - now;

        // If countdown is over, reset to next week
        if (timeRemaining <= 0) {
            // Force recalculation for next week
            now = new Date();
            endOfWeek = getEndOfWeek();
            timeRemaining = endOfWeek - now;
        }

        // Calculate time units
        var days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        var hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

        // Update DOM elements
        var daysEl = document.getElementById('countdown-days');
        var hoursEl = document.getElementById('countdown-hours');
        var minutesEl = document.getElementById('countdown-minutes');
        var secondsEl = document.getElementById('countdown-seconds');

        if (daysEl) daysEl.textContent = pad(days);
        if (hoursEl) hoursEl.textContent = pad(hours);
        if (minutesEl) minutesEl.textContent = pad(minutes);
        if (secondsEl) secondsEl.textContent = pad(seconds);
    }

    /**
     * Initialize countdown
     */
    function initCountdown() {
        // Update immediately
        updateCountdown();
        
        // Update every second
        setInterval(updateCountdown, 1000);
    }

    // Start countdown when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCountdown);
    } else {
        initCountdown();
    }

})();
