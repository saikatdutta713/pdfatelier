import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Alert,
  Platform,
  AppState,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import BottomNav from '../components/BottomNav';
import EmptyState from '../components/EmptyState';
import { BannerAd, BannerAdSize, TestIds, InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { formatFileSize } from '../utils/pdfHelper';
import { checkStoragePermission, requestStoragePermission } from '../utils/permissions';

const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-1160568075790150/9036704803';
const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
  requestNonPersonalizedAdsOnly: true,
});

const bannerAdUnitId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-1160568075790150/3063915712';

const MyFilesScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const [files, setFiles] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      setAdLoaded(true);
    });
    interstitial.load();
    return () => unsubscribe();
  }, []);

  const loadFiles = useCallback(async () => {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) return;

    try {
      const downloadPath = RNFS.DocumentDirectoryPath;
      const result = await RNFS.readDir(downloadPath);
      const pdfFiles = result
        .filter(file => file.name.toLowerCase().endsWith('.pdf'))
        .map(file => ({
          id: file.path,
          name: file.name,
          path: file.path,
          size: formatFileSize(file.size),
          date: new Date(file.mtime || Date.now()).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          }),
          bytes: file.size,
        }))
        .sort((a, b) => b.bytes - a.bytes);

      setFiles(pdfFiles);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadFiles();
    });

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        loadFiles();
      }
    });

    return () => {
      unsubscribe();
      subscription.remove();
    };
  }, [navigation, loadFiles]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFiles();
    setRefreshing(false);
  };

  const handleShare = async (path: string, name: string) => {
    try {
      const shareOptions = {
        title: 'Share PDF',
        url: `file://${path}`,
        type: 'application/pdf',
        filename: name,
      };
      await Share.open(shareOptions);
    } catch (error) {
      if (error && (error as any).message !== 'User did not share') {
        console.error('Sharing error:', error);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar 
          barStyle={isDark ? "light-content" : "dark-content"} 
          backgroundColor={colors.background} 
        />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => (navigation as any).openDrawer()}>
            <Icon name="menu" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Saved PDFs</Text>
          <TouchableOpacity style={[styles.userIconBg, { backgroundColor: isDark ? colors.card : '#F8FAFC' }]} onPress={() => navigation.navigate('Settings')}>
            <Icon name="cog" size={24} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={files}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={{ paddingBottom: 110 }}
          renderItem={({ item, index }) => (
            <TouchableOpacity 
              style={[styles.fileCard, { backgroundColor: colors.card }]}
              onPress={() => {
                if (adLoaded) {
                  interstitial.show();
                  setAdLoaded(false);
                  interstitial.load();
                }
                navigation.navigate('PdfViewer', { path: item.path, fileName: item.name });
              }}
              activeOpacity={0.7}
            >
              <View style={[
                styles.fileIconBg, 
                { backgroundColor: isDark 
                  ? (index % 2 === 0 ? 'rgba(225,29,72,0.15)' : 'rgba(37,99,235,0.15)') 
                  : (index % 2 === 0 ? '#FFE4E4' : '#E0EBFF') 
                }
              ]}>
                <Icon 
                  name="file-pdf-box" 
                  size={30} 
                  color={index % 2 === 0 ? (isDark ? '#FB7185' : '#E11D48') : (isDark ? '#60A5FA' : '#2563EB')} 
                />
              </View>
              <View style={styles.fileInfo}>
                <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                <View style={styles.metaRow}>
                   <View style={[styles.sizeBadge, { backgroundColor: isDark ? 'rgba(148,163,184,0.1)' : '#F1F5F9' }]}>
                      <Text style={[styles.sizeBadgeText, { color: isDark ? colors.textTertiary : colors.textSecondary }]}>{item.size}</Text>
                   </View>
                   <Text style={[styles.fileDate, { color: colors.textTertiary }]}>{item.date}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleShare(item.path, item.name)} style={styles.moreIcon}>
                <Icon name="share-variant-outline" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListHeaderComponent={
            <View style={styles.content}>
              <Text style={[styles.title, { color: colors.text }]}>My PDFs</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Manage and organize your generated documents
              </Text>

              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.filterBtn, { backgroundColor: isDark ? colors.card : '#F5F8FF' }]}>
                  <Icon name="filter-variant" size={20} color={colors.primary} />
                  <Text style={[styles.filterText, { color: colors.primary }]}>Filter</Text>
                </TouchableOpacity>
              </View>

              {files.length === 0 && (refreshing === false) && (
                <View style={{ marginTop: 40 }}>
                  <EmptyState 
                    title="No Documents Found" 
                    message="Import assets or initiate a new conversion to populate your curation gallery."
                  />
                </View>
              )}
            </View>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />

        {/* FAB */}
        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('ImageToPdf')}
        >
          <Icon name="file-plus-outline" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Banner Ad Area */}
        <View style={styles.bannerContainer}>
          <BannerAd
            unitId={bannerAdUnitId}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
            onAdFailedToLoad={(error) => console.error('Ad failed to load:', error)}
          />
        </View>

        {/* Bottom Nav */}
        <BottomNav navigation={navigation} activeTab="files" />
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
  headerIcon: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  userIconBg: {
    padding: 6,
    borderRadius: 12,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: 24,
  },
  actionRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  filterText: {
    fontWeight: '700',
    fontSize: 15,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  fileIconBg: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sizeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sizeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  fileDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  moreIcon: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bannerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 60,
    marginBottom: 90, // Space for BottomNav
    backgroundColor: 'transparent',
  },
  bottomNavContainer: {
    height: 90,
    justifyContent: 'center',
  },
  bottomNav: {
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
    width: 70,
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
  },
});

export default MyFilesScreen;
