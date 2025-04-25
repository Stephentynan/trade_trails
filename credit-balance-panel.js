import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * CreditBalancePanel Component
 * 
 * Displays user's credit balance with options to purchase more credits
 * or view transaction history. Provides a compact panel for the main app
 * interface with an expandable modal for credit purchases.
 * 
 * @param {Object} props
 * @param {number} props.userCredits - User's current credit balance
 * @param {Function} props.onPurchase - Function to call when purchasing credits
 * @param {Function} props.onHistoryPress - Function to navigate to history screen
 * @param {Array} [props.creditPackages] - Available credit packages for purchase
 * @returns {React.Component}
 */
const CreditBalancePanel = ({
  userCredits = 0,
  onPurchase,
  onHistoryPress,
  creditPackages = [
    { id: 'pkg1', amount: 20, price: 1.99, featured: false },
    { id: 'pkg2', amount: 50, price: 3.99, featured: true, savings: '20%' },
    { id: 'pkg3', amount: 100, price: 6.99, featured: false, savings: '30%' },
    { id: 'pkg4', amount: 200, price: 12.99, featured: false, savings: '35%' }
  ]
}) => {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [purchasing, setPurchasing] = useState(false);

  // Handle package selection
  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
  };

  // Handle purchase completion
  const handlePurchase = async () => {
    if (!selectedPackage || purchasing) return;
    
    setPurchasing(true);
    
    try {
      // Call the provided purchase function
      await onPurchase(selectedPackage);
      
      // Close modal on success
      setShowPurchaseModal(false);
    } catch (error) {
      // Handle error (in a real app, you would show an error message)
      console.error('Purchase error:', error);
    } finally {
      setPurchasing(false);
      setSelectedPackage(null);
    }
  };

  // Render a credit package card
  const renderPackageItem = ({ item }) => {
    const isSelected = selectedPackage && selectedPackage.id === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.packageCard,
          isSelected ? styles.selectedPackage : {},
          item.featured ? styles.featuredPackage : {}
        ]}
        onPress={() => handleSelectPackage(item)}
        disabled={purchasing}
      >
        {item.featured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>BEST VALUE</Text>
          </View>
        )}
        
        <View style={styles.packageHeader}>
          <Text style={styles.packageAmount}>{item.amount}</Text>
          <Text style={styles.packageCreditsLabel}>credits</Text>
        </View>
        
        <View style={styles.packagePrice}>
          <Text style={styles.priceCurrency}>$</Text>
          <Text style={styles.priceAmount}>{item.price.toFixed(2)}</Text>
        </View>
        
        {item.savings && (
          <View style={styles.savingsTag}>
            <Text style={styles.savingsText}>SAVE {item.savings}</Text>
          </View>
        )}
        
        {isSelected && (
          <View style={styles.selectedCheckmark}>
            <Ionicons name="checkmark-circle" size={24} color="#3C6E47" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View>
      {/* Main Credit Balance Panel */}
      <View style={styles.creditPanel}>
        <View style={styles.balanceContainer}>
          <Ionicons name="wallet-outline" size={24} color="#3C6E47" />
          <Text style={styles.balanceText}>{userCredits} credits</Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowPurchaseModal(true)}
          >
            <Ionicons name="add-circle-outline" size={18} color="#3C6E47" />
            <Text style={styles.buttonText}>Get More</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.historyButton}
            onPress={onHistoryPress}
          >
            <Ionicons name="time-outline" size={18} color="#3C6E47" />
            <Text style={styles.buttonText}>History</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Purchase Modal */}
      <Modal
        visible={showPurchaseModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Get More Credits</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowPurchaseModal(false);
                  setSelectedPackage(null);
                }}
                disabled={purchasing}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {/* Current Balance */}
            <View style={styles.currentBalance}>
              <Text style={styles.currentBalanceLabel}>Current Balance</Text>
              <View style={styles.currentBalanceRow}>
                <Ionicons name="wallet" size={24} color="#3C6E47" />
                <Text style={styles.currentBalanceAmount}>
                  {userCredits} <Text style={styles.currentBalanceUnit}>credits</Text>
                </Text>
              </View>
            </View>
            
            {/* Package List */}
            <Text style={styles.sectionTitle}>Select a Package</Text>
            <FlatList
              data={creditPackages}
              renderItem={renderPackageItem}
              keyExtractor={item => item.id}
              numColumns={2}
              contentContainerStyle={styles.packageList}
            />
            
            {/* Purchase Button */}
            <TouchableOpacity
              style={[
                styles.purchaseButton,
                (!selectedPackage || purchasing) ? styles.disabledButton : {}
              ]}
              onPress={handlePurchase}
              disabled={!selectedPackage || purchasing}
            >
              {purchasing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.purchaseButtonText}>
                  {selectedPackage 
                    ? `Purchase for $${selectedPackage.price.toFixed(2)}` 
                    : 'Select a Package'}
                </Text>
              )}
            </TouchableOpacity>
            
            {/* Info Text */}
            <View style={styles.infoContainer}>
              <Ionicons name="information-circle" size={16} color="#888" />
              <Text style={styles.infoText}>
                Credits are used to trade for private locations. You can also earn credits by sharing your own locations with the community.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  creditPanel: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3C6E47',
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  buttonText: {
    fontSize: 14,
    color: '#3C6E47',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  currentBalance: {
    backgroundColor: '#f0f7f2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  currentBalanceLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  currentBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentBalanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3C6E47',
    marginLeft: 8,
  },
  currentBalanceUnit: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#555',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  packageList: {
    paddingBottom: 16,
  },
  packageCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  selectedPackage: {
    borderWidth: 2,
    borderColor: '#3C6E47',
  },
  featuredPackage: {
    backgroundColor: '#f0f7f2',
  },
  featuredBadge: {
    position: 'absolute',
    top: -10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#3C6E47',
    borderRadius: 4,
  },
  featuredBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  packageHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  packageAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  packageCreditsLabel: {
    fontSize: 14,
    color: '#888',
  },
  packagePrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceCurrency: {
    fontSize: 14,
    color: '#555',
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
  },
  savingsTag: {
    marginTop: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#FEF9E7',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#F39C12',
  },
  savingsText: {
    fontSize: 10,
    color: '#F39C12',
    fontWeight: 'bold',
  },
  selectedCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  purchaseButton: {
    backgroundColor: '#3C6E47',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 16,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#a8d5ba',
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#888',
    marginLeft: 8,
    lineHeight: 18,
  },
});

export default CreditBalancePanel;