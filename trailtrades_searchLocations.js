/**
 * TrailTrades Discovery & Search Module
 * 
 * Provides functionality to search and discover locations based on geographic area,
 * categories, user preferences, and various filters. Supports map view and list view options.
 * 
 * @param {Object} searchParameters - Search parameters object
 * @param {Object} [searchParameters.location] - Location to search from (center point)
 * @param {number} searchParameters.location.latitude - Latitude of center point
 * @param {number} searchParameters.location.longitude - Longitude of center point
 * @param {number} [searchParameters.radius=50] - Search radius in miles
 * @param {Object} [searchParameters.boundingBox] - Bounding box to search within (alternative to center point + radius)
 * @param {number} searchParameters.boundingBox.north - Northern latitude bound
 * @param {number} searchParameters.boundingBox.south - Southern latitude bound
 * @param {number} searchParameters.boundingBox.east - Eastern longitude bound
 * @param {number} searchParameters.boundingBox.west - Western longitude bound
 * @param {string[]} [searchParameters.categories] - Categories to filter by (hiking, camping, etc.)
 * @param {string[]} [searchParameters.tags] - Custom tags to filter by
 * @param {Object} [searchParameters.vehicleRequirements] - Vehicle requirement filters
 * @param {boolean} [searchParameters.vehicleRequirements.fourWDOnly] - Only show 4WD required trails
 * @param {boolean} [searchParameters.vehicleRequirements.highClearanceOnly] - Only show high clearance required trails
 * @param {boolean} [searchParameters.vehicleRequirements.rvFriendly] - Only show RV-friendly locations
 * @param {number} [searchParameters.vehicleRequirements.minClearanceInches] - Minimum clearance in inches
 * @param {Object} [searchParameters.rvSpecs] - RV specification filters
 * @param {number} [searchParameters.rvSpecs.minLengthFeet] - Minimum RV length in feet
 * @param {boolean} [searchParameters.rvSpecs.requiresHookups] - Requires hookups
 * @param {boolean} [searchParameters.rvSpecs.requiresDumping] - Requires dumping facilities
 * @param {string} [searchParameters.difficulty] - Trail difficulty filter ('easy', 'moderate', 'difficult', 'extreme')
 * @param {number} [searchParameters.minTrailLength] - Minimum trail length in miles
 * @param {number} [searchParameters.maxTrailLength] - Maximum trail length in miles
 * @param {string} [searchParameters.sortBy='distance'] - Sort results by ('distance', 'popularity', 'rating', 'newest')
 * @param {string} [searchParameters.privacyLevel='all'] - Privacy level filter ('public', 'followers', 'trade', 'all')
 * @param {string} [searchParameters.createdBy] - Filter by creator user ID
 * @param {boolean} [searchParameters.favorited] - Filter by user's favorites
 * @param {boolean} [searchParameters.visited] - Filter by user's visited locations
 * @param {number} [searchParameters.limit=20] - Maximum number of results to return
 * @param {number} [searchParameters.offset=0] - Offset for pagination
 * @param {string} [searchParameters.viewType='map'] - View type ('map' or 'list')
 * @returns {Promise<Object>} - Promise resolving to search results object
 */
