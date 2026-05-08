import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, ScrollView, Image, Linking } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Share from 'react-native-share';
import { useTheme } from '../context/ThemeContext';

const Sidebar: React.FC<DrawerContentComponentProps> = (props) => {
  const { colors, isDark } = useTheme();
  const menuItems = [
    { name: 'Home', icon: 'home-outline', label: 'Home', screen: 'Home' },
    { name: 'ImageToPdf', icon: 'image-outline', label: 'Images to PDF', screen: 'ImageToPdf' },
    { name: 'MergePdf', icon: 'arrow-up-bold-outline', label: 'Merge PDFs', screen: 'MergePdf' },
    { name: 'MyFiles', icon: 'folder-outline', label: 'Saved PDFs', screen: 'MyFiles' },
    { name: 'Settings', icon: 'cog-outline', label: 'Settings', screen: 'Settings' },
    { name: 'Premium', icon: 'crown-outline', label: 'Remove Ads', screen: 'Premium' },
    { name: 'ShareApp', icon: 'share-variant-outline', label: 'Share with Friends', screen: 'action_share' },
    { name: 'RateUs', icon: 'star-outline', label: 'Rate our App', screen: 'action_rate' },
  ];

  const handleAction = async (action: string) => {
    switch (action) {
      case 'action_share':
        try {
          await Share.open({
            title: 'Share PDF Laboratory',
            message: 'Check out this amazing PDF tool!',
            url: Platform.OS === 'android' ? 'https://play.google.com/store/apps/details?id=com.imsaikat.imagetopdf' : 'https://apps.apple.com/app/id123456789',
          });
        } catch (err) {
          console.log(err);
        }
        break;
      case 'action_rate':
        const url = Platform.OS === 'android' 
          ? 'market://details?id=com.imsaikat.imagetopdf' 
          : 'itms-apps://itunes.apple.com/app/id123456789?action=write-review';
        Linking.openURL(url).catch(() => {
          Linking.openURL('https://play.google.com/store/apps/details?id=com.imsaikat.imagetopdf');
        });
        break;
      case 'action_help':
        Linking.openURL('mailto:support@pdflab.com?subject=Support Request');
        break;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: isDark ? colors.card : '#F9FAFB', borderBottomColor: colors.border }]}>
        <View style={styles.branding}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/logo.png')} 
              style={styles.logoImage}
            />
          </View>
          <View>
            <Text style={[styles.appName, { color: colors.text }]}>PDF Laboratory</Text>
            <Text style={[styles.appVersion, { color: colors.textTertiary }]}>Version 1.0.0</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>MAIN TOOLS</Text>
          {menuItems.slice(0, 4).map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={[
                styles.menuItem,
                props.state.routes[props.state.index].state?.routes[props.state.routes[props.state.index].state?.index || 0].name === item.screen && { backgroundColor: isDark ? 'rgba(37,99,235,0.15)' : '#F0F7FF' }
              ]}
              onPress={() => item.screen && props.navigation.navigate('Main', { screen: item.screen })}
            >
              <View style={styles.iconContainer}>
                <Icon 
                  name={item.icon} 
                  size={22} 
                  color={props.state.routes[props.state.index].state?.routes[props.state.routes[props.state.index].state?.index || 0].name === item.screen ? colors.primary : colors.textTertiary} 
                />
              </View>
              <Text style={[
                styles.menuLabel,
                { color: props.state.routes[props.state.index].state?.routes[props.state.routes[props.state.index].state?.index || 0].name === item.screen ? colors.primary : colors.textSecondary }
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>PREFERENCES</Text>
          {menuItems.slice(4).map((item, index) => (
            <TouchableOpacity 
              key={index + 4} 
              style={styles.menuItem}
              onPress={() => {
                if (item.screen?.startsWith('action_')) {
                  handleAction(item.screen);
                } else if (item.screen) {
                  props.navigation.navigate('Main', { screen: item.screen });
                }
              }}
            >
              <Icon name={item.icon} size={22} color={colors.textTertiary} />
              <Text style={[styles.menuLabel, { color: colors.textSecondary }]}>{item.label}</Text>
              {item.name === 'Premium' && (
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumText}>HOT</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <TouchableOpacity style={styles.helpButton} onPress={() => handleAction('action_help')}>
            <Icon name="help-circle-outline" size={20} color={colors.textTertiary} />
            <Text style={[styles.helpText, { color: colors.textTertiary }]}>Help & Support</Text>
          </TouchableOpacity>
          <Text style={[styles.copyright, { color: colors.textTertiary }]}>© 2026 PDF Laboratory</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 24,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  branding: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 48,
    height: 48,
    marginRight: 16,
  },
  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 14,
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  appVersion: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  menuContainer: {
    flex: 1,
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 4,
  },
  activeMenuItem: {
    backgroundColor: '#F0F7FF',
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 16,
    flex: 1,
  },
  activeMenuLabel: {
    color: '#0055FF',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0055FF',
  },
  premiumBadge: {
    backgroundColor: '#FF4D4D',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  premiumText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginLeft: 8,
  },
  copyright: {
    fontSize: 12,
    fontWeight: '500',
    color: '#CBD5E1',
  }
});

export default Sidebar;
