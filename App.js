/**
 * Digital Clock with Alarm - Spotify Ringtone Integration
 * React Native (Expo) Implementation
 * 
 * Features:
 * - Live digital clock display
 * - Alarm with custom ringtones
 * - Spotify integration for ringtone selection
 * - Local fallback ringtones
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import * as SecureStore from 'expo-secure-store';

// Services
import { SpotifyAuthService } from './src/services/spotifyAuth';
import { SpotifyApiService } from './src/services/spotifyApi';
import { RingtoneManager } from './src/services/ringtoneManager';

// Screens
import RingtonePickerScreen from './src/screens/RingtonePickerScreen';

// ==========================================
// Configuration
// ==========================================

const CONFIG = {
  SPOTIFY_CLIENT_ID: 'YOUR_SPOTIFY_CLIENT_ID', // Replace with your Spotify app client ID
  SPOTIFY_REDIRECT_URI: 'digitalclockalarm://spotify-callback',
  SPOTIFY_SCOPES: ['user-read-private', 'user-library-read'],
  ALARM_CHECK_INTERVAL: 1000,
};

// ==========================================
// Local Preset Ringtones
// ==========================================

const LOCAL_RINGTONES = [
  { id: '1', name: 'Classic Beep', source: 'local', uri: null },
  { id: '2', name: 'Gentle Chime', source: 'local', uri: null },
  { id: '3', name: 'Morning Alarm', source: 'local', uri: null },
  { id: '4', name: 'Digital Alert', source: 'local', uri: null },
  { id: '5', name: 'Soft Wake', source: 'local', uri: null },
];

// ==========================================
// Main App Component
// ==========================================

export default function App() {
  // Clock state
  const [currentTime, setCurrentTime] = useState(new Date());
  const [alarmTime, setAlarmTime] = useState(null);
  const [isAlarmSet, setIsAlarmSet] = useState(false);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  
  // Theme state
  const [theme, setTheme] = useState('dark');
  
  // Ringtone state
  const [selectedRingtone, setSelectedRingtone] = useState(null);
  const [showRingtonePicker, setShowRingtonePicker] = useState(false);
  
  // Spotify state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Audio state
  const [sound, setSound] = useState(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  // Initialize app
  useEffect(() => {
    initializeApp();
    return () => {
      // Cleanup on unmount
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  // Clock update interval
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      checkAlarm();
    }, CONFIG.ALARM_CHECK_INTERVAL);
    
    return () => clearInterval(interval);
  }, [alarmTime, isAlarmSet, isAlarmPlaying]);

  // ==========================================
  // Initialization
  // ==========================================

  const initializeApp = async () => {
    try {
      // Load saved theme
      const savedTheme = await SecureStore.getItemAsync('clock-theme');
      if (savedTheme) {
        setTheme(savedTheme);
      }

      // Load saved ringtone
      const savedRingtone = await SecureStore.getItemAsync('selected-ringtone');
      if (savedRingtone) {
        setSelectedRingtone(JSON.parse(savedRingtone));
      }

      // Check Spotify auth status
      const hasValidToken = await SpotifyAuthService.hasValidToken();
      setIsAuthenticated(hasValidToken);

      // Load saved alarm
      const savedAlarmTime = await SecureStore.getItemAsync('alarm-time');
      const savedAlarmSet = await SecureStore.getItemAsync('alarm-set');
      
      if (savedAlarmSet && savedAlarmTime) {
        setAlarmTime(savedAlarmTime);
        setIsAlarmSet(true);
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

    } catch (error) {
      console.error('Error initializing app:', error);
    }
  };

  // ==========================================
  // Clock Functions
  // ==========================================

  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0'),
      ampm,
    };
  };

  const formatDate = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime12Hour = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    let hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12;
    return `${hour}:${minutes} ${ampm}`;
  };

  // ==========================================
  // Alarm Functions
  // ==========================================

  const checkAlarm = () => {
    if (!isAlarmSet || isAlarmPlaying || !alarmTime) return;
    
    const now = new Date();
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    if (currentTimeStr === alarmTime) {
      playAlarm();
    }
  };

  const setAlarm = async (time) => {
    try {
      setAlarmTime(time);
      setIsAlarmSet(true);
      
      await SecureStore.setItemAsync('alarm-time', time);
      await SecureStore.setItemAsync('alarm-set', 'true');
      
      Alert.alert('Alarm Set', `Alarm set for ${formatTime12Hour(time)}`);
    } catch (error) {
      console.error('Error setting alarm:', error);
      Alert.alert('Error', 'Failed to set alarm');
    }
  };

  const clearAlarm = async () => {
    try {
      if (isAlarmPlaying) {
        await stopAlarm();
      }
      
      setAlarmTime(null);
      setIsAlarmSet(false);
      
      await SecureStore.deleteItemAsync('alarm-time');
      await SecureStore.deleteItemAsync('alarm-set');
      
      Alert.alert('Alarm Cleared', 'Alarm has been cleared');
    } catch (error) {
      console.error('Error clearing alarm:', error);
    }
  };

  const playAlarm = async () => {
    try {
      setIsAlarmPlaying(true);
      
      if (selectedRingtone) {
        if (selectedRingtone.source === 'spotify' && selectedRingtone.preview_url) {
          // Play Spotify preview
          await playPreview(selectedRingtone.preview_url);
        } else if (selectedRingtone.source === 'local') {
          // Play local ringtone (use built-in beep)
          await RingtoneManager.playLocalRingtone();
        }
      } else {
        // Default alarm sound
        await RingtoneManager.playLocalRingtone();
      }
    } catch (error) {
      console.error('Error playing alarm:', error);
      setIsAlarmPlaying(false);
    }
  };

  const stopAlarm = async () => {
    try {
      setIsAlarmPlaying(false);
      
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }
      
      setIsPreviewPlaying(false);
    } catch (error) {
      console.error('Error stopping alarm:', error);
    }
  };

  // ==========================================
  // Ringtone Functions
  // ==========================================

  const playPreview = async (uri) => {
    try {
      // Stop any existing sound
      if (sound) {
        await sound.unloadAsync();
      }
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, isLooping: true }
      );
      
      setSound(newSound);
      setIsPreviewPlaying(true);
    } catch (error) {
      console.error('Error playing preview:', error);
      Alert.alert('Error', 'Could not play preview');
    }
  };

  const stopPreview = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        setIsPreviewPlaying(false);
      }
    } catch (error) {
      console.error('Error stopping preview:', error);
    }
  };

  const selectRingtone = async (ringtone) => {
    try {
      // Stop preview if playing
      if (isPreviewPlaying) {
        await stopPreview();
      }
      
      setSelectedRingtone(ringtone);
      
      // Save to secure storage
      await SecureStore.setItemAsync('selected-ringtone', JSON.stringify(ringtone));
      
      setShowRingtonePicker(false);
      
      // Show confirmation
      if (ringtone.source === 'spotify') {
        Alert.alert('Ringtone Selected', `"${ringtone.name}" by ${ringtone.artist} set as alarm ringtone`);
      } else {
        Alert.alert('Ringtone Selected', `${ringtone.name} set as alarm ringtone`);
      }
    } catch (error) {
      console.error('Error selecting ringtone:', error);
      Alert.alert('Error', 'Failed to set ringtone');
    }
  };

  // ==========================================
  // Theme Functions
  // ==========================================

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    await SecureStore.setItemAsync('clock-theme', newTheme);
  };

  // ==========================================
  // Time Input Handler
  // ==========================================

  const handleTimeInput = () => {
    // For MVP, use a simple prompt
    Alert.prompt(
      'Set Alarm Time',
      'Enter time in HH:MM format (24-hour)',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Set', 
          onPress: (time) => {
            // Validate time format
            const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (timeRegex.test(time)) {
              setAlarm(time);
            } else {
              Alert.alert('Invalid Time', 'Please enter a valid time in HH:MM format');
            }
          }
        },
      ],
      'plain-text',
      alarmTime || ''
    );
  };

  // ==========================================
  // Render Functions
  // ==========================================

  const time = formatTime(currentTime);
  const colors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  if (showRingtonePicker) {
    return (
      <RingtonePickerScreen
        theme={theme}
        colors={colors}
        isAuthenticated={isAuthenticated}
        onSelectRingtone={selectRingtone}
        onClose={() => setShowRingtonePicker(false)}
        onLoginSpotify={async () => {
          const success = await SpotifyAuthService.authenticate();
          setIsAuthenticated(success);
        }}
        localRingtones={LOCAL_RINGTONES}
        playPreview={playPreview}
        stopPreview={stopPreview}
        isPreviewPlaying={isPreviewPlaying}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Theme Toggle */}
      <TouchableOpacity 
        style={[styles.themeButton, { backgroundColor: colors.card }]}
        onPress={toggleTheme}
        accessibilityLabel="Toggle theme"
      >
        <Text style={[styles.themeIcon, { color: colors.text }]}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </Text>
      </TouchableOpacity>

      {/* Clock Display */}
      <View style={[styles.clockContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.time, { color: colors.primary }]}>
          {time.hours}:{time.minutes}:{time.seconds}
        </Text>
        <Text style={[styles.ampm, { color: colors.secondary }]}>{time.ampm}</Text>
        <Text style={[styles.date, { color: colors.secondary }]}>{formatDate(currentTime)}</Text>
        
        {isAlarmPlaying && (
          <View style={[styles.alarmPlaying, { backgroundColor: colors.danger }]}>
            <Text style={styles.alarmPlayingText}>🔔 Alarm Playing!</Text>
          </View>
        )}
      </View>

      {/* Alarm Section */}
      <View style={[styles.alarmSection, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Alarm</Text>
        
        {isAlarmSet && (
          <Text style={[styles.alarmTime, { color: colors.success }]}>
            {formatTime12Hour(alarmTime)}
          </Text>
        )}
        
        <View style={styles.alarmButtons}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleTimeInput}
          >
            <Text style={styles.buttonText}>{isAlarmSet ? 'Change' : 'Set Alarm'}</Text>
          </TouchableOpacity>
          
          {isAlarmSet && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.secondary }]}
              onPress={clearAlarm}
            >
              <Text style={styles.buttonText}>Clear</Text>
            </TouchableOpacity>
          )}
          
          {isAlarmPlaying && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.danger }]}
              onPress={stopAlarm}
            >
              <Text style={styles.buttonText}>Stop</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Ringtone Section */}
      <View style={[styles.ringtoneSection, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Ringtone</Text>
        
        {selectedRingtone ? (
          <View style={styles.selectedRingtone}>
            <Text style={[styles.ringtoneName, { color: colors.text }]}>
              {selectedRingtone.source === 'spotify' 
                ? `🎵 ${selectedRingtone.name}`
                : `🔔 ${selectedRingtone.name}`
              }
            </Text>
            {selectedRingtone.source === 'spotify' && (
              <Text style={[styles.ringtoneArtist, { color: colors.secondary }]}>
                {selectedRingtone.artist}
              </Text>
            )}
          </View>
        ) : (
          <Text style={[styles.noRingtone, { color: colors.secondary }]}>
            No ringtone selected
          </Text>
        )}
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => setShowRingtonePicker(true)}
        >
          <Text style={styles.buttonText}>
            {selectedRingtone ? 'Change Ringtone' : 'Select Ringtone'}
          </Text>
        </TouchableOpacity>
        
        {selectedRingtone?.source === 'spotify' && selectedRingtone.preview_url && (
          <TouchableOpacity
            style={[styles.previewButton, { borderColor: colors.primary }]}
            onPress={() => isPreviewPlaying ? stopPreview() : playPreview(selectedRingtone.preview_url)}
          >
            <Text style={[styles.previewButtonText, { color: colors.primary }]}>
              {isPreviewPlaying ? '⏹ Stop Preview' : '▶️ Preview'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// ==========================================
// Styles
// ==========================================

const DARK_COLORS = {
  background: '#1a1a2e',
  card: '#16213e',
  text: '#eaeaea',
  secondary: '#b0b0b0',
  primary: '#5dade2',
  success: '#66bb6a',
  danger: '#e57373',
};

const LIGHT_COLORS = {
  background: '#f5f5f5',
  card: '#ffffff',
  text: '#333333',
  secondary: '#666666',
  primary: '#4a90d9',
  success: '#28a745',
  danger: '#dc3545',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  themeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  themeIcon: {
    fontSize: 24,
  },
  clockContainer: {
    marginTop: 80,
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  time: {
    fontSize: 56,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  ampm: {
    fontSize: 20,
    marginTop: -10,
  },
  date: {
    fontSize: 16,
    marginTop: 10,
  },
  alarmPlaying: {
    marginTop: 20,
    padding: 10,
    borderRadius: 8,
  },
  alarmPlayingText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  alarmSection: {
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  alarmTime: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  alarmButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  ringtoneSection: {
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
  },
  selectedRingtone: {
    marginBottom: 15,
  },
  ringtoneName: {
    fontSize: 16,
    fontWeight: '600',
  },
  ringtoneArtist: {
    fontSize: 14,
    marginTop: 4,
  },
  noRingtone: {
    fontSize: 14,
    marginBottom: 15,
  },
  previewButton: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  previewButtonText: {
    fontWeight: '600',
  },
});