async function trailtrades_searchLocations(searchParameters = {}) {
  // Import necessary geo utilities
  const geolib = require('geolib');
  
  // Import configuration
  const config = {
    API_BASE_URL: process.env.TRAILTRADES_API_URL || 'https://api.trailtrades.com',
    DEFAULT_SEARCH_RADIUS: 50, // miles
    MAX_SEARCH_RADIUS: 500, // miles
    DEFAULT_RESULTS_LIMIT: 20
  };
  
  // Set default parameters
  const params = {
    radius: config.DEFAULT_SEARCH_RADIUS,
    limit: config.DEFAULT_RESULTS_LIMIT,
    offset: 0,
    sortBy: 'distance',
    privacyLevel: 'all',
    viewType: 'map',
    ...searchParameters
  };
  
  // Validate search parameters
  validateSearchParameters(params);
  
  // Determine search method (location+radius or bounding box)
  let searchMethod;
  let searchArea;
  
  if (params.location) {
    searchMethod = 'radius';
    searchArea = {
      latitude: params.location.latitude,
      longitude: params.location.longitude,
      radius: params.radius
    };
  } else if (params.boundingBox) {
    searchMethod = 'boundingBox';
    searchArea = {
      north: params.boundingBox.north,
      south: params.boundingBox.south,
      east: params.boundingBox.east,
      west: params.boundingBox.west
    };
  } else {
    // Use device location if available
    try {
      const currentLocation = await getCurrentLocation();
      searchMethod = 'radius';
      searchArea = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        radius: params.radius
      };
    } catch (locationError) {
      throw new Error('Location parameter or bounding box is required when device location is unavailable.');
    }
  }
  
  // Prepare request body
  const requestBody = {
    searchMethod,
    searchArea,
    filters: buildFilters(params),
    sort: {
      by: params.sortBy
    },
    pagination: {
      limit: params.limit,
      offset: params.offset
    }
  };
  
  try {
    // Get authentication token (allows personalized results)
    let authToken;
    try {
      authToken = await getAuthToken();
    } catch (authError) {
      // Continue without auth for public searches
      console.log('Searching without authentication. Only public locations will be returned.');
    }
    
    // Make API request
    const response = await fetch(`${config.API_BASE_URL}/search/locations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Search failed with status: ${response.status}`);
    }
    
    const searchResults = await response.json();
    
    // Process results based on viewType
    return processSearchResults(searchResults, params.viewType);
    
  } catch (error) {
    console.error('Location search error:', error);
    throw new Error(`Failed to search locations: ${error.message}`);
  }
  
  /**
   * Validate search parameters
   * 
   * @param {Object} params - Search parameters
   * @throws {Error} - If parameters are invalid
   */
  function validateSearchParameters(params) {
    // Validate location if provided
    if (params.location) {
      if (typeof params.location.latitude !== 'number' || 
          typeof params.location.longitude !== 'number') {
        throw new Error('Location must include valid latitude and longitude.');
      }
      
      if (params.location.latitude < -90 || params.location.latitude > 90) {
        throw new Error('Latitude must be between -90 and 90 degrees.');
      }
      
      if (params.location.longitude < -180 || params.location.longitude > 180) {
        throw new Error('Longitude must be between -180 and 180 degrees.');
      }
      
      // Validate radius
      if (params.radius <= 0) {
        throw new Error('Search radius must be greater than 0.');
      }
      
      if (params.radius > config.MAX_SEARCH_RADIUS) {
        throw new Error(`Search radius cannot exceed ${config.MAX_SEARCH_RADIUS} miles.`);
      }
    }
    
    // Validate bounding box if provided
    if (params.boundingBox) {
      const { north, south, east, west } = params.boundingBox;
      
      if (typeof north !== 'number' || typeof south !== 'number' ||
          typeof east !== 'number' || typeof west !== 'number') {
        throw new Error('Bounding box must include valid coordinates.');
      }
      
      if (north < south) {
        throw new Error('Northern bound must be greater than southern bound.');
      }
      
      if (north < -90 || north > 90 || south < -90 || south > 90) {
        throw new Error('Latitude must be between -90 and 90 degrees.');
      }
      
      if (east < -180 || east > 180 || west < -180 || west > 180) {
        throw new Error('Longitude must be between -180 and 180 degrees.');
      }
    }
    
    // Validate categories if provided
    if (params.categories && !Array.isArray(params.categories)) {
      throw new Error('Categories must be an array.');
    }
    
    // Validate tags if provided
    if (params.tags && !Array.isArray(params.tags)) {
      throw new Error('Tags must be an array.');
    }
    
    // Validate sortBy
    if (params.sortBy && !['distance', 'popularity', 'rating', 'newest'].includes(params.sortBy)) {
      throw new Error('Invalid sort option. Use "distance", "popularity", "rating", or "newest".');
    }
    
    // Validate privacyLevel
    if (params.privacyLevel && !['public', 'followers', 'trade', 'all'].includes(params.privacyLevel)) {
      throw new Error('Invalid privacy level filter. Use "public", "followers", "trade", or "all".');
    }
    
    // Validate difficulty
    if (params.difficulty && !['easy', 'moderate', 'difficult', 'extreme'].includes(params.difficulty)) {
      throw new Error('Invalid difficulty filter. Use "easy", "moderate", "difficult", or "extreme".');
    }
    
    // Validate pagination parameters
    if (params.limit <= 0) {
      throw new Error('Limit must be greater than 0.');
    }
    
    if (params.offset < 0) {
      throw new Error('Offset cannot be negative.');
    }
    
    // Validate viewType
    if (params.viewType && !['map', 'list'].includes(params.viewType)) {
      throw new Error('Invalid view type. Use "map" or "list".');
    }
  }
  
  /**
   * Build filters object from search parameters
   * 
   * @param {Object} params - Search parameters
   * @returns {Object} - Filters object
   */
  function buildFilters(params) {
    const filters = {};
    
    // Add category filters
    if (params.categories && params.categories.length > 0) {
      filters.categories = params.categories;
    }
    
    // Add tag filters
    if (params.tags && params.tags.length > 0) {
      filters.tags = params.tags;
    }
    
    // Add vehicle requirement filters
    if (params.vehicleRequirements) {
      filters.vehicleRequirements = {};
      
      if (typeof params.vehicleRequirements.fourWDOnly === 'boolean') {
        filters.vehicleRequirements.fourWDRequired = params.vehicleRequirements.fourWDOnly;
      }
      
      if (typeof params.vehicleRequirements.highClearanceOnly === 'boolean') {
        filters.vehicleRequirements.highClearanceRequired = params.vehicleRequirements.highClearanceOnly;
      }
      
      if (typeof params.vehicleRequirements.rvFriendly === 'boolean') {
        filters.vehicleRequirements.rvFriendly = params.vehicleRequirements.rvFriendly;
      }
      
      if (typeof params.vehicleRequirements.minClearanceInches === 'number') {
        filters.vehicleRequirements.minClearanceInches = params.vehicleRequirements.minClearanceInches;
      }
    }
    
    // Add RV specification filters
    if (params.rvSpecs) {
      filters.rvSpecs = {};
      
      if (typeof params.rvSpecs.minLengthFeet === 'number') {
        filters.rvSpecs.minLengthFeet = params.rvSpecs.minLengthFeet;
      }
      
      if (typeof params.rvSpecs.requiresHookups === 'boolean') {
        filters.rvSpecs.hasHookups = params.rvSpecs.requiresHookups;
      }
      
      if (typeof params.rvSpecs.requiresDumping === 'boolean') {
        filters.rvSpecs.hasDumping = params.rvSpecs.requiresDumping;
      }
    }
    
    // Add trail length filters
    if (typeof params.minTrailLength === 'number' || typeof params.maxTrailLength === 'number') {
      filters.trailLength = {};
      
      if (typeof params.minTrailLength === 'number') {
        filters.trailLength.min = params.minTrailLength;
      }
      
      if (typeof params.maxTrailLength === 'number') {
        filters.trailLength.max = params.maxTrailLength;
      }
    }
    
    // Add difficulty filter
    if (params.difficulty) {
      filters.difficulty = params.difficulty;
    }
    
    // Add privacy level filter
    if (params.privacyLevel && params.privacyLevel !== 'all') {
      filters.privacyLevel = params.privacyLevel;
    }
    
    // Add creator filter
    if (params.createdBy) {
      filters.createdBy = params.createdBy;
    }
    
    // Add favorite filter
    if (typeof params.favorited === 'boolean') {
      filters.favorited = params.favorited;
    }
    
    // Add visited filter
    if (typeof params.visited === 'boolean') {
      filters.visited = params.visited;
    }
    
    return filters;
  }
  
  /**
   * Process search results based on view type
   * 
   * @param {Object} searchResults - Search results from API
   * @param {string} viewType - View type ('map' or 'list')
   * @returns {Object} - Processed search results
   */
  function processSearchResults(searchResults, viewType) {
    // Add result processing for different view types
    const { locations, pagination, metadata } = searchResults;
    
    // If no results, return empty result set
    if (!locations || locations.length === 0) {
      return {
        locations: [],
        pagination,
        metadata
      };
    }
    
    // Process locations based on view type
    let processedLocations;
    
    if (viewType === 'map') {
      // For map view, format data for map display
      processedLocations = locations.map(location => formatLocationForMap(location));
    } else {
      // For list view, format data for list display
      processedLocations = locations.map(location => formatLocationForList(location));
    }
    
    // Return processed results
    return {
      locations: processedLocations,
      pagination,
      metadata,
      viewType
    };
  }
  
  /**
   * Format location for map view
   * 
   * @param {Object} location - Location object
   * @returns {Object} - Formatted location for map view
   */
  function formatLocationForMap(location) {
    // For map view, we need coordinates and minimal info for markers
    return {
      id: location.id,
      name: location.name,
      coordinates: getDisplayCoordinates(location),
      type: location.type,
      categories: location.categories,
      preview: {
        photoUrl: location.previewPhotoUrl || null,
        description: truncateText(location.description, 100)
      },
      privacyLevel: location.privacyLevel,
      isTradeAvailable: location.privacyLevel === 'trade',
      tradeCredits: location.tradeCredits || 0,
      rating: location.rating || 0,
      reviewCount: location.reviewCount || 0
    };
  }
  
  /**
   * Format location for list view
   * 
   * @param {Object} location - Location object
   * @returns {Object} - Formatted location for list view
   */
  function formatLocationForList(location) {
    // For list view, include more details but still respect privacy levels
    return {
      id: location.id,
      name: location.name,
      coordinates: getDisplayCoordinates(location),
      type: location.type,
      categories: location.categories,
      tags: location.tags || [],
      description: truncateText(location.description, 200),
      preview: {
        photoUrl: location.previewPhotoUrl || null,
        photoCount: location.photoCount || 0
      },
      difficulty: location.difficulty || null,
      distance: location.distance,
      trailLength: location.trailLength,
      privacyLevel: location.privacyLevel,
      isTradeAvailable: location.privacyLevel === 'trade',
      tradeCredits: location.tradeCredits || 0,
      creator: {
        id: location.creator.id,
        username: location.creator.username,
        avatarUrl: location.creator.avatarUrl
      },
      rating: location.rating || 0,
      reviewCount: location.reviewCount || 0,
      savedCount: location.savedCount || 0,
      createdAt: location.createdAt,
      vehicleRequirements: location.vehicleRequirements || null,
      rvSpecs: location.rvSpecs || null
    };
  }
  
  /**
   * Get display coordinates based on privacy level
   * 
   * @param {Object} location - Location object
   * @returns {Object} - Coordinates for display
   */
  function getDisplayCoordinates(location) {
    // For non-public locations, show approximate coordinates
    if (location.privacyLevel === 'trade' && !location.userHasAccess) {
      // For trade locations, show approximate coordinates (within 10-mile radius)
      return getApproximateCoordinates(
        location.coordinates.latitude,
        location.coordinates.longitude,
        10 // miles
      );
    } else if (location.privacyLevel === 'private' && !location.userHasAccess) {
      // For private locations, show very approximate coordinates (within 20-mile radius)
      return getApproximateCoordinates(
        location.coordinates.latitude,
        location.coordinates.longitude,
        20 // miles
      );
    } else {
      // For public locations or if user has access, show exact coordinates
      return {
        latitude: location.coordinates.latitude,
        longitude: location.coordinates.longitude
      };
    }
  }
  
  /**
   * Get approximate coordinates within a radius
   * 
   * @param {number} latitude - Original latitude
   * @param {number} longitude - Original longitude
   * @param {number} radiusMiles - Radius in miles
   * @returns {Object} - Approximate coordinates
   */
  function getApproximateCoordinates(latitude, longitude, radiusMiles) {
    // Convert miles to meters
    const radiusMeters = radiusMiles * 1609.34;
    
    // Generate random angle
    const angle = Math.random() * 2 * Math.PI;
    
    // Generate random distance within radius
    const distance = Math.sqrt(Math.random()) * radiusMeters;
    
    // Calculate new point
    const result = geolib.computeDestinationPoint(
      { latitude, longitude },
      distance,
      angle
    );
    
    return {
      latitude: result.latitude,
      longitude: result.longitude,
      isApproximate: true,
      approximateRadiusMiles: radiusMiles
    };
  }
  
  /**
   * Truncate text to specified length
   * 
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} - Truncated text
   */
  function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength) + '...';
  }
  
  /**
   * Get current device location
   * 
   * @returns {Promise<Object>} - Current location
   */
  async function getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator || !navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this device.'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error(`Unable to retrieve current location: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000
        }
      );
    });
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
}

export default trailtrades_searchLocations;