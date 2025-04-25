// SavedLocationsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SavedLocationsScreen = () => {
  const navigation = useNavigation();
  
  // State variables
  const [savedLocations, setSavedLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('dateAdded'); // 'dateAdded', 'name', 'distance'
  const [activeCategory, setActiveCategory] = useState('all'); // 'all', 'hiking', 'camping', etc.
  const [userLocation, setUserLocation] = useState(null);
  const [error, setError] = useState(null);
  
  // Get or refresh saved locations when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSavedLocations();
      
      // Get user location for distance calculation
      getUserLocation();
      
      return () => {
        // Clean up if needed
      };
    }, [])
  );
  
  // Filter locations when search query or category changes
  useEffect(() => {
    filterLocations();
  }, [searchQuery, activeCategory, savedLocations, sortBy]);
  
  // Fetch saved locations
  const loadSavedLocations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would be an API call to fetch user's saved locations
      // For demo, we'll use mock data
      setTimeout(() => {
        const mockSavedLocations = [
          {
            id: 'loc1',
            name: 'Hidden Waterfall Trail',
            description: 'A secluded waterfall with a swimming hole, perfect for hot summer days.',
            categories: ['hiking', 'camping'],
            coordinates: { latitude: 37.7749, longitude: -122.4194 },
            photoUrl: 'https://via.placeholder.com/100',
            dateAdded: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            creator: {
              id: 'user1',
              username: 'trailblazer',
              avatarUrl: 'https://via.placeholder.com/50'
            },
            tradeType: 'public'
          },
          {
            id: 'loc2',
            name: 'Mountain Ridge Overlook',
            description: 'Panoramic views of the entire valley and surrounding mountains.',
            categories: ['hiking', 'mountain_biking'],
            coordinates: { latitude: 37.7739, longitude: -122.4144 },
            photoUrl: 'https://via.placeholder.com/100',
            dateAdded: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
            creator: {
              id: 'user2',
              username: 'hikerpro',
              avatarUrl: 'https://via.placeholder.com/50'
            },
            tradeType: 'trade',
            tradeCredits: 15
          },
          {
            id: 'loc3',
            name: 'Desert Canyon Trail',
            description: 'Beautiful slot canyon with amazing rock formations and light effects.',
            categories: ['hiking', 'offroading'],
            coordinates: { latitude: 38.5733, longitude: -109.5498 },
            photoUrl: 'https://via.placeholder.com/100',
            dateAdded: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            creator: {
              id: 'user3',
              username: 'canyoneer',
              avatarUrl: 'https://via.placeholder.com/50'
            },
            tradeType: 'public'
          },
          {
            id: 'loc4',
            name: 'Alpine Lake Campsite',
            description: 'Secluded campsite next to a pristine alpine lake with great fishing.',
            categories: ['camping', 'rv_safe'],
            coordinates: { latitude: 39.0968, longitude: -120.0324 },
            photoUrl: 'https://via.placeholder.com/100',
            dateAdded: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            creator: {
              id: 'user4',
              username: 'camper',
              avatarUrl: 'https://via.placeholder.com/50'
            },
            tradeType: 'followers'
          },
          {
            id: 'loc5',
            name: 'Rock Crawler\'s Paradise',
            description: 'Challenging off-road trail with multiple rock obstacles and river crossings.',
            categories: ['offroading'],
            coordinates: { latitude: 38.9783, longitude: -114.0500 },
            photoUrl: 'https://via.placeholder.com/100',
            dateAdded: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 21 days ago
            creator: {
              id: 'user5',
              username: 'offroad_master',
              avatarUrl: 'https://via.placeholder.com/50'
            },
            tradeType: 'trade',
            tradeCredits: 25
          }
        ];
        
        setSavedLocations(mockSavedLocations);
        setLoading(false);
        setRefreshing(false);
      }, 1000);
    } catch (err) {
      console.error('Error loading saved locations:', err);
      setError('Failed to load saved locations. Please try again.');
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Get user's current location
  const getUserLocation = async () => {
    try {
      // In a real app, use geolocation API
      // For demo, we'll use a mock location in San Francisco
      setUserLocation({
        latitude: 37.7749,
        longitude: -122.4194
      });
    } catch (err) {
      console.error('Error getting user location:', err);
      // Continue without user location
    }
  };
  
  // Filter and sort locations based on search query, category, and sort option
  const filterLocations = () => {
    let filtered = [...savedLocations];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(location => 
        location.name.toLowerCase().includes(query) ||
        location.description.toLowerCase().includes(query)
      );
    }
    
    // Apply category filter
    if (activeCategory !== 'all') {
      filtered = filtered.filter(location => 
        location.categories.includes(activeCategory)
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'distance':
        if (userLocation) {
          // Calculate distances
          filtered.forEach(location => {
            location.distance = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              location.coordinates.latitude,
              location.coordinates.longitude
            );
          });
          
          filtered.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
        }
        break;
      case 'dateAdded':
      default:
        filtered.sort((a, b) => b.dateAdded - a.dateAdded);
        break;
    }
    
    setFilteredLocations(filtered);
  };
  
  // Calculate distance between two coordinates in miles
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3958.8; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    return d;
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadSavedLocations();
  };
  
  // Handle removing a saved location
  const handleRemoveLocation = (locationId) => {
    Alert.alert(
      'Remove Location',
      'Are you sure you want to remove this location from your saved list?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setSavedLocations(prevLocations => 
              prevLocations.filter(location => location.id !== locationId)
            );
          }
        }
      ]
    );
  };
  
  // Format date for display
  const formatDate = (date) => {
    // Calculate difference in days
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Get privacy level icon
  const getPrivacyIcon = (tradeType) => {
    switch (tradeType) {
      case 'public':
        return 'earth';
      case 'followers':
        return 'people';
      case 'private':
        return 'lock-closed';
      case 'trade':
        return 'swap-horizontal';
      default:
        return 'earth';
    }
  };
  
  // Render saved location item
  const renderLocationItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.locationCard}
        onPress={() => navigation.navigate('LocationDetail', { id: item.id, name: item.name })}
      >
        <View style={styles.locationCardContent}>
          <Image 
            source={{ uri: item.photoUrl }} 
            style={styles.locationImage} 
          />
          
          <View style={styles.locationInfo}>
            <View style={styles.locationHeader}>
              <Text style={styles.locationName} numberOfLines={1}>{item.name}</Text>
              <Ionicons name={getPrivacyIcon(item.tradeType)} size={16} color="#888" />
            </View>
            
            <Text style={styles.locationDescription} numberOfLines={2}>
              {item.description}
            </Text>
            
            <View style={styles.locationCategories}>
              {item.categories.map(category => (
                <View key={category} style={styles.categoryTag}>
                  <Text style={styles.categoryText}>
                    {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                  </Text>
                </View>
              ))}
            </View>
            
            <View style={styles.locationFooter}>
              <Text style={styles.dateAdded}>Saved {formatDate(item.dateAdded)}</Text>
              
              {userLocation && item.distance && (
                <Text style={styles.distanceText}>
                  {item.distance.toFixed(1)} mi away
                </Text>
              )}
            </View>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveLocation(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#e74c3c" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };
  
  // Available categories
  const categories = [
    { id: 'all', name: 'All' },
    { id: 'hiking', name: 'Hiking' },
    { id: 'camping', name: 'Camping' },
    { id: 'mountain_biking', name: 'Mountain Biking' },
    { id: 'dirt_biking', name: 'Dirt Biking' },
    { id: 'offroading', name: 'Offroading' },
    { id: 'rv_safe', name: 'RV-Safe' }
  ];
  
  // Render category filter
  const renderCategoryFilter = () => {
    return (
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryButton,
              activeCategory === item.id ? styles.activeCategoryButton : {}
            ]}
            onPress={() => setActiveCategory(item.id)}
          >
            <Text
              style={[
                styles.categoryButtonText,
                activeCategory === item.id ? styles.activeCategoryButtonText : {}
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.categoryFilterContainer}
      />
    );
  };
  
  // Render sort options
  const renderSortOptions = () => {
    return (
      <View style={styles.sortOptionsContainer}>
        <Text style={styles.sortByText}>Sort by:</Text>
        
        <TouchableOpacity
          style={[
            styles.sortOption,
            sortBy === 'dateAdded' ? styles.activeSortOption : {}
          ]}
          onPress={() => setSortBy('dateAdded')}
        >
          <Text
            style={[
              styles.sortOptionText,
              sortBy === 'dateAdded' ? styles.activeSortOptionText : {}
            ]}
          >
            Date
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.sortOption,
            sortBy === 'name' ? styles.activeSortOption : {}
          ]}
          onPress={() => setSortBy('name')}
        >
          <Text
            style={[
              styles.sortOptionText,
              sortBy === 'name' ? styles.activeSortOptionText : {}
            ]}
          >
            Name
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.sortOption,
            sortBy === 'distance' ? styles.activeSortOption : {}
          ]}
          onPress={() => setSortBy('distance')}
        >
          <Text
            style={[
              styles.sortOptionText,
              sortBy === 'distance' ? styles.activeSortOptionText : {}
            ]}
          >
            Distance
          </Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search saved locations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
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
      </View>
      
      {/* Category Filter */}
      {renderCategoryFilter()}
      
      {/* Sort Options */}
      {renderSortOptions()}
      
      {/* Location List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3C6E47" />
          <Text style={styles.loadingText}>Loading saved locations...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadSavedLocations}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredLocations}
          renderItem={renderLocationItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.locationList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#3C6E47']}
              tintColor="#3C6E47"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="bookmark-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>
                {searchQuery || activeCategory !== 'all' ? 
                  'No matching locations found' : 
                  'No saved locations yet'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery || activeCategory !== 'all' ? 
                  'Try adjusting your search or filters' : 
                  'Start saving locations by tapping the bookmark icon on location details'}
              </Text>
              {(searchQuery || activeCategory !== 'all') && (
                <TouchableOpacity
                  style={styles.clearFiltersButton}
                  onPress={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                  }}
                >
                  <Text style={styles.clearFiltersText}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
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
  searchContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingHorizontal: 12,
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
  categoryFilterContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
    marginRight: 8,
  },
  activeCategoryButton: {
    backgroundColor: '#3C6E47',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#555',
  },
  activeCategoryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  sortOptionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sortByText: {
    fontSize: 14,
    color: '#888',
    marginRight: 12,
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  activeSortOption: {
    backgroundColor: '#f0f7f2',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#555',
  },
  activeSortOptionText: {
    color: '#3C6E47',
    fontWeight: '600',
  },
  locationList: {
    padding: 12,
  },
  locationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  locationCardContent: {
    flex: 1,
    flexDirection: 'row',
  },
  locationImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  locationDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
  },
  locationCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  categoryTag: {
    backgroundColor: '#f2f2f2',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 6,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#555',
  },
  locationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateAdded: {
    fontSize: 12,
    color: '#888',
  },
  distanceText: {
    fontSize: 12,
    color: '#3C6E47',
    fontWeight: '600',
  },
  removeButton: {
    justifyContent: 'center',
    paddingLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    marginTop: 12,
    marginBottom: 24,
    fontSize: 16,
    color: '#e74c3c',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 16,
  },
  clearFiltersButton: {
    backgroundColor: '#3C6E47',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearFiltersText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SavedLocationsScreen;