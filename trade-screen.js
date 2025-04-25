// TradeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
  ScrollView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { trailtrades_performTrade } from '../../functions/trailtrades_performTrade';

const TradeScreen = () => {
  const navigation = useNavigation();
  
  // State variables
  const [activeTab, setActiveTab] = useState('available'); // 'available', 'my_locations', 'pending'
  const [availableLocations, setAvailableLocations] = useState([]);
  const [myTradeableLocations, setMyTradeableLocations] = useState([]);
  const [pendingTrades, setPendingTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userCredits, setUserCredits] = useState(0);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [tradeType, setTradeType] = useState('credit'); // 'credit' or 'direct'
  const [selectedMyLocation, setSelectedMyLocation] = useState(null);
  const [tradeMessage, setTradeMessage] = useState('');
  const [tradeInProgress, setTradeInProgress] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch data on component mount
  useEffect(() => {
    loadData();
  }, []);
  
  // Load all data based on active tab
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load user credits
      await loadUserCredits();
      
      // Load data based on active tab
      if (activeTab === 'available') {
        await loadAvailableLocations();
      } else if (activeTab === 'my_locations') {
        await loadMyTradeableLocations();
      } else if (activeTab === 'pending') {
        await loadPendingTrades();
      }
    } catch (err) {
      console.error('Error loading trade data:', err);
      setError('Failed to load trade data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Load user credits
  const loadUserCredits = async () => {
    try {
      // For demo purposes, use a mock value
      // In a real app, this would be an API call
      setUserCredits(85);
    } catch (err) {
      console.error('Error loading user credits:', err);
      throw err;
    }
  };
  
  // Load available locations for trade
  const loadAvailableLocations = async () => {
    try {
      // In a real app, this would be an API call
      // For now, use mock data
      setTimeout(() => {
        const mockLocations = [
          {
            id: 'loc1',
            name: 'Secret Waterfall Trail',
            description: 'A hidden waterfall deep in the forest, perfect for a refreshing swim after a hike.',
            categories: ['hiking', 'camping'],
            photoUrl: 'https://via.placeholder.com/150',
            tradeCredits: 20,
            creator: {
              id: 'user1',
              username: 'wilderness_explorer',
              avatarUrl: 'https://via.placeholder.com/50'
            },
            distance: 35.2, // miles
            rating: 4.8,
            reviewCount: 12
          },
          {
            id: 'loc2',
            name: 'Mountain Overlook',
            description: 'Panoramic view of the entire valley and surrounding mountains.',
            categories: ['hiking', 'mountain_biking'],
            photoUrl: 'https://via.placeholder.com/150',
            tradeCredits: 15,
            creator: {
              id: 'user2',
              username: 'trailblazer',
              avatarUrl: 'https://via.placeholder.com/50'
            },
            distance: 28.7, // miles
            rating: 4.5,
            reviewCount: 8
          },
          {
            id: 'loc3',
            name: 'Hidden Hot Springs',
            description: 'Natural hot springs tucked away in a secluded canyon. Perfect for relaxation after a long hike.',
            categories: ['hiking', 'camping'],
            photoUrl: 'https://via.placeholder.com/150',
            tradeCredits: 25,
            creator: {
              id: 'user3',
              username: 'adventureseeker',
              avatarUrl: 'https://via.placeholder.com/50'
            },
            distance: 42.1, // miles
            rating: 4.9,
            reviewCount: 15
          },
          {
            id: 'loc4',
            name: 'Rock Crawler\'s Paradise',
            description: 'Challenging off-road trail with multiple rock obstacles and river crossings.',
            categories: ['offroading'],
            photoUrl: 'https://via.placeholder.com/150',
            tradeCredits: 30,
            creator: {
              id: 'user4',
              username: 'offroad_master',
              avatarUrl: 'https://via.placeholder.com/50'
            },
            distance: 65.3, // miles
            rating: 4.7,
            reviewCount: 10
          }
        ];
        
        setAvailableLocations(mockLocations);
      }, 1000);
    } catch (err) {
      console.error('Error loading available locations:', err);
      throw err;
    }
  };
  
  // Load user's tradeable locations
  const loadMyTradeableLocations = async () => {
    try {
      // In a real app, this would be an API call
      // For now, use mock data
      setTimeout(() => {
        const mockMyLocations = [
          {
            id: 'myloc1',
            name: 'Desert Canyon Trail',
            description: 'Beautiful slot canyon with amazing rock formations and light effects.',
            categories: ['hiking', 'camping'],
            photoUrl: 'https://via.placeholder.com/150',
            tradeCredits: 20,
            privacy: 'trade',
            trades: 8,
            views: 34
          },
          {
            id: 'myloc2',
            name: 'Forest Creek Campsite',
            description: 'Secluded campsite next to a crystal clear creek with great fishing opportunities.',
            categories: ['camping', 'rv_safe'],
            photoUrl: 'https://via.placeholder.com/150',
            tradeCredits: 15,
            privacy: 'trade',
            trades: 5,
            views: 22
          },
          {
            id: 'myloc3',
            name: 'Technical Mountain Bike Trail',
            description: 'Advanced single-track with drops, jumps and berms for experienced riders.',
            categories: ['mountain_biking'],
            photoUrl: 'https://via.placeholder.com/150',
            tradeCredits: 25,
            privacy: 'public',
            trades: 0,
            views: 45
          }
        ];
        
        setMyTradeableLocations(mockMyLocations);
      }, 1000);
    } catch (err) {
      console.error('Error loading my tradeable locations:', err);
      throw err;
    }
  };
  
  // Load pending trades
  const loadPendingTrades = async () => {
    try {
      // In a real app, this would be an API call
      // For now, use mock data
      setTimeout(() => {
        const mockPendingTrades = [
          {
            id: 'trade1',
            type: 'direct',
            status: 'pending',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            offeredLocation: {
              id: 'myloc1',
              name: 'Desert Canyon Trail',
              photoUrl: 'https://via.placeholder.com/150'
            },
            requestedLocation: {
              id: 'loc3',
              name: 'Hidden Hot Springs',
              photoUrl: 'https://via.placeholder.com/150'
            },
            otherUser: {
              id: 'user3',
              username: 'adventureseeker',
              avatarUrl: 'https://via.placeholder.com/50'
            },
            message: 'Interested in trading for your Hidden Hot Springs location. My Desert Canyon Trail is a great hike with amazing views.'
          },
          {
            id: 'trade2',
            type: 'direct',
            status: 'requested',
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            offeredLocation: {
              id: 'loc2',
              name: 'Mountain Overlook',
              photoUrl: 'https://via.placeholder.com/150'
            },
            requestedLocation: {
              id: 'myloc2',
              name: 'Forest Creek Campsite',
              photoUrl: 'https://via.placeholder.com/150'
            },
            otherUser: {
              id: 'user2',
              username: 'trailblazer',
              avatarUrl: 'https://via.placeholder.com/50'
            },
            message: 'Would love to trade for your campsite. My Mountain Overlook has amazing sunset views.'
          }
        ];
        
        setPendingTrades(mockPendingTrades);
      }, 1000);
    } catch (err) {
      console.error('Error loading pending trades:', err);
      throw err;
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
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
  
  // Format date for display
  const formatDate = (date) => {
    const now = new Date();
    const diff = now - date;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days === 1 ? '' : 's'} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    } else {
      return 'Just now';
    }
  };
  
  // Handle tab change
  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      setLoading(true);
      
      // Reset search query
      setSearchQuery('');
      
      // Load data for the new tab
      if (tab === 'available') {
        loadAvailableLocations()
          .then(() => setLoading(false))
          .catch(() => setLoading(false));
      } else if (tab === 'my_locations') {
        loadMyTradeableLocations()
          .then(() => setLoading(false))
          .catch(() => setLoading(false));
      } else if (tab === 'pending') {
        loadPendingTrades()
          .then(() => setLoading(false))
          .catch(() => setLoading(false));
      }
    }
  };
  
  // Filter locations based on search query
  const getFilteredLocations = () => {
    const searchLower = searchQuery.toLowerCase();
    
    if (activeTab === 'available') {
      return availableLocations.filter(location => 
        location.name.toLowerCase().includes(searchLower) ||
        location.description.toLowerCase().includes(searchLower)
      );
    } else if (activeTab === 'my_locations') {
      return myTradeableLocations.filter(location => 
        location.name.toLowerCase().includes(searchLower) ||
        location.description.toLowerCase().includes(searchLower)
      );
    } else {
      return pendingTrades.filter(trade => 
        trade.offeredLocation.name.toLowerCase().includes(searchLower) ||
        trade.requestedLocation.name.toLowerCase().includes(searchLower) ||
        trade.otherUser.username.toLowerCase().includes(searchLower)
      );
    }
  };
  
  // Handle initiating a trade
  const handleInitiateTrade = (location) => {
    setSelectedLocation(location);
    setTradeType('credit'); // Default to credit trade
    setSelectedMyLocation(null);
    setTradeMessage('');
    setShowTradeModal(true);
  };
  
  // Handle trade execution
  const executeTrade = async () => {
    if (tradeInProgress) return;
    
    // Validate trade data
    if (tradeType === 'credit') {
      if (userCredits < selectedLocation.tradeCredits) {
        Alert.alert('Insufficient Credits', 
          `You have ${userCredits} credits, but this trade requires ${selectedLocation.tradeCredits} credits.`);
        return;
      }
    } else if (tradeType === 'direct') {
      if (!selectedMyLocation) {
        Alert.alert('Missing Selection', 'Please select one of your locations to offer in trade.');
        return;
      }
    }
    
    setTradeInProgress(true);
    
    try {
      // Prepare trade parameters
      let tradeParameters;
      
      if (tradeType === 'credit') {
        tradeParameters = {
          locationId: selectedLocation.id,
          creditAmount: selectedLocation.tradeCredits
        };
      } else {
        tradeParameters = {
          offeredLocationId: selectedMyLocation.id,
          requestedLocationId: selectedLocation.id,
          recipientUserId: selectedLocation.creator.id,
          message: tradeMessage
        };
      }
      
      // Execute trade
      const result = await trailtrades_performTrade(
        tradeType,
        tradeParameters,
        { autoDownload: true }
      );
      
      // Hide modal
      setShowTradeModal(false);
      
      // Handle successful trade
      if (tradeType === 'credit') {
        // Update user credits
        setUserCredits(result.remainingCredits);
        
        // Show success message
        Alert.alert(
          'Trade Successful!',
          `You've successfully traded ${selectedLocation.tradeCredits} credits for "${selectedLocation.name}". Location details are now available.`,
          [
            {
              text: 'View Location',
              onPress: () => navigation.navigate('LocationDetail', { id: selectedLocation.id, name: selectedLocation.name })
            },
            {
              text: 'OK',
              style: 'cancel'
            }
          ]
        );
        
        // Remove acquired location from available list
        setAvailableLocations(prevLocations => 
          prevLocations.filter(loc => loc.id !== selectedLocation.id)
        );
      } else {
        // Show success message for direct trade request
        Alert.alert(
          'Trade Request Sent!',
          `Your request to trade "${selectedMyLocation.name}" for "${selectedLocation.name}" has been sent. You'll be notified when the owner responds.`,
          [{ text: 'OK' }]
        );
        
        // Refresh pending trades
        loadPendingTrades();
      }
    } catch (err) {
      console.error('Trade error:', err);
      Alert.alert('Trade Failed', err.message || 'Failed to complete trade. Please try again.');
    } finally {
      setTradeInProgress(false);
    }
  };
  
  // Handle responding to a trade request
  const handleTradeResponse = (trade, accept) => {
    Alert.alert(
      accept ? 'Accept Trade' : 'Decline Trade',
      `Are you sure you want to ${accept ? 'accept' : 'decline'} this trade?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: accept ? 'Accept' : 'Decline',
          onPress: () => {
            // In a real app, this would be an API call
            Alert.alert(
              accept ? 'Trade Accepted' : 'Trade Declined',
              accept ? 
                `You've accepted the trade. You now have access to "${trade.offeredLocation.name}".` :
                `You've declined the trade request.`
            );
            
            // Remove from pending list
            setPendingTrades(prev => prev.filter(t => t.id !== trade.id));
          }
        }
      ]
    );
  };
  
  // Render available location item
  const renderAvailableLocationItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.locationCard}
        onPress={() => navigation.navigate('LocationDetail', { id: item.id, name: item.name })}
      >
        <Image 
          source={{ uri: item.photoUrl }}
          style={styles.locationImage}
        />
        <View style={styles.locationContent}>
          <Text style={styles.locationName}>{item.name}</Text>
          
          <Text style={styles.categoryText}>
            {formatCategories(item.categories)}
          </Text>
          
          <Text style={styles.locationDescription} numberOfLines={2}>
            {item.description}
          </Text>
          
          <View style={styles.locationFooter}>
            <View style={styles.creatorContainer}>
              <Image 
                source={{ uri: item.creator.avatarUrl }}
                style={styles.creatorAvatar}
              />
              <Text style={styles.creatorName}>{item.creator.username}</Text>
            </View>
            
            <View style={styles.tradeButton}>
              <Text style={styles.tradeCredits}>{item.tradeCredits} credits</Text>
              <TouchableOpacity
                style={styles.tradeAction}
                onPress={() => handleInitiateTrade(item)}
              >
                <Ionicons name="swap-horizontal" size={16} color="#fff" />
                <Text style={styles.tradeActionText}>Trade</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Render my location item
  const renderMyLocationItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.locationCard}
        onPress={() => navigation.navigate('LocationDetail', { id: item.id, name: item.name })}
      >
        <Image 
          source={{ uri: item.photoUrl }}
          style={styles.locationImage}
        />
        <View style={styles.locationContent}>
          <Text style={styles.locationName}>{item.name}</Text>
          
          <Text style={styles.categoryText}>
            {formatCategories(item.categories)}
          </Text>
          
          <Text style={styles.locationDescription} numberOfLines={2}>
            {item.description}
          </Text>
          
          <View style={styles.myLocationStats}>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={16} color="#555" />
              <Text style={styles.statValue}>{item.views}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="swap-horizontal" size={16} color="#555" />
              <Text style={styles.statValue}>{item.trades}</Text>
            </View>
            
            <View style={styles.privacyTag}>
              <Ionicons 
                name={item.privacy === 'trade' ? 'swap-horizontal' : 'earth'} 
                size={12} 
                color="#fff" 
              />
              <Text style={styles.privacyText}>
                {item.privacy === 'trade' ? 'Trade' : 'Public'}
              </Text>
            </View>
            
            {item.privacy === 'trade' && (
              <Text style={styles.tradeCreditsSmall}>{item.tradeCredits} credits</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Render pending trade item
  const renderPendingTradeItem = ({ item }) => {
    const isIncoming = item.status === 'requested';
    
    return (
      <View style={styles.tradeRequestCard}>
        <View style={styles.tradeRequestHeader}>
          <View style={styles.userInfo}>
            <Image 
              source={{ uri: item.otherUser.avatarUrl }}
              style={styles.userAvatar}
            />
            <Text style={styles.username}>{item.otherUser.username}</Text>
          </View>
          
          <Text style={styles.tradeDate}>{formatDate(item.timestamp)}</Text>
        </View>
        
        <View style={styles.tradeLocations}>
          <View style={styles.tradeLocationItem}>
            <Image 
              source={{ uri: isIncoming ? item.offeredLocation.photoUrl : item.requestedLocation.photoUrl }}
              style={styles.tradeLocationImage}
            />
            <Text style={styles.tradeLocationName} numberOfLines={1}>
              {isIncoming ? item.offeredLocation.name : item.requestedLocation.name}
            </Text>
            <Text style={styles.tradeDirectionLabel}>
              {isIncoming ? 'Their Offer' : 'You Requested'}
            </Text>
          </View>
          
          <View style={styles.tradeArrow}>
            <Ionicons name="swap-horizontal" size={24} color="#3C6E47" />
          </View>
          
          <View style={styles.tradeLocationItem}>
            <Image 
              source={{ uri: isIncoming ? item.requestedLocation.photoUrl : item.offeredLocation.photoUrl }}
              style={styles.tradeLocationImage}
            />
            <Text style={styles.tradeLocationName} numberOfLines={1}>
              {isIncoming ? item.requestedLocation.name : item.offeredLocation.name}
            </Text>
            <Text style={styles.tradeDirectionLabel}>
              {isIncoming ? 'They Want' : 'Your Offer'}
            </Text>
          </View>
        </View>
        
        {item.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Message:</Text>
            <Text style={styles.messageText}>{item.message}</Text>
          </View>
        )}
        
        <View style={styles.tradeActions}>
          {isIncoming ? (
            <>
              <TouchableOpacity 
                style={[styles.tradeActionButton, styles.declineButton]}
                onPress={() => handleTradeResponse(item, false)}
              >
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.tradeActionButton, styles.acceptButton]}
                onPress={() => handleTradeResponse(item, true)}
              >
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={[styles.tradeActionButton, styles.cancelButton]}
              onPress={() => handleTradeResponse(item, false)}
            >
              <Text style={styles.cancelButtonText}>Cancel Request</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };
  
  // Render trade modal
  const renderTradeModal = () => {
    if (!selectedLocation) return null;
    
    return (
      <Modal
        visible={showTradeModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Trade for Location</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowTradeModal(false)}
                disabled={tradeInProgress}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.selectedLocationContainer}>
                <Image 
                  source={{ uri: selectedLocation.photoUrl }}
                  style={styles.selectedLocationImage}
                />
                <Text style={styles.selectedLocationName}>{selectedLocation.name}</Text>
                <Text style={styles.selectedLocationDetails}>
                  {formatCategories(selectedLocation.categories)}
                </Text>
              </View>
              
              <View style={styles.tradeTypeTabs}>
                <TouchableOpacity
                  style={[
                    styles.tradeTypeTab,
                    tradeType === 'credit' ? styles.activeTradeTypeTab : {}
                  ]}
                  onPress={() => setTradeType('credit')}
                  disabled={tradeInProgress}
                >
                  <Ionicons
                    name="cash-outline"
                    size={20}
                    color={tradeType === 'credit' ? '#fff' : '#555'}
                  />
                  <Text
                    style={[
                      styles.tradeTypeText,
                      tradeType === 'credit' ? styles.activeTradeTypeText : {}
                    ]}
                  >
                    Use Credits
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.tradeTypeTab,
                    tradeType === 'direct' ? styles.activeTradeTypeTab : {}
                  ]}
                  onPress={() => setTradeType('direct')}
                  disabled={tradeInProgress}
                >
                  <Ionicons
                    name="swap-horizontal"
                    size={20}
                    color={tradeType === 'direct' ? '#fff' : '#555'}
                  />
                  <Text
                    style={[
                      styles.tradeTypeText,
                      tradeType === 'direct' ? styles.activeTradeTypeText : {}
                    ]}
                  >
                    Direct Trade
                  </Text>
                </TouchableOpacity>
              </View>
              
              {tradeType === 'credit' ? (
                <View style={styles.creditTradeSection}>
                  <View style={styles.creditInfoRow}>
                    <Text style={styles.creditLabel}>Trade Cost:</Text>
                    <Text style={styles.creditValue}>{selectedLocation.tradeCredits} credits</Text>
                  </View>
                  
                  <View style={styles.creditInfoRow}>
                    <Text style={styles.creditLabel}>Your Balance:</Text>
                    <Text style={styles.creditValue}>{userCredits} credits</Text>
                  </View>
                  
                  <View style={styles.creditInfoRow}>
                    <Text style={styles.creditLabel}>Remaining After Trade:</Text>
                    <Text 
                      style={[
                        styles.creditValue,
                        (userCredits - selectedLocation.tradeCredits) < 0 ? styles.insufficientCredits : {}
                      ]}
                    >
                      {userCredits - selectedLocation.tradeCredits} credits
                    </Text>
                  </View>
                  
                  {(userCredits - selectedLocation.tradeCredits) < 0 && (
                    <View style={styles.insufficientWarning}>
                      <Ionicons name="alert-circle" size={18} color="#e74c3c" />
                      <Text style={styles.insufficientWarningText}>
                        You don't have enough credits for this trade.
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.directTradeSection}>
                  <Text style={styles.sectionTitle}>Choose a location to offer:</Text>
                  
                  {myTradeableLocations.length === 0 ? (
                    <View style={styles.noLocationsWarning}>
                      <Ionicons name="alert-circle" size={18} color="#e74c3c" />
                      <Text style={styles.noLocationsWarningText}>
                        You don't have any locations available for trade. Add a location with "Trade" privacy level.
                      </Text>
                    </View>
                  ) : (
                    <>
                      <FlatList
                        data={myTradeableLocations}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={[
                              styles.myLocationSelectItem,
                              selectedMyLocation?.id === item.id ? styles.selectedMyLocation : {}
                            ]}
                            onPress={() => setSelectedMyLocation(item)}
                            disabled={tradeInProgress}
                          >
                            <Image 
                              source={{ uri: item.photoUrl }}
                              style={styles.myLocationSelectImage}
                            />
                            <View style={styles.myLocationSelectInfo}>
                              <Text style={styles.myLocationSelectName}>{item.name}</Text>
                              <Text style={styles.myLocationSelectDetails}>
                                {formatCategories(item.categories)}
                              </Text>
                            </View>
                            {selectedMyLocation?.id === item.id && (
                              <Ionicons name="checkmark-circle" size={24} color="#3C6E47" />
                            )}
                          </TouchableOpacity>
                        )}
                        horizontal={false}
                        scrollEnabled={false}
                        style={styles.myLocationsList}
                      />
                      
                      <Text style={styles.messageInputLabel}>Add a message (optional):</Text>
                      <TextInput
                        style={styles.messageInput}
                        placeholder="Let them know why they should trade with you..."
                        value={tradeMessage}
                        onChangeText={setTradeMessage}
                        multiline
                        numberOfLines={3}
                        maxLength={200}
                        editable={!tradeInProgress}
                      />
                    </>
                  )}
                </View>
              )}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelTradeButton}
                onPress={() => setShowTradeModal(false)}
                disabled={tradeInProgress}
              >
                <Text style={styles.cancelTradeButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.confirmTradeButton,
                  (tradeType === 'credit' && userCredits < selectedLocation.tradeCredits) ||
                  (tradeType === 'direct' && !selectedMyLocation) ||
                  tradeInProgress ? 
                    styles.disabledButton : {}
                ]}
                onPress={executeTrade}
                disabled={
                  (tradeType === 'credit' && userCredits < selectedLocation.tradeCredits) ||
                  (tradeType === 'direct' && !selectedMyLocation) ||
                  tradeInProgress
                }
              >
                {tradeInProgress ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmTradeButtonText}>
                    {tradeType === 'credit' ? 'Trade Credits' : 'Send Trade Request'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.creditBalance}>
          <Ionicons name="wallet-outline" size={24} color="#3C6E47" />
          <Text style={styles.creditBalanceText}>{userCredits} credits</Text>
        </View>
        
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('TradeHistory')}
        >
          <Ionicons name="time-outline" size={18} color="#3C6E47" />
          <Text style={styles.historyButtonText}>History</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              activeTab === 'available' ? "Search available locations..." :
              activeTab === 'my_locations' ? "Search your locations..." :
              "Search trades..."
            }
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
      
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'available' ? styles.activeTabButton : {}]}
          onPress={() => handleTabChange('available')}
        >
          <Text
            style={[styles.tabButtonText, activeTab === 'available' ? styles.activeTabButtonText : {}]}
          >
            Available
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'my_locations' ? styles.activeTabButton : {}]}
          onPress={() => handleTabChange('my_locations')}
        >
          <Text
            style={[styles.tabButtonText, activeTab === 'my_locations' ? styles.activeTabButtonText : {}]}
          >
            My Locations
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'pending' ? styles.activeTabButton : {}]}
          onPress={() => handleTabChange('pending')}
        >
          <Text
            style={[styles.tabButtonText, activeTab === 'pending' ? styles.activeTabButtonText : {}]}
          >
            Pending
          </Text>
        </TouchableOpacity>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3C6E47" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={getFilteredLocations()}
          keyExtractor={item => item.id}
          renderItem={
            activeTab === 'available' ? renderAvailableLocationItem :
            activeTab === 'my_locations' ? renderMyLocationItem :
            renderPendingTradeItem
          }
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#3C6E47']}
              tintColor="#3C6E47"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyListContainer}>
              <Ionicons 
                name={
                  activeTab === 'available' ? 'compass-outline' :
                  activeTab === 'my_locations' ? 'map-outline' :
                  'swap-horizontal-outline'
                } 
                size={64} 
                color="#ccc" 
              />
              <Text style={styles.emptyListTitle}>
                {activeTab === 'available' ? 'No locations available' :
                 activeTab === 'my_locations' ? 'No tradeable locations' :
                 'No pending trades'}
              </Text>
              <Text style={styles.emptyListText}>
                {activeTab === 'available' ? 'Try adjusting your search or check back later for new locations.' :
                 activeTab === 'my_locations' ? 'Add a location with the "Trade" privacy level to make it available for trading.' :
                 'You don\'t have any active trade requests at the moment.'}
              </Text>
            </View>
          }
        />
      )}
      
      {/* Trade Modal */}
      {renderTradeModal()}
      
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  creditBalance: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creditBalanceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3C6E47',
    marginLeft: 8,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  historyButtonText: {
    fontSize: 14,
    color: '#3C6E47',
    marginLeft: 4,
  },
  searchContainer: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingHorizontal: 10,
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#3C6E47',
  },
  tabButtonText: {
    fontSize: 14,
    color: '#888',
  },
  activeTabButtonText: {
    color: '#3C6E47',
    fontWeight: '600',
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
  listContainer: {
    padding: 12,
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  locationImage: {
    width: '100%',
    height: 150,
  },
  locationContent: {
    padding: 16,
  },
  locationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  locationDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
  },
  locationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  creatorName: {
    fontSize: 14,
    color: '#555',
  },
  tradeButton: {
    alignItems: 'flex-end',
  },
  tradeCredits: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3C6E47',
    marginBottom: 4,
  },
  tradeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3C6E47',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  tradeActionText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  myLocationStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statValue: {
    fontSize: 14,
    color: '#555',
    marginLeft: 4,
  },
  privacyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3C6E47',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  privacyText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 4,
  },
  tradeCreditsSmall: {
    fontSize: 12,
    color: '#3C6E47',
    fontWeight: '600',
  },
  tradeRequestCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tradeRequestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  tradeDate: {
    fontSize: 12,
    color: '#888',
  },
  tradeLocations: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tradeLocationItem: {
    width: '40%',
    alignItems: 'center',
  },
  tradeLocationImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  tradeLocationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  tradeDirectionLabel: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  tradeArrow: {
    width: '10%',
    alignItems: 'center',
  },
  messageContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },
  tradeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tradeActionButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#3C6E47',
    flex: 1,
    marginLeft: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  declineButton: {
    backgroundColor: '#f5f5f5',
    flex: 1,
    marginRight: 8,
  },
  declineButtonText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    flex: 1,
  },
  cancelButtonText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyListContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyListText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
  modalContent: {
    padding: 16,
  },
  selectedLocationContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedLocationImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedLocationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  selectedLocationDetails: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  tradeTypeTabs: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tradeTypeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  activeTradeTypeTab: {
    backgroundColor: '#3C6E47',
  },
  tradeTypeText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 6,
  },
  activeTradeTypeText: {
    color: '#fff',
    fontWeight: '600',
  },
  creditTradeSection: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
  },
  creditInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  creditLabel: {
    fontSize: 14,
    color: '#555',
  },
  creditValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  insufficientCredits: {
    color: '#e74c3c',
  },
  insufficientWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FADBD8',
    borderRadius: 4,
    padding: 8,
    marginTop: 8,
  },
  insufficientWarningText: {
    fontSize: 14,
    color: '#e74c3c',
    marginLeft: 6,
  },
  directTradeSection: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  noLocationsWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FADBD8',
    borderRadius: 4,
    padding: 8,
  },
  noLocationsWarningText: {
    fontSize: 14,
    color: '#e74c3c',
    marginLeft: 6,
  },
  myLocationsList: {
    maxHeight: 210,
  },
  myLocationSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  selectedMyLocation: {
    borderWidth: 2,
    borderColor: '#3C6E47',
  },
  myLocationSelectImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 12,
  },
  myLocationSelectInfo: {
    flex: 1,
  },
  myLocationSelectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  myLocationSelectDetails: {
    fontSize: 12,
    color: '#888',
  },
  messageInputLabel: {
    fontSize: 14,
    color: '#555',
    marginTop: 12,
    marginBottom: 8,
  },
  messageInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelTradeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3C6E47',
    borderRadius: 8,
    marginRight: 8,
  },
  cancelTradeButtonText: {
    color: '#3C6E47',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmTradeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#3C6E47',
    borderRadius: 8,
    marginLeft: 8,
  },
  confirmTradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#a8d5ba',
  },
});

export default TradeScreen;