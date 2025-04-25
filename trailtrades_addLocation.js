/**
 * TrailTrades Location Management Module
 * 
 * Adds a new location to the user's collection via import from map services or manual entry.
 * Integrates with Google Maps and Apple Maps APIs for geocoding and place information.
 * 
 * @param {string} method - Method of adding location: 'import', 'address', or 'coordinates'
 * @param {Object} locationData - Location data based on method
 * @param {Object} [locationData.mapSource] - Map source data (required for 'import' method)
 * @param {string} [locationData.mapSource.provider] - 'google' or 'apple'
 * @param {string} [locationData.mapSource.placeId] - Place ID from provider
 * @param {Object} [locationData.address] - Address data (required for 'address' method)
 * @param {string} [locationData.address.street] - Street address
 * @param {string} [locationData.address.city] - City
 * @param {string} [locationData.address.state] - State/province
 * @param {string} [locationData.address.country] - Country
 * @param {string} [locationData.address.postalCode] - Postal/ZIP code
 * @param {Object} [locationData.coordinates] - Coordinate data (required for 'coordinates' method)
 * @param {number} [locationData.coordinates.latitude] - Latitude
 * @param {number} [locationData.coordinates.longitude] - Longitude
 * @param {Object} metadata - Additional location metadata
 * @param {string} metadata.name - Name of the location
 * @param {string[]} metadata.categories - Array of category IDs (hiking, camping, mountain biking, etc.)
 * @param {Object} metadata.vehicleRequirements - Vehicle-specific requirements
 * @param {boolean} [metadata.vehicleRequirements.fourWDRequired] - Whether 4WD is required
 * @param {boolean} [metadata.vehicleRequirements.highClearanceRequired] - Whether high clearance is required
 * @param {boolean} [metadata.vehicleRequirements.rvFriendly] - Whether location is RV-friendly
 * @param {number} [metadata.vehicleRequirements.minClearanceInches] - Minimum clearance in inches
 * @param {Object} [metadata.rvSpecs] - RV-specific information (if applicable)
 * @param {number} [metadata.rvSpecs.maxLengthFeet] - Maximum RV length in feet
 * @param {boolean} [metadata.rvSpecs.hasHookups] - Whether location has hookups
 * @param {boolean} [metadata.rvSpecs.hasDumping] - Whether location has dumping facilities
 * @param {string[]} [metadata.tags] - Array of custom tags
 * @param {string} [metadata.description] - Description of the location
 * @param {string} privacyLevel - Privacy level: 'public', 'followers', 'private', or 'trade'
 * @returns {Promise<Object>} - Promise resolving to created location object or error
 */
