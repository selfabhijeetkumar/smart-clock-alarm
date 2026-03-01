# Spotify Ringtone Integration - Implementation Plan

## Overview
Extend the existing alarm clock with Spotify integration for custom ringtone selection.

## Architecture

### Components
1. **SpotifyAuthService** - OAuth flow and token management
2. **SpotifyTrackPicker** - Search and select tracks
3. **TrackPreview** - Play 30-second preview
4. **RingtoneManager** - Save and set ringtone
5. **LocalFallback** - Preset ringtone options

### Data Flow
```
User taps "Set Ringtone" 
→ Check Spotify auth status
→ If not authenticated → Spotify OAuth login
→ Search/browse tracks
→ Select track → Get preview_url
→ Preview playback
→ Confirm selection → Save to local storage
→ Set as alarm ringtone
```

## MVP Implementation Files

### Key Files to Create:
- package.json
- app.json
- App.js (main entry)
- src/services/spotifyAuth.js
- src/services/spotifyApi.js
- src/services/ringtoneManager.js
- src/screens/RingtonePickerScreen.js
- src/components/TrackItem.js
- src/components/LocalRingtones.js

## Security Considerations
- Store tokens securely (expo-secure-store)
- Implement token refresh logic
- Never expose client secrets in frontend
- Use PKCE flow for web OAuth
