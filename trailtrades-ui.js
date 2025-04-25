// App.js - Main entry point for the application
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar, Platform, SafeAreaView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

// Authentication Screens
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import ForgotPasswordScreen from './screens/auth/ForgotPasswordScreen';

// Main App Screens
import HomeScreen from './screens/main/HomeScreen';
import DiscoverScreen from './screens/discover/DiscoverScreen';
import LocationDetailScreen from './screens/location/LocationDetailScreen';
import AddLocationScreen from './screens/location/AddLocationScreen';
import RecordTrailScreen from './screens/trail/RecordTrailScreen';
import TrailDetailScreen from './screens/trail/TrailDetailScreen';
import UploadMediaScreen from './screens/media/UploadMediaScreen';
import MediaDetailScreen from './screens/media/MediaDetailScreen';
import ProfileScreen from './screens/profile/ProfileScreen';
import EditProfileScreen from './screens/profile/EditProfileScreen';
import TradeScreen from './screens/trade/TradeScreen';
import TradeHistoryScreen from './screens/trade/TradeHistoryScreen';
import SettingsScreen from './screens/settings/SettingsScreen';

// Navigation Stacks
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Authentication Stack
const AuthStack = () => {
  return (
    <Stack.Navigator 
      screenOptions={{
        headerStyle: {
          backgroundColor: '#3C6E47', // Forest green
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{ title: 'Create Account' }}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen} 
        options={{ title: 'Reset Password' }}
      />
    </Stack.Navigator>
  );
};

// Home Stack
const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#3C6E47',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'TrailTrades' }}
      />
      <Stack.Screen 
        name="LocationDetail" 
        component={LocationDetailScreen} 
        options={({ route }) => ({ title: route.params?.name || 'Location Details' })}
      />
      <Stack.Screen 
        name="TrailDetail" 
        component={TrailDetailScreen} 
        options={({ route }) => ({ title: route.params?.name || 'Trail Details' })}
      />
      <Stack.Screen 
        name="MediaDetail" 
        component={MediaDetailScreen} 
        options={{ title: 'Photo & Video' }}
      />
    </Stack.Navigator>
  );
};

// Discover Stack
const DiscoverStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#3C6E47',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Discover" 
        component={DiscoverScreen} 
        options={{ title: 'Discover Locations' }}
      />
      <Stack.Screen 
        name="LocationDetail" 
        component={LocationDetailScreen} 
        options={({ route }) => ({ title: route.params?.name || 'Location Details' })}
      />
      <Stack.Screen 
        name="TrailDetail" 
        component={TrailDetailScreen} 
        options={({ route }) => ({ title: route.params?.name || 'Trail Details' })}
      />
      <Stack.Screen 
        name="MediaDetail" 
        component={MediaDetailScreen} 
        options={{ title: 'Photo & Video' }}
      />
    </Stack.Navigator>
  );
};

// Create Stack
const CreateStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#3C6E47',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="AddLocation" 
        component={AddLocationScreen} 
        options={{ title: 'Add Location' }}
      />
      <Stack.Screen 
        name="RecordTrail" 
        component={RecordTrailScreen} 
        options={{ title: 'Record Trail' }}
      />
      <Stack.Screen 
        name="UploadMedia" 
        component={UploadMediaScreen} 
        options={{ title: 'Upload Photos & Videos' }}
      />
    </Stack.Navigator>
  );
};

// Trade Stack
const TradeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#3C6E47',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Trade" 
        component={TradeScreen} 
        options={{ title: 'Trade Spots' }}
      />
      <Stack.Screen 
        name="TradeHistory" 
        component={TradeHistoryScreen} 
        options={{ title: 'Trade History' }}
      />
      <Stack.Screen 
        name="LocationDetail" 
        component={LocationDetailScreen} 
        options={({ route }) => ({ title: route.params?.name || 'Location Details' })}
      />
    </Stack.Navigator>
  );
};

// Profile Stack
const ProfileStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#3C6E47',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'My Profile' }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen} 
        options={{ title: 'Edit Profile' }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Settings' }}
      />
      <Stack.Screen 
        name="LocationDetail" 
        component={LocationDetailScreen} 
        options={({ route }) => ({ title: route.params?.name || 'Location Details' })}
      />
      <Stack.Screen 
        name="TrailDetail" 
        component={TrailDetailScreen} 
        options={({ route }) => ({ title: route.params?.name || 'Trail Details' })}
      />
    </Stack.Navigator>
  );
};

// Main Tab Navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'DiscoverTab') {
            iconName = focused ? 'compass' : 'compass-outline';
          } else if (route.name === 'CreateTab') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'TradeTab') {
            iconName = focused ? 'swap-horizontal' : 'swap-horizontal-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
        },
        tabBarActiveTintColor: '#3C6E47',
        tabBarInactiveTintColor: '#888888',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeStack} 
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="DiscoverTab" 
        component={DiscoverStack} 
        options={{ title: 'Discover' }}
      />
      <Tab.Screen 
        name="CreateTab" 
        component={CreateStack} 
        options={{ title: 'Create' }}
      />
      <Tab.Screen 
        name="TradeTab" 
        component={TradeStack} 
        options={{ title: 'Trade' }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileStack} 
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Main App Component
const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  // Check for existing auth token on startup
  useEffect(() => {
    const bootstrapAsync = async () => {
      let token = null;
      try {
        // Fetch token from storage
        token = await AsyncStorage.getItem('trailtrades_auth_token');
      } catch (e) {
        // Error fetching token
        console.error('Failed to get auth token', e);
      }
      
      // Update state with token
      setUserToken(token);
      setIsLoading(false);
    };

    bootstrapAsync();
  }, []);

  // Set loading screen if still loading
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        {/* Add your loading component here */}
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
        backgroundColor="#3C6E47"
      />
      {userToken ? (
        <TabNavigator />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
});

export default App;