async function trailtrades_addLocation(method, locationData, metadata, privacyLevel) {
  // Import configuration for API keys
  const config = {
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
    APPLE_MAPS_TOKEN: process.env.APPLE_MAPS_TOKEN || ''
  };
  
  // Validate inputs
  if (!method || !['import', 'address', 'coordinates'].includes(method)) {
    throw new Error('Invalid location addition method. Use "import", "address", or "coordinates".');
  }
  
  if (!locationData || typeof locationData !== 'object') {
    throw new Error('Location data object is required.');
  }
  
  if (!metadata || typeof metadata !== 'object' || !metadata.name || !metadata.categories) {
    throw new Error('Metadata object with name and categories is required.');
  }
  
  if (!privacyLevel || !['public', 'followers', 'private', 'trade'].includes(privacyLevel)) {
    throw new Error('Invalid privacy level. Use "public", "followers", "private", or "trade".');
  }
  
  // Verify API keys are available based on method
  if (method === 'import' && locationData.mapSource) {
    const provider = locationData.mapSource.provider;
    if (provider === 'google' && !config.GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key is required for Google Maps integration.');
    } else if (provider === 'apple' && !config.APPLE_MAPS_TOKEN) {
      throw new Error('Apple Maps token is required for Apple Maps integration.');
    }
  }
  
  // Process location data based on method
  let processedLocation;
  try {
    if (method === 'import') {
      processedLocation = await processImportedLocation(locationData);
    } else if (method === 'address') {
      processedLocation = await processAddressLocation(locationData);
    } else if (method === 'coordinates') {
      processedLocation = await processCoordinatesLocation(locationData);
    }
  } catch (error) {
    console.error('Location processing error:', error);
    throw new Error(`Failed to process location: ${error.message}`);
  }
  
  // Prepare location object for API
  const locationObject = {
    ...processedLocation,
    metadata: {
      name: metadata.name,
      categories: validateCategories(metadata.categories),
      tags: metadata.tags || [],
      description: metadata.description || '',
      vehicleRequirements: validateVehicleRequirements(metadata.vehicleRequirements),
      ...(metadata.rvSpecs ? { rvSpecs: validateRVSpecs(metadata.rvSpecs) } : {})
    },
    privacyLevel,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Add location to database via API
  try {
    const authToken = await getAuthToken();
    
    const response = await fetch('https://api.trailtrades.com/locations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(locationObject)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to add location');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Location addition error:', error);
    throw error;
  }
}

/**
 * Process location imported from map service
 * 
 * @param {Object} locationData - Import location data
 * @returns {Promise<Object>} - Processed location data
 */
async function processImportedLocation(locationData) {
  if (!locationData.mapSource || !locationData.mapSource.provider || !locationData.mapSource.placeId) {
    throw new Error('Invalid map source data. Provider and placeId are required.');
  }
  
  const { provider, placeId } = locationData.mapSource;
  
  if (!['google', 'apple'].includes(provider)) {
    throw new Error('Invalid map provider. Use "google" or "apple".');
  }
  
  // Fetch place details from appropriate API
  try {
    let placeDetails;
    
    if (provider === 'google') {
      placeDetails = await fetchGooglePlaceDetails(placeId);
    } else if (provider === 'apple') {
      placeDetails = await fetchApplePlaceDetails(placeId);
    }
    
    return {
      source: {
        type: 'import',
        provider,
        placeId
      },
      coordinates: {
        latitude: placeDetails.coordinates.latitude,
        longitude: placeDetails.coordinates.longitude
      },
      address: placeDetails.address,
      // Include approximate elevation if available
      ...(placeDetails.elevation ? { elevation: placeDetails.elevation } : {})
    };
  } catch (error) {
    throw new Error(`Failed to fetch place details: ${error.message}`);
  }
}

/**
 * Process location added via address
 * 
 * @param {Object} locationData - Address location data
 * @returns {Promise<Object>} - Processed location data
 */
async function processAddressLocation(locationData) {
  if (!locationData.address || !locationData.address.street || !locationData.address.city) {
    throw new Error('Invalid address data. At minimum, street and city are required.');
  }
  
  // Geocode address to get coordinates
  try {
    const geocodeResult = await geocodeAddress(locationData.address);
    
    return {
      source: {
        type: 'address'
      },
      coordinates: {
        latitude: geocodeResult.coordinates.latitude,
        longitude: geocodeResult.coordinates.longitude
      },
      address: locationData.address,
      // Include approximate elevation if available
      ...(geocodeResult.elevation ? { elevation: geocodeResult.elevation } : {})
    };
  } catch (error) {
    throw new Error(`Failed to geocode address: ${error.message}`);
  }
}

/**
 * Process location added via coordinates
 * 
 * @param {Object} locationData - Coordinate location data
 * @returns {Promise<Object>} - Processed location data
 */
async function processCoordinatesLocation(locationData) {
  if (!locationData.coordinates || 
      typeof locationData.coordinates.latitude !== 'number' || 
      typeof locationData.coordinates.longitude !== 'number') {
    throw new Error('Invalid coordinate data. Latitude and longitude are required.');
  }
  
  const { latitude, longitude } = locationData.coordinates;
  
  // Validate latitude and longitude ranges
  if (latitude < -90 || latitude > 90) {
    throw new Error('Latitude must be between -90 and 90 degrees.');
  }
  
  if (longitude < -180 || longitude > 180) {
    throw new Error('Longitude must be between -180 and 180 degrees.');
  }
  
  // Reverse geocode coordinates to get address
  try {
    const reverseGeocodeResult = await reverseGeocode(latitude, longitude);
    
    return {
      source: {
        type: 'coordinates'
      },
      coordinates: {
        latitude,
        longitude
      },
      address: reverseGeocodeResult.address,
      // Include approximate elevation if available
      ...(reverseGeocodeResult.elevation ? { elevation: reverseGeocodeResult.elevation } : {})
    };
  } catch (error) {
    // If reverse geocoding fails, still return the coordinates without address
    return {
      source: {
        type: 'coordinates'
      },
      coordinates: {
        latitude,
        longitude
      }
    };
  }
}

/**
 * Validate categories against app's predefined list
 * 
 * @param {string[]} categories - Array of category IDs
 * @returns {string[]} - Validated category array
 */
function validateCategories(categories) {
  const validCategories = [
    'hiking',
    'camping',
    'mountain_biking',
    'dirt_biking',
    'offroading',
    'rv_safe'
  ];
  
  // Filter out any invalid categories
  return categories.filter(category => validCategories.includes(category));
}

/**
 * Validate vehicle requirements data
 * 
 * @param {Object} vehicleReqs - Vehicle requirements data
 * @returns {Object} - Validated vehicle requirements
 */
function validateVehicleRequirements(vehicleReqs) {
  if (!vehicleReqs || typeof vehicleReqs !== 'object') {
    // Default values if not provided
    return {
      fourWDRequired: false,
      highClearanceRequired: false,
      rvFriendly: false
    };
  }
  
  return {
    fourWDRequired: Boolean(vehicleReqs.fourWDRequired),
    highClearanceRequired: Boolean(vehicleReqs.highClearanceRequired),
    rvFriendly: Boolean(vehicleReqs.rvFriendly),
    // Only include minClearanceInches if it's a valid number
    ...(typeof vehicleReqs.minClearanceInches === 'number' && vehicleReqs.minClearanceInches > 0
      ? { minClearanceInches: vehicleReqs.minClearanceInches }
      : {})
  };
}

/**
 * Validate RV specifications data
 * 
 * @param {Object} rvSpecs - RV specifications data
 * @returns {Object} - Validated RV specifications
 */
function validateRVSpecs(rvSpecs) {
  if (!rvSpecs || typeof rvSpecs !== 'object') {
    return {};
  }
  
  return {
    // Only include maxLengthFeet if it's a valid number
    ...(typeof rvSpecs.maxLengthFeet === 'number' && rvSpecs.maxLengthFeet > 0
      ? { maxLengthFeet: rvSpecs.maxLengthFeet }
      : {}),
    hasHookups: Boolean(rvSpecs.hasHookups),
    hasDumping: Boolean(rvSpecs.hasDumping)
  };
}

/**
 * Helper function to retrieve authentication token
 * 
 * @returns {Promise<string>} - Authentication token
 */
async function getAuthToken() {
  try {
    let token;
    
    if (Platform.OS === 'ios') {
      // iOS secure storage implementation
      const credentials = await Keychain.getGenericPassword();
      token = credentials.password;
    } else if (Platform.OS === 'android') {
      // Android secure storage implementation
      token = await EncryptedStorage.getItem('trailtrades_auth_token');
    } else {
      // Web fallback
      token = localStorage.getItem('trailtrades_auth_token');
    }
    
    if (!token) {
      throw new Error('Authentication token not found. Please log in.');
    }
    
    return token;
  } catch (error) {
    console.error('Failed to retrieve authentication token:', error);
    throw new Error('Authentication required. Please log in.');
  }
}

/**
 * Fetch place details from Google Places API
 * 
 * @param {string} placeId - Google Place ID
 * @returns {Promise<Object>} - Place details with coordinates, address, and elevation
 */
async function fetchGooglePlaceDetails(placeId) {
  try {
    // Get Google Maps API key from config
    const apiKey = config.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }
    
    // Call Google Places API Details endpoint
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address,address_component&key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK' || !data.result) {
      throw new Error(`Google Places API error: ${data.status || 'Unknown error'}`);
    }
    
    // Parse address components
    const addressComponents = {};
    if (data.result.address_components) {
      for (const component of data.result.address_components) {
        const types = component.types;
        
        if (types.includes('street_number')) {
          addressComponents.streetNumber = component.long_name;
        } else if (types.includes('route')) {
          addressComponents.street = component.long_name;
        } else if (types.includes('locality')) {
          addressComponents.city = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          addressComponents.state = component.short_name;
        } else if (types.includes('country')) {
          addressComponents.country = component.long_name;
        } else if (types.includes('postal_code')) {
          addressComponents.postalCode = component.long_name;
        }
      }
    }
    
    // Extract coordinates
    const location = data.result.geometry?.location;
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      throw new Error('Invalid location data received from Google');
    }
    
    // Fetch elevation data for coordinates
    const elevation = await fetchElevationData(location.lat, location.lng);
    
    // Construct address object
    const street = addressComponents.streetNumber && addressComponents.street 
      ? `${addressComponents.streetNumber} ${addressComponents.street}`
      : addressComponents.street || '';
      
    return {
      coordinates: {
        latitude: location.lat,
        longitude: location.lng
      },
      address: {
        street,
        city: addressComponents.city || '',
        state: addressComponents.state || '',
        country: addressComponents.country || '',
        postalCode: addressComponents.postalCode || '',
        formattedAddress: data.result.formatted_address || ''
      },
      elevation
    };
  } catch (error) {
    console.error('Google Places API error:', error);
    throw new Error(`Failed to fetch place details from Google: ${error.message}`);
  }
}

