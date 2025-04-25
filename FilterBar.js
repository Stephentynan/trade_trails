// FilterBar.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  Slider,
  Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const FilterBar = ({ activeFilters, onFilterChange }) => {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempFilters, setTempFilters] = useState(activeFilters);
  
  // Available categories
  const categories = [
    { id: 'hiking', name: 'Hiking', icon: 'walk' },
    { id: 'camping', name: 'Camping', icon: 'campfire' },
    { id: 'mountain_biking', name: 'Mountain Biking', icon: 'bike' },
    { id: 'dirt_biking', name: 'Dirt Biking', icon: 'motorbike' },
    { id: 'offroading', name: 'Offroading', icon: 'car-4x4' },
    { id: 'rv_safe', name: 'RV-Safe', icon: 'rv-truck' }
  ];
  
  // Difficulty levels
  const difficultyLevels = [
    { id: 'easy', name: 'Easy', color: '#27AE60' },
    { id: 'moderate', name: 'Moderate', color: '#F39C12' },
    { id: 'difficult', name: 'Difficult', color: '#E67E22' },
    { id: 'extreme', name: 'Extreme', color: '#C0392B' }
  ];
  
  // Toggle category filter
  const toggleCategory = (categoryId) => {
    if (tempFilters.categories.includes(categoryId)) {
      setTempFilters({
        ...tempFilters,
        categories: tempFilters.categories.filter(id => id !== categoryId)
      });
    } else {
      setTempFilters({
        ...tempFilters,
        categories: [...tempFilters.categories, categoryId]
      });
    }
  };
  
  // Toggle difficulty level
  const toggleDifficulty = (difficultyId) => {
    setTempFilters({
      ...tempFilters,
      difficulty: tempFilters.difficulty === difficultyId ? null : difficultyId
    });
  };
  
  // Apply filters
  const applyFilters = () => {
    onFilterChange(tempFilters);
    setShowFilterModal(false);
  };
  
  // Reset filters
  const resetFilters = () => {
    const defaultFilters = {
      categories: [],
      vehicleRequirements: {
        fourWDOnly: false,
        highClearanceOnly: false,
        rvFriendly: false
      },
      difficulty: null,
      privacyLevel: 'all',
      radius: 50
    };
    
    setTempFilters(defaultFilters);
  };
  
  // Render active filter chips
  const renderActiveFilterChips = () => {
    const filterChips = [];
    
    // Add category chips
    tempFilters.categories.forEach(categoryId => {
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        filterChips.push(
          <View key={`category-${categoryId}`} style={styles.filterChip}>
            <MaterialCommunityIcons name={category.icon} size={14} color="#fff" />
            <Text style={styles.filterChipText}>{category.name}</Text>
          </View>
        );
      }
    });
    
    // Add vehicle requirement chips
    if (tempFilters.vehicleRequirements.fourWDOnly) {
      filterChips.push(
        <View key="4wd" style={styles.filterChip}>
          <MaterialCommunityIcons name="car-4x4" size={14} color="#fff" />
          <Text style={styles.filterChipText}>4WD</Text>
        </View>
      );
    }
    
    if (tempFilters.vehicleRequirements.highClearanceOnly) {
      filterChips.push(
        <View key="highClearance" style={styles.filterChip}>
          <MaterialCommunityIcons name="car-lifted-pickup" size={14} color="#fff" />
          <Text style={styles.filterChipText}>High Clearance</Text>
        </View>
      );
    }
    
    if (tempFilters.vehicleRequirements.rvFriendly) {
      filterChips.push(
        <View key="rv" style={styles.filterChip}>
          <MaterialCommunityIcons name="rv-truck" size={14} color="#fff" />
          <Text style={styles.filterChipText}>RV Friendly</Text>
        </View>
      );
    }
    
    // Add difficulty chip
    if (tempFilters.difficulty) {
      const difficulty = difficultyLevels.find(d => d.id === tempFilters.difficulty);
      if (difficulty) {
        filterChips.push(
          <View 
            key={`difficulty-${difficulty.id}`} 
            style={[styles.filterChip, { backgroundColor: difficulty.color }]}
          >
            <Text style={styles.filterChipText}>{difficulty.name}</Text>
          </View>
        );
      }
    }
    
    // Add privacy level chip if not 'all'
    if (tempFilters.privacyLevel !== 'all') {
      let privacyText = '';
      let privacyIcon = '';
      
      switch (tempFilters.privacyLevel) {
        case 'public':
          privacyText = 'Public Only';
          privacyIcon = 'earth';
          break;
        case 'trade':
          privacyText = 'Trade Only';
          privacyIcon = 'swap-horizontal';
          break;
        case 'followers':
          privacyText = 'Followers Only';
          privacyIcon = 'people';
          break;
      }
      
      if (privacyText) {
        filterChips.push(
          <View key="privacy" style={styles.filterChip}>
            <Ionicons name={privacyIcon} size={14} color="#fff" />
            <Text style={styles.filterChipText}>{privacyText}</Text>
          </View>
        );
      }
    }
    
    // Add radius chip
    filterChips.push(
      <View key="radius" style={styles.filterChip}>
        <Ionicons name="compass" size={14} color="#fff" />
        <Text style={styles.filterChipText}>{tempFilters.radius} mi</Text>
      </View>
    );
    
    return filterChips;
  };
  
  return (
    <View style={styles.container}>
      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="options-outline" size={20} color="#3C6E47" />
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activeFiltersContainer}
        >
          {activeFilters.categories.length > 0 || 
           activeFilters.vehicleRequirements.fourWDOnly ||
           activeFilters.vehicleRequirements.highClearanceOnly ||
           activeFilters.vehicleRequirements.rvFriendly ||
           activeFilters.difficulty ||
           activeFilters.privacyLevel !== 'all' ? (
            renderActiveFilterChips()
          ) : (
            <Text style={styles.noFiltersText}>No filters applied</Text>
          )}
        </ScrollView>
      </View>
      
      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={false}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setTempFilters(activeFilters);
                setShowFilterModal(false);
              }}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* Categories */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <View style={styles.categoriesContainer}>
                {categories.map(category => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryButton,
                      tempFilters.categories.includes(category.id) ? styles.categoryButtonSelected : {}
                    ]}
                    onPress={() => toggleCategory(category.id)}
                  >
                    <MaterialCommunityIcons
                      name={category.icon}
                      size={24}
                      color={tempFilters.categories.includes(category.id) ? "#fff" : "#555"}
                    />
                    <Text
                      style={[
                        styles.categoryButtonText,
                        tempFilters.categories.includes(category.id) ? styles.categoryButtonTextSelected : {}
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Vehicle Requirements */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Vehicle Requirements</Text>
              <View style={styles.settingRow}>
                <View style={styles.settingLabelContainer}>
                  <MaterialCommunityIcons name="car-4x4" size={24} color="#555" />
                  <Text style={styles.settingLabel}>4WD Required</Text>
                </View>
                <Switch
                  value={tempFilters.vehicleRequirements.fourWDOnly}
                  onValueChange={(value) => setTempFilters({
                    ...tempFilters,
                    vehicleRequirements: {
                      ...tempFilters.vehicleRequirements,
                      fourWDOnly: value
                    }
                  })}
                  trackColor={{ false: "#e0e0e0", true: "#a8d5ba" }}
                  thumbColor={tempFilters.vehicleRequirements.fourWDOnly ? "#3C6E47" : "#f4f3f4"}
                />
              </View>
              
              <View style={styles.settingRow}>
                <View style={styles.settingLabelContainer}>
                  <MaterialCommunityIcons name="car-lifted-pickup" size={24} color="#555" />
                  <Text style={styles.settingLabel}>High Clearance Required</Text>
                </View>
                <Switch
                  value={tempFilters.vehicleRequirements.highClearanceOnly}
                  onValueChange={(value) => setTempFilters({
                    ...tempFilters,
                    vehicleRequirements: {
                      ...tempFilters.vehicleRequirements,
                      highClearanceOnly: value
                    }
                  })}
                  trackColor={{ false: "#e0e0e0", true: "#a8d5ba" }}
                  thumbColor={tempFilters.vehicleRequirements.highClearanceOnly ? "#3C6E47" : "#f4f3f4"}
                />
              </View>
              
              <View style={styles.settingRow}>
                <View style={styles.settingLabelContainer}>
                  <MaterialCommunityIcons name="rv-truck" size={24} color="#555" />
                  <Text style={styles.settingLabel}>RV Friendly</Text>
                </View>
                <Switch
                  value={tempFilters.vehicleRequirements.rvFriendly}
                  onValueChange={(value) => setTempFilters({
                    ...tempFilters,
                    vehicleRequirements: {
                      ...tempFilters.vehicleRequirements,
                      rvFriendly: value
                    }
                  })}
                  trackColor={{ false: "#e0e0e0", true: "#a8d5ba" }}
                  thumbColor={tempFilters.vehicleRequirements.rvFriendly ? "#3C6E47" : "#f4f3f4"}
                />
              </View>
            </View>
            
            {/* Difficulty */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Difficulty Level</Text>
              <View style={styles.difficultyContainer}>
                {difficultyLevels.map(level => (
                  <TouchableOpacity
                    key={level.id}
                    style={[
                      styles.difficultyButton,
                      tempFilters.difficulty === level.id ? 
                        { backgroundColor: level.color } : {}
                    ]}
                    onPress={() => toggleDifficulty(level.id)}
                  >
                    <Text
                      style={[
                        styles.difficultyButtonText,
                        tempFilters.difficulty === level.id ?
                          styles.difficultyButtonTextSelected : {}
                      ]}
                    >
                      {level.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Privacy Level */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Availability</Text>
              <View style={styles.privacyContainer}>
                <TouchableOpacity
                  style={[
                    styles.privacyButton,
                    tempFilters.privacyLevel === 'all' ?
                      styles.privacyButtonSelected : {}
                  ]}
                  onPress={() => setTempFilters({
                    ...tempFilters,
                    privacyLevel: 'all'
                  })}
                >
                  <Text
                    style={[
                      styles.privacyButtonText,
                      tempFilters.privacyLevel === 'all' ?
                        styles.privacyButtonTextSelected : {}
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.privacyButton,
                    tempFilters.privacyLevel === 'public' ?
                      styles.privacyButtonSelected : {}
                  ]}
                  onPress={() => setTempFilters({
                    ...tempFilters,
                    privacyLevel: 'public'
                  })}
                >
                  <Ionicons
                    name="earth"
                    size={16}
                    color={tempFilters.privacyLevel === 'public' ? "#fff" : "#555"}
                    style={styles.privacyIcon}
                  />
                  <Text
                    style={[
                      styles.privacyButtonText,
                      tempFilters.privacyLevel === 'public' ?
                        styles.privacyButtonTextSelected : {}
                    ]}
                  >
                    Public
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.privacyButton,
                    tempFilters.privacyLevel === 'trade' ?
                      styles.privacyButtonSelected : {}
                  ]}
                  onPress={() => setTempFilters({
                    ...tempFilters,
                    privacyLevel: 'trade'
                  })}
                >
                  <Ionicons
                    name="swap-horizontal"
                    size={16}
                    color={tempFilters.privacyLevel === 'trade' ? "#fff" : "#555"}
                    style={styles.privacyIcon}
                  />
                  <Text
                    style={[
                      styles.privacyButtonText,
                      tempFilters.privacyLevel === 'trade' ?
                        styles.privacyButtonTextSelected : {}
                    ]}
                  >
                    Trade Only
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Search Radius */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Search Radius</Text>
              <View style={styles.radiusContainer}>
                <Slider
                  style={styles.radiusSlider}
                  minimumValue={5}
                  maximumValue={100}
                  step={5}
                  value={tempFilters.radius}
                  onValueChange={(value) => setTempFilters({
                    ...tempFilters,
                    radius: value
                  })}
                  minimumTrackTintColor="#3C6E47"
                  maximumTrackTintColor="#e0e0e0"
                  thumbTintColor="#3C6E47"
                />
                <View style={styles.radiusLabelsContainer}>
                  <Text style={styles.radiusValue}>{tempFilters.radius} miles</Text>
                  <View style={styles.radiusLabels}>
                    <Text style={styles.radiusLabel}>5 mi</Text>
                    <Text style={styles.radiusLabel}>100 mi</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
          
          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetFilters}
            >
              <Text style={styles.resetButtonText}>Reset All</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.applyButton}
              onPress={applyFilters}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    zIndex: 10,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#3C6E47',
    fontWeight: '600',
    marginLeft: 4,
  },
  activeFiltersContainer: {
    paddingRight: 16,
  },
  noFiltersText: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3C6E47',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
  },
  filterChipText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
  },
  filterSection: {
    backgroundColor: '#fff',
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  categoryButton: {
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    padding: 12,
    margin: 8,
    width: '29%',
  },
  categoryButtonSelected: {
    backgroundColor: '#3C6E47',
  },
  categoryButtonText: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
    textAlign: 'center',
  },
  categoryButtonTextSelected: {
    color: '#fff',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  difficultyButton: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: '23%',
    alignItems: 'center',
  },
  difficultyButtonText: {
    fontSize: 13,
    color: '#555',
  },
  difficultyButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  privacyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  privacyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 12,
    marginBottom: 12,
  },
  privacyButtonSelected: {
    backgroundColor: '#3C6E47',
  },
  privacyIcon: {
    marginRight: 6,
  },
  privacyButtonText: {
    fontSize: 14,
    color: '#555',
  },
  privacyButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  radiusContainer: {
    paddingHorizontal: 8,
  },
  radiusSlider: {
    width: '100%',
    height: 40,
  },
  radiusLabelsContainer: {
    marginTop: 8,
  },
  radiusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3C6E47',
    textAlign: 'center',
    marginBottom: 4,
  },
  radiusLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radiusLabel: {
    fontSize: 12,
    color: '#888',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  resetButton: {
    borderWidth: 1,
    borderColor: '#3C6E47',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '48%',
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#3C6E47',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: '#3C6E47',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '48%',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FilterBar;