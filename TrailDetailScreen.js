// TrailDetailScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  Share,
  Alert
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';

const { width, height } = Dimensions.get('window');

const TrailDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const mapRef = useRef(null);
  const { id } = route.params || {};
  
  // State variables
  const [trail, setTrail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'chart', 'photos'
  const [mapRegion, setMapRegion] = useState(null);
  
  // Fetch trail data
  useEffect(() => {
    fetchTrailData();
  }, [id]);
  
  // Fetch trail data
  const fetchTrailData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would be an API call
      // For now, use mock data for demonstration
      setTimeout(() => {
        const mockTrail = {
          id: id || 'trail1',
          name: route.params?.name || 'Forest Loop Trail',
          locationId: 'loc123',
          locationName: 'Hidden Valley Park',
          description: 'A beautiful loop trail through dense forest with several stream crossings and panoramic viewpoints. Great for hikers of all skill levels.',
          type: 'hiking',
          difficulty: 'moderate',
          creator: {
            id: 'user123',
            username: 'trailguru',
            avatarUrl: 'https://via.placeholder.com/50'
          },
          metrics: {
            distance: 7500, // meters
            elevationGain: 350, // meters
            elevationLoss: 350, // meters
            highestPoint: 842, // meters
            lowestPoint: 620, // meters
            estimatedTime: 180, // minutes
            duration: 165 // actual time in minutes
          },
          waypoints: [
            { coordinates: { latitude: 37.7749, longitude: -122.4194 }, elevation: 620, timestamp: new Date('2023-09-10T09:30:00') },
            { coordinates: { latitude: 37.7739, longitude: -122.4174 }, elevation: 650, timestamp: new Date('2023-09-10T09:45:00') },
            { coordinates: { latitude: 37.7719, longitude: -122.4164 }, elevation: 720, timestamp: new Date('2023-09-10T10:15:00') },
            { coordinates: { latitude: 37.7709, longitude: -122.4144 }, elevation: 780, timestamp: new Date('2023-09-10T10:45:00') },
            { coordinates: { latitude: 37.7729, longitude: -122.4124 }, elevation: 842, timestamp: new Date('2023-09-10T11:15:00') },
            { coordinates: { latitude: 37.7749, longitude: -122.4114 }, elevation: 800, timestamp: new Date('2023-09-10T11:45:00') },
            { coordinates: { latitude: 37.7769, longitude: -122.4134 }, elevation: 730, timestamp: new Date('2023-09-10T12:00:00') },
            { coordinates: { latitude: 37.7759, longitude: -122.4164 }, elevation: 670, timestamp: new Date('2023-09-10T12:15:00') },
            { coordinates: { latitude: 37.7749, longitude: -122.4194 }, elevation: 620, timestamp: new Date('2023-09-10T12:45:00') }
          ],
          media: [
            { id: 'photo1', type: 'photo', url: 'https://via.placeholder.com/500x300', thumbnail: 'https://via.placeholder.com/100', description: 'Forest view' },
            { id: 'photo2', type: 'photo', url: 'https://via.placeholder.com/500x300', thumbnail: 'https://via.placeholder.com/100', description: 'Stream crossing' },
            { id: 'photo3', type: 'photo', url: 'https://via.placeholder.com/500x300', thumbnail: 'https://via.placeholder.com/100', description: 'Viewpoint' }
          ],
          weather: {
            condition: 'clear',
            temperature: 72, // fahrenheit
            humidity: 45, // percent
            windSpeed: 5 // mph
          },
          createdAt: '2023-09-10T09:30:00Z',
          updatedAt: '2023-09-10T13:00:00Z'
        };
        
        setTrail(mockTrail);
        
        // Set map region based on trail waypoints
        if (mockTrail.waypoints && mockTrail.waypoints.length > 0) {
          // Find bounding box
          let minLat = mockTrail.waypoints[0].coordinates.latitude;
          let maxLat = mockTrail.waypoints[0].coordinates.latitude;
          let minLng = mockTrail.waypoints[0].coordinates.longitude;
          let maxLng = mockTrail.waypoints[0].coordinates.longitude;
          
          mockTrail.waypoints.forEach(wp => {
            minLat = Math.min(minLat, wp.coordinates.latitude);
            maxLat = Math.max(maxLat, wp.coordinates.latitude);
            minLng = Math.min(minLng, wp.coordinates.longitude);
            maxLng = Math.max(maxLng, wp.coordinates.longitude);
          });
          
          // Center point
          const centerLat = (minLat + maxLat) / 2;
          const centerLng = (minLng + maxLng) / 2;
          
          // Delta with padding
          const latDelta = (maxLat - minLat) * 1.5;
          const lngDelta = (maxLng - minLng) * 1.5;
          
          setMapRegion({
            latitude: centerLat,
            longitude: centerLng,
            latitudeDelta: Math.max(latDelta, 0.01),
            longitudeDelta: Math.max(lngDelta, 0.01),
          });
        }
        
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Error fetching trail data:', err);
      setError('Failed to load trail details. Please try again.');
      setLoading(false);
    }
  };
  
  // Share trail
  const handleShareTrail = async () => {
    if (!trail) return;
    
    try {
      await Share.share({
        message: `Check out this awesome trail I found on TrailTrades: ${trail.name} in ${trail.locationName}`,
        // In a real app, you would include a deep link URL here
        url: `trailtrades://trails/${trail.id}`
      });
    } catch (err) {
      console.error('Share error:', err);
    }
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
  
  // Format time for display (minutes to hours:minutes)
  const formatTime = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hrs === 0) {
      return `${mins} min`;
    } else {
      return `${hrs}h ${mins}m`;
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Get icon for trail type
  const getTrailTypeIcon = (type) => {
    switch (type) {
      case 'hiking':
        return 'walk';
      case 'mountain_biking':
        return 'bike';
      case 'dirt_biking':
        return 'motorbike';
      case 'offroading':
        return 'car-4x4';
      default:
        return 'map-marker-path';
    }
  };
  
  // Get color for difficulty level
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return '#27AE60';
      case 'moderate':
        return '#F39C12';
      case 'difficult':
        return '#E67E22';
      case 'extreme':
        return '#C0392B';
      default:
        return '#3C6E47';
    }
  };
  
  // Get icon for weather condition
  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'clear':
        return 'sunny';
      case 'cloudy':
        return 'cloudy';
      case 'rainy':
        return 'rainy';
      case 'snowy':
        return 'snow';
      case 'stormy':
        return 'thunderstorm';
      default:
        return 'partly-sunny';
    }
  };
  
  // Prepare elevation data for chart
  const prepareElevationData = () => {
    if (!trail || !trail.waypoints) return null;
    
    // Extract elevation data from waypoints
    const elevationData = trail.waypoints.map((wp, index) => ({
      elevation: wp.elevation,
      distance: index === 0 ? 0 : calculateDistance(
        trail.waypoints[0].coordinates.latitude,
        trail.waypoints[0].coordinates.longitude,
        wp.coordinates.latitude,
        wp.coordinates.longitude
      ) / 1000 // Convert to km
    }));
    
    return elevationData;
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
  
  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3C6E47" />
        <Text style={styles.loadingText}>Loading trail details...</Text>
      </View>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchTrailData}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Render if no trail found
  if (!trail) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
        <Text style={styles.errorText}>Trail not found</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Prepare elevation data for chart
  const elevationData = prepareElevationData();
  const chartData = {
    labels: elevationData.map(data => data.distance.toFixed(1)),
    datasets: [
      {
        data: elevationData.map(data => data.elevation),
        color: (opacity = 1) => `rgba(60, 110, 71, ${opacity})`,
        strokeWidth: 2
      }
    ]
  };
  
  return (
    <ScrollView style={styles.container}>
      {/* Map View */}
      <View style={styles.mapContainer}>
        {mapRegion && (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={mapRegion}
            scrollEnabled={true}
            zoomEnabled={true}
            pitchEnabled={false}
          >
            {trail.waypoints.length > 0 && (
              <Polyline
                coordinates={trail.waypoints.map(wp => ({
                  latitude: wp.coordinates.latitude,
                  longitude: wp.coordinates.longitude
                }))}
                strokeColor="#3C6E47"
                strokeWidth={4}
              />
            )}
            
            {/* Start Marker */}
            <Marker
              coordinate={{
                latitude: trail.waypoints[0].coordinates.latitude,
                longitude: trail.waypoints[0].coordinates.longitude
              }}
              pinColor="#27AE60"
            >
              <Ionicons name="flag" size={24} color="#27AE60" />
            </Marker>
            
            {/* End Marker */}
            <Marker
              coordinate={{
                latitude: trail.waypoints[trail.waypoints.length - 1].coordinates.latitude,
                longitude: trail.waypoints[trail.waypoints.length - 1].coordinates.longitude
              }}
              pinColor="#C0392B"
            >
              <Ionicons name="flag-outline" size={24} color="#C0392B" />
            </Marker>
          </MapView>
        )}
        
        <TouchableOpacity
          style={styles.expandMapButton}
          onPress={() => {
            // In a real app, navigate to a full screen map
            Alert.alert('Expand Map', 'This would open a full screen map view');
          }}
        >
          <Ionicons name="expand" size={20} color="#3C6E47" />
        </TouchableOpacity>
      </View>
      
      {/* Basic Info Panel */}
      <View style={styles.infoPanel}>
        <Text style={styles.trailName}>{trail.name}</Text>
        
        <View style={styles.locationRow}>
          <Ionicons name="location" size={16} color="#555" />
          <Text style={styles.locationText}>{trail.locationName}</Text>
        </View>
        
        <View style={styles.trailMeta}>
          <View style={styles.trailTypeContainer}>
            <MaterialCommunityIcons name={getTrailTypeIcon(trail.type)} size={16} color="#555" />
            <Text style={styles.trailTypeText}>
              {trail.type.charAt(0).toUpperCase() + trail.type.slice(1)}
            </Text>
          </View>
          
          <View 
            style={[
              styles.difficultyTag,
              { backgroundColor: getDifficultyColor(trail.difficulty) }
            ]}
          >
            <Text style={styles.difficultyText}>
              {trail.difficulty.charAt(0).toUpperCase() + trail.difficulty.slice(1)}
            </Text>
          </View>
        </View>
        
        <View style={styles.creatorRow}>
          <Image
            source={{ uri: trail.creator.avatarUrl }}
            style={styles.creatorAvatar}
          />
          <Text style={styles.creatorText}>
            Recorded by <Text style={styles.creatorName}>{trail.creator.username}</Text>
          </Text>
          <Text style={styles.trailDate}>
            {formatDate(trail.createdAt)}
          </Text>
        </View>
      </View>
      
      {/* Trail Stats Panel */}
      <View style={styles.statsPanel}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatDistance(trail.metrics.distance)}</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{trail.metrics.elevationGain}m</Text>
          <Text style={styles.statLabel}>Elevation Gain</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatTime(trail.metrics.duration)}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
      </View>
      
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'overview' ? styles.activeTabButton : {}]}
          onPress={() => setActiveTab('overview')}
        >
          <Ionicons
            name="information-circle"
            size={20}
            color={activeTab === 'overview' ? '#3C6E47' : '#888'}
          />
          <Text
            style={[styles.tabButtonText, activeTab === 'overview' ? styles.activeTabButtonText : {}]}
          >
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'chart' ? styles.activeTabButton : {}]}
          onPress={() => setActiveTab('chart')}
        >
          <Ionicons
            name="trending-up"
            size={20}
            color={activeTab === 'chart' ? '#3C6E47' : '#888'}
          />
          <Text
            style={[styles.tabButtonText, activeTab === 'chart' ? styles.activeTabButtonText : {}]}
          >
            Elevation
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'photos' ? styles.activeTabButton : {}]}
          onPress={() => setActiveTab('photos')}
        >
          <Ionicons
            name="images"
            size={20}
            color={activeTab === 'photos' ? '#3C6E47' : '#888'}
          />
          <Text
            style={[styles.tabButtonText, activeTab === 'photos' ? styles.activeTabButtonText : {}]}
          >
            Photos ({trail.media?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Tab Content */}
      <View style={styles.tabContent}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <View>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{trail.description}</Text>
            
            <View style={styles.divider} />
            
            <Text style={styles.sectionTitle}>Trail Details</Text>
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Distance:</Text>
                <Text style={styles.detailValue}>{formatDistance(trail.metrics.distance)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Elevation Gain:</Text>
                <Text style={styles.detailValue}>{trail.metrics.elevationGain}m</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Elevation Loss:</Text>
                <Text style={styles.detailValue}>{trail.metrics.elevationLoss}m</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Highest Point:</Text>
                <Text style={styles.detailValue}>{trail.metrics.highestPoint}m</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Lowest Point:</Text>
                <Text style={styles.detailValue}>{trail.metrics.lowestPoint}m</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Duration:</Text>
                <Text style={styles.detailValue}>{formatTime(trail.metrics.duration)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Estimated Time:</Text>
                <Text style={styles.detailValue}>{formatTime(trail.metrics.estimatedTime)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Difficulty:</Text>
                <View 
                  style={[
                    styles.difficultyTagSmall,
                    { backgroundColor: getDifficultyColor(trail.difficulty) }
                  ]}
                >
                  <Text style={styles.difficultyTextSmall}>
                    {trail.difficulty.charAt(0).toUpperCase() + trail.difficulty.slice(1)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type:</Text>
                <Text style={styles.detailValue}>
                  {trail.type.charAt(0).toUpperCase() + trail.type.slice(1).replace('_', ' ')}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Recorded On:</Text>
                <Text style={styles.detailValue}>{formatDate(trail.createdAt)}</Text>
              </View>
            </View>
            
            {trail.weather && (
              <>
                <View style={styles.divider} />
                
                <Text style={styles.sectionTitle}>Weather Conditions</Text>
                <View style={styles.weatherContainer}>
                  <View style={styles.weatherMain}>
                    <Ionicons name={getWeatherIcon(trail.weather.condition)} size={36} color="#555" />
                    <Text style={styles.weatherCondition}>
                      {trail.weather.condition.charAt(0).toUpperCase() + trail.weather.condition.slice(1)}
                    </Text>
                  </View>
                  
                  <View style={styles.weatherDetails}>
                    <View style={styles.weatherDetail}>
                      <Text style={styles.weatherDetailLabel}>Temperature</Text>
                      <Text style={styles.weatherDetailValue}>{trail.weather.temperature}°F</Text>
                    </View>
                    
                    <View style={styles.weatherDetail}>
                      <Text style={styles.weatherDetailLabel}>Humidity</Text>
                      <Text style={styles.weatherDetailValue}>{trail.weather.humidity}%</Text>
                    </View>
                    
                    <View style={styles.weatherDetail}>
                      <Text style={styles.weatherDetailLabel}>Wind</Text>
                      <Text style={styles.weatherDetailValue}>{trail.weather.windSpeed} mph</Text>
                    </View>
                  </View>
                </View>
              </>
            )}
            
            <View style={styles.divider} />
            
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleShareTrail}
              >
                <Ionicons name="share-outline" size={24} color="#3C6E47" />
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  // In a real app, download GPX file
                  Alert.alert('Download', 'This would download the GPX file of the trail');
                }}
              >
                <Ionicons name="download-outline" size={24} color="#3C6E47" />
                <Text style={styles.actionButtonText}>Download</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  // In a real app, navigate to add photo screen
                  navigation.navigate('UploadMedia', { 
                    trailId: trail.id, 
                    locationId: trail.locationId 
                  });
                }}
              >
                <Ionicons name="camera-outline" size={24} color="#3C6E47" />
                <Text style={styles.actionButtonText}>Add Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Elevation Chart Tab */}
        {activeTab === 'chart' && (
          <View>
            <Text style={styles.sectionTitle}>Elevation Profile</Text>
            <View style={styles.chartContainer}>
              {elevationData && (
                <LineChart
                  data={chartData}
                  width={width - 32}
                  height={220}
                  chartConfig={{
                    backgroundColor: '#fff',
                    backgroundGradientFrom: '#fff',
                    backgroundGradientTo: '#fff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(60, 110, 71, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(85, 85, 85, ${opacity})`,
                    style: {
                      borderRadius: 8
                    },
                    propsForDots: {
                      r: '3',
                      strokeWidth: '1',
                      stroke: '#3C6E47'
                    },
                    propsForBackgroundLines: {
                      strokeDasharray: ''
                    }
                  }}
                  bezier
                  style={{
                    marginVertical: 8,
                    borderRadius: 8
                  }}
                  withShadow={false}
                  withInnerLines={true}
                  withOuterLines={true}
                  withVerticalLines={false}
                  withHorizontalLines={true}
                  yAxisLabel=""
                  yAxisSuffix="m"
                  xAxisLabel="km"
                  xAxisSuffix=""
                  fromZero={false}
                />
              )}
            </View>
            
            <View style={styles.elevationStats}>
              <View style={styles.elevationStat}>
                <Text style={styles.elevationStatLabel}>Elevation Gain</Text>
                <Text style={styles.elevationStatValue}>{trail.metrics.elevationGain}m</Text>
              </View>
              
              <View style={styles.elevationStat}>
                <Text style={styles.elevationStatLabel}>Elevation Loss</Text>
                <Text style={styles.elevationStatValue}>{trail.metrics.elevationLoss}m</Text>
              </View>
              
              <View style={styles.elevationStat}>
                <Text style={styles.elevationStatLabel}>Highest Point</Text>
                <Text style={styles.elevationStatValue}>{trail.metrics.highestPoint}m</Text>
              </View>
              
              <View style={styles.elevationStat}>
                <Text style={styles.elevationStatLabel}>Lowest Point</Text>
                <Text style={styles.elevationStatValue}>{trail.metrics.lowestPoint}m</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <Text style={styles.sectionTitle}>Gradient Analysis</Text>
            <Text style={styles.gradientText}>
              This trail has a moderate gradient with some steeper sections. 
              The steepest section occurs between kilometer 2 and 3, with a 
              gradient of approximately 15%. The trail is mostly uphill for the 
              first half and downhill for the second half, forming a loop.
            </Text>
          </View>
        )}
        
        {/* Photos Tab */}
        {activeTab === 'photos' && (
          <View>
            <Text style={styles.sectionTitle}>Trail Photos</Text>
            
            {trail.media && trail.media.length > 0 ? (
              <View style={styles.photoGrid}>
                {trail.media.map(item => (
                  <TouchableOpacity 
                    key={item.id}
                    style={styles.photoItem}
                    onPress={() => navigation.navigate('MediaDetail', { id: item.id })}
                  >
                    <Image
                      source={{ uri: item.url }}
                      style={styles.photo}
                    />
                    {item.description && (
                      <View style={styles.photoDescription}>
                        <Text style={styles.photoDescriptionText} numberOfLines={1}>
                          {item.description}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
                
                <TouchableOpacity 
                  style={styles.addPhotoButton}
                  onPress={() => navigation.navigate('UploadMedia', { 
                    trailId: trail.id, 
                    locationId: trail.locationId 
                  })}
                >
                  <Ionicons name="add" size={32} color="#888" />
                  <Text style={styles.addPhotoText}>Add Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyPhotosContainer}>
                <Ionicons name="images-outline" size={48} color="#ccc" />
                <Text style={styles.emptyPhotosText}>No photos available</Text>
                <TouchableOpacity 
                  style={styles.addPhotosButton}
                  onPress={() => navigation.navigate('UploadMedia', { 
                    trailId: trail.id, 
                    locationId: trail.locationId 
                  })}
                >
                  <Text style={styles.addPhotosButtonText}>Add Photos</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginVertical: 12,
  },
  retryButton: {
    backgroundColor: '#3C6E47',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mapContainer: {
    height: 200,
    width: '100%',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  expandMapButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#fff',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  infoPanel: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  trailName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 16,
    color: '#555',
    marginLeft: 6,
  },
  trailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  trailTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  trailTypeText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 4,
  },
  difficultyTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  creatorText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  creatorName: {
    fontWeight: '600',
    color: '#333',
  },
  trailDate: {
    fontSize: 12,
    color: '#888',
  },
  statsPanel: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#3C6E47',
  },
  tabButtonText: {
    fontSize: 14,
    color: '#888',
    marginLeft: 4,
  },
  activeTabButtonText: {
    color: '#3C6E47',
    fontWeight: '600',
  },
  tabContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  detailsContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#555',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  difficultyTagSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  difficultyTextSmall: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  weatherContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
  },
  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  weatherCondition: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weatherDetail: {
    alignItems: 'center',
  },
  weatherDetailLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  weatherDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#3C6E47',
    marginTop: 4,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  elevationStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  elevationStat: {
    width: '50%',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  elevationStatLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  elevationStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  gradientText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -4,
  },
  photoItem: {
    width: (width - 32 - 8) / 2, // Adjusted for padding
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: 150,
  },
  photoDescription: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 6,
  },
  photoDescriptionText: {
    color: '#fff',
    fontSize: 12,
  },
  addPhotoButton: {
    width: (width - 32 - 8) / 2, // Adjusted for padding
    height: 150,
    margin: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    marginTop: 8,
    fontSize: 14,
    color: '#888',
  },
  emptyPhotosContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyPhotosText: {
    fontSize: 16,
    color: '#888',
    marginTop: 12,
    marginBottom: 16,
  },
  addPhotosButton: {
    backgroundColor: '#3C6E47',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addPhotosButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TrailDetailScreen;