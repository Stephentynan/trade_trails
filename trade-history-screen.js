// TradeHistoryScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TradeHistoryScreen = () => {
  const navigation = useNavigation();
  
  // State variables
  const [tradeHistory, setTradeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'credit', 'direct'
  const [error, setError] = useState(null);
  
  // Fetch trade history on component mount
  useEffect(() => {
    loadTradeHistory();
  }, []);
  
  // Load trade history
  const loadTradeHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // For demo purposes, use mock data
      // In a real app, this would be an API call
      setTimeout(() => {
        const mockTradeHistory = [
          {
            id: 'trade1',
            type: 'credit',
            status: 'completed',
            creditAmount: 15,
            location: {
              id: 'loc1',
              name: 'Mountain Overlook',
              photoUrl: 'https://via.placeholder.com/100'
            },
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
          },
          {
            id: 'trade2',
            type: 'direct',
            status: 'completed',
            offeredLocation: {
              id: 'myloc1',
              name: 'Desert Canyon Trail',
              photoUrl: 'https://via.placeholder.com/100'
            },
            receivedLocation: {
              id: 'loc3',
              name: 'Hidden Hot Springs',
              photoUrl: 'https://via.placeholder.com/100'
            },
            otherUser: {
              id: 'user3',
              username: 'adventureseeker',
              avatarUrl: 'https://via.placeholder.com/50'
            },
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
          },
          {
            id: 'trade3',
            type: 'credit',
            status: 'completed',
            creditAmount: 20,
            location: {
              id: 'loc4',
              name: 'Secret Waterfall',
              photoUrl: 'https://via.placeholder.com/100'
            },
            timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // 14 days ago
          },
          {
            id: 'trade4',
            type: 'direct',
            status: 'cancelled',
            offeredLocation: {
              id: 'myloc2',
              name: 'Forest Creek Campsite',
              photoUrl: 'https://via.placeholder.com/100'
            },
            requestedLocation: {
              id: 'loc5',
              name: 'Alpine Lake',
              photoUrl: 'https://via.placeholder.com/100'
            },
            otherUser: {
              id: 'user5',
              username: 'alpinist',
              avatarUrl: 'https://via.placeholder.com/50'
            },
            timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
          }
        ];
        
        setTradeHistory(mockTradeHistory);
        setLoading(false);
        setRefreshing(false);
      }, 1000);
    } catch (err) {
      console.error('Error loading trade history:', err);
      setError('Failed to load trade history. Please try again.');
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadTradeHistory();
  };
  
  // Get filtered trade history
  const getFilteredTradeHistory = () => {
    if (activeTab === 'all') {
      return tradeHistory;
    } else {
      return tradeHistory.filter(trade => trade.type === activeTab);
    }
  };
  
  // Get formatted date string
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Render trade history item
  const renderTradeHistoryItem = ({ item }) => {
    // Credit trade
    if (item.type === 'credit') {
      return (
        <TouchableOpacity 
          style={styles.tradeCard}
          onPress={() => navigation.navigate('LocationDetail', { id: item.location.id, name: item.location.name })}
        >
          <View style={styles.tradeCardHeader}>
            <View style={styles.tradeTypeTag}>
              <Ionicons name="cash-outline" size={12} color="#fff" />
              <Text style={styles.tradeTypeText}>Credit</Text>
            </View>
            <Text style={styles.tradeDate}>{formatDate(item.timestamp)}</Text>
          </View>
          
          <View style={styles.tradeContent}>
            <Image 
              source={{ uri: item.location.photoUrl }}
              style={styles.tradeImage}
            />
            
            <View style={styles.tradeDetails}>
              <Text style={styles.tradeName}>{item.location.name}</Text>
              <View style={styles.creditDetails}>
                <Ionicons name="arrow-forward" size={14} color="#555" />
                <Text style={styles.creditAmount}>{item.creditAmount} credits</Text>
              </View>
              
              <View style={styles.statusContainer}>
                <View style={[styles.statusIndicator, { backgroundColor: '#27AE60' }]} />
                <Text style={styles.statusText}>Acquired</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    }
    // Direct trade
    else if (item.type === 'direct') {
      return (
        <TouchableOpacity 
          style={styles.tradeCard}
          onPress={() => item.status === 'completed' 
            ? navigation.navigate('LocationDetail', { id: item.receivedLocation.id, name: item.receivedLocation.name })
            : null
          }
        >
          <View style={styles.tradeCardHeader}>
            <View style={styles.tradeTypeTag}>
              <Ionicons name="swap-horizontal" size={12} color="#fff" />
              <Text style={styles.tradeTypeText}>Direct</Text>
            </View>
            <Text style={styles.tradeDate}>{formatDate(item.timestamp)}</Text>
          </View>
          
          <View style={styles.directTradeContent}>
            <View style={styles.tradeLocation}>
              <Image 
                source={{ uri: item.offeredLocation.photoUrl }}
                style={styles.directTradeImage}
              />
              <Text style={styles.directTradeLocationName} numberOfLines={2}>
                {item.offeredLocation.name}
              </Text>
              <Text style={styles.directTradeLabel}>You Offered</Text>
            </View>
            
            <View style={styles.tradeArrow}>
              <Ionicons 
                name="arrow-forward" 
                size={20} 
                color={item.status === 'completed' ? '#27AE60' : '#e74c3c'} 
              />
            </View>
            
            <View style={styles.tradeLocation}>
              <Image 
                source={{ uri: item.receivedLocation ? item.receivedLocation.photoUrl : item.requestedLocation.photoUrl }}
                style={styles.directTradeImage}
              />
              <Text style={styles.directTradeLocationName} numberOfLines={2}>
                {item.receivedLocation ? item.receivedLocation.name : item.requestedLocation.name}
              </Text>
              <Text style={styles.directTradeLabel}>
                {item.receivedLocation ? 'You Received' : 'You Requested'}
              </Text>
            </View>
          </View>
          
          <View style={styles.directTradeFooter}>
            <View style={styles.userInfo}>
              <Text style={styles.tradedWithLabel}>Traded with:</Text>
              <View style={styles.userContainer}>
                <Image 
                  source={{ uri: item.otherUser.avatarUrl }}
                  style={styles.userAvatar}
                />
                <Text style={styles.username}>{item.otherUser.username}</Text>
              </View>
            </View>
            
            <View style={styles.statusContainer}>
              <View 
                style={[
                  styles.statusIndicator, 
                  { backgroundColor: item.status === 'completed' ? '#27AE60' : '#e74c3c' }
                ]} 
              />
              <Text style={styles.statusText}>
                {item.status === 'completed' ? 'Completed' : 'Cancelled'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }
    
    return null;
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'all' ? styles.activeTabButton : {}]}
          onPress={() => setActiveTab('all')}
        >
          <Text
            style={[styles.tabButtonText, activeTab === 'all' ? styles.activeTabButtonText : {}]}
          >
            All
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'credit' ? styles.activeTabButton : {}]}
          onPress={() => setActiveTab('credit')}
        >
          <Text
            style={[styles.tabButtonText, activeTab === 'credit' ? styles.activeTabButtonText : {}]}
          >
            Credit
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'direct' ? styles.activeTabButton : {}]}
          onPress={() => setActiveTab('direct')}
        >
          <Text
            style={[styles.tabButtonText, activeTab === 'direct' ? styles.activeTabButtonText : {}]}
          >
            Direct
          </Text>
        </TouchableOpacity>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3C6E47" />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadTradeHistory}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={getFilteredTradeHistory()}
          keyExtractor={item => item.id}
          renderItem={renderTradeHistoryItem}
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
              <Ionicons name="time-outline" size={64} color="#ccc" />
              <Text style={styles.emptyListTitle}>No trade history</Text>
              <Text style={styles.emptyListText}>
                Trades you make will appear here. Start trading to build your history.
              </Text>
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
  tradeCard: {
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
  tradeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tradeTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3C6E47',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tradeTypeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  tradeDate: {
    fontSize: 12,
    color: '#888',
  },
  tradeContent: {
    flexDirection: 'row',
  },
  tradeImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
  },
  tradeDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  tradeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  creditDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  creditAmount: {
    fontSize: 14,
    color: '#555',
    marginLeft: 6,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#555',
  },
  directTradeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tradeLocation: {
    width: '42%',
    alignItems: 'center',
  },
  directTradeImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  directTradeLocationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  directTradeLabel: {
    fontSize: 12,
    color: '#888',
  },
  tradeArrow: {
    width: '10%',
    alignItems: 'center',
  },
  directTradeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  userInfo: {
    flex: 1,
  },
  tradedWithLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  username: {
    fontSize: 14,
    color: '#555',
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
});

export default TradeHistoryScreen;