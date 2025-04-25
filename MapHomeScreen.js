// MapHomeScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Platform, 
  SafeAreaView,
  Modal,
  ActivityIndicator,
  Dimensions,
  Image
} from 'react-native';
import MapView, { Marker, Polyline, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import FilterBar from '../components/FilterBar';
import LocationPreviewCard from '../components/LocationPreviewCard';
import { trailtrades_searchLocations } from '../../functions/trailtrades_searchLocations';

const { width, height } = Dimensions.get('window');

const MapHomeScreen = () => {
  const navigation = useNavigation();
  const mapRef = useRef(null);

  // State variables
  const [userLocation, setUserLocation] = useState(null);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    categories: [],
    vehicleRequirements: {
      fourWDOnly: false,
      highClearanceOnly: false,
      rvFriendly: false
    },
    difficulty: null,
    privacyLevel: 'all',
    radius: 50 // miles
  });
  const [showLocationPreview, setShowLocationPreview] = useState(false);

  // Get user's location and load nearby locations on component mount
  useEffect(() => {
    (async () => {
      try {
        // Request location permissions
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission to access location was denied');
          setLoading(false);
          return;
        }

        // Get current position
        let position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        const currentLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        
        setUserLocation(currentLocation);
        
        // Load initial locations with current position
        await loadNearbyLocations(currentLocation);
      } catch (err) {
        console.error('Error getting location:', err);
        setError('Could not get your location');
        setLoading(false);
      }
    })();
  }, []);

  // Load nearby locations based on position and filters
  const loadNearbyLocations = async (location) => {
    setLoading(true);
    setError(null);
    
    try {
      // Build search parameters
      const searchParameters = {
        location: location,
        radius: activeFilters.radius,
        categories: activeFilters.categories.length > 0 ? activeFilters.categories : undefined,
        vehicleRequirements: {
          fourWDOnly: activeFilters.vehicleRequirements.fourWDOnly,
          highClearanceOnly: activeFilters.vehicleRequirements.highClearanceOnly,
          rvFriendly: activeFilters.vehicleRequirements.rvFriendly
        },
        difficulty: activeFilters.difficulty,
        privacyLevel: activeFilters.privacyLevel !== 'all' ? activeFilters.privacyLevel : undefined,
        limit: 50,
        viewType: 'map'
      };
      
      // Call search function
      const results = await trailtrades_searchLocations(searchParameters);
      
      setLocations(results.locations);
    } catch (err) {
      console.error('Error loading locations:', err);
      setError('Failed to load locations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Refresh locations when filters change
  useEffect(() => {
    if (userLocation) {
      loadNearbyLocations(userLocation);
    }
  }, [activeFilters]);

  // Handle map region change
  const handleRegionChange = async (region) => {
    // Get center point of new region
    const centerLocation = {
      latitude: region.latitude,
      longitude: region.longitude
    };
    
    // Only reload if moved significantly (to avoid too many API calls)
    if (userLocation && 
        Math.abs(centerLocation.latitude - userLocation.latitude) > 0.05 ||
        Math.abs(centerLocation.longitude - userLocation.longitude) > 0.05) {
      await loadNearbyLocations(centerLocation);
    }
  };

  // Handle marker press
  const handleMarkerPress = (location) => {
    setSelectedLocation(location);
    setShowLocationPreview(true);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setActiveFilters({
      ...activeFilters,
      ...newFilters
    });
  };

  // Render marker based on location type/category
  const renderMarker = (location) => {
    // Determine marker color based on location type/category
    let markerColor = '#3C6E47'; // Default green
    
    if (location.categories) {
      if (location.categories.includes('offroading')) {
        markerColor = '#D35400'; // Orange for offroading
      } else if (location.categories.includes('camping')) {
        markerColor = '#8E44AD'; // Purple for camping
      } else if (location.categories.includes('mountain_biking') || 
                location.categories.includes('dirt_biking')) {
        markerColor = '#2980B9'; // Blue for biking
      }
    }
    
    // Change marker appearance for trade locations
    const isTradeLocation = location.privacyLevel === 'trade' && !location.userHasAccess;
    
    return (
      <Marker
        key={location.id}
        coordinate={{
          latitude: location.coordinates.latitude,
          longitude: location.coordinates.longitude
        }}
        pinColor={markerColor}
        opacity={isTradeLocation ? 0.7 : 1}
        onPress={() => handleMarkerPress(location)}
      >
        <Callout tooltip>
          <View style={styles.callout}>
            <Text style={styles.calloutTitle}>{location.name}</Text>
            {location.preview && location.preview.photoUrl && (
              <Image 
                source={{ uri: location.preview.photoUrl }} 
                style={styles.calloutImage} 
              />
            )}
            {isTradeLocation && (
              <View style={styles.tradeTag}>
                <Ionicons name="swap-horizontal" size={12} color="#fff" />
                <Text style={styles.tradeText}>Trade</Text>
              </View>
            )}
          </View>
        </Callout>
      </Marker>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Filter Bar */}
      <FilterBar 
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
      />
      
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
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation
            showsMyLocationButton
            onRegionChangeComplete={handleRegionChange}
          >
            {locations.map(location => renderMarker(location))}
          </MapView>
        ) : (
          <View style={styles.loadingContainer}>
            {loading ? (
              <ActivityIndicator size="large" color="#3C6E47" />
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    setLoading(true);
                    // Try to get location again
                    Location.getCurrentPositionAsync({
                      accuracy: Location.Accuracy.Balanced,
                    }).then(position => {
                      const location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                      };
                      setUserLocation(location);
                      loadNearbyLocations(location);
                    }).catch(err => {
                      console.error('Error getting location:', err);
                      setError('Could not get your location');
                      setLoading(false);
                    });
                  }}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}
        
        {/* Loading Indicator */}
        {loading && userLocation && (
          <View style={styles.mapLoadingOverlay}>
            <ActivityIndicator size="large" color="#3C6E47" />
          </View>
        )}
        
        {/* Map Control Buttons */}
        <View style={styles.mapControlsContainer}>
          <TouchableOpacity
            style={styles.mapControlButton}
            onPress={() => {
              if (mapRef.current && userLocation) {
                mapRef.current.animateToRegion({
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                });
              }
            }}
          >
            <Ionicons name="locate" size={24} color="#3C6E47" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.mapControlButton}
            onPress={() => navigation.navigate('AddLocation')}
          >
            <Ionicons name="add-circle" size={24} color="#3C6E47" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Location Preview */}
      {showLocationPreview && selectedLocation && (
        <LocationPreviewCard
          location={selectedLocation}
          onClose={() => setShowLocationPreview(false)}
          onViewDetails={() => {
            setShowLocationPreview(false);
            navigation.navigate('LocationDetail', { 
              id: selectedLocation.id,
              name: selectedLocation.name
            });
          }}
        />
      )}
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
  mapLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3C6E47',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  callout: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  calloutImage: {
    width: '100%',
    height: 100,
    borderRadius: 6,
    marginBottom: 8,
  },
  tradeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3C6E47',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  tradeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  mapControlsContainer: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    flexDirection: 'column',
  },
  mapControlButton: {
    backgroundColor: '#fff',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default MapHomeScreen;