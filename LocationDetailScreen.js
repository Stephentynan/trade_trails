// LocationDetailScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Share,
  Alert
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation, useRoute } from '@react-navigation/native';
import { trailtrades_performTrade } from '../../functions/trailtrades_performTrade';

const { width, height } = Dimensions.get('window');

const LocationDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const mapRef = useRef(null);
  const { id } = route.params;
  
  // State variables
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userCredits, setUserCredits] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'trails', 'photos'
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeError, setTradeError] = useState(null);

  // Fetch location details on mount
  useEffect(() => {
    fetchLocationDetails();
    fetchUserCredits();
    
    // Get user's location
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        }
      } catch (err) {
        console.error('Error getting location:', err);
      }
    })();
  }, [id]);

  // Fetch location details from API
  const fetchLocationDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // This would normally be an API call
      // For now, simulate a fetch with setTimeout
      setTimeout(() => {
        // Simulated location data
        const locationData = {
          id,
          name: route.params?.name || 'Location Details',
          description: 'This is a beautiful hiking trail with stunning views of the surrounding mountains and valleys. Perfect for a day trip with moderate difficulty level.',
          coordinates: {
            latitude: 37.7749,
            longitude: -122.4194,
            isApproximate: false
          },
          categories: ['hiking', 'offroading'],
          tags: ['scenic', 'waterfall', 'forest'],
          creator: {
            id: 'user123',
            username: 'trailguru',
            avatarUrl: 'https://via.placeholder.com/50'
          },
          trails: [
            {
              id: 'trail1',
              name: 'Main Loop Trail',
              length: 5.2, // miles
              difficulty: 'moderate',
              elevationGain: 850, // feet
              estimatedTime: '2.5 hours'
            },
            {
              id: 'trail2',
              name: 'Waterfall Spur',
              length: 1.8, // miles
              difficulty: 'easy',
              elevationGain: 250, // feet
              estimatedTime: '45 minutes'
            }
          ],
          media: [
            {
              id: 'photo1',
              type: 'photo',
              url: 'https://via.placeholder.com/500x300',
              thumbnail: 'https://via.placeholder.com/100x100',
              description: 'Scenic overlook'
            },
            {
              id: 'photo2',
              type: 'photo',
              url: 'https://via.placeholder.com/500x300',
              thumbnail: 'https://via.placeholder.com/100x100',
              description: 'Trail entrance'
            },
            {
              id: 'photo3',
              type: 'photo',
              url: 'https://via.placeholder.com/500x300',
              thumbnail: 'https://via.placeholder.com/100x100',
              description: 'Waterfall'
            }
          ],
          vehicleRequirements: {
            fourWDRequired: true,
            highClearanceRequired: true,
            rvFriendly: false,
            minClearanceInches: 8
          },
          privacyLevel: 'trade',
          userHasAccess: false,
          tradeCredits: 15,
          rating: 4.8,
          reviewCount: 24,
          createdAt: '2023-05-15T12:00:00Z',
          updatedAt: '2023-06-20T14:30:00Z'
        };
        
        setLocation(locationData);
        setLoading(false);
      }, 1500); // Simulate network delay
    } catch (err) {
      console.error('Error fetching location details:', err);
      setError('Failed to load location details. Please try again.');
      setLoading(false);
    }
  };

  // Fetch user credits
  const fetchUserCredits = async () => {
    try {
      // This would normally be an API call
      // For now, just set a static value
      setUserCredits(20);
    } catch (err) {
      console.error('Error fetching user credits:', err);
    }
  };

  // Perform trade for location
  const handleTradeForLocation = async () => {
    if (!location) return;
    
    // Check if user has enough credits
    if (userCredits < location.tradeCredits) {
      Alert.alert(
        'Insufficient Credits',
        `You need ${location.tradeCredits} credits to trade for this location. You currently have ${userCredits} credits.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Confirm trade
    Alert.alert(
      'Confirm Trade',
      `Are you sure you want to trade ${location.tradeCredits} credits for access to "${location.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Trade', 
          onPress: async () => {
            setTradeLoading(true);
            setTradeError(null);
            
            try {
              // Call trade function
              const tradeResult = await trailtrades_performTrade(
                'credit',
                { locationId: location.id, creditAmount: location.tradeCredits },
                { autoDownload: true }
              );
              
              // Update state
              setLocation({
                ...location,
                userHasAccess: true
              });
              
              // Update user credits
              setUserCredits(tradeResult.remainingCredits);
              
              // Show success message
              Alert.alert(
                'Trade Successful',
                'You now have access to this location. The location details have been saved for offline use.',
                [{ text: 'Great!' }]
              );
            } catch (err) {
              console.error('Trade error:', err);
              setTradeError(err.message || 'Failed to complete trade. Please try again.');
            } finally {
              setTradeLoading(false);
            }
          }
        }
      ]
    );
  };

  // Share location
  const handleShareLocation = async () => {
    try {
      await Share.share({
        message: `Check out this awesome location I found on TrailTrades: ${location.name}`,
        // In a real app, you would include a deep link URL here
        url: `trailtrades://locations/${location.id}`
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3C6E47" />
        <Text style={styles.loadingText}>Loading location details...</Text>
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
          onPress={fetchLocationDetails}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render if no location found
  if (!location) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
        <Text style={styles.errorText}>Location not found</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Determine if access to full details is allowed
  const hasAccess = location.privacyLevel === 'public' || location.userHasAccess;
  
  // Get display coordinates (exact or approximate)
  const displayCoordinates = {
    latitude: location.coordinates.latitude,
    longitude: location.coordinates.longitude
  };

  // Format vehicle requirements
  const formatVehicleRequirements = () => {
    if (!location.vehicleRequirements) return null;
    
    const requirements = [];
    
    if (location.vehicleRequirements.fourWDRequired) {
      requirements.push('4WD required');
    }
    
    if (location.vehicleRequirements.highClearanceRequired) {
      requirements.push('High clearance required');
    }
    
    if (location.vehicleRequirements.minClearanceInches) {
      requirements.push(`${location.vehicleRequirements.minClearanceInches}" minimum clearance`);
    }
    
    if (location.vehicleRequirements.rvFriendly) {
      requirements.push('RV friendly');
    }
    
    return requirements.join(' • ');
  };

  // Format categories
  const formatCategories = () => {
    const categoryNames = {
      'hiking': 'Hiking',
      'camping': 'Camping',
      'mountain_biking': 'Mountain Biking',
      'dirt_biking': 'Dirt Biking',
      'offroading': 'Offroading',
      'rv_safe': 'RV-Safe'
    };
    
    if (!location.categories || location.categories.length === 0) {
      return 'Uncategorized';
    }
    
    return location.categories
      .map(cat => categoryNames[cat] || cat)
      .join(' • ');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: displayCoordinates.latitude,
            longitude: displayCoordinates.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
        >
          <Marker
            coordinate={displayCoordinates}
            pinColor="#3C6E47"
          />
        </MapView>
        
        {!hasAccess && (
          <View style={styles.mapOverlay}>
            <Ionicons name="lock-closed" size={36} color="#fff" />
            <Text style={styles.mapOverlayText}>
              Trade for exact location
            </Text>
          </View>
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
        <Text style={styles.locationName}>{location.name}</Text>
        
        <View style={styles.categoryRow}>
          <Text style={styles.categoryText}>{formatCategories()}</Text>
        </View>
        
        {location.rating > 0 && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={18} color="#FFD700" />
            <Text style={styles.ratingText}>
              {location.rating.toFixed(1)} ({location.reviewCount} reviews)
            </Text>
          </View>
        )}
        
        <View style={styles.creatorRow}>
          <Image
            source={{ uri: location.creator.avatarUrl }}
            style={styles.creatorAvatar}
          />
          <Text style={styles.creatorText}>
            Added by <Text style={styles.creatorName}>{location.creator.username}</Text>
          </Text>
        </View>
        
        {location.vehicleRequirements && formatVehicleRequirements() && (
          <View style={styles.requirementsRow}>
            <Ionicons name="car" size={16} color="#555" style={styles.requirementsIcon} />
            <Text style={styles.requirementsText}>{formatVehicleRequirements()}</Text>
          </View>
        )}
      </View>
      
      {/* Trade Panel (if applicable) */}
      {location.privacyLevel === 'trade' && !location.userHasAccess && (
        <View style={styles.tradePanel}>
          <View style={styles.tradePanelHeader}>
            <Ionicons name="swap-horizontal" size={24} color="#3C6E47" />
            <Text style={styles.tradePanelTitle}>Available for Trade</Text>
          </View>
          
          <Text style={styles.tradePanelDescription}>
            Trade {location.tradeCredits} credits to unlock the exact location, 
            trails, and all photos. Location will be available offline.
          </Text>
          
          <View style={styles.tradePanelCredits}>
            <Text style={styles.tradePanelCreditsText}>
              You have: <Text style={styles.tradePanelCreditsValue}>{userCredits} credits</Text>
            </Text>
          </View>
          
          {tradeError && (
            <Text style={styles.tradeErrorText}>{tradeError}</Text>
          )}
          
          <TouchableOpacity
            style={[
              styles.tradeButton,
              (tradeLoading || userCredits < location.tradeCredits) ? styles.tradeButtonDisabled : {}
            ]}
            onPress={handleTradeForLocation}
            disabled={tradeLoading || userCredits < location.tradeCredits}
          >
            {tradeLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="swap-horizontal" size={20} color="#fff" style={styles.tradeButtonIcon} />
                <Text style={styles.tradeButtonText}>
                  Trade for Location
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
      
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'info' ? styles.activeTabButton : {}]}
          onPress={() => setActiveTab('info')}
        >
          <Ionicons
            name="information-circle"
            size={20}
            color={activeTab === 'info' ? '#3C6E47' : '#888'}
          />
          <Text
            style={[styles.tabButtonText, activeTab === 'info' ? styles.activeTabButtonText : {}]}
          >
            Info
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'trails' ? styles.activeTabButton : {}]}
          onPress={() => setActiveTab('trails')}
        >
          <Ionicons
            name="map"
            size={20}
            color={activeTab === 'trails' ? '#3C6E47' : '#888'}
          />
          <Text
            style={[styles.tabButtonText, activeTab === 'trails' ? styles.activeTabButtonText : {}]}
          >
            Trails ({location.trails?.length || 0})
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
            Photos ({location.media?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Tab Content */}
      <View style={styles.tabContent}>
        {/* Info Tab */}
        {activeTab === 'info' && (
          <View>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{location.description}</Text>
            
            {location.tags && location.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {location.tags.map(tag => (
                  <View key={tag} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}
            
            <View style={styles.divider} />
            
            {hasAccess ? (
              <>
                <Text style={styles.sectionTitle}>Location Details</Text>
                <View style={styles.detailRow}>
                  <Ionicons name="location" size={18} color="#555" style={styles.detailIcon} />
                  <Text style={styles.detailText}>
                    {displayCoordinates.latitude.toFixed(6)}, {displayCoordinates.longitude.toFixed(6)}
                  </Text>
                  <TouchableOpacity 
                    style={styles.copyButton}
                    onPress={() => {
                      Alert.alert('Copy Coordinates', 'Coordinates copied to clipboard');
                    }}
                  >
                    <Ionicons name="copy-outline" size={16} color="#3C6E47" />
                  </TouchableOpacity>
                </View>
                
                {userLocation && (
                  <View style={styles.detailRow}>
                    <Ionicons name="navigate" size={18} color="#555" style={styles.detailIcon} />
                    <Text style={styles.detailText}>
                      20.5 miles from your location
                    </Text>
                    <TouchableOpacity 
                      style={styles.directionsButton}
                      onPress={() => {
                        Alert.alert('Get Directions', 'This would open directions in maps app');
                      }}
                    >
                      <Text style={styles.directionsButtonText}>Directions</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.lockedDetailsContainer}>
                <Ionicons name="lock-closed" size={24} color="#888" />
                <Text style={styles.lockedDetailsText}>
                  Trade for access to exact coordinates and directions
                </Text>
              </View>
            )}
            
            <View style={styles.divider} />
            
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleShareLocation}
              >
                <Ionicons name="share-outline" size={24} color="#3C6E47" />
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  Alert.alert('Save', 'This would save the location to your favorites');
                }}
              >
                <Ionicons name="bookmark-outline" size={24} color="#3C6E47" />
                <Text style={styles.actionButtonText}>Save</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  Alert.alert('Report', 'This would open the report location dialog');
                }}
              >
                <Ionicons name="flag-outline" size={24} color="#3C6E47" />
                <Text style={styles.actionButtonText}>Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Trails Tab */}
        {activeTab === 'trails' && (
          <View>
            {hasAccess ? (
              <>
                {location.trails && location.trails.length > 0 ? (
                  location.trails.map(trail => (
                    <TouchableOpacity 
                      key={trail.id}
                      style={styles.trailCard}
                      onPress={() => navigation.navigate('TrailDetail', { id: trail.id, name: trail.name })}
                    >
                      <View style={styles.trailCardHeader}>
                        <Text style={styles.trailName}>{trail.name}</Text>
                        <Ionicons name="chevron-forward" size={20} color="#888" />
                      </View>
                      
                      <View style={styles.trailDetailsContainer}>
                        <View style={styles.trailDetail}>
                          <Ionicons name="trail-sign" size={16} color="#555" />
                          <Text style={styles.trailDetailText}>{trail.length} mi</Text>
                        </View>
                        
                        <View style={styles.trailDetail}>
                          <Ionicons name="trending-up" size={16} color="#555" />
                          <Text style={styles.trailDetailText}>{trail.elevationGain} ft</Text>
                        </View>
                        
                        <View style={styles.trailDetail}>
                          <Ionicons name="time" size={16} color="#555" />
                          <Text style={styles.trailDetailText}>{trail.estimatedTime}</Text>
                        </View>
                        
                        <View style={[
                          styles.difficultyTag, 
                          trail.difficulty === 'easy' ? styles.easyTag :
                          trail.difficulty === 'moderate' ? styles.moderateTag :
                          trail.difficulty === 'difficult' ? styles.difficultTag :
                          styles.extremeTag
                        ]}>
                          <Text style={styles.difficultyText}>
                            {trail.difficulty.charAt(0).toUpperCase() + trail.difficulty.slice(1)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <Ionicons name="trail-sign-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyStateText}>No trails available</Text>
                    <TouchableOpacity 
                      style={styles.addTrailButton}
                      onPress={() => navigation.navigate('RecordTrail', { locationId: location.id })}
                    >
                      <Text style={styles.addTrailButtonText}>Add Trail</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.lockedContentContainer}>
                <Ionicons name="lock-closed" size={36} color="#888" />
                <Text style={styles.lockedContentText}>
                  Trade for access to view trails
                </Text>
                <Image
                  source={{ uri: 'https://via.placeholder.com/400x200' }}
                  style={styles.blurredPreview}
                  blurRadius={10}
                />
              </View>
            )}
          </View>
        )}
        
        {/* Photos Tab */}
        {activeTab === 'photos' && (
          <View>
            {hasAccess ? (
              <>
                {location.media && location.media.length > 0 ? (
                  <View style={styles.photoGrid}>
                    {location.media.map(item => (
                      <TouchableOpacity 
                        key={item.id}
                        style={styles.photoThumbnail}
                        onPress={() => navigation.navigate('MediaDetail', { id: item.id })}
                      >
                        <Image
                          source={{ uri: item.url }}
                          style={styles.thumbnailImage}
                        />
                        {item.type === 'video' && (
                          <View style={styles.videoIndicator}>
                            <Ionicons name="play" size={24} color="#fff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                    
                    <TouchableOpacity 
                      style={styles.addPhotoButton}
                      onPress={() => navigation.navigate('UploadMedia', { locationId: location.id })}
                    >
                      <Ionicons name="add" size={36} color="#888" />
                      <Text style={styles.addPhotoText}>Add Photo</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <Ionicons name="images-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyStateText}>No photos available</Text>
                    <TouchableOpacity 
                      style={styles.addPhotoButtonLarge}
                      onPress={() => navigation.navigate('UploadMedia', { locationId: location.id })}
                    >
                      <Text style={styles.addPhotoButtonLargeText}>Add Photos</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.lockedContentContainer}>
                <Ionicons name="lock-closed" size={36} color="#888" />
                <Text style={styles.lockedContentText}>
                  Trade for access to view all photos
                </Text>
                <Image
                  source={{ uri: location.media?.[0]?.url || 'https://via.placeholder.com/400x200' }}
                  style={styles.blurredPreview}
                  blurRadius={10}
                />
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
    backgroundColor: '#f9f9f9',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#555',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 24,
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
  mapContainer: {
    height: 200,
    width: '100%',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapOverlayText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
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
  locationName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  categoryRow: {
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#555',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 4,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
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
  },
  creatorName: {
    fontWeight: '600',
    color: '#333',
  },
  requirementsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  requirementsIcon: {
    marginRight: 6,
  },
  requirementsText: {
    fontSize: 14,
    color: '#555',
  },
  tradePanel: {
    backgroundColor: '#f0f7f2',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tradePanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tradePanelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3C6E47',
    marginLeft: 8,
  },
  tradePanelDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
  },
  tradePanelCredits: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  tradePanelCreditsText: {
    fontSize: 14,
    color: '#555',
  },
  tradePanelCreditsValue: {
    fontWeight: 'bold',
    color: '#3C6E47',
  },
  tradeErrorText: {
    fontSize: 14,
    color: '#e74c3c',
    marginBottom: 12,
  },
  tradeButton: {
    backgroundColor: '#3C6E47',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tradeButtonDisabled: {
    backgroundColor: '#a8d5ba',
  },
  tradeButtonIcon: {
    marginRight: 8,
  },
  tradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  tagChip: {
    backgroundColor: '#f2f2f2',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagChipText: {
    fontSize: 14,
    color: '#555',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  copyButton: {
    padding: 4,
  },
  directionsButton: {
    backgroundColor: '#3C6E47',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  directionsButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  lockedDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    padding: 16,
  },
  lockedDetailsText: {
    fontSize: 14,
    color: '#888',
    marginLeft: 12,
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#3C6E47',
    marginTop: 4,
  },
  trailCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  trailCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trailName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  trailDetailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  trailDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  trailDetailText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 4,
  },
  difficultyTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  easyTag: {
    backgroundColor: '#27AE60',
  },
  moderateTag: {
    backgroundColor: '#F39C12',
  },
  difficultTag: {
    backgroundColor: '#E67E22',
  },
  extremeTag: {
    backgroundColor: '#C0392B',
  },
  difficultyText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#888',
    marginTop: 12,
    marginBottom: 16,
  },
  addTrailButton: {
    backgroundColor: '#3C6E47',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addTrailButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  lockedContentContainer: {
    alignItems: 'center',
    padding: 24,
  },
  lockedContentText: {
    fontSize: 16,
    color: '#888',
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  blurredPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -4,
  },
  photoThumbnail: {
    width: (width - 32) / 3,
    height: (width - 32) / 3,
    margin: 4,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#f2f2f2',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  videoIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  addPhotoButton: {
    width: (width - 32) / 3,
    height: (width - 32) / 3,
    margin: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  addPhotoButtonLarge: {
    backgroundColor: '#3C6E47',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addPhotoButtonLargeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LocationDetailScreen;