/**
 * Fetch place details from Apple MapKit JS
 * 
 * @param {string} placeId - Apple Maps place ID
 * @returns {Promise<Object>} - Place details with coordinates, address, and elevation
 */
async function fetchApplePlaceDetails(placeId) {
  // Note: This implementation requires the MapKit JS to be initialized in your app
  return new Promise((resolve, reject) => {
    try {
      // Verify MapKit JS is available
      if (!window.mapkit) {
        throw new Error('MapKit JS not initialized');
      }
      
      // Create a MapKit JS Search object
      const search = new window.mapkit.Search();
      
      // Lookup the place using its ID
      search.lookup(
        { placeId: placeId }, 
        (error, data) => {
          if (error) {
            reject(new Error(`Apple Maps lookup error: ${error.message}`));
            return;
          }
          
          if (!data || !data.place) {
            reject(new Error('Place not found in Apple Maps'));
            return;
          }
          
          const place = data.place;
          
          // Extract coordinates
          const coordinates = {
            latitude: place.coordinate.latitude,
            longitude: place.coordinate.longitude
          };
          
          // Parse address
          const address = {
            street: place.thoroughfare || '',
            city: place.locality || '',
            state: place.administrativeArea || '',
            country: place.country || '',
            postalCode: place.postalCode || '',
            formattedAddress: place.formattedAddress || ''
          };
          
          // Fetch elevation data
          fetchElevationData(coordinates.latitude, coordinates.longitude)
            .then(elevation => {
              resolve({
                coordinates,
                address,
                elevation
              });
            })
            .catch(err => {
              // If elevation fetch fails, resolve without elevation
              resolve({
                coordinates,
                address
              });
            });
        }
      );
    } catch (error) {
      reject(new Error(`Failed to fetch place details from Apple: ${error.message}`));
    }
  });
}

