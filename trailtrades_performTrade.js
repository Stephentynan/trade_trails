/**
 * TrailTrades Trading Mechanism Module
 * 
 * Handles the trading of location data between users through credit exchanges
 * or direct location trades. Manages trading protocol, credit accounting,
 * and trust metrics.
 * 
 * @param {string} tradeType - Type of trade: 'credit', 'direct', or 'purchase'
 * @param {Object} tradeParameters - Trade parameters
 * @param {string} [tradeParameters.locationId] - ID of location to acquire (required for 'credit' and 'purchase')
 * @param {string} [tradeParameters.offeredLocationId] - ID of location being offered (required for 'direct')
 * @param {string} [tradeParameters.requestedLocationId] - ID of location being requested (required for 'direct')
 * @param {number} [tradeParameters.creditAmount] - Amount of credits to use (required for 'credit')
 * @param {string} [tradeParameters.recipientUserId] - User ID of trade recipient (required for 'direct')
 * @param {string} [tradeParameters.message] - Optional message to recipient (for 'direct')
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.autoDownload=false] - Whether to automatically download location data
 * @param {boolean} [options.notifyRecipient=true] - Whether to notify recipient
 * @returns {Promise<Object>} - Promise resolving to trade result object
 */
async function trailtrades_performTrade(tradeType, tradeParameters, options = {}) {
  // Import configuration
  const config = {
    API_BASE_URL: process.env.TRAILTRADES_API_URL || 'https://api.trailtrades.com',
    MIN_TRADE_CREDITS: 5,
    DEFAULT_PURCHASE_CREDITS: 10
  };
  
  // Default options
  const defaultOptions = {
    autoDownload: false,
    notifyRecipient: true
  };
  
  // Merge default options with provided options
  const finalOptions = { ...defaultOptions, ...options };
  
  // Validate trade type
  if (!tradeType || !['credit', 'direct', 'purchase'].includes(tradeType)) {
    throw new Error('Invalid trade type. Use "credit", "direct", or "purchase".');
  }
  
  // Validate trade parameters based on trade type
  if (!tradeParameters || typeof tradeParameters !== 'object') {
    throw new Error('Trade parameters object is required.');
  }
  
  try {
    // Check authentication (required for all trade operations)
    const authToken = await getAuthToken();
    const userInfo = await getUserInfo(authToken);
    
    // Validate trade parameters and prepare trade request based on trade type
    let tradeRequest;
    let requiredCredits = 0;
    
    switch (tradeType) {
      case 'credit':
        // Validate credit trade parameters
        validateCreditTradeParameters(tradeParameters);
        
        // Get location information to verify credit cost
        const locationInfo = await getLocationInfo(tradeParameters.locationId, authToken);
        requiredCredits = locationInfo.tradeCredits || config.MIN_TRADE_CREDITS;
        
        // Check if user has enough credits
        if (userInfo.credits < requiredCredits) {
          throw new Error(`Insufficient credits. You have ${userInfo.credits} credits, but this trade requires ${requiredCredits} credits.`);
        }
        
        // Prepare credit trade request
        tradeRequest = {
          type: 'credit',
          locationId: tradeParameters.locationId,
          creditAmount: requiredCredits
        };
        break;
        
      case 'direct':
        // Validate direct trade parameters
        validateDirectTradeParameters(tradeParameters);
        
        // Verify that user owns the offered location
        const offeredLocationInfo = await getLocationInfo(tradeParameters.offeredLocationId, authToken);
        
        if (offeredLocationInfo.creator.id !== userInfo.id) {
          throw new Error('You can only offer locations that you have created.');
        }
        
        // Verify that recipient exists
        await verifyUserExists(tradeParameters.recipientUserId, authToken);
        
        // Prepare direct trade request
        tradeRequest = {
          type: 'direct',
          offeredLocationId: tradeParameters.offeredLocationId,
          requestedLocationId: tradeParameters.requestedLocationId,
          recipientUserId: tradeParameters.recipientUserId,
          message: tradeParameters.message || ''
        };
        break;
        
      case 'purchase':
        // Validate purchase parameters
        validatePurchaseParameters(tradeParameters);
        
        // Get credit bundle information
        requiredCredits = config.DEFAULT_PURCHASE_CREDITS;
        
        // Prepare purchase request
        tradeRequest = {
          type: 'purchase',
          locationId: tradeParameters.locationId
        };
        break;
    }
    
    // Execute trade operation
    const tradeResult = await executeTrade(tradeRequest, authToken);
    
    // Download location data if requested
    if (finalOptions.autoDownload && (tradeType === 'credit' || tradeType === 'purchase')) {
      await downloadLocationData(tradeParameters.locationId, authToken);
    }
    
    // Return trade result
    return {
      success: true,
      tradeId: tradeResult.tradeId,
      timestamp: tradeResult.timestamp,
      type: tradeType,
      details: tradeResult.details,
      remainingCredits: tradeResult.newCreditBalance,
      ...(tradeType === 'credit' || tradeType === 'purchase' ? 
          { locationAccess: true, locationId: tradeParameters.locationId } : {}),
      ...(tradeType === 'direct' ? 
          { status: tradeResult.status, recipientUserId: tradeParameters.recipientUserId } : {})
    };
  } catch (error) {
    console.error('Trade error:', error);
    throw new Error(`Trade failed: ${error.message}`);
  }
  
  /**
   * Validate parameters for credit trade
   * 
   * @param {Object} params - Credit trade parameters
   * @throws {Error} - If parameters are invalid
   */
  function validateCreditTradeParameters(params) {
    if (!params.locationId || typeof params.locationId !== 'string') {
      throw new Error('Location ID is required for credit trade.');
    }
  }
  
  /**
   * Validate parameters for direct trade
   * 
   * @param {Object} params - Direct trade parameters
   * @throws {Error} - If parameters are invalid
   */
  function validateDirectTradeParameters(params) {
    if (!params.offeredLocationId || typeof params.offeredLocationId !== 'string') {
      throw new Error('Offered location ID is required for direct trade.');
    }
    
    if (!params.requestedLocationId || typeof params.requestedLocationId !== 'string') {
      throw new Error('Requested location ID is required for direct trade.');
    }
    
    if (!params.recipientUserId || typeof params.recipientUserId !== 'string') {
      throw new Error('Recipient user ID is required for direct trade.');
    }
  }
  
  /**
   * Validate parameters for credit purchase
   * 
   * @param {Object} params - Purchase parameters
   * @throws {Error} - If parameters are invalid
   */
  function validatePurchaseParameters(params) {
    if (!params.locationId || typeof params.locationId !== 'string') {
      throw new Error('Location ID is required for credit purchase.');
    }
  }
  
  /**
   * Execute trade operation via API
   * 
   * @param {Object} tradeRequest - Prepared trade request
   * @param {string} authToken - Authentication token
   * @returns {Promise<Object>} - Trade result from API
   */
  async function executeTrade(tradeRequest, authToken) {
    const response = await fetch(`${config.API_BASE_URL}/trades`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(tradeRequest)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Trade failed with status: ${response.status}`);
    }
    
    return await response.json();
  }
  
  /**
   * Get user information
   * 
   * @param {string} authToken - Authentication token
   * @returns {Promise<Object>} - User information
   */
  async function getUserInfo(authToken) {
    const response = await fetch(`${config.API_BASE_URL}/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to get user info: ${response.status}`);
    }
    
    return await response.json();
  }
  
  /**
   * Get location information
   * 
   * @param {string} locationId - Location ID
   * @param {string} authToken - Authentication token
   * @returns {Promise<Object>} - Location information
   */
  async function getLocationInfo(locationId, authToken) {
    const response = await fetch(`${config.API_BASE_URL}/locations/${locationId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Location not found. The location ID ${locationId} does not exist.`);
      }
      
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to get location info: ${response.status}`);
    }
    
    return await response.json();
  }
  
  /**
   * Verify user exists
   * 
   * @param {string} userId - User ID
   * @param {string} authToken - Authentication token
   * @returns {Promise<boolean>} - Whether user exists
   */
  async function verifyUserExists(userId, authToken) {
    const response = await fetch(`${config.API_BASE_URL}/users/${userId}/exists`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`User not found. The user ID ${userId} does not exist.`);
      }
      
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to verify user: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.exists) {
      throw new Error(`User not found. The user ID ${userId} does not exist.`);
    }
    
    return true;
  }
  
  /**
   * Download location data
   * 
   * @param {string} locationId - Location ID
   * @param {string} authToken - Authentication token
   * @returns {Promise<Object>} - Downloaded location data
   */
  async function downloadLocationData(locationId, authToken) {
    const response = await fetch(`${config.API_BASE_URL}/locations/${locationId}/full`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to download location data: ${response.status}`);
    }
    
    const locationData = await response.json();
    
    // Store location data in local storage or database for offline use
    await storeLocationData(locationData);
    
    return locationData;
  }
  
  /**
   * Store location data for offline use
   * 
   * @param {Object} locationData - Full location data
   * @returns {Promise<void>}
   */
  async function storeLocationData(locationData) {
    try {
      // Determine storage strategy based on platform
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        // For mobile, use AsyncStorage or similar
        const AsyncStorage = require('@react-native-async-storage/async-storage');
        await AsyncStorage.setItem(
          `location_${locationData.id}`,
          JSON.stringify(locationData)
        );
        
        // Update location index
        const locationIndex = await AsyncStorage.getItem('location_index');
        const index = locationIndex ? JSON.parse(locationIndex) : [];
        
        if (!index.includes(locationData.id)) {
          index.push(locationData.id);
          await AsyncStorage.setItem('location_index', JSON.stringify(index));
        }
      } else {
        // For web, use localStorage
        localStorage.setItem(
          `location_${locationData.id}`,
          JSON.stringify(locationData)
        );
        
        // Update location index
        const locationIndex = localStorage.getItem('location_index');
        const index = locationIndex ? JSON.parse(locationIndex) : [];
        
        if (!index.includes(locationData.id)) {
          index.push(locationData.id);
          localStorage.setItem('location_index', JSON.stringify(index));
        }
      }
      
      console.log(`Location data for ${locationData.id} stored successfully.`);
    } catch (error) {
      console.error('Failed to store location data:', error);
      // Continue without throwing, as this is not critical
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

export default trailtrades_performTrade;