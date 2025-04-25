/**
 * TrailTrades Trail Mapping Module
 * 
 * Records and processes trail data through real-time GPS tracking or manual waypoint input.
 * Generates GPX data, analyzes trail metrics, and associates trails with locations.
 * 
 * @param {string} method - Recording method: 'gps' or 'manual'
 * @param {Object} trailData - Trail data
 * @param {string} trailData.name - Name of the trail
 * @param {string} trailData.locationId - ID of associated location
 * @param {Array} [trailData.waypoints] - Array of waypoints (required for 'manual' method)
 * @param {Object} [trailData.waypoints[].coordinates] - Waypoint coordinates
 * @param {number} trailData.waypoints[].coordinates.latitude - Latitude
 * @param {number} trailData.waypoints[].coordinates.longitude - Longitude
 * @param {number} [trailData.waypoints[].elevation] - Elevation in meters
 * @param {string} [trailData.waypoints[].name] - Waypoint name/description
 * @param {Date} [trailData.waypoints[].timestamp] - Timestamp of waypoint
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.includeElevation=true] - Whether to fetch elevation data for waypoints
 * @param {string} [options.trailType='hiking'] - Type of trail ('hiking', 'mountain_biking', 'dirt_biking', 'offroading')
 * @param {string} [options.difficulty] - Trail difficulty ('easy', 'moderate', 'difficult', 'extreme')
 * @param {Object} [options.gpxOptions] - Custom GPX export options
 * @param {boolean} [options.autoSave=true] - Whether to automatically save trail to server
 * @returns {Promise<Object>} - Promise resolving to trail object with metrics and GPX data
 */
