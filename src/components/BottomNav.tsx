import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';

interface BottomNavProps {
  navigation: any;
  activeTab: 'home' | 'scanner' | 'files' | 'none';
}

const BottomNav = ({ navigation, activeTab }: BottomNavProps) => {
  const { colors, isDark } = useTheme();

  const NavItem = ({ name, icon, label, target, isActive, params }: any) => (
    <TouchableOpacity 
      style={styles.navItem} 
      onPress={() => navigation.navigate(target, params)}
      activeOpacity={0.7}
    >
      {isActive ? (
        <View style={[styles.activeNavBg, { backgroundColor: isDark ? colors.primaryContainer : '#E0E7FF' }]}>
          <Icon name={icon} size={26} color={colors.primary} />
        </View>
      ) : (
        <Icon name={`${icon}-outline`} size={26} color={colors.textTertiary} />
      )}
      <Text style={[styles.navText, { color: isActive ? colors.primary : colors.textTertiary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

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
    height: 80,
    borderTopWidth: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
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
  activeNavBg: {
    width: 60,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  navText: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.5,
  },
});

export default BottomNav;
