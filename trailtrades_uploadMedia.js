/**
 * TrailTrades Media Management Module
 * 
 * Handles uploading and managing media files (photos/videos) associated with locations and trails.
 * Includes compression, metadata extraction, location tagging, and visibility controls.
 * 
 * @param {Object} mediaData - Media data object
 * @param {File|Blob|string} mediaData.file - Media file, Blob object, or base64 string
 * @param {string} mediaData.type - Media type: 'photo' or 'video'
 * @param {string} mediaData.title - Media title
 * @param {string} [mediaData.description] - Media description
 * @param {Object} association - Association object
 * @param {string} association.type - Association type: 'location', 'trail', or 'waypoint'
 * @param {string} association.id - ID of associated entity
 * @param {Object} [association.coordinates] - Optional specific coordinates
 * @param {number} association.coordinates.latitude - Latitude
 * @param {number} association.coordinates.longitude - Longitude
 * @param {Object} [options] - Upload options
 * @param {string} [options.privacyLevel='public'] - Privacy level: 'public', 'followers', 'private', or 'trade'
 * @param {boolean} [options.extractMetadata=true] - Whether to extract metadata from media file
 * @param {boolean} [options.stripExifLocation=true] - Whether to strip location data from EXIF
 * @param {boolean} [options.compressMedia=true] - Whether to compress media before upload
 * @param {number} [options.maxPhotoSizeMB=5] - Maximum photo size in MB
 * @param {number} [options.maxVideoSizeMB=50] - Maximum video size in MB
 * @param {number} [options.photoQuality=0.8] - Photo compression quality (0-1)
 * @param {string[]} [options.tags] - Array of custom tags
 * @param {boolean} [options.watermark=false] - Whether to add watermark (for trade photos)
 * @returns {Promise<Object>} - Promise resolving to uploaded media object
 */
