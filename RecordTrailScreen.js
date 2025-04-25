// RecordTrailScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Platform
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { trailtrades_recordTrail } from '../../functions/trailtrades_recordTrail';

const { width, height } = Dimensions.get('window');

const RecordTrailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const mapRef = useRef(null);
  const { locationId } = route.params || {};

  // State variables
  const [recordMethod, setRecordMethod] = useState('gps'); // 'gps' or 'manual'
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedTime, setRecordedTime] = useState(0); // in seconds
  const [timer, setTimer] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  const [trailStats, setTrailStats] = useState({
    distance: 0, // meters
    elevationGain: 0, // meters
    elevationLoss: 0, // meters
  });
  const [trailInfo, setTrailInfo] = useState({
    name: '',
    locationId: locationId || '',
    description: '',
    difficulty: 'moderate', // 'easy', 'moderate', 'difficult', 'extreme'
    type: 'hiking', // 'hiking', 'mountain_biking', 'dirt_biking', 'offroading'
  });
  const [loading, setLoading] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [error, setError] = useState(null);
  
  // Distance filter (minimum distance in meters between consecutive waypoints)
  const [distanceFilter, setDistanceFilter] = useState(5);
  // Accuracy filter (maximum allowed GPS accuracy in meters)
  const [accuracyFilter, setAccuracyFilter] = useState(20);
  // Minimum time between waypoints in milliseconds
  const [timeFilter, setTimeFilter] = useState(1000);
  // Last recorded timestamp
  const [lastRecordedTime, setLastRecordedTime] = useState(0);
  
  // Difficulty level options
  const difficultyLevels = [
    { id: 'easy', name: 'Easy', color: '#27AE60' },
    { id: 'moderate', name: 'Moderate', color: '#F39C12' },
    { id: 'difficult', name: 'Difficult', color: '#E67E22' },
    { id: 'extreme', name: 'Extreme', color: '#C0392B' }
  ];
  
  // Trail type options
  const trailTypes = [
    { id: 'hiking', name: 'Hiking', icon: 'walk' },
    { id: 'mountain_biking', name: 'Mountain Biking', icon: 'bike' },
    { id: 'dirt_biking', name: 'Dirt Biking', icon: 'motorbike' },
    { id: 'offroading', name: 'Offroading', icon: 'car-4x4' }
  ];

  // Get user's location on component mount
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission to access location was denied');
          return;
        }

        let position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
        
        const currentLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        
        setUserLocation(currentLocation);
      } catch (err) {
        console.error('Error getting location:', err);
        setError('Could not get your location');
      }
    })();
    
    // Clean up on unmount
    return () => {
      if (watchId) {
        Location.stopLocationUpdates(watchId);
      }
      if (timer) {
        clearInterval(timer);
      }
    };
  }, []);
  
  // Start recording trail
  const startRecording = async () => {
    if (recordMethod === 'gps') {
      await startGPSRecording();
    } else {
      startManualRecording();
    }
  };
  
  // Start GPS recording
  const startGPSRecording = async () => {
    if (!userLocation) {
      Alert.alert('Error', 'Unable to get your location. Please try again.');
      return;
    }
    
    try {
      // Start timer
      const timerInterval = setInterval(() => {
        setRecordedTime(prev => prev + 1);
      }, 1000);
      setTimer(timerInterval);
      
      // Add first waypoint
      const initialWaypoint = {
        coordinates: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude
        },
        altitude: userLocation.altitude,
        accuracy: userLocation.accuracy,
        timestamp: new Date().getTime()
      };
      
      setWaypoints([initialWaypoint]);
      setLastRecordedTime(new Date().getTime());
      
      // Start location updates
      const locationWatchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 1, // minimum change in meters
          timeInterval: 1000, // minimum time in ms between updates
        },
        handleLocationUpdate
      );
      
      setWatchId(locationWatchId);
      setIsRecording(true);
      
    } catch (err) {
      console.error('Error starting GPS recording:', err);
      Alert.alert('Error', 'Failed to start GPS recording. Please try again.');
    }
  };
  
  // Handle location updates
  const handleLocationUpdate = (location) => {
    if (!isRecording || isPaused) return;
    
    const newLocation = {
      coordinates: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      },
      altitude: location.coords.altitude,
      accuracy: location.coords.accuracy,
      timestamp: location.timestamp
    };
    
    // Apply filters
    const now = new Date().getTime();
    const timeDiff = now - lastRecordedTime;
    
    // Skip if not enough time has passed
    if (timeDiff < timeFilter) return;
    
    // Skip if accuracy is worse than threshold
    if (newLocation.accuracy > accuracyFilter) return;
    
    // Skip if distance is less than threshold
    if (waypoints.length > 0) {
      const lastWaypoint = waypoints[waypoints.length - 1];
      const distance = calculateDistance(
        lastWaypoint.coordinates.latitude,
        lastWaypoint.coordinates.longitude,
        newLocation.coordinates.latitude,
        newLocation.coordinates.longitude
      );
      
      if (distance < distanceFilter) return;
      
      // Update stats
      setTrailStats(prev => ({
        ...prev,
        distance: prev.distance + distance
      }));
      
      // Update elevation stats if available
      if (lastWaypoint.altitude && newLocation.altitude) {
        const elevationDiff = newLocation.altitude - lastWaypoint.altitude;
        if (elevationDiff > 0) {
          setTrailStats(prev => ({
            ...prev,
            elevationGain: prev.elevationGain + elevationDiff
          }));
        } else {
          setTrailStats(prev => ({
            ...prev,
            elevationLoss: prev.elevationLoss + Math.abs(elevationDiff)
          }));
        }
      }
    }
    
    setWaypoints(prev => [...prev, newLocation]);
    setLastRecordedTime(now);
    setUserLocation(newLocation);
  };
  
  // Calculate distance between coordinates in meters
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  };
  
  // Start manual recording
  const startManualRecording = () => {
    // Start timer
    const timerInterval = setInterval(() => {
      setRecordedTime(prev => prev + 1);
    }, 1000);
    setTimer(timerInterval);
    
    setIsRecording(true);
    
    // Alert user about manual recording instructions
    Alert.alert(
      'Manual Recording',
      'Tap on the map to add waypoints. Long press to remove a waypoint.',
      [{ text: 'OK' }]
    );
  };
  
  // Pause recording
  const pauseRecording = () => {
    if (isPaused) {
      // Resume recording
      setIsPaused(false);
      
      if (recordMethod === 'gps') {
        // Restart location updates
        Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            distanceInterval: 1,
            timeInterval: 1000,
          },
          handleLocationUpdate
        ).then(locationWatchId => {
          setWatchId(locationWatchId);
        });
      }
    } else {
      // Pause recording
      setIsPaused(true);
      
      if (recordMethod === 'gps' && watchId) {
        watchId.remove();
        setWatchId(null);
      }
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (waypoints.length < 2) {
      Alert.alert(
        'Not enough waypoints',
        'You need at least 2 waypoints to save a trail.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Stop timer
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
    
    // Stop location updates
    if (watchId) {
      watchId.remove();
      setWatchId(null);
    }
    
    setIsRecording(false);
    setIsPaused(false);
    setShowSaveModal(true);
  };
  
  // Handle map tap for manual recording
  const handleMapTap = (event) => {
    if (recordMethod === 'manual' && isRecording && !isPaused) {
      const { coordinate } = event.nativeEvent;
      
      const newWaypoint = {
        coordinates: {
          latitude: coordinate.latitude,
          longitude: coordinate.longitude
        },
        timestamp: new Date().getTime()
      };
      
      // Update distance if there are existing waypoints
      if (waypoints.length > 0) {
        const lastWaypoint = waypoints[waypoints.length - 1];
        const distance = calculateDistance(
          lastWaypoint.coordinates.latitude,
          lastWaypoint.coordinates.longitude,
          newWaypoint.coordinates.latitude,
          newWaypoint.coordinates.longitude
        );
        
        setTrailStats(prev => ({
          ...prev,
          distance: prev.distance + distance
        }));
      }
      
      setWaypoints(prev => [...prev, newWaypoint]);
    }
  };
  
  // Handle marker long press (for removing waypoints in manual mode)
  const handleMarkerLongPress = (index) => {
    if (recordMethod === 'manual' && isRecording && !isPaused) {
      Alert.alert(
        'Remove Waypoint',
        'Are you sure you want to remove this waypoint?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Remove', 
            onPress: () => {
              setWaypoints(prev => {
                // Remove the waypoint
                const newWaypoints = [...prev];
                newWaypoints.splice(index, 1);
                
                // Recalculate distance
                let totalDistance = 0;
                for (let i = 1; i < newWaypoints.length; i++) {
                  totalDistance += calculateDistance(
                    newWaypoints[i-1].coordinates.latitude,
                    newWaypoints[i-1].coordinates.longitude,
                    newWaypoints[i].coordinates.latitude,
                    newWaypoints[i].coordinates.longitude
                  );
                }
                
                setTrailStats(prev => ({
                  ...prev,
                  distance: totalDistance
                }));
                
                return newWaypoints;
              });
            } 
          }
        ]
      );
    }
  };
  
  // Save trail
  const saveTrail = async () => {
    if (waypoints.length < 2) {
      Alert.alert('Error', 'You need at least 2 waypoints to save a trail.');
      return;
    }
    
    if (!trailInfo.name.trim()) {
      Alert.alert('Error', 'Please enter a name for the trail.');
      return;
    }
    
    setLoading(true);
    
    try {
      // Call the record trail function
      const trailData = {
        name: trailInfo.name,
        locationId: trailInfo.locationId,
        waypoints: waypoints.map(wp => ({
          coordinates: {
            latitude: wp.coordinates.latitude,
            longitude: wp.coordinates.longitude
          },
          elevation: wp.altitude,
          timestamp: new Date(wp.timestamp)
        }))
      };
      
      const options = {
        includeElevation: true,
        trailType: trailInfo.type,
        difficulty: trailInfo.difficulty,
        autoSave: true
      };
      
      const result = await trailtrades_recordTrail('manual', trailData, options);
      
      // Success
      setShowSaveModal(false);
      
      Alert.alert(
        'Trail Saved',
        'Your trail has been saved successfully. Would you like to add photos to this trail?',
        [
          {
            text: 'Later',
            onPress: () => {
              navigation.goBack();
            },
            style: 'cancel',
          },
          {
            text: 'Add Photos',
            onPress: () => {
              navigation.navigate('UploadMedia', { 
                trailId: result.id, 
                locationId: trailInfo.locationId 
              });
            },
          }
        ]
      );
      
    } catch (err) {
      console.error('Error saving trail:', err);
      Alert.alert('Error', `Failed to save trail: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Format time for display
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Format distance for display
  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${meters.toFixed(0)}m`;
    } else {
      const km = meters / 1000;
      return `${km.toFixed(2)}km`;
    }
  };
  
  // Render recording controls
  const renderRecordingControls = () => {
    if (!isRecording) {
      return (
        <View style={styles.recordingControlsContainer}>
          <View style={styles.methodSelector}>
            <TouchableOpacity
              style={[
                styles.methodButton,
                recordMethod === 'gps' ? styles.methodButtonActive : {}
              ]}
              onPress={() => setRecordMethod('gps')}
            >
              <Ionicons
                name="navigate"
                size={20}
                color={recordMethod === 'gps' ? "#fff" : "#3C6E47"}
              />
              <Text
                style={[
                  styles.methodButtonText,
                  recordMethod === 'gps' ? styles.methodButtonTextActive : {}
                ]}
              >
                GPS Tracking
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.methodButton,
                recordMethod === 'manual' ? styles.methodButtonActive : {}
              ]}
              onPress={() => setRecordMethod('manual')}
            >
              <Ionicons
                name="pencil"
                size={20}
                color={recordMethod === 'manual' ? "#fff" : "#3C6E47"}
              />
              <Text
                style={[
                  styles.methodButtonText,
                  recordMethod === 'manual' ? styles.methodButtonTextActive : {}
                ]}
              >
                Manual Drawing
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.startButton}
            onPress={startRecording}
          >
            <Ionicons name="play" size={24} color="#fff" />
            <Text style={styles.startButtonText}>
              Start Recording
            </Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <View style={styles.activeRecordingControls}>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>TIME</Text>
              <Text style={styles.statValue}>{formatTime(recordedTime)}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>DISTANCE</Text>
              <Text style={styles.statValue}>{formatDistance(trailStats.distance)}</Text>
            </View>
            
            {trailStats.elevationGain > 0 && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>ELEVATION</Text>
                <Text style={styles.statValue}>
                  +{trailStats.elevationGain.toFixed(0)}m
                  {trailStats.elevationLoss > 0 && ` / -${trailStats.elevationLoss.toFixed(0)}m`}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.recordingButtons}>
            <TouchableOpacity
              style={styles.recordingButton}
              onPress={pauseRecording}
            >
              <Ionicons
                name={isPaused ? "play" : "pause"}
                size={24}
                color="#3C6E47"
              />
              <Text style={styles.recordingButtonText}>
                {isPaused ? "Resume" : "Pause"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.recordingButton, styles.stopButton]}
              onPress={stopRecording}
            >
              <Ionicons name="stop" size={24} color="#fff" />
              <Text style={styles.stopButtonText}>
                Stop
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  };
  
  // Render save trail modal
  const renderSaveTrailModal = () => {
    return (
      <Modal
        visible={showSaveModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Save Trail</Text>
              {!loading && (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowSaveModal(false)}
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              )}
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Trail Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter trail name"
                value={trailInfo.name}
                onChangeText={(text) => setTrailInfo(prev => ({ ...prev, name: text }))}
                editable={!loading}
              />
              
              <Text style={styles.inputLabel}>Trail Type</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.trailTypeContainer}
              >
                {trailTypes.map(type => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.trailTypeButton,
                      trailInfo.type === type.id ? styles.trailTypeButtonSelected : {}
                    ]}
                    onPress={() => setTrailInfo(prev => ({ ...prev, type: type.id }))}
                    disabled={loading}
                  >
                    <MaterialCommunityIcons
                      name={type.icon}
                      size={24}
                      color={trailInfo.type === type.id ? "#fff" : "#555"}
                    />
                    <Text
                      style={[
                        styles.trailTypeButtonText,
                        trailInfo.type === type.id ? styles.trailTypeButtonTextSelected : {}
                      ]}
                    >
                      {type.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <Text style={styles.inputLabel}>Difficulty Level</Text>
              <View style={styles.difficultyContainer}>
                {difficultyLevels.map(level => (
                  <TouchableOpacity
                    key={level.id}
                    style={[
                      styles.difficultyButton,
                      trailInfo.difficulty === level.id ? { backgroundColor: level.color } : {}
                    ]}
                    onPress={() => setTrailInfo(prev => ({ ...prev, difficulty: level.id }))}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.difficultyButtonText,
                        trailInfo.difficulty === level.id ? styles.difficultyButtonTextSelected : {}
                      ]}
                    >
                      {level.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Enter trail description"
                value={trailInfo.description}
                onChangeText={(text) => setTrailInfo(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!loading}
              />
              
              <Text style={styles.trailStatsTitle}>Trail Statistics</Text>
              <View style={styles.trailStatsContainer}>
                <View style={styles.trailStatItem}>
                  <Text style={styles.trailStatLabel}>Total Distance</Text>
                  <Text style={styles.trailStatValue}>{formatDistance(trailStats.distance)}</Text>
                </View>
                
                <View style={styles.trailStatItem}>
                  <Text style={styles.trailStatLabel}>Elevation Gain</Text>
                  <Text style={styles.trailStatValue}>
                    {trailStats.elevationGain > 0 ? `${trailStats.elevationGain.toFixed(0)}m` : 'N/A'}
                  </Text>
                </View>
                
                <View style={styles.trailStatItem}>
                  <Text style={styles.trailStatLabel}>Elevation Loss</Text>
                  <Text style={styles.trailStatValue}>
                    {trailStats.elevationLoss > 0 ? `${trailStats.elevationLoss.toFixed(0)}m` : 'N/A'}
                  </Text>
                </View>
                
                <View style={styles.trailStatItem}>
                  <Text style={styles.trailStatLabel}>Waypoints</Text>
                  <Text style={styles.trailStatValue}>{waypoints.length}</Text>
                </View>
                
                <View style={styles.trailStatItem}>
                  <Text style={styles.trailStatLabel}>Duration</Text>
                  <Text style={styles.trailStatValue}>{formatTime(recordedTime)}</Text>
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              {loading ? (
                <ActivityIndicator size="large" color="#3C6E47" />
              ) : (
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveTrail}
                >
                  <Text style={styles.saveButtonText}>Save Trail</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Map View */}
      <View style={styles.mapContainer}>
        {userLocation ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation
            onPress={handleMapTap}
            scrollEnabled={!isPaused}
            zoomEnabled={!isPaused}
            rotateEnabled={!isPaused}
          >
            {waypoints.length > 0 && (
              <Polyline
                coordinates={waypoints.map(wp => ({
                  latitude: wp.coordinates.latitude,
                  longitude: wp.coordinates.longitude
                }))}
                strokeColor="#3C6E47"
                strokeWidth={4}
              />
            )}
            
            {waypoints.map((waypoint, index) => (
              <Marker
                key={index}
                coordinate={{
                  latitude: waypoint.coordinates.latitude,
                  longitude: waypoint.coordinates.longitude
                }}
                pinColor={index === 0 ? "#27AE60" : index === waypoints.length - 1 ? "#C0392B" : "#3C6E47"}
                opacity={0.8}
                onPress={() => {}} // Prevent map press from being triggered
                onLongPress={() => handleMarkerLongPress(index)}
              />
            ))}
          </MapView>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3C6E47" />
            <Text style={styles.loadingText}>
              {error ? error : 'Getting your location...'}
            </Text>
          </View>
        )}
        
        {/* Recording indicator */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View 
              style={[
                styles.recordingDot, 
                isPaused ? styles.recordingDotPaused : {}
              ]} 
            />
            <Text style={styles.recordingText}>
              {isPaused ? 'PAUSED' : 'RECORDING'}
            </Text>
          </View>
        )}
      </View>
      
      {/* Recording Controls */}
      {renderRecordingControls()}
      
      {/* Save Trail Modal */}
      {renderSaveTrailModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e74c3c',
    marginRight: 6,
  },
  recordingDotPaused: {
    backgroundColor: '#f39c12',
  },
  recordingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recordingControlsContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 16,
  },
  methodSelector: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3C6E47',
  },
  methodButtonActive: {
    backgroundColor: '#3C6E47',
  },
  methodButtonText: {
    fontSize: 14,
    color: '#3C6E47',
    marginLeft: 6,
  },
  methodButtonTextActive: {
    color: '#fff',
  },
  startButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3C6E47',
    paddingVertical: 14,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  activeRecordingControls: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    minWidth: 80,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  recordingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recordingButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#3C6E47',
  },
  recordingButtonText: {
    color: '#3C6E47',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  stopButton: {
    backgroundColor: '#e74c3c',
    borderColor: '#e74c3c',
  },
  stopButtonText: {
    color: '#fff',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
  },
  trailTypeContainer: {
    paddingBottom: 8,
  },
  trailTypeButton: {
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    marginBottom: 8,
    width: 100,
  },
  trailTypeButtonSelected: {
    backgroundColor: '#3C6E47',
  },
  trailTypeButtonText: {
    fontSize: 12,
    color: '#555',
    marginTop: 6,
    textAlign: 'center',
  },
  trailTypeButtonTextSelected: {
    color: '#fff',
  },
  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  difficultyButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: '23%',
    alignItems: 'center',
  },
  difficultyButtonText: {
    fontSize: 14,
    color: '#555',
  },
  difficultyButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  trailStatsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  trailStatsContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  trailStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  trailStatLabel: {
    fontSize: 14,
    color: '#555',
  },
  trailStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#3C6E47',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RecordTrailScreen;