// CreditsManagement.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const CreditsManagement = ({ visible, onClose, userCredits, onCreditUpdate }) => {
  const navigation = useNavigation();
  
  // Credit packages
  const creditPackages = [
    { id: 'pkg1', amount: 20, price: 1.99, featured: false },
    { id: 'pkg2', amount: 50, price: 3.99, featured: true, savings: '20%' },
    { id: 'pkg3', amount: 100, price: 6.99, featured: false, savings: '30%' },
    { id: 'pkg4', amount: 200, price: 12.99, featured: false, savings: '35%' }
  ];
  
  // Credit transactions history (would normally be loaded from API)
  const [transactions, setTransactions] = useState([
    { id: 'txn1', type: 'purchase', amount: 50, date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
    { id: 'txn2', type: 'trade', amount: -15, locationName: 'Mountain Overlook', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
    { id: 'txn3', type: 'earned', amount: 25, locationName: 'Secret Waterfall', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    { id: 'txn4', type: 'trade', amount: -20, locationName: 'Hidden Hot Springs', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
  ]);
  
  // State for purchase process
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [processingPurchase, setProcessingPurchase] = useState(false);
  const [activeTab, setActiveTab] = useState('buy'); // 'buy' or 'history'
  
  // Reset selected package when modal closes
  useEffect(() => {
    if (!visible) {
      setSelectedPackage(null);
      setProcessingPurchase(false);
    }
  }, [visible]);
  
  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Handle package selection
  const selectPackage = (pkg) => {
    setSelectedPackage(pkg);
  };
  
  // Handle purchase
  const handlePurchase = () => {
    if (!selectedPackage) {
      Alert.alert('Selection Required', 'Please select a credit package to purchase.');
      return;
    }
    
    setProcessingPurchase(true);
    
    // Simulate purchase process
    setTimeout(() => {
      // Add new transaction to history
      const newTransaction = {
        id: `txn${transactions.length + 1}`,
        type: 'purchase',
        amount: selectedPackage.amount,
        date: new Date()
      };
      
      setTransactions([newTransaction, ...transactions]);
      
      // Update user credits through callback
      if (onCreditUpdate) {
        onCreditUpdate(userCredits + selectedPackage.amount);
      }
      
      // Reset state and show success
      setProcessingPurchase(false);
      setSelectedPackage(null);
      
      Alert.alert(
        'Purchase Successful',
        `You have purchased ${selectedPackage.amount} credits.`,
        [{ text: 'OK', onPress: () => setActiveTab('history') }]
      );
    }, 2000);
  };
  
  // Render credit package item
  const renderPackageItem = ({ item }) => {
    const isSelected = selectedPackage && selectedPackage.id === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.packageCard,
          isSelected ? styles.selectedPackage : {},
          item.featured ? styles.featuredPackage : {}
        ]}
        onPress={() => selectPackage(item)}
        disabled={processingPurchase}
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
  
  // Render transaction item
  const renderTransactionItem = ({ item }) => {
    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionIconContainer}>
          {item.type === 'purchase' && (
            <Ionicons name="cart" size={20} color="#3498db" />
          )}
          {item.type === 'trade' && (
            <Ionicons name="swap-horizontal" size={20} color="#e74c3c" />
          )}
          {item.type === 'earned' && (
            <Ionicons name="star" size={20} color="#f39c12" />
          )}
        </View>
        
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionTitle}>
            {item.type === 'purchase' ? 'Credit Purchase' :
             item.type === 'trade' ? `Trade for ${item.locationName}` :
             `Earned from ${item.locationName}`}
          </Text>
          <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
        </View>
        
        <Text style={[
          styles.transactionAmount,
          item.amount > 0 ? styles.positiveAmount : styles.negativeAmount
        ]}>
          {item.amount > 0 ? '+' : ''}{item.amount}
        </Text>
      </View>
    );
  };
  
  if (!visible) return null;
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Credits</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.creditBalance}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <View style={styles.balanceContainer}>
            <Ionicons name="wallet" size={28} color="#3C6E47" />
            <Text style={styles.balanceAmount}>{userCredits}</Text>
            <Text style={styles.balanceUnit}>credits</Text>
          </View>
        </View>
        
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'buy' ? styles.activeTabButton : {}]}
            onPress={() => setActiveTab('buy')}
          >
            <Text
              style={[styles.tabButtonText, activeTab === 'buy' ? styles.activeTabButtonText : {}]}
            >
              Buy Credits
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'history' ? styles.activeTabButton : {}]}
            onPress={() => setActiveTab('history')}
          >
            <Text
              style={[styles.tabButtonText, activeTab === 'history' ? styles.activeTabButtonText : {}]}
            >
              History
            </Text>
          </TouchableOpacity>
        </View>
        
        {activeTab === 'buy' ? (
          <View style={styles.buyContent}>
            <Text style={styles.sectionTitle}>Select a Package</Text>
            <FlatList
              data={creditPackages}
              renderItem={renderPackageItem}
              keyExtractor={item => item.id}
              numColumns={2}
              contentContainerStyle={styles.packagesContainer}
            />
            
            <TouchableOpacity
              style={[
                styles.purchaseButton,
                (!selectedPackage || processingPurchase) ? styles.disabledButton : {}
              ]}
              onPress={handlePurchase}
              disabled={!selectedPackage || processingPurchase}
            >
              {processingPurchase ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.purchaseButtonText}>
                  {selectedPackage 
                    ? `Purchase for $${selectedPackage.price.toFixed(2)}` 
                    : 'Select a Package'}
                </Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.infoContainer}>
              <Ionicons name="information-circle" size={16} color="#888" />
              <Text style={styles.infoText}>
                Credits are used to trade for private locations. You can also earn credits by sharing your own locations with the community.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.historyContent}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            <FlatList
              data={transactions}
              renderItem={renderTransactionItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.transactionsContainer}
              ListEmptyComponent={
                <View style={styles.emptyListContainer}>
                  <Ionicons name="newspaper-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyListText}>No transactions yet</Text>
                </View>
              }
            />
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50, // For status bar
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  creditBalance: {
    backgroundColor: '#fff',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3C6E47',
    marginHorizontal: 8,
  },
  balanceUnit: {
    fontSize: 16,
    color: '#555',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#3C6E47',
  },
  tabButtonText: {
    fontSize: 14,
    color: '#888',
  },
  activeTabButtonText: {
    color: '#3C6E47',
    fontWeight: '600',
  },
  buyContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  packagesContainer: {
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
  historyContent: {
    flex: 1,
    padding: 16,
  },
  transactionsContainer: {
    paddingBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#888',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  positiveAmount: {
    color: '#27ae60',
  },
  negativeAmount: {
    color: '#e74c3c',
  },
  emptyListContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyListText: {
    fontSize: 16,
    color: '#888',
    marginTop: 16,
  },
});

export default CreditsManagement;