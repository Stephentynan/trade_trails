// AddLocationScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { trailtrades_addLocation } from '../../functions/trailtrades_addLocation';

const AddLocationScreen = () => {
  const navigation = useNavigation();
  const mapRef = useRef(null);

  // State for location input method
  const [addMethod, setAddMethod] = useState('map'); // 'map', 'address', 'coordinates'
  
  // State for location data
  const [locationData, setLocationData] = useState({
    name: '',
    description: '',
    categories: [],
    tags: [],
    vehicleRequirements: {
      fourWDRequired: false,
      highClearanceRequired: false,
      rvFriendly: false,
      minClearanceInches: 0
    },
    rvSpecs: {
      maxLengthFeet: 0,
      hasHookups: false,
      hasDumping: false
    },
    coordinates: {
      latitude: null,
      longitude: null
    },
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    },
    privacyLevel: 'public' // 'public', 'followers', 'private', 'trade'
  });

  // State for map interaction
  const [userLocation, setUserLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRvOptions, setShowRvOptions] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [tradeCredits, setTradeCredits] = useState(10);

  // Available categories
  const categories = [
    { id: 'hiking', name: 'Hiking', icon: 'walk' },
    { id: 'camping', name: 'Camping', icon: 'campfire' },
    { id: 'mountain_biking', name: 'Mountain Biking', icon: 'bike' },
    { id: 'dirt_biking', name: 'Dirt Biking', icon: 'motorbike' },
    { id: 'offroading', name: 'Offroading', icon: 'car-4x4' },
    { id: 'rv_safe', name: 'RV-Safe', icon: 'rv-truck' }
  ];

  // Get user's location on component mount
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission to access location was denied');
          return;
        }

        let position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        const currentLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        
        setUserLocation(currentLocation);
        setSelectedLocation(currentLocation);
        
        // Update the locationData with the current coordinates
        setLocationData(prevData => ({
          ...prevData,
          coordinates: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude
          }
        }));
      } catch (err) {
        console.error('Error getting location:', err);
        setError('Could not get your location');
      }
    })();
  }, []);

  // Toggle a category selection
  const toggleCategory = (categoryId) => {
    setLocationData(prevData => {
      if (prevData.categories.includes(categoryId)) {
        return {
          ...prevData,
          categories: prevData.categories.filter(id => id !== categoryId)
        };
      } else {
        return {
          ...prevData,
          categories: [...prevData.categories, categoryId]
        };
      }
    });

    // If RV-Safe is toggled, show RV options
    if (categoryId === 'rv_safe') {
      setShowRvOptions(!locationData.categories.includes('rv_safe'));
      if (!locationData.categories.includes('rv_safe')) {
        setLocationData(prevData => ({
          ...prevData,
          vehicleRequirements: {
            ...prevData.vehicleRequirements,
            rvFriendly: true
          }
        }));
      }
    }
  };

  // Handle map press to select location
  const handleMapPress = (event) => {
    if (addMethod === 'map') {
      const { coordinate } = event.nativeEvent;
      setSelectedLocation(coordinate);
      
      // Update the locationData with the selected coordinates
      setLocationData(prevData => ({
        ...prevData,
        coordinates: {
          latitude: coordinate.latitude,
          longitude: coordinate.longitude
        }
      }));
    }
  };

  // Update address fields
  const handleAddressChange = (field, value) => {
    setLocationData(prevData => ({
      ...prevData,
      address: {
        ...prevData.address,
        [field]: value
      }
    }));
  };

  // Update coordinates fields
  const handleCoordinateChange = (field, value) => {
    const numberValue = parseFloat(value);
    if (!isNaN(numberValue)) {
      setLocationData(prevData => ({
        ...prevData,
        coordinates: {
          ...prevData.coordinates,
          [field]: numberValue
        }
      }));

      if (field === 'latitude' && numberValue >= -90 && numberValue <= 90 &&
          locationData.coordinates.longitude !== null) {
        setSelectedLocation({
          latitude: numberValue,
          longitude: locationData.coordinates.longitude
        });
      } else if (field === 'longitude' && numberValue >= -180 && numberValue <= 180 &&
                locationData.coordinates.latitude !== null) {
        setSelectedLocation({
          latitude: locationData.coordinates.latitude,
          longitude: numberValue
        });
      }
    }
  };

  // Validate form before submission
  const validateForm = () => {
    // Check name
    if (!locationData.name.trim()) {
      Alert.alert('Error', 'Please enter a name for this location');
      return false;
    }

    // Check that at least one category is selected
    if (locationData.categories.length === 0) {
      Alert.alert('Error', 'Please select at least one category');
      return false;
    }

    // Check coordinates based on method
    if (addMethod === 'map' || addMethod === 'coordinates') {
      if (!locationData.coordinates.latitude || !locationData.coordinates.longitude) {
        Alert.alert('Error', 'Please select a valid location on the map');
        return false;
      }
    } else if (addMethod === 'address') {
      if (!locationData.address.street || !locationData.address.city) {
        Alert.alert('Error', 'Please enter at least street and city');
        return false;
      }
    }

    // Check RV specs if RV-friendly
    if (locationData.vehicleRequirements.rvFriendly) {
      if (locationData.rvSpecs.maxLengthFeet <= 0) {
        Alert.alert('Info', 'No maximum RV length specified. Setting to default of 30 feet.');
        setLocationData(prevData => ({
          ...prevData,
          rvSpecs: {
            ...prevData.rvSpecs,
            maxLengthFeet: 30
          }
        }));
      }
    }

    // Check trade credits if privacy level is trade
    if (locationData.privacyLevel === 'trade' && tradeCredits < 5) {
      Alert.alert('Error', 'Trade credit requirement must be at least 5 credits');
      return false;
    }

    return true;
  };

  // Submit location
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare location data based on selected method
      let methodData;
      if (addMethod === 'map') {
        methodData = {
          mapSource: {
            provider: 'google',
            placeId: 'custom_location'
          }
        };
      } else if (addMethod === 'address') {
        methodData = {
          address: locationData.address
        };
      } else if (addMethod === 'coordinates') {
        methodData = {
          coordinates: locationData.coordinates
        };
      }

      // Prepare metadata
      const metadata = {
        name: locationData.name,
        categories: locationData.categories,
        description: locationData.description,
        tags: locationData.tags.length > 0 ? locationData.tags.split(',').map(tag => tag.trim()) : [],
        vehicleRequirements: {
          fourWDRequired: locationData.vehicleRequirements.fourWDRequired,
          highClearanceRequired: locationData.vehicleRequirements.highClearanceRequired,
          rvFriendly: locationData.vehicleRequirements.rvFriendly,
          minClearanceInches: locationData.vehicleRequirements.minClearanceInches > 0 ? 
            locationData.vehicleRequirements.minClearanceInches : undefined
        }
      };

      // Add RV specs if RV-friendly
      if (locationData.vehicleRequirements.rvFriendly) {
        metadata.rvSpecs = {
          maxLengthFeet: locationData.rvSpecs.maxLengthFeet,
          hasHookups: locationData.rvSpecs.hasHookups,
          hasDumping: locationData.rvSpecs.hasDumping
        };
      }

      // Call the add location function
      const result = await trailtrades_addLocation(
        addMethod,
        methodData,
        metadata,
        locationData.privacyLevel
      );

      // Handle success
      Alert.alert(
        'Success',
        'Location added successfully! Would you like to add photos or trails?',
        [
          {
            text: 'Later',
            onPress: () => {
              navigation.goBack();
            },
            style: 'cancel',
          },
          {
            text: 'Add Photos',
            onPress: () => {
              navigation.navigate('UploadMedia', { locationId: result.id });
            },
          },
          {
            text: 'Add Trail',
            onPress: () => {
              navigation.navigate('RecordTrail', { locationId: result.id });
            },
          },
        ]
      );
    } catch (err) {
      console.error('Error adding location:', err);
      setError(err.message || 'Failed to add location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render input method selector
  const renderMethodSelector = () => {
    return (
      <View style={styles.methodSelector}>
        <TouchableOpacity
          style={[styles.methodButton, addMethod === 'map' ? styles.methodButtonActive : {}]}
          onPress={() => setAddMethod('map')}
        >
          <Ionicons
            name="map"
            size={20}
            color={addMethod === 'map' ? '#fff' : '#3C6E47'}
          />
          <Text style={[styles.methodButtonText, addMethod === 'map' ? styles.methodButtonTextActive : {}]}>
            Map
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.methodButton, addMethod === 'address' ? styles.methodButtonActive : {}]}
          onPress={() => setAddMethod('address')}
        >
          <Ionicons
            name="home"
            size={20}
            color={addMethod === 'address' ? '#fff' : '#3C6E47'}
          />
          <Text style={[styles.methodButtonText, addMethod === 'address' ? styles.methodButtonTextActive : {}]}>
            Address
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.methodButton, addMethod === 'coordinates' ? styles.methodButtonActive : {}]}
          onPress={() => setAddMethod('coordinates')}
        >
          <Ionicons
            name="compass"
            size={20}
            color={addMethod === 'coordinates' ? '#fff' : '#3C6E47'}
          />
          <Text style={[styles.methodButtonText, addMethod === 'coordinates' ? styles.methodButtonTextActive : {}]}>
            Coordinates
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render map input
  const renderMapInput = () => {
    return (
      <View style={styles.mapContainer}>
        {userLocation ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation
            onPress={handleMapPress}
          >
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation}
                pinColor="#3C6E47"
                draggable
                onDragEnd={(e) => {
                  setSelectedLocation(e.nativeEvent.coordinate);
                  setLocationData(prevData => ({
                    ...prevData,
                    coordinates: {
                      latitude: e.nativeEvent.coordinate.latitude,
                      longitude: e.nativeEvent.coordinate.longitude
                    }
                  }));
                }}
              />
            )}
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <ActivityIndicator size="large" color="#3C6E47" />
            <Text style={styles.mapPlaceholderText}>Loading map...</Text>
          </View>
        )}

        <View style={styles.mapInstructions}>
          <Text style={styles.mapInstructionsText}>
            {selectedLocation 
              ? 'Drag the pin to adjust the exact location' 
              : 'Tap on the map to select a location'}
          </Text>
        </View>
      </View>
    );
  };

  // Render address input
  const renderAddressInput = () => {
    return (
      <View style={styles.inputSection}>
        <Text style={styles.inputSectionTitle}>Address Information</Text>
        
        <TextInput
          style={styles.textInput}
          placeholder="Street"
          value={locationData.address.street}
          onChangeText={(text) => handleAddressChange('street', text)}
        />
        
        <TextInput
          style={styles.textInput}
          placeholder="City"
          value={locationData.address.city}
          onChangeText={(text) => handleAddressChange('city', text)}
        />
        
        <View style={styles.rowInputs}>
          <TextInput
            style={[styles.textInput, { flex: 1, marginRight: 8 }]}
            placeholder="State/Province"
            value={locationData.address.state}
            onChangeText={(text) => handleAddressChange('state', text)}
          />
          
          <TextInput
            style={[styles.textInput, { flex: 1 }]}
            placeholder="Postal Code"
            value={locationData.address.postalCode}
            onChangeText={(text) => handleAddressChange('postalCode', text)}
          />
        </View>
        
        <TextInput
          style={styles.textInput}
          placeholder="Country"
          value={locationData.address.country}
          onChangeText={(text) => handleAddressChange('country', text)}
        />
      </View>
    );
  };

  // Render coordinates input
  const renderCoordinatesInput = () => {
    return (
      <View style={styles.inputSection}>
        <Text style={styles.inputSectionTitle}>Coordinates</Text>
        
        <View style={styles.rowInputs}>
          <View style={[styles.coordinateInput, { marginRight: 8 }]}>
            <Text style={styles.coordinateLabel}>Latitude</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Latitude (e.g. 37.7749)"
              value={locationData.coordinates.latitude !== null ? locationData.coordinates.latitude.toString() : ''}
              onChangeText={(text) => handleCoordinateChange('latitude', text)}
              keyboardType="decimal-pad"
            />
          </View>
          
          <View style={styles.coordinateInput}>
            <Text style={styles.coordinateLabel}>Longitude</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Longitude (e.g. -122.4194)"
              value={locationData.coordinates.longitude !== null ? locationData.coordinates.longitude.toString() : ''}
              onChangeText={(text) => handleCoordinateChange('longitude', text)}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
        
        <Text style={styles.coordinateHelper}>
          Latitude must be between -90 and 90, Longitude between -180 and 180
        </Text>
        
        {selectedLocation && (
          <View style={styles.mapPreview}>
            <MapView
              style={styles.previewMap}
              provider={PROVIDER_GOOGLE}
              region={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker
                coordinate={selectedLocation}
                pinColor="#3C6E47"
              />
            </MapView>
          </View>
        )}
      </View>
    );
  };

  // Render location input based on selected method
  const renderLocationInput = () => {
    switch (addMethod) {
      case 'map':
        return renderMapInput();
      case 'address':
        return renderAddressInput();
      case 'coordinates':
        return renderCoordinatesInput();
      default:
        return null;
    }
  };

  // Render categories modal
  const renderCategoryModal = () => {
    return (
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Categories</Text>
              <TouchableOpacity
                onPress={() => setShowCategoryModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.categoriesGrid}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    locationData.categories.includes(category.id) ? styles.categoryItemSelected : {}
                  ]}
                  onPress={() => toggleCategory(category.id)}
                >
                  <MaterialCommunityIcons
                    name={category.icon}
                    size={28}
                    color={locationData.categories.includes(category.id) ? "#fff" : "#555"}
                  />
                  <Text
                    style={[
                      styles.categoryItemText,
                      locationData.categories.includes(category.id) ? styles.categoryItemTextSelected : {}
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Basic Information Section */}
        <View style={styles.inputSection}>
          <Text style={styles.inputSectionTitle}>Basic Information</Text>
          
          <TextInput
            style={styles.textInput}
            placeholder="Location Name"
            value={locationData.name}
            onChangeText={(text) => setLocationData(prevData => ({ ...prevData, name: text }))}
          />
          
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Description"
            value={locationData.description}
            onChangeText={(text) => setLocationData(prevData => ({ ...prevData, description: text }))}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          
          <TouchableOpacity
            style={styles.categorySelector}
            onPress={() => setShowCategoryModal(true)}
          >
            <Text style={styles.categorySelectorLabel}>Categories</Text>
            <View style={styles.selectedCategories}>
              {locationData.categories.length > 0 ? (
                locationData.categories.map(catId => {
                  const category = categories.find(c => c.id === catId);
                  return (
                    <View key={catId} style={styles.selectedCategory}>
                      <MaterialCommunityIcons name={category?.icon || 'tag'} size={14} color="#fff" />
                      <Text style={styles.selectedCategoryText}>{category?.name || catId}</Text>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.noCategoriesText}>Select categories</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            placeholder="Tags (comma separated)"
            value={locationData.tags}
            onChangeText={(text) => setLocationData(prevData => ({ ...prevData, tags: text }))}
          />
        </View>
        
        {/* Location Method Section */}
        <View style={styles.inputSection}>
          <Text style={styles.inputSectionTitle}>Location Method</Text>
          {renderMethodSelector()}
          {renderLocationInput()}
        </View>
        
        {/* Vehicle Requirements Section */}
        <View style={styles.inputSection}>
          <Text style={styles.inputSectionTitle}>Vehicle Requirements</Text>
          
          <View style={styles.switchRow}>
            <View style={styles.switchLabelContainer}>
              <MaterialCommunityIcons name="car-4x4" size={24} color="#555" />
              <Text style={styles.switchLabel}>4WD Required</Text>
            </View>
            <Switch
              value={locationData.vehicleRequirements.fourWDRequired}
              onValueChange={(value) => setLocationData(prevData => ({
                ...prevData,
                vehicleRequirements: {
                  ...prevData.vehicleRequirements,
                  fourWDRequired: value
                }
              }))}
              trackColor={{ false: "#e0e0e0", true: "#a8d5ba" }}
              thumbColor={locationData.vehicleRequirements.fourWDRequired ? "#3C6E47" : "#f4f3f4"}
            />
          </View>
          
          <View style={styles.switchRow}>
            <View style={styles.switchLabelContainer}>
              <MaterialCommunityIcons name="car-lifted-pickup" size={24} color="#555" />
              <Text style={styles.switchLabel}>High Clearance Required</Text>
            </View>
            <Switch
              value={locationData.vehicleRequirements.highClearanceRequired}
              onValueChange={(value) => setLocationData(prevData => ({
                ...prevData,
                vehicleRequirements: {
                  ...prevData.vehicleRequirements,
                  highClearanceRequired: value
                }
              }))}
              trackColor={{ false: "#e0e0e0", true: "#a8d5ba" }}
              thumbColor={locationData.vehicleRequirements.highClearanceRequired ? "#3C6E47" : "#f4f3f4"}
            />
          </View>
          
          {locationData.vehicleRequirements.highClearanceRequired && (
            <View style={styles.indentedInput}>
              <Text style={styles.indentedInputLabel}>Minimum Ground Clearance (inches)</Text>
              <TextInput
                style={[styles.textInput, { width: 100 }]}
                placeholder="inches"
                value={locationData.vehicleRequirements.minClearanceInches > 0 ? 
                  locationData.vehicleRequirements.minClearanceInches.toString() : ''}
                onChangeText={(text) => {
                  const value = parseInt(text);
                  setLocationData(prevData => ({
                    ...prevData,
                    vehicleRequirements: {
                      ...prevData.vehicleRequirements,
                      minClearanceInches: isNaN(value) ? 0 : value
                    }
                  }));
                }}
                keyboardType="number-pad"
              />
            </View>
          )}
          
          <View style={styles.switchRow}>
            <View style={styles.switchLabelContainer}>
              <MaterialCommunityIcons name="rv-truck" size={24} color="#555" />
              <Text style={styles.switchLabel}>RV Friendly</Text>
            </View>
            <Switch
              value={locationData.vehicleRequirements.rvFriendly}
              onValueChange={(value) => {
                setLocationData(prevData => ({
                  ...prevData,
                  vehicleRequirements: {
                    ...prevData.vehicleRequirements,
                    rvFriendly: value
                  }
                }));
                setShowRvOptions(value);
                if (value && !locationData.categories.includes('rv_safe')) {
                  setLocationData(prevData => ({
                    ...prevData,
                    categories: [...prevData.categories, 'rv_safe']
                  }));
                }
              }}
              trackColor={{ false: "#e0e0e0", true: "#a8d5ba" }}
              thumbColor={locationData.vehicleRequirements.rvFriendly ? "#3C6E47" : "#f4f3f4"}
            />
          </View>
          
          {showRvOptions && (
            <View style={styles.rvOptions}>
              <View style={styles.indentedInput}>
                <Text style={styles.indentedInputLabel}>Maximum RV Length (feet)</Text>
                <TextInput
                  style={[styles.textInput, { width: 100 }]}
                  placeholder="feet"
                  value={locationData.rvSpecs.maxLengthFeet > 0 ? 
                    locationData.rvSpecs.maxLengthFeet.toString() : ''}
                  onChangeText={(text) => {
                    const value = parseInt(text);
                    setLocationData(prevData => ({
                      ...prevData,
                      rvSpecs: {
                        ...prevData.rvSpecs,
                        maxLengthFeet: isNaN(value) ? 0 : value
                      }
                    }));
                  }}
                  keyboardType="number-pad"
                />
              </View>
              
              <View style={styles.switchRow}>
                <Text style={styles.indentedSwitchLabel}>Hookups Available</Text>
                <Switch
                  value={locationData.rvSpecs.hasHookups}
                  onValueChange={(value) => setLocationData(prevData => ({
                    ...prevData,
                    rvSpecs: {
                      ...prevData.rvSpecs,
                      hasHookups: value
                    }
                  }))}
                  trackColor={{ false: "#e0e0e0", true: "#a8d5ba" }}
                  thumbColor={locationData.rvSpecs.hasHookups ? "#3C6E47" : "#f4f3f4"}
                />
              </View>
              
              <View style={styles.switchRow}>
                <Text style={styles.indentedSwitchLabel}>Dump Station Available</Text>
                <Switch
                  value={locationData.rvSpecs.hasDumping}
                  onValueChange={(value) => setLocationData(prevData => ({
                    ...prevData,
                    rvSpecs: {
                      ...prevData.rvSpecs,
                      hasDumping: value
                    }
                  }))}
                  trackColor={{ false: "#e0e0e0", true: "#a8d5ba" }}
                  thumbColor={locationData.rvSpecs.hasDumping ? "#3C6E47" : "#f4f3f4"}
                />
              </View>
            </View>
          )}
        </View>
        
        {/* Privacy Settings Section */}
        <View style={styles.inputSection}>
          <Text style={styles.inputSectionTitle}>Privacy Settings</Text>
          
          <View style={styles.privacyOptions}>
            <TouchableOpacity
              style={[
                styles.privacyOption,
                locationData.privacyLevel === 'public' ? styles.privacyOptionSelected : {}
              ]}
              onPress={() => setLocationData(prevData => ({ ...prevData, privacyLevel: 'public' }))}
            >
              <Ionicons
                name="earth"
                size={24}
                color={locationData.privacyLevel === 'public' ? "#fff" : "#555"}
              />
              <Text
                style={[
                  styles.privacyOptionText,
                  locationData.privacyLevel === 'public' ? styles.privacyOptionTextSelected : {}
                ]}
              >
                Public
              </Text>
              <Text
                style={[
                  styles.privacyOptionDescription,
                  locationData.privacyLevel === 'public' ? styles.privacyOptionDescriptionSelected : {}
                ]}
              >
                Anyone can view this location
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.privacyOption,
                locationData.privacyLevel === 'followers' ? styles.privacyOptionSelected : {}
              ]}
              onPress={() => setLocationData(prevData => ({ ...prevData, privacyLevel: 'followers' }))}
            >
              <Ionicons
                name="people"
                size={24}
                color={locationData.privacyLevel === 'followers' ? "#fff" : "#555"}
              />
              <Text
                style={[
                  styles.privacyOptionText,
                  locationData.privacyLevel === 'followers' ? styles.privacyOptionTextSelected : {}
                ]}
              >
                Followers
              </Text>
              <Text
                style={[
                  styles.privacyOptionDescription,
                  locationData.privacyLevel === 'followers' ? styles.privacyOptionDescriptionSelected : {}
                ]}
              >
                Only your followers can view
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.privacyOption,
                locationData.privacyLevel === 'private' ? styles.privacyOptionSelected : {}
              ]}
              onPress={() => setLocationData(prevData => ({ ...prevData, privacyLevel: 'private' }))}
            >
              <Ionicons
                name="lock-closed"
                size={24}
                color={locationData.privacyLevel === 'private' ? "#fff" : "#555"}
              />
              <Text
                style={[
                  styles.privacyOptionText,
                  locationData.privacyLevel === 'private' ? styles.privacyOptionTextSelected : {}
                ]}
              >
                Private
              </Text>
              <Text
                style={[
                  styles.privacyOptionDescription,
                  locationData.privacyLevel === 'private' ? styles.privacyOptionDescriptionSelected : {}
                ]}
              >
                Only you can view this location
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.privacyOption,
                locationData.privacyLevel === 'trade' ? styles.privacyOptionSelected : {}
              ]}
              onPress={() => setLocationData(prevData => ({ ...prevData, privacyLevel: 'trade' }))}
            >
              <Ionicons
                name="swap-horizontal"
                size={24}
                color={locationData.privacyLevel === 'trade' ? "#fff" : "#555"}
              />
              <Text
                style={[
                  styles.privacyOptionText,
                  locationData.privacyLevel === 'trade' ? styles.privacyOptionTextSelected : {}
                ]}
              >
                Trade
              </Text>
              <Text
                style={[
                  styles.privacyOptionDescription,
                  locationData.privacyLevel === 'trade' ? styles.privacyOptionDescriptionSelected : {}
                ]}
              >
                Users must trade credits to view
              </Text>
            </TouchableOpacity>
          </View>
          
          {locationData.privacyLevel === 'trade' && (
            <View style={styles.tradeCreditsContainer}>
              <Text style={styles.tradeCreditsLabel}>Required Credits (min. 5)</Text>
              <View style={styles.tradeCreditsInputContainer}>
                <TouchableOpacity
                  style={styles.tradeCreditsButton}
                  onPress={() => setTradeCredits(prev => Math.max(5, prev - 5))}
                >
                  <Ionicons name="remove" size={20} color="#3C6E47" />
                </TouchableOpacity>
                
                <TextInput
                  style={styles.tradeCreditsInput}
                  value={tradeCredits.toString()}
                  onChangeText={(text) => {
                    const value = parseInt(text);
                    if (!isNaN(value) && value >= 5) {
                      setTradeCredits(value);
                    }
                  }}
                  keyboardType="number-pad"
                />
                
                <TouchableOpacity
                  style={styles.tradeCreditsButton}
                  onPress={() => setTradeCredits(prev => prev + 5)}
                >
                  <Ionicons name="add" size={20} color="#3C6E47" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
        
        {/* Error message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        {/* Submit button */}
        <TouchableOpacity
          style={[styles.submitButton, loading ? styles.submitButtonDisabled : {}]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Add Location</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      
      {/* Categories Modal */}
      {renderCategoryModal()}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  inputSection: {
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
  inputSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  categorySelectorLabel: {
    fontSize: 16,
    color: '#555',
    marginRight: 8,
    width: 80,
  },
  selectedCategories: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3C6E47',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  selectedCategoryText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
  noCategoriesText: {
    color: '#888',
    fontStyle: 'italic',
  },
  methodSelector: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3C6E47',
  },
  methodButtonActive: {
    backgroundColor: '#3C6E47',
  },
  methodButtonText: {
    fontSize: 14,
    color: '#3C6E47',
    marginLeft: 6,
  },
  methodButtonTextActive: {
    color: '#fff',
  },
  mapContainer: {
    height: 250,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
  },
  mapInstructions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  mapInstructionsText: {
    color: '#fff',
    textAlign: 'center',
  },
  rowInputs: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  coordinateInput: {
    flex: 1,
  },
  coordinateLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  coordinateHelper: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },
  mapPreview: {
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewMap: {
    ...StyleSheet.absoluteFillObject,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  indentedInput: {
    marginLeft: 32,
    marginBottom: 16,
  },
  indentedInputLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  indentedSwitchLabel: {
    fontSize: 14,
    color: '#555',
    marginLeft: 32,
  },
  rvOptions: {
    marginBottom: 8,
  },
  privacyOptions: {
    marginBottom: 16,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  privacyOptionSelected: {
    backgroundColor: '#3C6E47',
  },
  privacyOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
    width: 80,
  },
  privacyOptionTextSelected: {
    color: '#fff',
  },
  privacyOptionDescription: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  privacyOptionDescriptionSelected: {
    color: '#f5f5f5',
  },
  tradeCreditsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f7f2',
    borderRadius: 8,
    padding: 12,
  },
  tradeCreditsLabel: {
    fontSize: 14,
    color: '#3C6E47',
  },
  tradeCreditsInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tradeCreditsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3C6E47',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tradeCreditsInput: {
    backgroundColor: '#fff',
    width: 50,
    height: 40,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 8,
    borderRadius: 4,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#3C6E47',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#a8d5ba',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
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
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  categoryItem: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    margin: 6,
  },
  categoryItemSelected: {
    backgroundColor: '#3C6E47',
  },
  categoryItemText: {
    fontSize: 12,
    color: '#555',
    marginTop: 8,
    textAlign: 'center',
  },
  categoryItemTextSelected: {
    color: '#fff',
  },
  doneButton: {
    backgroundColor: '#3C6E47',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddLocationScreen;