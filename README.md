# Digital Clock with Alarm

A beginner-friendly digital clock with alarm functionality built with vanilla HTML, CSS, and JavaScript. No frameworks required - just open in your browser!

## Features

- **Live Clock**: Displays time in HH:MM:SS AM/PM format
- **Current Date**: Shows today's date
- **Alarm System**: Set, clear, and stop alarms
- **Theme Toggle**: Dark/light mode with CSS variables
- **Persistent State**: Settings saved to localStorage
- **Accessibility**: ARIA labels, keyboard support, focus states
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Extension Ready**: Data structure prepared for multiple alarms

## Files Included

```
├── index.html    # Main HTML structure
├── style.css     # Styles with CSS variables
├── script.js     # JavaScript functionality
├── alarm.mp3     # Alarm sound file (placeholder)
└── README.md     # This file
```

## Quick Start

1. **Clone or download** this project to your computer
2. **Open** `index.html` in any modern web browser
3. **That's it!** - No build step or server required

## How to Use

### Setting an Alarm

1. Click the time input field or use the time picker
2. Select your desired wake-up time
3. Click **"Set Alarm"** button
4. The status will show "Alarm set for HH:MM"

### When Alarm Triggers

- Alarm sound will play (loops until stopped)
- Clock display will pulse red
- Status shows "Alarm playing!"
- Click **"Stop"** to silence the alarm

### Clearing an Alarm

- Click **"Clear"** to remove the set alarm
- This also stops the alarm if it's currently playing

### Theme Toggle

- Click the moon/sun icon in the top-right corner
- Your preference is saved automatically

## Alarm Sound

### Current Status

The project includes a reference to `alarm.mp3` which needs to be provided:

```
<audio id="alarm-audio" preload="auto">
    <source src="alarm.mp3" type="audio/mpeg">
</audio>
```

### How to Add Alarm Sound

**Option 1: Download a Sound File (Recommended)**
1. Download any alarm/sound effect MP3 file
2. Rename it to `alarm.mp3`
3. Place it in the same folder as the HTML file

**Option 2: Use Online Resources**
- FreeSound: https://freesound.org
- Mixkit: https://mixkit.co/free-sound-effects/alarm/
- Find any "alarm clock" sound effect

**Option 3: Built-in Fallback (Automatic)**

The script automatically uses a Web Audio API beep sound as fallback when `alarm.mp3` is not found. This means the alarm will still work with audio even without adding an MP3 file!

## Browser Support

- Chrome/Edge 80+
- Firefox 75+
- Safari 13+
- Opera 67+

## Accessibility Features

- Full keyboard navigation
- ARIA labels on all interactive elements
- Visible focus states
- Screen reader friendly
- Respects `prefers-reduced-motion`
- Respects `prefers-color-scheme`

## Data Structures for Extension

The code includes data structures ready for multiple alarms:

```
javascript
/**
 * @typedef {Object} Alarm
 * @property {string} id - Unique identifier
 * @property {string} time - Time in HH:MM format
 * @property {boolean} enabled - Whether alarm is active
 * @property {string} label - Optional label
 * @property {string[]} days - Days of week
 */
```

## Extending to Multiple Alarms

To add multiple alarm support in the future:

1. **UI Changes** (index.html):
   - Replace single alarm input with alarm list
   - Add "Add Alarm" button
   - Create alarm cards with edit/delete

2. **Data Changes** (script.js):
   - Change `state.alarmTime` to `state.alarms[]`
   - Update localStorage structure
   - Modify checkAlarm to check all alarms

3. **CSS Updates** (style.css):
   - Style alarm cards
   - Add animations for alarm list

## Troubleshooting

### Alarm sound not playing
- Ensure `alarm.mp3` exists in the same folder
- Check browser's audio autoplay policies
- Try clicking anywhere on the page first

### Time not updating
- Refresh the page
- Check browser console for errors

### Theme not saving
- Check localStorage is enabled
- Some incognito modes disable localStorage

## License

MIT License - Feel free to use for learning or personal projects!

---

Built with ❤️ for learning purposes
