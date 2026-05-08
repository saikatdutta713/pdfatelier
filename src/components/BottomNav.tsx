import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';

interface BottomNavProps {
  navigation: any;
  activeTab: 'home' | 'scanner' | 'files' | 'none';
}

const BottomNav = ({ navigation, activeTab }: BottomNavProps) => {
  const { colors, isDark } = useTheme();

  const NavItem = ({ name, icon, label, target, isActive, params }: any) => {
    const isScanner = name === 'scanner';
    
    return (
      <TouchableOpacity 
        style={[styles.navItem, isScanner && styles.scannerNavItem]} 
        onPress={() => navigation.navigate(target, params)}
        activeOpacity={0.7}
      >
        <View style={[
          isScanner ? styles.scannerBg : styles.activeNavBg, 
          isActive ? { backgroundColor: isDark ? colors.primaryContainer : '#E0E7FF' } : (isScanner ? { backgroundColor: isDark ? colors.card : '#F8FAFC' } : null)
        ]}>
          <Icon 
            name={isActive ? icon : `${icon}-outline`} 
            size={isScanner ? 28 : 26} 
            color={isActive ? colors.primary : colors.textTertiary} 
          />
        </View>
        <Text style={[styles.navText, { color: isActive ? colors.primary : colors.textTertiary }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
      <View style={styles.navRow}>
        <NavItem 
          name="home" 
          icon="home" 
          label="HOME" 
          target="Home" 
          isActive={activeTab === 'home'} 
        />
        <NavItem 
          name="scanner" 
          icon="camera" 
          label="SCANNER" 
          target="ImageToPdf" 
          params={{ action: 'camera' }}
          isActive={activeTab === 'scanner'} 
        />
        <NavItem 
          name="files" 
          icon="folder" 
          label="FILES" 
          target="MyFiles" 
          isActive={activeTab === 'files'} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 90,
    borderTopWidth: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    paddingBottom: 10,
  },
  navRow: {
    flexDirection: 'row',
    height: 80,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  scannerNavItem: {
    flex: 1.2,
  },
  activeNavBg: {
    width: 60,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  scannerBg: {
    width: 70,
    height: 54,
    borderRadius: 27, // Oval/Pill shape
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  navText: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.5,
  },
});

export default BottomNav;
