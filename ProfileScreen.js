// ProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProfileScreen = () => {
  const navigation = useNavigation();
  
  // State variables
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('locations'); // 'locations', 'trails', 'activity'
  const [userLocations, setUserLocations] = useState([]);
  const [userTrails, setUserTrails] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [error, setError] = useState(null);
  
  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
  }, []);
  
  // Fetch user data
  const fetchUserData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would be an API call
      // For now, use mock data
      setTimeout(() => {
        const mockUser = {
          id: 'user123',
          username: 'trailexplorer',
          fullName: 'Alex Johnson',
          email: 'alex@example.com',
          bio: 'Avid hiker and off-road enthusiast. Always exploring new trails and sharing hidden gems.',
          avatarUrl: 'https://via.placeholder.com/150',
          coverPhotoUrl: 'https://via.placeholder.com/600x200',
          stats: {
            locations: 12,
            trails: 24,
            followers: 156,
            following: 89,
            credits: 85
          },
          preferences: {
            privacyDefault: 'followers',
            notificationsEnabled: true,
            units: 'metric'
          }
        };
        
        setUser(mockUser);
        fetchUserContent();
      }, 1000);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load user profile. Please try again.');
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Fetch user content (locations, trails, activity)
  const fetchUserContent = () => {
    // Fetch content based on active tab
    if (activeTab === 'locations') {
      fetchUserLocations();
    } else if (activeTab === 'trails') {
      fetchUserTrails();
    } else if (activeTab === 'activity') {
      fetchUserActivity();
    }
  };
  
  // Fetch user locations
  const fetchUserLocations = () => {
    setTimeout(() => {
      const mockLocations = [
        {
          id: 'loc1',
          name: 'Hidden Falls Trail',
          description: 'Beautiful waterfall trail with secluded swimming holes',
          categories: ['hiking', 'camping'],
          previewPhotoUrl: 'https://via.placeholder.com/100',
          privacyLevel: 'public',
          createdAt: '2023-09-01T12:00:00Z',
          views: 124,
          trades: 18
        },
        {
          id: 'loc2',
          name: 'Mountain Ridge Lookout',
          description: 'Panoramic views of the valley from this remote ridge',
          categories: ['hiking', 'offroading'],
          previewPhotoUrl: 'https://via.placeholder.com/100',
          privacyLevel: 'trade',
          createdAt: '2023-08-15T12:00:00Z',
          views: 85,
          trades: 32
        },
        {
          id: 'loc3',
          name: 'Desert Springs Campsite',
          description: 'Hidden desert oasis with natural hot springs',
          categories: ['camping', 'rv_safe'],
          previewPhotoUrl: 'https://via.placeholder.com/100',
          privacyLevel: 'followers',
          createdAt: '2023-07-22T12:00:00Z',
          views: 67,
          trades: 15
        }
      ];
      
      setUserLocations(mockLocations);
      setLoading(false);
      setRefreshing(false);
    }, 1000);
  };
  
  // Fetch user trails
  const fetchUserTrails = () => {
    setTimeout(() => {
      const mockTrails = [
        {
          id: 'trail1',
          name: 'Forest Loop Trail',
          locationName: 'Hidden Valley Park',
          description: 'A beautiful loop trail through dense forest',
          previewPhotoUrl: 'https://via.placeholder.com/100',
          metrics: {
            distance: 7500, // meters
            elevationGain: 350, // meters
            duration: 165 // minutes
          },
          difficulty: 'moderate',
          createdAt: '2023-09-10T09:30:00Z'
        },
        {
          id: 'trail2',
          name: 'Coastal Bluff Trail',
          locationName: 'Seacliff State Park',
          description: 'Stunning coastal views along dramatic bluffs',
          previewPhotoUrl: 'https://via.placeholder.com/100',
          metrics: {
            distance: 5200, // meters
            elevationGain: 120, // meters
            duration: 95 // minutes
          },
          difficulty: 'easy',
          createdAt: '2023-08-22T14:15:00Z'
        },
        {
          id: 'trail3',
          name: 'Mountain Summit Route',
          locationName: 'Alpine Wilderness',
          description: 'Challenging trail to the mountain summit',
          previewPhotoUrl: 'https://via.placeholder.com/100',
          metrics: {
            distance: 12800, // meters
            elevationGain: 980, // meters
            duration: 310 // minutes
          },
          difficulty: 'difficult',
          createdAt: '2023-07-15T08:45:00Z'
        }
      ];
      
      setUserTrails(mockTrails);
      setLoading(false);
      setRefreshing(false);
    }, 1000);
  };
  
  // Fetch user activity
  const fetchUserActivity = () => {
    setTimeout(() => {
      const mockActivity = [
        {
          id: 'act1',
          type: 'location_added',
          locationId: 'loc1',
          locationName: 'Hidden Falls Trail',
          timestamp: '2023-09-01T12:00:00Z'
        },
        {
          id: 'act2',
          type: 'trail_recorded',
          trailId: 'trail1',
          trailName: 'Forest Loop Trail',
          locationName: 'Hidden Valley Park',
          timestamp: '2023-08-28T09:30:00Z'
        },
        {
          id: 'act3',
          type: 'photo_added',
          mediaId: 'photo1',
          locationId: 'loc2',
          locationName: 'Mountain Ridge Lookout',
          timestamp: '2023-08-22T15:45:00Z'
        },
        {
          id: 'act4',
          type: 'trade_completed',
          locationId: 'loc3',
          locationName: 'Desert Springs Campsite',
          credits: 25,
          timestamp: '2023-08-15T10:15:00Z'
        },
        {
          id: 'act5',
          type: 'location_added',
          locationId: 'loc2',
          locationName: 'Mountain Ridge Lookout',
          timestamp: '2023-08-15T12:00:00Z'
        }
      ];
      
      setUserActivity(mockActivity);
      setLoading(false);
      setRefreshing(false);
    }, 1000);
  };
  
  // Refresh data
  const handleRefresh = () => {
    setRefreshing(true);
    fetchUserData();
  };
  
  // Handle tab change
  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      setLoading(true);
      
      if (tab === 'locations') {
        fetchUserLocations();
      } else if (tab === 'trails') {
        fetchUserTrails();
      } else if (tab === 'activity') {
        fetchUserActivity();
      }
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Format categories for display
  const formatCategories = (categoryIds) => {
    const categoryNames = {
      'hiking': 'Hiking',
      'camping': 'Camping',
      'mountain_biking': 'Mountain Biking',
      'dirt_biking': 'Dirt Biking',
      'offroading': 'Offroading',
      'rv_safe': 'RV-Safe'
    };
    
    if (!categoryIds || categoryIds.length === 0) {
      return 'Uncategorized';
    }
    
    return categoryIds
      .map(cat => categoryNames[cat] || cat)
      .join(' • ');
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
  
  // Get privacy level icon
  const getPrivacyIcon = (privacy) => {
    switch (privacy) {
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
  
  // Get difficulty color
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
  
  // Get activity icon
  const getActivityIcon = (type) => {
    switch (type) {
      case 'location_added':
        return 'location';
      case 'trail_recorded':
        return 'trail-sign';
      case 'photo_added':
        return 'image';
      case 'trade_completed':
        return 'swap-horizontal';
      default:
        return 'information-circle';
    }
  };
  
  // Render location item
  const renderLocationItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.locationItem}
        onPress={() => navigation.navigate('LocationDetail', { id: item.id, name: item.name })}
      >
        <Image
          source={{ uri: item.previewPhotoUrl }}
          style={styles.locationImage}
        />
        <View style={styles.locationContent}>
          <View style={styles.locationHeader}>
            <Text style={styles.locationName} numberOfLines={1}>
              {item.name}
            </Text>
            <Ionicons
              name={getPrivacyIcon(item.privacyLevel)}
              size={16}
              color="#888"
            />
          </View>
          
          <Text style={styles.locationCategories}>
            {formatCategories(item.categories)}
          </Text>
          
          <Text style={styles.locationDescription} numberOfLines={2}>
            {item.description}
          </Text>
          
          <View style={styles.locationFooter}>
            <Text style={styles.locationDate}>
              {formatDate(item.createdAt)}
            </Text>
            
            <View style={styles.locationStats}>
              <View style={styles.locationStat}>
                <Ionicons name="eye-outline" size={14} color="#888" />
                <Text style={styles.locationStatText}>{item.views}</Text>
              </View>
              
              <View style={styles.locationStat}>
                <Ionicons name="swap-horizontal" size={14} color="#888" />
                <Text style={styles.locationStatText}>{item.trades}</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Render trail item
  const renderTrailItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.trailItem}
        onPress={() => navigation.navigate('TrailDetail', { id: item.id, name: item.name })}
      >
        <Image
          source={{ uri: item.previewPhotoUrl }}
          style={styles.trailImage}
        />
        <View style={styles.trailContent}>
          <View style={styles.trailHeader}>
            <Text style={styles.trailName} numberOfLines={1}>
              {item.name}
            </Text>
            <View 
              style={[
                styles.difficultyTag,
                { backgroundColor: getDifficultyColor(item.difficulty) }
              ]}
            >
              <Text style={styles.difficultyText}>
                {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
              </Text>
            </View>
          </View>
          
          <Text style={styles.trailLocation}>
            {item.locationName}
          </Text>
          
          <View style={styles.trailMetrics}>
            <View style={styles.trailMetric}>
              <Ionicons name="resize" size={14} color="#888" />
              <Text style={styles.trailMetricText}>
                {formatDistance(item.metrics.distance)}
              </Text>
            </View>
            
            <View style={styles.trailMetric}>
              <Ionicons name="trending-up" size={14} color="#888" />
              <Text style={styles.trailMetricText}>
                {item.metrics.elevationGain}m
              </Text>
            </View>
            
            <View style={styles.trailMetric}>
              <Ionicons name="time-outline" size={14} color="#888" />
              <Text style={styles.trailMetricText}>
                {formatTime(item.metrics.duration)}
              </Text>
            </View>
          </View>
          
          <Text style={styles.trailDate}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Render activity item
  const renderActivityItem = ({ item }) => {
    // Get activity message based on type
    let activityMessage = '';
    let navigationTarget = null;
    
    switch (item.type) {
      case 'location_added':
        activityMessage = `Added a new location: ${item.locationName}`;
        navigationTarget = { screen: 'LocationDetail', params: { id: item.locationId, name: item.locationName } };
        break;
      case 'trail_recorded':
        activityMessage = `Recorded a new trail: ${item.trailName} at ${item.locationName}`;
        navigationTarget = { screen: 'TrailDetail', params: { id: item.trailId, name: item.trailName } };
        break;
      case 'photo_added':
        activityMessage = `Added a new photo to ${item.locationName}`;
        navigationTarget = { screen: 'MediaDetail', params: { id: item.mediaId } };
        break;
      case 'trade_completed':
        activityMessage = `Traded ${item.credits} credits for ${item.locationName}`;
        navigationTarget = { screen: 'LocationDetail', params: { id: item.locationId, name: item.locationName } };
        break;
      default:
        activityMessage = 'Unknown activity';
        break;
    }
    
    return (
      <TouchableOpacity
        style={styles.activityItem}
        onPress={() => navigationTarget && navigation.navigate(navigationTarget.screen, navigationTarget.params)}
      >
        <View style={styles.activityIconContainer}>
          <Ionicons name={getActivityIcon(item.type)} size={20} color="#3C6E47" />
        </View>
        
        <View style={styles.activityContent}>
          <Text style={styles.activityMessage}>{activityMessage}</Text>
          <Text style={styles.activityDate}>{formatDate(item.timestamp)}</Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Render empty state
  const renderEmptyState = () => {
    if (activeTab === 'locations') {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="map-outline" size={48} color="#ccc" />
          <Text style={styles.emptyStateTitle}>No Locations Yet</Text>
          <Text style={styles.emptyStateDescription}>
            You haven't added any locations yet.
            Add a location to start sharing and trading with others.
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => navigation.navigate('AddLocation')}
          >
            <Text style={styles.emptyStateButtonText}>Add Location</Text>
          </TouchableOpacity>
        </View>
      );
    } else if (activeTab === 'trails') {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="trail-sign-outline" size={48} color="#ccc" />
          <Text style={styles.emptyStateTitle}>No Trails Yet</Text>
          <Text style={styles.emptyStateDescription}>
            You haven't recorded any trails yet.
            Record a trail to track your outdoor adventures.
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => navigation.navigate('RecordTrail')}
          >
            <Text style={styles.emptyStateButtonText}>Record Trail</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-outline" size={48} color="#ccc" />
          <Text style={styles.emptyStateTitle}>No Activity Yet</Text>
          <Text style={styles.emptyStateDescription}>
            Your recent activity will appear here.
            Add locations, record trails, or trade to get started.
          </Text>
        </View>
      );
    }
  };
  
  // Render loading state
  if (loading && !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3C6E47" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }
  
  // Render error state
  if (error && !user) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchUserData}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Render profile content
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3C6E47']}
            tintColor="#3C6E47"
          />
        }
      >
        {/* Cover Photo */}
        <View style={styles.coverContainer}>
          <Image
            source={{ uri: user.coverPhotoUrl }}
            style={styles.coverPhoto}
          />
          
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* Profile Info */}
        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: user.avatarUrl }}
              style={styles.avatar}
            />
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.fullName}</Text>
            <Text style={styles.userUsername}>@{user.username}</Text>
            <Text style={styles.userBio}>{user.bio}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
        
        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.stats.locations}</Text>
            <Text style={styles.statLabel}>Locations</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.stats.trails}</Text>
            <Text style={styles.statLabel}>Trails</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.stats.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.stats.following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.stats.credits}</Text>
            <Text style={styles.statLabel}>Credits</Text>
          </View>
        </View>
        
        {/* Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'locations' ? styles.activeTabButton : {}
            ]}
            onPress={() => handleTabChange('locations')}
          >
            <Ionicons
              name="map"
              size={20}
              color={activeTab === 'locations' ? "#3C6E47" : "#888"}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'locations' ? styles.activeTabButtonText : {}
              ]}
            >
              Locations
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'trails' ? styles.activeTabButton : {}
            ]}
            onPress={() => handleTabChange('trails')}
          >
            <Ionicons
              name="trail-sign"
              size={20}
              color={activeTab === 'trails' ? "#3C6E47" : "#888"}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'trails' ? styles.activeTabButtonText : {}
              ]}
            >
              Trails
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'activity' ? styles.activeTabButton : {}
            ]}
            onPress={() => handleTabChange('activity')}
          >
            <Ionicons
              name="time"
              size={20}
              color={activeTab === 'activity' ? "#3C6E47" : "#888"}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'activity' ? styles.activeTabButtonText : {}
              ]}
            >
              Activity
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Tab Content */}
        <View style={styles.tabContent}>
          {loading ? (
            <View style={styles.loadingContent}>
              <ActivityIndicator size="large" color="#3C6E47" />
            </View>
          ) : (
            <>
              {/* Locations Tab */}
              {activeTab === 'locations' && (
                <View>
                  {userLocations.length > 0 ? (
                    userLocations.map(location => renderLocationItem({ item: location }))
                  ) : (
                    renderEmptyState()
                  )}
                </View>
              )}
              
              {/* Trails Tab */}
              {activeTab === 'trails' && (
                <View>
                  {userTrails.length > 0 ? (
                    userTrails.map(trail => renderTrailItem({ item: trail }))
                  ) : (
                    renderEmptyState()
                  )}
                </View>
              )}
              
              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <View>
                  {userActivity.length > 0 ? (
                    userActivity.map(activity => renderActivityItem({ item: activity }))
                  ) : (
                    renderEmptyState()
                  )}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollContainer: {
    flex: 1,
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
  coverContainer: {
    height: 150,
    position: 'relative',
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
  },
  settingsButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 55,
    paddingBottom: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatarContainer: {
    position: 'absolute',
    top: -50,
    left: 16,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  userInfo: {
    marginLeft: 108,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  userBio: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  editProfileButton: {
    marginTop: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  editProfileButtonText: {
    color: '#3C6E47',
    fontSize: 14,
    fontWeight: '600',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
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
    paddingVertical: 8,
  },
  loadingContent: {
    padding: 40,
    alignItems: 'center',
  },
  locationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  locationImage: {
    width: 100,
    height: 100,
  },
  locationContent: {
    flex: 1,
    padding: 12,
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
  locationCategories: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  locationDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  locationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationDate: {
    fontSize: 12,
    color: '#888',
  },
  locationStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  locationStatText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
  },
  trailItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  trailImage: {
    width: 100,
    height: 100,
  },
  trailContent: {
    flex: 1,
    padding: 12,
  },
  trailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  trailName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  difficultyTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  trailLocation: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  trailMetrics: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  trailMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  trailMetricText: {
    fontSize: 12,
    color: '#555',
    marginLeft: 4,
  },
  trailDate: {
    fontSize: 12,
    color: '#888',
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f7f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 12,
    color: '#888',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: '#3C6E47',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;