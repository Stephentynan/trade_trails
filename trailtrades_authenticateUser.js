/**
 * TrailTrades Authentication Module
 * 
 * Handles user authentication via email/password or SSO (Google/Apple)
 * 
 * @param {string} method - Authentication method: 'email', 'google', or 'apple'
 * @param {Object} credentials - Authentication credentials
 * @param {string} [credentials.email] - User's email (required for email auth)
 * @param {string} [credentials.password] - User's password (required for email auth)
 * @param {string} [credentials.token] - OAuth token (required for SSO auth)
 * @returns {Promise<Object>} - Promise resolving to user data object or error
 */
async function trailtrades_authenticateUser(method, credentials) {
  // Validate inputs
  if (!method || !['email', 'google', 'apple'].includes(method)) {
    throw new Error('Invalid authentication method. Use "email", "google", or "apple".');
  }
  
  if (!credentials || typeof credentials !== 'object') {
    throw new Error('Credentials object is required.');
  }
  
  // Email authentication
  if (method === 'email') {
    if (!credentials.email || !credentials.password) {
      throw new Error('Email authentication requires email and password.');
    }
    
    try {
      // Call API endpoint for email authentication
      const response = await fetch('https://api.trailtrades.com/auth/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Authentication failed');
      }
      
      const userData = await response.json();
      
      // Store auth token in secure storage
      await storeAuthToken(userData.token);
      
      return userData;
    } catch (error) {
      console.error('Email authentication error:', error);
      throw error;
    }
  }
  
  // SSO authentication (Google or Apple)
  if (method === 'google' || method === 'apple') {
    if (!credentials.token) {
      throw new Error(`${method.charAt(0).toUpperCase() + method.slice(1)} authentication requires OAuth token.`);
    }
    
    try {
      // Call API endpoint for SSO authentication
      const response = await fetch(`https://api.trailtrades.com/auth/${method}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: credentials.token,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Authentication failed');
      }
      
      const userData = await response.json();
      
      // Store auth token in secure storage
      await storeAuthToken(userData.token);
      
      return userData;
    } catch (error) {
      console.error(`${method} authentication error:`, error);
      throw error;
    }
  }
}

/**
 * Helper function to securely store authentication token
 * Implementation varies based on platform (iOS/Android)
 * 
 * @param {string} token - Authentication token to store
 * @returns {Promise<void>}
 */
async function storeAuthToken(token) {
  try {
    if (Platform.OS === 'ios') {
      // iOS secure storage implementation
      await Keychain.setGenericPassword('trailtrades_user', token);
    } else if (Platform.OS === 'android') {
      // Android secure storage implementation
      await EncryptedStorage.setItem('trailtrades_auth_token', token);
    } else {
      // Web fallback
      localStorage.setItem('trailtrades_auth_token', token);
    }
  } catch (error) {
    console.error('Failed to store authentication token:', error);
    throw new Error('Failed to securely store authentication data');
  }
}

export default trailtrades_authenticateUser;