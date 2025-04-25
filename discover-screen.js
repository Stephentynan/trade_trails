// DiscoverScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Platform,
  Animated,
  ScrollView
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { trailtrades_searchLocations } from '../../functions/trailtrades_searchLocations';

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get('window');

const DiscoverScreen = () => {
  const navigation = useNavigation();
  const mapRef = useRef(null);
  const filtersScrollViewRef = useRef(null);
  const listScrollY = useRef(new Animated.Value(0)).current;

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [viewType, setViewType] = useState('map'); // 'map' or 'list'
  const [userLocation, setUserLocation] = useState(null);
  const [radius, setRadius] = useState(50); // default 50 miles
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [vehicleFilters, setVehicleFilters] = useState({
    fourWDOnly: false,
    highClearanceOnly: false,
    rvFriendly: false
  });
  const [difficulty, setDifficulty] = useState(null);
  const [privacyLevel, setPrivacyLevel] = useState('all');
  const [sortBy, setSortBy] = useState('distance');
  
  // State for location data
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0
  });
  const [showFilters, setShowFilters] = useState(false);

  // Get user's location on component mount
  useEffect(() => {
    (async () => {
      // Get location permission and user's current location
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission to access location was denied');
          // Continue without location
          loadLocations();
          return;
        }

        let position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        
        // Load initial locations with user's position
        loadLocations({
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }
        });
      } catch (err) {
        console.error('Error getting location:', err);
        setError('Could not get your location');
        // Continue without location
        loadLocations();
      }
    })();

    // Load available categories
    loadCategories();
  }, []);

  // Load available categories for filtering
  const loadCategories = () => {
    // In a real app, these might come from an API
    const availableCategories = [
      { id: 'hiking', name: 'Hiking' },
      { id: 'camping', name: 'Camping' },
      { id: 'mountain_biking', name: 'Mountain Biking' },
      { id: 'dirt_biking', name: 'Dirt Biking' },
      { id: 'offroading', name: 'Offroading' },
      { id: 'rv_safe', name: 'RV-Safe' }
    ];
    
    setCategories(availableCategories);
  };

  // Search for locations with current filters
  const loadLocations = async (overrideParams = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // Build search parameters
      const searchParameters = {
        // Location-based parameters
        ...(userLocation && !overrideParams.boundingBox ? { 
          location: overrideParams.location || userLocation,
          radius
        } : {}),
        
        // Bounding box if provided (for map region changes)
        ...(overrideParams.boundingBox ? { boundingBox: overrideParams.boundingBox } : {}),
        
        // Category filters
        ...(selectedCategories.length > 0 ? { categories: selectedCategories } : {}),
        
        // Vehicle requirement filters
        vehicleRequirements: {
          fourWDOnly: vehicleFilters.fourWDOnly,
          highClearanceOnly: vehicleFilters.highClearanceOnly,
          rvFriendly: vehicleFilters.rvFriendly
        },
        
        // Other filters
        ...(difficulty ? { difficulty } : {}),
        privacyLevel,
        sortBy,
        
        // Pagination
        limit: pagination.limit,
        offset: overrideParams.offset || 0,
        
        // Set view type
        viewType
      };
      
      // Call the search function we built previously
      const results = await trailtrades_searchLocations(searchParameters);
      
      // Update state with results
      if (overrideParams.offset > 0) {
        // If paginating, append to existing results
        setLocations(prevLocations => [...prevLocations, ...results.locations]);
      } else {
        // If new search, replace existing results
        setLocations(results.locations);
      }
      
      // Update pagination info
      setPagination({
        limit: pagination.limit,
        offset: overrideParams.offset || 0,
        total: results.metadata.total || 0
      });
    } catch (err) {
      console.error('Error loading locations:', err);
      setError('Failed to load locations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle map region change
  const handleRegionChange = (region) => {
    // Only search when region change ends (to avoid too many API calls)
    const boundingBox = {
      north: region.latitude + region.latitudeDelta / 2,
      south: region.latitude - region.latitudeDelta / 2,
      east: region.longitude + region.longitudeDelta / 2,
      west: region.longitude - region.longitudeDelta / 2
    };
    
    // Use bounding box instead of center point + radius for map searches
    loadLocations({ boundingBox });
  };

  // Handle search button press
  const handleSearch = () => {
    // Reset pagination and search
    loadLocations({ offset: 0 });
  };

  // Toggle selected category
  const toggleCategory = (categoryId) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  // Load more results (pagination)
  const loadMore = () => {
    if (loading || pagination.offset + pagination.limit >= pagination.total) {
      return; // Don't load more if already loading or no more results
    }
    
    const newOffset = pagination.offset + pagination.limit;
    loadLocations({ offset: newOffset });
  };

  // Render map marker
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
      >
        <Callout
          tooltip
          onPress={() => navigation.navigate('LocationDetail', { id: location.id, name: location.name })}
        >
          <View style={styles.callout}>
            <Text style={styles.calloutTitle}>{location.name}</Text>
            {location.preview.photoUrl && (
              <Image 
                source={{ uri: location.preview.photoUrl }} 
                style={styles.calloutImage} 
              />
            )}
            <Text style={styles.calloutDescription}>{location.preview.description}</Text>
            {isTradeLocation && (
              <View style={styles.tradeInfo}>
                <Ionicons name="swap-horizontal" size={16} color="#3C6E47" />
                <Text style={styles.tradeText}>
                  {`Available for trade (${location.tradeCredits} credits)`}
                </Text>
              </View>
            )}
            <Text style={styles.calloutViewDetails}>Tap to view details</Text>
          </View>
        </Callout>
      </Marker>
    );
  };

  // Render list item for location
  const renderListItem = ({ item }) => {
    const location = item;
    const isTradeLocation = location.privacyLevel === 'trade' && !location.userHasAccess;
    
    return (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => navigation.navigate('LocationDetail', { id: location.id, name: location.name })}
      >
        <View style={styles.listItemHeader}>
          <View style={styles.listItemTitleContainer}>
            <Text style={styles.listItemTitle}>{location.name}</Text>
            {location.distance && (
              <Text style={styles.listItemDistance}>
                {`${(location.distance / 1609.34).toFixed(1)} mi`}
              </Text>
            )}
          </View>
          {isTradeLocation && (
            <View style={styles.listItemTradeTag}>
              <Ionicons name="swap-horizontal" size={14} color="white" />
              <Text style={styles.listItemTradeText}>
                {`${location.tradeCredits}`}
              </Text>
            </View>
          )}
        </View>
        
        {location.preview.photoUrl ? (
          <Image
            source={{ uri: location.preview.photoUrl }}
            style={styles.listItemImage}
          />
        ) : (
          <View style={[styles.listItemImage, styles.listItemNoImage]}>
            <Ionicons name="image-outline" size={40} color="#cccccc" />
          </View>
        )}
        
        <Text style={styles.listItemDescription} numberOfLines={2}>
          {location.description}
        </Text>
        
        <View style={styles.listItemFooter}>
          <View style={styles.listItemCategories}>
            {location.categories.slice(0, 3).map(categoryId => {
              const category = categories.find(c => c.id === categoryId);
              return category ? (
                <View key={categoryId} style={styles.categoryTag}>
                  <Text style={styles.categoryTagText}>{category.name}</Text>
                </View>
              ) : null;
            })}
            {location.categories.length > 3 && (
              <Text style={styles.moreCategories}>+{location.categories.length - 3}</Text>
            )}
          </View>
          
          {location.rating > 0 && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>
                {location.rating.toFixed(1)} ({location.reviewCount})
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Render filters section
  const renderFilters = () => {
    return (
      <View style={[styles.filtersContainer, showFilters ? styles.filtersExpanded : {}]}>
        <TouchableOpacity
          style={styles.filtersHeader}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filtersTitle}>Filters</Text>
          <Ionicons
            name={showFilters ? "chevron-up" : "chevron-down"}
            size={24}
            color="#3C6E47"
          />
        </TouchableOpacity>
        
        {showFilters && (
          <ScrollView
            ref={filtersScrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScrollView}
            contentContainerStyle={styles.filtersScrollContent}
          >
            {/* Categories filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Categories</Text>
              <View style={styles.categoriesContainer}>
                {categories.map(category => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryButton,
                      selectedCategories.includes(category.id) ? styles.categoryButtonSelected : {}
                    ]}
                    onPress={() => toggleCategory(category.id)}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        selectedCategories.includes(category.id) ? styles.categoryButtonTextSelected : {}
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Vehicle requirements */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Vehicle Requirements</Text>
              <View style={styles.vehicleFiltersContainer}>
                <TouchableOpacity
                  style={[
                    styles.vehicleFilterButton,
                    vehicleFilters.fourWDOnly ? styles.vehicleFilterSelected : {}
                  ]}
                  onPress={() => setVehicleFilters({
                    ...vehicleFilters,
                    fourWDOnly: !vehicleFilters.fourWDOnly
                  })}
                >
                  <MaterialCommunityIcons
                    name="car-4x4"
                    size={24}
                    color={vehicleFilters.fourWDOnly ? "#fff" : "#555"}
                  />
                  <Text
                    style={[
                      styles.vehicleFilterText,
                      vehicleFilters.fourWDOnly ? styles.vehicleFilterTextSelected : {}
                    ]}
                  >
                    4WD Only
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.vehicleFilterButton,
                    vehicleFilters.highClearanceOnly ? styles.vehicleFilterSelected : {}
                  ]}
                  onPress={() => setVehicleFilters({
                    ...vehicleFilters,
                    highClearanceOnly: !vehicleFilters.highClearanceOnly
                  })}
                >
                  <MaterialCommunityIcons
                    name="car-lifted-pickup"
                    size={24}
                    color={vehicleFilters.highClearanceOnly ? "#fff" : "#555"}
                  />
                  <Text
                    style={[
                      styles.vehicleFilterText,
                      vehicleFilters.highClearanceOnly ? styles.vehicleFilterTextSelected : {}
                    ]}
                  >
                    High Clearance
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.vehicleFilterButton,
                    vehicleFilters.rvFriendly ? styles.vehicleFilterSelected : {}
                  ]}
                  onPress={() => setVehicleFilters({
                    ...vehicleFilters,
                    rvFriendly: !vehicleFilters.rvFriendly
                  })}
                >
                  <MaterialCommunityIcons
                    name="rv-truck"
                    size={24}
                    color={vehicleFilters.rvFriendly ? "#fff" : "#555"}
                  />
                  <Text
                    style={[
                      styles.vehicleFilterText,
                      vehicleFilters.rvFriendly ? styles.vehicleFilterTextSelected : {}
                    ]}
                  >
                    RV Friendly
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Difficulty filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Difficulty</Text>
              <View style={styles.difficultyContainer}>
                {['easy', 'moderate', 'difficult', 'extreme'].map(level => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.difficultyButton,
                      difficulty === level ? styles.difficultyButtonSelected : {}
                    ]}
                    onPress={() => setDifficulty(difficulty === level ? null : level)}
                  >
                    <Text
                      style={[
                        styles.difficultyButtonText,
                        difficulty === level ? styles.difficultyButtonTextSelected : {}
                      ]}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Privacy level filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Availability</Text>
              <View style={styles.privacyContainer}>
                <TouchableOpacity
                  style={[
                    styles.privacyButton,
                    privacyLevel === 'all' ? styles.privacyButtonSelected : {}
                  ]}
                  onPress={() => setPrivacyLevel('all')}
                >
                  <Text
                    style={[
                      styles.privacyButtonText,
                      privacyLevel === 'all' ? styles.privacyButtonTextSelected : {}
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.privacyButton,
                    privacyLevel === 'public' ? styles.privacyButtonSelected : {}
                  ]}
                  onPress={() => setPrivacyLevel('public')}
                >
                  <Text
                    style={[
                      styles.privacyButtonText,
                      privacyLevel === 'public' ? styles.privacyButtonTextSelected : {}
                    ]}
                  >
                    Public
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.privacyButton,
                    privacyLevel === 'trade' ? styles.privacyButtonSelected : {}
                  ]}
                  onPress={() => setPrivacyLevel('trade')}
                >
                  <Text
                    style={[
                      styles.privacyButtonText,
                      privacyLevel === 'trade' ? styles.privacyButtonTextSelected : {}
                    ]}
                  >
                    Trade Only
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Sort options */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Sort By</Text>
              <View style={styles.sortContainer}>
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    sortBy === 'distance' ? styles.sortButtonSelected : {}
                  ]}
                  onPress={() => setSortBy('distance')}
                >
                  <Text
                    style={[
                      styles.sortButtonText,
                      sortBy === 'distance' ? styles.sortButtonTextSelected : {}
                    ]}
                  >
                    Distance
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    sortBy === 'rating' ? styles.sortButtonSelected : {}
                  ]}
                  onPress={() => setSortBy('rating')}
                >
                  <Text
                    style={[
                      styles.sortButtonText,
                      sortBy === 'rating' ? styles.sortButtonTextSelected : {}
                    ]}
                  >
                    Rating
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    sortBy === 'newest' ? styles.sortButtonSelected : {}
                  ]}
                  onPress={() => setSortBy('newest')}
                >
                  <Text
                    style={[
                      styles.sortButtonText,
                      sortBy === 'newest' ? styles.sortButtonTextSelected : {}
                    ]}
                  >
                    Newest
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    sortBy === 'popularity' ? styles.sortButtonSelected : {}
                  ]}
                  onPress={() => setSortBy('popularity')}
                >
                  <Text
                    style={[
                      styles.sortButtonText,
                      sortBy === 'popularity' ? styles.sortButtonTextSelected : {}
                    ]}
                  >
                    Popular
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Apply and Reset filters */}
            <View style={styles.filterActionContainer}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => {
                  // Reset all filters to default
                  setSelectedCategories([]);
                  setVehicleFilters({
                    fourWDOnly: false,
                    highClearanceOnly: false,
                    rvFriendly: false
                  });
                  setDifficulty(null);
                  setPrivacyLevel('all');
                  setSortBy('distance');
                }}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => {
                  // Apply filters and search
                  setShowFilters(false);
                  handleSearch();
                }}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search bar and view toggle */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search locations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={18} color="#888" />
            </TouchableOpacity>
          )}
        </View>
        
        <SegmentedControl
          values={['Map', 'List']}
          selectedIndex={viewType === 'map' ? 0 : 1}
          onChange={(event) => {
            setViewType(event.nativeEvent.selectedSegmentIndex === 0 ? 'map' : 'list');
          }}
          style={styles.viewToggle}
          tintColor="#3C6E47"
          fontStyle={{ color: '#555' }}
          activeFontStyle={{ color: '#fff' }}
        />
      </View>

      {/* Filters section */}
      {renderFilters()}

      {/* Map view */}
      {viewType === 'map' && (
        <View style={styles.mapContainer}>
          {userLocation ? (
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
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
                    onPress={() => loadLocations()}
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.noLocationText}>
                  Unable to determine your location.
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* List view */}
      {viewType === 'list' && (
        <View style={styles.listContainer}>
          {loading && locations.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3C6E47" />
            </View>
          ) : error && locations.length === 0 ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => loadLocations()}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : locations.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search-outline" size={64} color="#cccccc" />
              <Text style={styles.noResultsText}>No locations found</Text>
              <Text style={styles.noResultsSubtext}>
                Try adjusting your filters or search in a different area
              </Text>
            </View>
          ) : (
            <FlatList
              data={locations}
              renderItem={renderListItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: listScrollY } } }],
                { useNativeDriver: false }
              )}
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                loading && locations.length > 0 ? (
                  <View style={styles.listFooterLoader}>
                    <ActivityIndicator size="small" color="#3C6E47" />
                    <Text style={styles.loadingMoreText}>Loading more...</Text>
                  </View>
                ) : null
              }
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  clearButton: {
    padding: 6,
  },
  viewToggle: {
    height: 36,
    marginBottom: 8,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 16,
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
  noLocationText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  callout: {
    width: 250,
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
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  calloutDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  tradeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tradeText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#3C6E47',
    fontWeight: '600',
  },
  calloutViewDetails: {
    fontSize: 14,
    color: '#3C6E47',
    textAlign: 'center',
    fontWeight: '600',
  },
  listItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listItemTitleContainer: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  listItemDistance: {
    fontSize: 14,
    color: '#888',
  },
  listItemTradeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3C6E47',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  listItemTradeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  listItemImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 12,
  },
  listItemNoImage: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItemDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
    lineHeight: 20,
  },
  listItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItemCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  categoryTag: {
    backgroundColor: '#f2f2f2',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  categoryTagText: {
    fontSize: 12,
    color: '#555',
  },
  moreCategories: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
    alignSelf: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 4,
  },
  listFooterLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    zIndex: 5,
  },
  filtersExpanded: {
    borderBottomColor: '#e0e0e0',
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  filtersScrollView: {
    maxHeight: 400,
  },
  filtersScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#555',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryButton: {
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryButtonSelected: {
    backgroundColor: '#3C6E47',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#555',
  },
  categoryButtonTextSelected: {
    color: '#fff',
  },
  vehicleFiltersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vehicleFilterButton: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    width: '31%',
  },
  vehicleFilterSelected: {
    backgroundColor: '#3C6E47',
  },
  vehicleFilterText: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
    textAlign: 'center',
  },
  vehicleFilterTextSelected: {
    color: '#fff',
  },
  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  difficultyButton: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '23%',
    alignItems: 'center',
  },
  difficultyButtonSelected: {
    backgroundColor: '#3C6E47',
  },
  difficultyButtonText: {
    fontSize: 13,
    color: '#555',
  },
  difficultyButtonTextSelected: {
    color: '#fff',
  },
  privacyContainer: {
    flexDirection: 'row',
  },
  privacyButton: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  privacyButtonSelected: {
    backgroundColor: '#3C6E47',
  },
  privacyButtonText: {
    fontSize: 14,
    color: '#555',
  },
  privacyButtonTextSelected: {
    color: '#fff',
  },
  sortContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sortButton: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  sortButtonSelected: {
    backgroundColor: '#3C6E47',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#555',
  },
  sortButtonTextSelected: {
    color: '#fff',
  },
  filterActionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  resetButton: {
    borderWidth: 1,
    borderColor: '#3C6E47',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: '48%',
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#3C6E47',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: '#3C6E47',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: '48%',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DiscoverScreen;