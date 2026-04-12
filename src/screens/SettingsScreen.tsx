import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Switch, StatusBar, Alert, Linking, ToastAndroid, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import InfoModal from '../components/InfoModal';
import RNFS from 'react-native-fs';
import BottomNav from '../components/BottomNav';

const bannerAdUnitId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-1160568075790150/7611090332';

const SettingsScreen = ({ navigation }: any) => {
  const { theme, toggleTheme, colors, isDark } = useTheme();
  const { notifications, setNotifications, smartCompression, setSmartCompression, highQuality, setHighQuality } = useSettings();
  const [modalVisible, setModalVisible] = useState(false);

  const executeClearCache = async () => {
    setModalVisible(false);
    try {
      // Clear cache directory
      const cacheFiles = await RNFS.readDir(RNFS.CachesDirectoryPath);
      for (const file of cacheFiles) {
        if (file.isFile()) {
          await RNFS.unlink(file.path);
        } else {
          // Recursive delete for subdirectories in cache
          await RNFS.unlink(file.path).catch(() => {});
        }
      }

      // Also check temporary directory
      if (Platform.OS === 'ios') {
        const tempFiles = await RNFS.readDir(RNFS.TemporaryDirectoryPath);
        for (const file of tempFiles) {
          await RNFS.unlink(file.path).catch(() => {});
        }
      }

      if (Platform.OS === 'android') {
        ToastAndroid.show('All temporary files removed', ToastAndroid.SHORT);
      } else {
        Alert.alert('Success', 'Storage space reclaimed.');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      Alert.alert('Notice', 'Some files could not be cleared as they are currently in use.');
    }
  };

  const handleClearCache = () => {
    setModalVisible(true);
  };

  const openURL = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'The secure link could not be negotiated.');
    });
  };

  const SettingItem = ({ icon, title, subtitle, value, onValueChange, onPress, type = 'toggle' }: any) => (
    <TouchableOpacity 
      style={[styles.settingItem, { borderBottomColor: colors.border + '30' }]}
      onPress={onPress}
      disabled={type === 'toggle'}
    >
      <View style={[styles.iconContainer, { backgroundColor: isDark ? colors.background : colors.primary + '10' }]}>
        <Icon name={icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.settingText}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSub, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      {type === 'toggle' ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: isDark ? '#334155' : '#CBD5E1', true: colors.primary + '60' }}
          thumbColor={value ? colors.primary : '#94A3B8'}
        />
      ) : (
        <Icon name="chevron-right" size={20} color={colors.textTertiary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        
        <InfoModal
          visible={modalVisible}
          title="Clear Cache"
          message="This will remove temporary images and cached files. Your saved PDFs will not be affected."
          type="warning"
          onClose={() => setModalVisible(false)}
          onConfirm={executeClearCache}
          confirmText="Clear Now"
          cancelText="Keep"
        />

        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Configuration</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroSection}>
            <Text style={[styles.badge, { color: colors.textTertiary }]}>ATELIER PREFERENCES</Text>
            <Text style={[styles.mainTitle, { color: colors.text }]}>Settings</Text>
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionHeader, { color: colors.primary }]}>APPEARANCE</Text>
            <SettingItem 
              icon="weather-night" 
              title="Dark Mode" 
              subtitle="Easier on the eyes in the dark" 
              value={isDark} 
              onValueChange={toggleTheme} 
            />
            <SettingItem 
              icon="bell-ring-outline" 
              title="Notifications" 
              subtitle="Get alerts when PDFs are ready" 
              value={notifications} 
              onValueChange={setNotifications} 
            />
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionHeader, { color: colors.primary }]}>PDF SETTINGS</Text>
            <SettingItem 
              icon="high-definition" 
              title="High Quality" 
              subtitle="Always save in best resolution" 
              value={highQuality}
              onValueChange={setHighQuality}
            />
            <SettingItem 
              icon="shimmer" 
              title="Smart Compression" 
              subtitle="Automatically reduce file size" 
              value={smartCompression} 
              onValueChange={setSmartCompression} 
            />
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionHeader, { color: colors.primary }]}>ABOUT</Text>
            <SettingItem 
              icon="information-variant" 
              title="App Version" 
              subtitle="1.0.0" 
              type="chevron" 
              onPress={() => Platform.OS === 'android' ? ToastAndroid.show('Version 1.0.0', ToastAndroid.SHORT) : Alert.alert('Version', '1.0.0')}
            />
            <SettingItem 
              icon="security" 
              title="Privacy Policy" 
              type="chevron" 
              onPress={() => openURL('https://pdfatelier.com/privacy')}
            />
            <SettingItem 
              icon="file-document-edit-outline" 
              title="Terms of Service" 
              type="chevron" 
              onPress={() => openURL('https://pdfatelier.com/terms')}
            />
          </View>

          <TouchableOpacity style={[styles.purgeBtn, { backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2' }]} onPress={handleClearCache}>
            <Icon name="trash-can-outline" size={20} color={colors.error} />
            <Text style={[styles.purgeText, { color: colors.error }]}>Clear Temporary Files</Text>
          </TouchableOpacity>

          <Text style={[styles.copyright, { color: colors.textTertiary }]}>
            © 2026 PDF Laboratory. Fast & Private.
          </Text>
        </ScrollView>

        {/* Banner Ad Area */}
        <View style={styles.bannerContainer}>
          <BannerAd
            unitId={bannerAdUnitId}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
          />
        </View>

        <BottomNav navigation={navigation} activeTab="settings" />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -1,
  },
  content: {
    padding: 24,
  },
  heroSection: {
    marginBottom: 32,
  },
  badge: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  section: {
    marginBottom: 24,
    borderRadius: 24,
    padding: 12,
    borderWidth: 1,
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
      }
    }),
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 16,
    marginTop: 8,
    marginLeft: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  settingSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    opacity: 0.8,
  },
  purgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 20,
    marginTop: 16,
    marginBottom: 32,
  },
  purgeText: {
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 10,
  },
  copyright: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  bannerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
});

export default SettingsScreen;