async function trailtrades_recordTrail(method, trailData, options = {}) {
  // Import necessary GPS and mapping utilities
  const geolib = require('geolib');
  const { toGPX } = require('gps-to-gpx');
  
  // Import configuration for API keys
  const config = {
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
    MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN || ''
  };
  
  // Default options
  const defaultOptions = {
    includeElevation: true,
    trailType: 'hiking',
    difficulty: null,
    gpxOptions: {
      activityName: 'hiking',
      timeField: 'timestamp'
    },
    autoSave: true
  };
  
  // Merge default options with provided options
  const finalOptions = { ...defaultOptions, ...options };
  
  // Set activity name in GPX based on trail type
  if (finalOptions.trailType && finalOptions.gpxOptions) {
    switch (finalOptions.trailType) {
      case 'mountain_biking':
        finalOptions.gpxOptions.activityName = 'mountain biking';
        break;
      case 'dirt_biking':
        finalOptions.gpxOptions.activityName = 'dirt biking';
        break;
      case 'offroading':
        finalOptions.gpxOptions.activityName = 'offroading';
        break;
      default:
        finalOptions.gpxOptions.activityName = 'hiking';
    }
  }
  
  // Validate method
  if (!method || !['gps', 'manual'].includes(method)) {
    throw new Error('Invalid recording method. Use "gps" or "manual".');
  }
  
  // Validate trail data
  if (!trailData || typeof trailData !== 'object') {
    throw new Error('Trail data object is required.');
  }
  
  if (!trailData.name || typeof trailData.name !== 'string') {
    throw new Error('Trail name is required.');
  }
  
  if (!trailData.locationId || typeof trailData.locationId !== 'string') {
    throw new Error('Location ID is required.');
  }
  
  // Initialize trail object
  let trail = {
    name: trailData.name,
    locationId: trailData.locationId,
    type: finalOptions.trailType,
    difficulty: finalOptions.difficulty,
    waypoints: [],
    metrics: {
      distance: 0,
      elevationGain: 0,
      elevationLoss: 0,
      highestPoint: null,
      lowestPoint: null,
      startPoint: null,
      endPoint: null,
      duration: null
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Process based on method
  if (method === 'manual') {
    // Validate waypoints for manual method
    if (!Array.isArray(trailData.waypoints) || trailData.waypoints.length < 2) {
      throw new Error('At least 2 waypoints are required for manual trail creation.');
    }
    
    // Process waypoints
    trail.waypoints = await processWaypoints(trailData.waypoints, finalOptions.includeElevation);
    
    // Calculate trail metrics
    trail.metrics = calculateTrailMetrics(trail.waypoints);
    
    // Generate GPX data
    trail.gpxData = generateGPX(trail.waypoints, {
      ...finalOptions.gpxOptions,
      creator: 'TrailTrades App'
    });
  } else if (method === 'gps') {
    // For GPS method, we'll return a recorder object that can be used to track in real-time
    const trailRecorder = createGPSTrailRecorder(trail, finalOptions);
    return trailRecorder;
  }
  
  // Save trail if autoSave is enabled
  if (finalOptions.autoSave) {
    try {
      const savedTrail = await saveTrail(trail);
      return savedTrail;
    } catch (error) {
      console.error('Failed to save trail:', error);
      // Still return the trail object even if saving failed
      return {
        ...trail,
        saveError: error.message
      };
    }
  }
  
  return trail;
  
  /**
   * Process waypoints and fetch elevation data if needed
   * 
   * @param {Array} waypoints - Array of waypoint objects
   * @param {boolean} includeElevation - Whether to fetch elevation data
   * @returns {Promise<Array>} - Processed waypoints
   */
  async function processWaypoints(waypoints, includeElevation) {
    // Validate each waypoint
    const validWaypoints = waypoints.filter(waypoint => {
      if (!waypoint || typeof waypoint !== 'object') return false;
      if (!waypoint.coordinates) return false;
      
      const { latitude, longitude } = waypoint.coordinates;
      if (typeof latitude !== 'number' || typeof longitude !== 'number') return false;
      if (latitude < -90 || latitude > 90) return false;
      if (longitude < -180 || longitude > 180) return false;
      
      return true;
    });
    
    if (validWaypoints.length < 2) {
      throw new Error('At least 2 valid waypoints are required.');
    }
    
    // Process timestamps
    const waypointsWithTimestamps = validWaypoints.map((waypoint, index) => {
      // Use provided timestamp or create one based on index (spaced 1 minute apart)
      const timestamp = waypoint.timestamp ? new Date(waypoint.timestamp) : 
        new Date(Date.now() - (validWaypoints.length - index) * 60000);
      
      return {
        ...waypoint,
        timestamp
      };
    });
    
    // Fetch elevation data if needed
    if (includeElevation) {
      return await fetchElevationForWaypoints(waypointsWithTimestamps);
    }
    
    return waypointsWithTimestamps;
  }
  
  /**
   * Fetch elevation data for waypoints
   * 
   * @param {Array} waypoints - Array of waypoint objects
   * @returns {Promise<Array>} - Waypoints with elevation data
   */
  async function fetchElevationForWaypoints(waypoints) {
    // Determine which service to use for elevation data
    const elevationService = config.MAPBOX_ACCESS_TOKEN ? 'mapbox' : 'google';
    
    // Extract coordinates for batch processing
    const coordinates = waypoints.map(waypoint => ({
      latitude: waypoint.coordinates.latitude,
      longitude: waypoint.coordinates.longitude
    }));
    
    try {
      let elevationData;
      
      if (elevationService === 'mapbox') {
        elevationData = await fetchMapboxElevation(coordinates);
      } else {
        elevationData = await fetchGoogleElevation(coordinates);
      }
      
      // Merge elevation data with waypoints
      return waypoints.map((waypoint, index) => ({
        ...waypoint,
        elevation: waypoint.elevation || elevationData[index] || null
      }));
    } catch (error) {
      console.error('Failed to fetch elevation data:', error);
      // Return waypoints without elevation if fetch fails
      return waypoints;
    }
  }
  
  /**
   * Fetch elevation data from Mapbox API
   * 
   * @param {Array} coordinates - Array of coordinate objects
   * @returns {Promise<Array>} - Array of elevation values
   */
  async function fetchMapboxElevation(coordinates) {
    // Mapbox limits 300 points per request, so batch if needed
    const BATCH_SIZE = 300;
    const batches = [];
    
    for (let i = 0; i < coordinates.length; i += BATCH_SIZE) {
      batches.push(coordinates.slice(i, i + BATCH_SIZE));
    }
    
    const allElevations = [];
    
    for (const batch of batches) {
      // Format coordinates for Mapbox API (longitude,latitude format)
      const coordinateString = batch.map(coord => 
        `${coord.longitude},${coord.latitude}`
      ).join(';');
      
      const response = await fetch(
        `https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2/tilequery/${coordinateString}.json?access_token=${config.MAPBOX_ACCESS_TOKEN}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract elevation from features
      const batchElevations = data.features.map(feature => {
        const elevationProp = feature.properties.ele;
        return typeof elevationProp === 'number' ? elevationProp : null;
      });
      
      allElevations.push(...batchElevations);
    }
    
    return allElevations;
  }
  
  /**
   * Fetch elevation data from Google Elevation API
   * 
   * @param {Array} coordinates - Array of coordinate objects
   * @returns {Promise<Array>} - Array of elevation values
   */
  async function fetchGoogleElevation(coordinates) {
    // Google Elevation API has a limit of 512 locations per request
    const BATCH_SIZE = 500;
    const batches = [];
    
    for (let i = 0; i < coordinates.length; i += BATCH_SIZE) {
      batches.push(coordinates.slice(i, i + BATCH_SIZE));
    }
    
    const allElevations = [];
    
    for (const batch of batches) {
      // Format locations for Google API
      const locations = batch.map(coord => 
        `${coord.latitude},${coord.longitude}`
      ).join('|');
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/elevation/json?locations=${locations}&key=${config.GOOGLE_MAPS_API_KEY}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Google Elevation API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`Google Elevation API error: ${data.status}`);
      }
      
      // Extract elevation values
      const batchElevations = data.results.map(result => result.elevation);
      allElevations.push(...batchElevations);
    }
    
    return allElevations;
  }
  
  /**
   * Calculate trail metrics based on waypoints
   * 
   * @param {Array} waypoints - Array of waypoint objects
   * @returns {Object} - Trail metrics
   */
  function calculateTrailMetrics(waypoints) {
    const metrics = {
      distance: 0,
      elevationGain: 0,
      elevationLoss: 0,
      highestPoint: null,
      lowestPoint: null,
      startPoint: waypoints.length > 0 ? waypoints[0] : null,
      endPoint: waypoints.length > 0 ? waypoints[waypoints.length - 1] : null,
      duration: null
    };
    
    if (waypoints.length < 2) {
      return metrics;
    }
    
    // Calculate total distance
    metrics.distance = geolib.getPathLength(waypoints.map(waypoint => ({
      latitude: waypoint.coordinates.latitude,
      longitude: waypoint.coordinates.longitude
    })));
    
    // Process elevation data if available
    const hasElevation = waypoints.some(waypoint => 
      waypoint.elevation !== undefined && waypoint.elevation !== null
    );
    
    if (hasElevation) {
      // Find highest and lowest points
      let highest = -Infinity;
      let lowest = Infinity;
      
      waypoints.forEach(waypoint => {
        if (waypoint.elevation !== undefined && waypoint.elevation !== null) {
          if (waypoint.elevation > highest) {
            highest = waypoint.elevation;
            metrics.highestPoint = waypoint;
          }
          if (waypoint.elevation < lowest) {
            lowest = waypoint.elevation;
            metrics.lowestPoint = waypoint;
          }
        }
      });
      
      // Calculate elevation gain and loss
      for (let i = 1; i < waypoints.length; i++) {
        const prevElevation = waypoints[i - 1].elevation;
        const currElevation = waypoints[i].elevation;
        
        if (prevElevation !== undefined && prevElevation !== null &&
            currElevation !== undefined && currElevation !== null) {
          const diff = currElevation - prevElevation;
          if (diff > 0) {
            metrics.elevationGain += diff;
          } else {
            metrics.elevationLoss += Math.abs(diff);
          }
        }
      }
    }
    
    // Calculate duration if timestamps are available
    if (waypoints.length >= 2 && 
        waypoints[0].timestamp instanceof Date &&
        waypoints[waypoints.length - 1].timestamp instanceof Date) {
      const startTime = waypoints[0].timestamp;
      const endTime = waypoints[waypoints.length - 1].timestamp;
      
      metrics.duration = endTime.getTime() - startTime.getTime();
    }
    
    return metrics;
  }
  
  /**
   * Generate GPX data from waypoints
   * 
   * @param {Array} waypoints - Array of waypoint objects
   * @param {Object} options - GPX options
   * @returns {string} - GPX formatted data
   */
  function generateGPX(waypoints, options) {
    // Convert waypoints to the format expected by gps-to-gpx
    const points = waypoints.map(waypoint => ({
      latitude: waypoint.coordinates.latitude,
      longitude: waypoint.coordinates.longitude,
      elevation: waypoint.elevation,
      time: waypoint.timestamp,
      name: waypoint.name
    }));
    
    // Generate GPX with provided options
    const gpxOptions = {
      activityName: options.activityName || 'hiking',
      startTime: waypoints.length > 0 ? waypoints[0].timestamp : new Date(),
      creator: options.creator || 'TrailTrades App'
    };
    
    return toGPX(points, gpxOptions);
  }
  
  /**
   * Create a GPS trail recorder for real-time tracking
   * 
   * @param {Object} trail - Initial trail object
   * @param {Object} options - Recording options
   * @returns {Object} - Trail recorder object
   */
  function createGPSTrailRecorder(trail, options) {
    let isRecording = false;
    let watchId = null;
    let waypoints = [];
    let lastLocation = null;
    let minAccuracy = 15; // meters
    let minDistance = 5; // meters
    let currentTrail = { ...trail };
    
    // Initialize geolocation options
    const geolocationOptions = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000
    };
    
    return {
      /**
       * Start GPS recording
       * 
       * @param {Object} [startOptions] - Start options
       * @param {number} [startOptions.minAccuracy] - Minimum accuracy in meters
       * @param {number} [startOptions.minDistance] - Minimum distance between points in meters
       * @returns {Promise<void>}
       */
      start: async (startOptions = {}) => {
        if (isRecording) {
          throw new Error('GPS recording already in progress.');
        }
        
        // Update options if provided
        if (startOptions.minAccuracy) {
          minAccuracy = startOptions.minAccuracy;
        }
        
        if (startOptions.minDistance) {
          minDistance = startOptions.minDistance;
        }
        
        // Check if geolocation is available
        if (!navigator || !navigator.geolocation) {
          throw new Error('Geolocation is not supported by this device.');
        }
        
        // Start recording
        isRecording = true;
        waypoints = [];
        
        // Create a promise that resolves once we get the first position
        const firstPositionPromise = new Promise((resolve, reject) => {
          // Start watching position
          watchId = navigator.geolocation.watchPosition(
            (position) => {
              const { latitude, longitude, altitude, accuracy, timestamp } = position.coords;
              
              // Skip points with low accuracy
              if (accuracy > minAccuracy) {
                return;
              }
              
              // Create waypoint
              const waypoint = {
                coordinates: {
                  latitude,
                  longitude
                },
                elevation: altitude || null,
                timestamp: new Date(timestamp),
                accuracy
              };
              
              // Check if this is far enough from the last point
              if (lastLocation) {
                const distance = geolib.getDistance(
                  { latitude, longitude },
                  { latitude: lastLocation.coordinates.latitude, longitude: lastLocation.coordinates.longitude }
                );
                
                if (distance < minDistance) {
                  return;
                }
              }
              
              // Add waypoint
              waypoints.push(waypoint);
              lastLocation = waypoint;
              
              // Resolve the promise once we have the first position
              if (waypoints.length === 1) {
                resolve();
              }
            },
            (error) => {
              if (waypoints.length === 0) {
                reject(new Error(`Geolocation error: ${error.message}`));
              }
              
              console.error('Geolocation error:', error);
            },
            geolocationOptions
          );
        });
        
        // Wait for the first position
        await firstPositionPromise;
        
        // Update trail with first position
        currentTrail.metrics.startPoint = waypoints[0];
        currentTrail.createdAt = waypoints[0].timestamp.toISOString();
        
        return {
          message: 'GPS recording started successfully.',
          firstPosition: waypoints[0]
        };
      },
      
      /**
       * Pause GPS recording
       */
      pause: () => {
        if (!isRecording) {
          throw new Error('No GPS recording in progress.');
        }
        
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
          watchId = null;
        }
        
        isRecording = false;
        
        return {
          message: 'GPS recording paused.',
          waypoints: waypoints.length
        };
      },
      
      /**
       * Resume GPS recording
       */
      resume: () => {
        if (isRecording) {
          throw new Error('GPS recording already in progress.');
        }
        
        // Start watching position again
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude, altitude, accuracy, timestamp } = position.coords;
            
            // Skip points with low accuracy
            if (accuracy > minAccuracy) {
              return;
            }
            
            // Create waypoint
            const waypoint = {
              coordinates: {
                latitude,
                longitude
              },
              elevation: altitude || null,
              timestamp: new Date(timestamp),
              accuracy
            };
            
            // Check if this is far enough from the last point
            if (lastLocation) {
              const distance = geolib.getDistance(
                { latitude, longitude },
                { latitude: lastLocation.coordinates.latitude, longitude: lastLocation.coordinates.longitude }
              );
              
              if (distance < minDistance) {
                return;
              }
            }
            
            // Add waypoint
            waypoints.push(waypoint);
            lastLocation = waypoint;
          },
          (error) => {
            console.error('Geolocation error:', error);
          },
          geolocationOptions
        );
        
        isRecording = true;
        
        return {
          message: 'GPS recording resumed.',
          waypoints: waypoints.length
        };
      },
      
      /**
       * Stop GPS recording and finalize trail
       * 
       * @param {boolean} [saveTrail=true] - Whether to save the trail
       * @returns {Promise<Object>} - Completed trail data
       */
      stop: async (saveTrail = true) => {
        if (!isRecording && watchId === null) {
          throw new Error('No GPS recording in progress.');
        }
        
        // Stop watching position
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
          watchId = null;
        }
        
        isRecording = false;
        
        // Check if we have enough waypoints
        if (waypoints.length < 2) {
          throw new Error('Not enough waypoints recorded. At least 2 are required.');
        }
        
        // Fetch elevation data if needed
        if (options.includeElevation) {
          // Filter waypoints that need elevation data
          const waypointsWithoutElevation = waypoints.filter(
            waypoint => waypoint.elevation === null
          );
          
          if (waypointsWithoutElevation.length > 0) {
            try {
              // Fetch elevation data
              const coordinates = waypointsWithoutElevation.map(waypoint => ({
                latitude: waypoint.coordinates.latitude,
                longitude: waypoint.coordinates.longitude
              }));
              
              let elevationData;
              
              if (config.MAPBOX_ACCESS_TOKEN) {
                elevationData = await fetchMapboxElevation(coordinates);
              } else if (config.GOOGLE_MAPS_API_KEY) {
                elevationData = await fetchGoogleElevation(coordinates);
              }
              
              // Update waypoints with elevation data
              if (elevationData) {
                let elevationIndex = 0;
                waypoints = waypoints.map(waypoint => {
                  if (waypoint.elevation === null) {
                    const elevation = elevationData[elevationIndex++];
                    return { ...waypoint, elevation };
                  }
                  return waypoint;
                });
              }
            } catch (error) {
              console.error('Failed to fetch elevation data:', error);
              // Continue without elevation data
            }
          }
        }
        
        // Calculate trail metrics
        currentTrail.waypoints = waypoints;
        currentTrail.metrics = calculateTrailMetrics(waypoints);
        currentTrail.updatedAt = new Date().toISOString();
        
        // Generate GPX data
        currentTrail.gpxData = generateGPX(waypoints, {
          ...options.gpxOptions,
          creator: 'TrailTrades App'
        });
        
        // Save trail if requested
        if (saveTrail && options.autoSave) {
          try {
            const savedTrail = await saveTrail(currentTrail);
            return savedTrail;
          } catch (error) {
            console.error('Failed to save trail:', error);
            return {
              ...currentTrail,
              saveError: error.message
            };
          }
        }
        
        return currentTrail;
      },
      
      /**
       * Get current recording status and stats
       * 
       * @returns {Object} - Recording status and stats
       */
      getStatus: () => {
        const metrics = calculateTrailMetrics(waypoints);
        
        return {
          isRecording,
          waypoints: waypoints.length,
          duration: metrics.duration,
          distance: metrics.distance,
          elevationGain: metrics.elevationGain,
          elevationLoss: metrics.elevationLoss
        };
      },
      
      /**
       * Add a manual waypoint (for mixed GPS/manual recording)
       * 
       * @param {Object} waypoint - Waypoint data
       * @returns {Object} - Updated status
       */
      addWaypoint: (waypoint) => {
        if (!waypoint || !waypoint.coordinates) {
          throw new Error('Invalid waypoint data.');
        }
        
        const { latitude, longitude } = waypoint.coordinates;
        
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
          throw new Error('Invalid coordinates.');
        }
        
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
          throw new Error('Coordinates out of range.');
        }
        
        // Create timestamp if not provided
        const timestamp = waypoint.timestamp instanceof Date 
          ? waypoint.timestamp 
          : new Date();
        
        // Add waypoint
        const newWaypoint = {
          coordinates: {
            latitude,
            longitude
          },
          elevation: waypoint.elevation || null,
          name: waypoint.name || null,
          timestamp,
          isManual: true
        };
        
        waypoints.push(newWaypoint);
        lastLocation = newWaypoint;
        
        return {
          message: 'Waypoint added successfully.',
          waypoints: waypoints.length
        };
      }
    };
  }
  
  /**
   * Save trail to server
   * 
   * @param {Object} trail - Trail object
   * @returns {Promise<Object>} - Saved trail data
   */
  async function saveTrail(trail) {
    try {
      const authToken = await getAuthToken();
      
      const response = await fetch('https://api.trailtrades.com/trails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(trail)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save trail');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Trail save error:', error);
      throw error;
    }
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

export default trailtrades_recordTrail;