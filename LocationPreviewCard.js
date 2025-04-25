// LocationPreviewCard.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const LocationPreviewCard = ({ location, onClose, onViewDetails }) => {
  if (!location) return null;
  
  // Determine if location is a trade-only location
  const isTradeLocation = location.privacyLevel === 'trade' && !location.userHasAccess;
  
  // Format categories for display
  const formatCategories = () => {
    const categoryNames = {
      'hiking': 'Hiking',
      'camping': 'Camping',
      'mountain_biking': 'Mountain Biking',
      'dirt_biking': 'Dirt Biking',
      'offroading': 'Offroading',
      'rv_safe': 'RV-Safe'
    };
    
    if (!location.categories || location.categories.length === 0) {
      return 'Uncategorized';
    }
    
    return location.categories
      .map(cat => categoryNames[cat] || cat)
      .join(', ');
  };
  
  // Determine category icon
  const getCategoryIcon = () => {
    if (!location.categories || location.categories.length === 0) {
      return 'compass';
    }
    
    const categoryIcons = {
      'hiking': 'walk',
      'camping': 'campfire',
      'mountain_biking': 'bike',
      'dirt_biking': 'motorbike',
      'offroading': 'car-4x4',
      'rv_safe': 'rv-truck'
    };
    
    // Return icon for first category
    return categoryIcons[location.categories[0]] || 'compass';
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={onClose}
      >
        <Ionicons name="close" size={24} color="#555" />
      </TouchableOpacity>
      
      <View style={styles.previewCard}>
        {/* Location Photo */}
        <View style={styles.imageContainer}>
          {location.preview && location.preview.photoUrl ? (
            <Image
              source={{ uri: location.preview.photoUrl }}
              style={styles.locationImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={48} color="#cccccc" />
            </View>
          )}
          
          {/* Trade Badge */}
          {isTradeLocation && (
            <View style={styles.tradeBadge}>
              <Ionicons name="swap-horizontal" size={16} color="#fff" />
              <Text style={styles.tradeBadgeText}>Trade</Text>
            </View>
          )}
        </View>
        
        {/* Location Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.locationName}>{location.name}</Text>
          
          <View style={styles.categoryRow}>
            <MaterialCommunityIcons name={getCategoryIcon()} size={18} color="#555" />
            <Text style={styles.categoryText}>{formatCategories()}</Text>
          </View>
          
          {/* Location Description */}
          {location.preview && location.preview.description && (
            <Text style={styles.description} numberOfLines={2}>
              {location.preview.description}
            </Text>
          )}
          
          {/* Vehicle Requirements */}
          {(location.vehicleRequirements && 
            (location.vehicleRequirements.fourWDRequired ||
             location.vehicleRequirements.highClearanceRequired)) && (
            <View style={styles.requirementsContainer}>
              {location.vehicleRequirements.fourWDRequired && (
                <View style={styles.requirementTag}>
                  <MaterialCommunityIcons name="car-4x4" size={14} color="#fff" />
                  <Text style={styles.requirementText}>4WD</Text>
                </View>
              )}
              {location.vehicleRequirements.highClearanceRequired && (
                <View style={styles.requirementTag}>
                  <MaterialCommunityIcons name="car-lifted-pickup" size={14} color="#fff" />
                  <Text style={styles.requirementText}>High Clearance</Text>
                </View>
              )}
            </View>
          )}
          
          {/* RV Info */}
          {location.vehicleRequirements && location.vehicleRequirements.rvFriendly && (
            <View style={styles.rvInfoContainer}>
              <View style={styles.rvTag}>
                <MaterialCommunityIcons name="rv-truck" size={14} color="#fff" />
                <Text style={styles.rvTagText}>RV Friendly</Text>
              </View>
              
              {location.rvSpecs && location.rvSpecs.maxLengthFeet && (
                <Text style={styles.rvSpecText}>
                  Max Length: {location.rvSpecs.maxLengthFeet} ft
                </Text>
              )}
            </View>
          )}
          
          {/* Trade Info */}
          {isTradeLocation && (
            <View style={styles.tradeInfoContainer}>
              <Text style={styles.tradeInfoText}>
                Available for trade ({location.tradeCredits || 5} credits)
              </Text>
            </View>
          )}
          
          {/* View Details Button */}
          <TouchableOpacity
            style={styles.viewDetailsButton}
            onPress={onViewDetails}
          >
            <Text style={styles.viewDetailsText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20, // Allow space for home indicator on newer iPhones
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 180,
    width: '100%',
  },
  locationImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tradeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3C6E47',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tradeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  infoContainer: {
    padding: 16,
  },
  locationName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 6,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  requirementsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  requirementTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E67E22',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  requirementText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
  rvInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rvTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498DB',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  rvTagText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
  rvSpecText: {
    fontSize: 12,
    color: '#555',
  },
  tradeInfoContainer: {
    marginBottom: 12,
  },
  tradeInfoText: {
    fontSize: 14,
    color: '#3C6E47',
    fontWeight: '600',
  },
  viewDetailsButton: {
    backgroundColor: '#3C6E47',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  viewDetailsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LocationPreviewCard;