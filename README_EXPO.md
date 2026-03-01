# React Native (Expo) Implementation - Spotify Ringtone Integration

## Overview
This is the React Native (Expo) implementation with full Spotify integration for selecting custom alarm ringtones.

## Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Spotify Developer Account

## Setup

1. Install dependencies:
```
bash
npm install
```

2. Configure Spotify:
   - Go to https://developer.spotify.com/dashboard
   - Create a new app
   - Add redirect URI: `digitalclockalarm://spotify-callback`
   - Copy the Client ID

3. Update Client ID in files:
   - Open `src/services/spotifyAuth.js`
   - Replace `YOUR_SPOTIFY_CLIENT_ID` with your actual Client ID

4. Run the app:
```
bash
npx expo start
```

## Project Structure

```
├── App.js                      # Main app component
├── package.json                 # Dependencies
├── app.json                     # Expo configuration
├── babel.config.js             # Babel configuration
├── src/
│   ├── services/
│   │   ├── spotifyAuth.js      # Spotify OAuth authentication
│   │   ├── spotifyApi.js       # Spotify Web API calls
│   │   └── ringtoneManager.js  # Ringtone playback & storage
│   └── screens/
│       └── RingtonePickerScreen.js  # Ringtone selection UI
└── assets/                      # App icons and images
```

## Features

- Spotify OAuth authentication
- Search Spotify tracks
- Preview 30-second clips
- Set Spotify track as alarm ringtone
- Local fallback ringtones
- Dark/light theme
- Persistent storage

## Security Notes

- Tokens are stored securely using expo-secure-store
- Token refresh is handled automatically
- Client secret is not exposed in the app

## Platform Notes

### Android
- Uses SET_RINGTONE permission (requires native module for full functionality)
- preview_url works for alarm playback

### iOS
- Limited ringtone setting capabilities
- Works as app-specific alarm sound

### Web
- OAuth redirect handling required
- Audio playback may have autoplay restrictions