async function trailtrades_uploadMedia(mediaData, association, options = {}) {
  // Import necessary libraries
  const EXIF = require('exif-js');
  const imageCompression = require('browser-image-compression');
  
  // Import configuration
  const config = {
    API_BASE_URL: process.env.TRAILTRADES_API_URL || 'https://api.trailtrades.com',
    CLOUD_STORAGE_BUCKET: process.env.CLOUD_STORAGE_BUCKET || 'trailtrades-media',
    MAX_CONCURRENT_UPLOADS: 3
  };
  
  // Default options
  const defaultOptions = {
    privacyLevel: 'public',
    extractMetadata: true,
    stripExifLocation: true,
    compressMedia: true,
    maxPhotoSizeMB: 5,
    maxVideoSizeMB: 50,
    photoQuality: 0.8,
    tags: [],
    watermark: false
  };
  
  // Merge default options with provided options
  const finalOptions = { ...defaultOptions, ...options };
  
  // Validate inputs
  if (!mediaData || typeof mediaData !== 'object') {
    throw new Error('Media data object is required.');
  }
  
  if (!mediaData.file) {
    throw new Error('Media file is required.');
  }
  
  if (!mediaData.type || !['photo', 'video'].includes(mediaData.type)) {
    throw new Error('Invalid media type. Use "photo" or "video".');
  }
  
  if (!mediaData.title || typeof mediaData.title !== 'string') {
    throw new Error('Media title is required.');
  }
  
  if (!association || typeof association !== 'object') {
    throw new Error('Association object is required.');
  }
  
  if (!association.type || !['location', 'trail', 'waypoint'].includes(association.type)) {
    throw new Error('Invalid association type. Use "location", "trail", or "waypoint".');
  }
  
  if (!association.id || typeof association.id !== 'string') {
    throw new Error('Association ID is required.');
  }
  
  if (!['public', 'followers', 'private', 'trade'].includes(finalOptions.privacyLevel)) {
    throw new Error('Invalid privacy level. Use "public", "followers", "private", or "trade".');
  }
  
  // Initialize media object
  let mediaObject = {
    title: mediaData.title,
    description: mediaData.description || '',
    type: mediaData.type,
    association: {
      type: association.type,
      id: association.id,
      ...(association.coordinates ? { coordinates: association.coordinates } : {})
    },
    privacyLevel: finalOptions.privacyLevel,
    tags: finalOptions.tags || [],
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  try {
    // Process media file
    let processedFile;
    let metadata = {};
    
    // Convert base64 to Blob if needed
    if (typeof mediaData.file === 'string' && mediaData.file.startsWith('data:')) {
      mediaData.file = await base64ToBlob(mediaData.file);
    }
    
    // Extract metadata if enabled
    if (finalOptions.extractMetadata) {
      metadata = await extractMediaMetadata(mediaData.file, mediaData.type);
      
      // Strip location data if requested
      if (finalOptions.stripExifLocation && metadata.location) {
        delete metadata.location;
      }
      
      // Add metadata to media object
      mediaObject.metadata = metadata;
      
      // Use EXIF creation date if available
      if (metadata.creationDate) {
        mediaObject.createdAt = metadata.creationDate.toISOString();
      }
    }
    
    // Check if coordinates are provided in association or metadata
    if (!association.coordinates && metadata.location) {
      mediaObject.association.coordinates = {
        latitude: metadata.location.latitude,
        longitude: metadata.location.longitude
      };
    }
    
    // Compress media if enabled
    if (finalOptions.compressMedia) {
      if (mediaData.type === 'photo') {
        processedFile = await compressPhoto(mediaData.file, finalOptions);
      } else if (mediaData.type === 'video') {
        processedFile = await compressVideo(mediaData.file, finalOptions);
      } else {
        processedFile = mediaData.file;
      }
    } else {
      processedFile = mediaData.file;
    }
    
    // Add watermark if enabled and is trade photo
    if (finalOptions.watermark && finalOptions.privacyLevel === 'trade' && mediaData.type === 'photo') {
      processedFile = await addWatermark(processedFile);
    }
    
    // Generate upload URL and upload media
    const uploadResult = await uploadMedia(processedFile, mediaObject, finalOptions);
    
    // Return uploaded media object
    return uploadResult;
  } catch (error) {
    console.error('Media upload error:', error);
    throw new Error(`Failed to upload media: ${error.message}`);
  }
  
  /**
   * Convert base64 data URL to Blob object
   * 
   * @param {string} base64Data - Base64 data URL
   * @returns {Promise<Blob>} - Blob object
   */
  async function base64ToBlob(base64Data) {
    return new Promise((resolve, reject) => {
      try {
        // Split the base64 string to get data type and actual base64 data
        const parts = base64Data.split(';base64,');
        const contentType = parts[0].split(':')[1];
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        
        resolve(new Blob([uInt8Array], { type: contentType }));
      } catch (error) {
        reject(new Error(`Failed to convert base64 to Blob: ${error.message}`));
      }
    });
  }
  
  /**
   * Extract metadata from media file
   * 
   * @param {File|Blob} file - Media file
   * @param {string} type - Media type
   * @returns {Promise<Object>} - Extracted metadata
   */
  async function extractMediaMetadata(file, type) {
    return new Promise((resolve, reject) => {
      try {
        const metadata = {
          size: file.size,
          contentType: file.type
        };
        
        if (type === 'photo') {
          // Create FileReader to read the image
          const reader = new FileReader();
          
          reader.onload = function(e) {
            try {
              const imageElement = document.createElement('img');
              imageElement.src = e.target.result;
              
              imageElement.onload = function() {
                try {
                  // Add image dimensions to metadata
                  metadata.dimensions = {
                    width: imageElement.width,
                    height: imageElement.height
                  };
                  
                  // Extract EXIF data
                  EXIF.getData(imageElement, function() {
                    try {
                      const exifData = EXIF.getAllTags(this);
                      
                      if (exifData) {
                        // Extract creation date
                        if (exifData.DateTimeOriginal) {
                          const dateParts = exifData.DateTimeOriginal.split(' ');
                          const date = dateParts[0].replace(/:/g, '-');
                          const time = dateParts[1];
                          metadata.creationDate = new Date(`${date}T${time}`);
                        }
                        
                        // Extract location if available
                        if (exifData.GPSLatitude && exifData.GPSLongitude) {
                          const latRef = exifData.GPSLatitudeRef || 'N';
                          const lngRef = exifData.GPSLongitudeRef || 'E';
                          
                          const latitude = convertDMSToDD(
                            exifData.GPSLatitude[0],
                            exifData.GPSLatitude[1],
                            exifData.GPSLatitude[2],
                            latRef
                          );
                          
                          const longitude = convertDMSToDD(
                            exifData.GPSLongitude[0],
                            exifData.GPSLongitude[1],
                            exifData.GPSLongitude[2],
                            lngRef
                          );
                          
                          metadata.location = {
                            latitude,
                            longitude
                          };
                        }
                        
                        // Extract camera info
                        if (exifData.Make || exifData.Model) {
                          metadata.camera = {
                            make: exifData.Make,
                            model: exifData.Model
                          };
                        }
                        
                        // Extract other useful EXIF data
                        if (exifData.ExposureTime) {
                          metadata.exposureTime = exifData.ExposureTime;
                        }
                        
                        if (exifData.FNumber) {
                          metadata.aperture = exifData.FNumber;
                        }
                        
                        if (exifData.ISOSpeedRatings) {
                          metadata.iso = exifData.ISOSpeedRatings;
                        }
                        
                        if (exifData.FocalLength) {
                          metadata.focalLength = exifData.FocalLength;
                        }
                      }
                      
                      resolve(metadata);
                    } catch (exifError) {
                      console.error('EXIF extraction error:', exifError);
                      // Resolve with partial metadata
                      resolve(metadata);
                    }
                  });
                } catch (imgError) {
                  console.error('Image processing error:', imgError);
                  // Resolve with partial metadata
                  resolve(metadata);
                }
              };
              
              imageElement.onerror = function() {
                // Resolve with basic metadata if image loading fails
                resolve(metadata);
              };
            } catch (loadError) {
              console.error('Image loading error:', loadError);
              // Resolve with basic metadata
              resolve(metadata);
            }
          };
          
          reader.onerror = function() {
            // Resolve with basic metadata if reading fails
            resolve(metadata);
          };
          
          reader.readAsDataURL(file);
        } else if (type === 'video') {
          // For video, create a video element to extract metadata
          const videoElement = document.createElement('video');
          videoElement.preload = 'metadata';
          
          videoElement.onloadedmetadata = function() {
            try {
              // Add video dimensions and duration to metadata
              metadata.dimensions = {
                width: videoElement.videoWidth,
                height: videoElement.videoHeight
              };
              
              metadata.duration = videoElement.duration;
              
              resolve(metadata);
            } catch (videoError) {
              console.error('Video metadata extraction error:', videoError);
              // Resolve with basic metadata
              resolve(metadata);
            }
          };
          
          videoElement.onerror = function() {
            // Resolve with basic metadata if video loading fails
            resolve(metadata);
          };
          
          // Create object URL for video
          const objectURL = URL.createObjectURL(file);
          videoElement.src = objectURL;
          
          // Clean up object URL after metadata extraction
          setTimeout(() => {
            URL.revokeObjectURL(objectURL);
          }, 5000);
        } else {
          // For other file types, just return basic metadata
          resolve(metadata);
        }
      } catch (error) {
        console.error('Metadata extraction error:', error);
        // Return basic metadata on error
        resolve({
          size: file.size,
          contentType: file.type
        });
      }
    });
  }
  
  /**
   * Convert GPS coordinates from DMS (Degrees, Minutes, Seconds) to DD (Decimal Degrees)
   * 
   * @param {number} degrees - Degrees
   * @param {number} minutes - Minutes
   * @param {number} seconds - Seconds
   * @param {string} direction - Direction: N, S, E, or W
   * @returns {number} - Decimal degrees
   */
  function convertDMSToDD(degrees, minutes, seconds, direction) {
    let dd = degrees + minutes / 60 + seconds / 3600;
    
    if (direction === 'S' || direction === 'W') {
      dd = -dd;
    }
    
    return dd;
  }
  
  /**
   * Compress photo before upload
   * 
   * @param {File|Blob} file - Photo file
   * @param {Object} options - Compression options
   * @returns {Promise<File|Blob>} - Compressed photo file
   */
  async function compressPhoto(file, options) {
    try {
      // Check if file is already smaller than max size
      if (file.size <= options.maxPhotoSizeMB * 1024 * 1024) {
        return file;
      }
      
      // Set compression options
      const compressionOptions = {
        maxSizeMB: options.maxPhotoSizeMB,
        maxWidthOrHeight: 2048, // Reasonable max dimension
        useWebWorker: true,
        quality: options.photoQuality
      };
      
      // Compress image
      const compressedFile = await imageCompression(file, compressionOptions);
      
      return compressedFile;
    } catch (error) {
      console.error('Photo compression error:', error);
      // Return original file if compression fails
      return file;
    }
  }
  
  /**
   * Compress video before upload (basic implementation)
   * 
   * @param {File|Blob} file - Video file
   * @param {Object} options - Compression options
   * @returns {Promise<File|Blob>} - Processed video file
   */
  async function compressVideo(file, options) {
    // Note: Full video compression is complex and usually requires
    // server-side processing or specialized libraries.
    // This is a placeholder for a more advanced implementation.
    
    // Check if file is already smaller than max size
    if (file.size <= options.maxVideoSizeMB * 1024 * 1024) {
      return file;
    }
    
    // For browser environments without video compression capability,
    // we return the original file with a console warning
    console.warn('Video compression not implemented in client. File exceeds size limit of', 
      `${options.maxVideoSizeMB}MB (actual: ${(file.size / (1024 * 1024)).toFixed(2)}MB).`,
      'Server-side compression will be attempted.');
    
    return file;
  }
  
  /**
   * Add watermark to photo
   * 
   * @param {File|Blob} file - Photo file
   * @returns {Promise<Blob>} - Watermarked photo
   */
  async function addWatermark(file) {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        
        reader.onload = function(event) {
          try {
            const img = new Image();
            
            img.onload = function() {
              try {
                // Create canvas and context
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                
                const ctx = canvas.getContext('2d');
                
                // Draw image on canvas
                ctx.drawImage(img, 0, 0);
                
                // Add watermark text
                ctx.font = `${Math.max(16, img.width / 25)}px Arial`;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.textAlign = 'center';
                
                // Draw diagonal watermark
                ctx.save();
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(-Math.PI / 4); // Rotate 45 degrees counter-clockwise
                ctx.fillText('TrailTrades Preview', 0, 0);
                ctx.restore();
                
                // Convert canvas to Blob with same type as original
                canvas.toBlob(
                  (blob) => {
                    resolve(blob);
                  },
                  file.type,
                  0.9
                );
              } catch (canvasError) {
                console.error('Canvas error:', canvasError);
                // Return original file if watermarking fails
                resolve(file);
              }
            };
            
            img.onerror = function() {
              console.error('Image loading error during watermarking');
              // Return original file if image loading fails
              resolve(file);
            };
            
            img.src = event.target.result;
          } catch (imgError) {
            console.error('Image processing error:', imgError);
            // Return original file if processing fails
            resolve(file);
          }
        };
        
        reader.onerror = function() {
          console.error('File reading error during watermarking');
          // Return original file if reading fails
          resolve(file);
        };
        
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Watermarking error:', error);
        // Return original file if any error occurs
        resolve(file);
      }
    });
  }
  
  /**
   * Upload media to server
   * 
   * @param {File|Blob} file - Processed media file
   * @param {Object} mediaObject - Media metadata object
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} - Upload result
   */
  async function uploadMedia(file, mediaObject, options) {
    try {
      // Get authentication token
      const authToken = await getAuthToken();
      
      // Step 1: Request signed upload URL
      const uploadUrlResponse = await fetch(`${config.API_BASE_URL}/media/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          fileName: file.name || `${mediaObject.type}-${Date.now()}`,
          contentType: file.type,
          mediaType: mediaObject.type,
          associationType: mediaObject.association.type,
          privacyLevel: mediaObject.privacyLevel
        })
      });
      
      if (!uploadUrlResponse.ok) {
        const uploadUrlError = await uploadUrlResponse.json();
        throw new Error(uploadUrlError.message || 'Failed to get upload URL');
      }
      
      const { uploadUrl, mediaId } = await uploadUrlResponse.json();
      
      // Step 2: Upload file to storage
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type
        },
        body: file
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`Storage upload failed: ${uploadResponse.status}`);
      }
      
      // Step 3: Confirm upload and save metadata
      const confirmResponse = await fetch(`${config.API_BASE_URL}/media/${mediaId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          ...mediaObject,
          id: mediaId
        })
      });
      
      if (!confirmResponse.ok) {
        const confirmError = await confirmResponse.json();
        throw new Error(confirmError.message || 'Failed to confirm upload');
      }
      
      // Return complete media object with server-side additions
      return await confirmResponse.json();
    } catch (error) {
      console.error('Media upload error:', error);
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

export default trailtrades_uploadMedia;