// TradeNotification.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const TradeNotification = ({ 
  visible, 
  type, // 'trade_request', 'trade_accepted', 'trade_declined', 'credit_trade'
  data,
  onDismiss
}) => {
  const navigation = useNavigation();
  const [slideAnim] = useState(new Animated.Value(-100));
  
  useEffect(() => {
    if (visible) {
      // Slide in when visible
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Auto dismiss after 5 seconds
      const dismissTimer = setTimeout(() => {
        dismiss();
      }, 5000);
      
      return () => clearTimeout(dismissTimer);
    }
  }, [visible]);
  
  const dismiss = () => {
    // Slide out animation
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (onDismiss) onDismiss();
    });
  };
  
  // Navigate to appropriate screen based on notification type
  const handlePress = () => {
    dismiss();
    
    switch (type) {
      case 'trade_request':
        navigation.navigate('TradeTab', { screen: 'Trade', params: { initialTab: 'pending' } });
        break;
      case 'trade_accepted':
      case 'trade_declined':
        navigation.navigate('TradeTab', { screen: 'TradeHistory' });
        break;
      case 'credit_trade':
        if (data?.locationId) {
          navigation.navigate('LocationDetail', { id: data.locationId, name: data.locationName });
        }
        break;
    }
  };
  
  // Get notification content based on type
  const getNotificationContent = () => {
    if (!data) return null;
    
    switch (type) {
      case 'trade_request':
        return (
          <>
            <Ionicons name="notifications" size={20} color="#fff" style={styles.notificationIcon} />
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>Trade Request</Text>
              <Text style={styles.notificationText}>
                <Text style={styles.highlightText}>{data.username}</Text> wants to trade for your location <Text style={styles.highlightText}>{data.locationName}</Text>
              </Text>
            </View>
            {data.userAvatar && (
              <Image source={{ uri: data.userAvatar }} style={styles.userAvatar} />
            )}
          </>
        );
      
      case 'trade_accepted':
        return (
          <>
            <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.notificationIcon} />
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>Trade Accepted</Text>
              <Text style={styles.notificationText}>
                <Text style={styles.highlightText}>{data.username}</Text> accepted your trade for <Text style={styles.highlightText}>{data.locationName}</Text>
              </Text>
            </View>
            {data.locationImage && (
              <Image source={{ uri: data.locationImage }} style={styles.locationImage} />
            )}
          </>
        );
      
      case 'trade_declined':
        return (
          <>
            <Ionicons name="close-circle" size={20} color="#fff" style={styles.notificationIcon} />
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>Trade Declined</Text>
              <Text style={styles.notificationText}>
                <Text style={styles.highlightText}>{data.username}</Text> declined your trade request
              </Text>
            </View>
          </>
        );
      
      case 'credit_trade':
        return (
          <>
            <Ionicons name="swap-horizontal" size={20} color="#fff" style={styles.notificationIcon} />
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>Trade Complete</Text>
              <Text style={styles.notificationText}>
                You successfully traded {data.credits} credits for <Text style={styles.highlightText}>{data.locationName}</Text>
              </Text>
            </View>
            {data.locationImage && (
              <Image source={{ uri: data.locationImage }} style={styles.locationImage} />
            )}
          </>
        );
      
      default:
        return null;
    }
  };
  
  // Get background color based on notification type
  const getBackgroundColor = () => {
    switch (type) {
      case 'trade_request':
        return '#3498db'; // Blue
      case 'trade_accepted':
        return '#27ae60'; // Green
      case 'trade_declined':
        return '#e74c3c'; // Red
      case 'credit_trade':
        return '#3C6E47'; // App's primary green
      default:
        return '#3C6E47';
    }
  };
  
  if (!visible) return null;
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: getBackgroundColor(),
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.notificationContainer}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {getNotificationContent()}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={dismiss}
      >
        <Ionicons name="close" size={16} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 40, // Account for status bar
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  notificationContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIcon: {
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  notificationText: {
    color: '#fff',
    fontSize: 12,
  },
  highlightText: {
    fontWeight: 'bold',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  locationImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginLeft: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  closeButton: {
    marginLeft: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
});

export default TradeNotification;