/**
 * Geocode address to coordinates
 * 
 * @param {Object} address - Address object
 * @returns {Promise<Object>} - Geocoded result with coordinates and elevation
 */
async function geocodeAddress(address) {
  try {
    // Get Google Maps API key from config
    const apiKey = config.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }
    
    // Format address string
    const addressString = [
      address.street,
      address.city,
      address.state,
      address.postalCode,
      address.country
    ].filter(Boolean).join(', ');
    
    if (!addressString) {
      throw new Error('Address is empty');
    }
    
    // Call Google Geocoding API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressString)}&key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new Error(`Geocoding error: ${data.status || 'No results found'}`);
    }
    
    // Extract location data
    const location = data.results[0].geometry.location;
    
    // Fetch elevation data
    const elevation = await fetchElevationData(location.lat, location.lng);
    
    return {
      coordinates: {
        latitude: location.lat,
        longitude: location.lng
      },
      elevation
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error(`Failed to geocode address: ${error.message}`);
  }
}

/**
 * Reverse geocode coordinates to address
 * 
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise<Object>} - Reverse geocoded result with address and elevation
 */
async function reverseGeocode(latitude, longitude) {
  try {
    // Get Google Maps API key from config
    const apiKey = config.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }
    
    // Call Google Reverse Geocoding API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Reverse geocoding API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new Error(`Reverse geocoding error: ${data.status || 'No results found'}`);
    }
    
    // Parse address components
    const addressComponents = {};
    const result = data.results[0];
    
    for (const component of result.address_components) {
      const types = component.types;
      
      if (types.includes('street_number')) {
        addressComponents.streetNumber = component.long_name;
      } else if (types.includes('route')) {
        addressComponents.route = component.long_name;
      } else if (types.includes('locality')) {
        addressComponents.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        addressComponents.state = component.short_name;
      } else if (types.includes('country')) {
        addressComponents.country = component.long_name;
      } else if (types.includes('postal_code')) {
        addressComponents.postalCode = component.long_name;
      }
    }
    
    // Construct street address
    const street = addressComponents.streetNumber && addressComponents.route
      ? `${addressComponents.streetNumber} ${addressComponents.route}`
      : addressComponents.route || '';
    
    // Fetch elevation data
    const elevation = await fetchElevationData(latitude, longitude);
    
    return {
      address: {
        street,
        city: addressComponents.city || '',
        state: addressComponents.state || '',
        country: addressComponents.country || '',
        postalCode: addressComponents.postalCode || '',
        formattedAddress: result.formatted_address || ''
      },
      elevation
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw new Error(`Failed to reverse geocode coordinates: ${error.message}`);
  }
}

/**
 * Fetch elevation data for coordinates
 * 
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise<number|null>} - Elevation in meters or null if unavailable
 */
async function fetchElevationData(latitude, longitude) {
  try {
    // Get Google Maps API key from config
    const apiKey = config.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }
    
    // Call Google Elevation API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/elevation/json?locations=${latitude},${longitude}&key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Elevation API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new Error(`Elevation error: ${data.status || 'No results found'}`);
    }
    
    return data.results[0].elevation; // elevation in meters
  } catch (error) {
    console.error('Elevation data error:', error);
    // Return null instead of throwing to make elevation optional
    return null;
  }
}

export default trailtrades_addLocation;