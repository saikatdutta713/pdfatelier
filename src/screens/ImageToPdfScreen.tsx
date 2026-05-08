import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  StatusBar,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { displayNotification } from '../utils/notifications';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'react-native-image-picker';
import { convertImagesToPdf, formatFileSize } from '../utils/pdfHelper';
import { requestMediaPermission, requestStoragePermission } from '../utils/permissions';
import ProgressLoader from '../components/ProgressLoader';
import InfoModal from '../components/InfoModal';
import { InterstitialAd, AdEventType, TestIds, BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import BottomNav from '../components/BottomNav';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInUp, FadeInDown, SpringUtils } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-1160568075790150/9036704803';
const bannerAdUnitId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-1160568075790150/3063915712';
const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
  requestNonPersonalizedAdsOnly: true,
});

const ImageToPdfScreen = ({ navigation, route }: any) => {
  const { colors, isDark } = useTheme();
  const { notifications, highQuality, smartCompression } = useSettings();
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [queueFiles, setQueueFiles] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{ path: string; name: string; size: string } | null>(null);
  const [quality, setQuality] = useState(0.7); // Default standard quality
  
  useEffect(() => {
    // If route params specify quality, it takes top priority (from Home shortcuts)
    if (route.params?.quality) {
      setQuality(route.params.quality);
    } 
    // Otherwise, check global settings
    else if (highQuality) {
      setQuality(1.0);
    } else if (smartCompression) {
      setQuality(0.7);
    }

    // Handle scanner action from bottom nav
    if (route.params?.action === 'camera') {
      setTimeout(() => {
        takePhoto();
        // Clear params to avoid reopening on re-renders
        navigation.setParams({ action: undefined });
      }, 500);
    }
  }, [route.params?.quality, route.params?.action, highQuality, smartCompression]);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    type: 'success' | 'info' | 'error' | 'warning';
    onConfirm?: () => void;
  }>({
    title: '',
    message: '',
    type: 'info',
  });

  useEffect(() => {
    const unsubscribe = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      setLoaded(true);
    });
    interstitial.load();
    return () => unsubscribe();
  }, []);

  const showAlert = useCallback((title: string, message: string, type: any = 'info', onConfirm?: () => void) => {
    setModalConfig({ title, message, type, onConfirm });
    setModalVisible(true);
  }, []);

  const selectImages = async () => {
    const hasPermission = await requestMediaPermission();
    if (!hasPermission) return;

    ImagePicker.launchImageLibrary(
      { mediaType: 'photo', selectionLimit: 0, quality: 0.8 },
      (response) => {
        if (response.assets) {
          const newAssets = response.assets.map(asset => ({
            id: Date.now().toString() + Math.random().toString(),
            uri: asset.uri,
            name: asset.fileName || `IMG_${Date.now()}.jpg`,
            size: formatFileSize(asset.fileSize || 0),
            bytes: asset.fileSize || 0,
            status: 'waiting'
          }));
          setImages(prev => [...prev, ...newAssets]);
        }
      }
    );
  };

  const takePhoto = async () => {
    const hasPermission = await requestMediaPermission();
    if (!hasPermission) return;

    ImagePicker.launchCamera(
      { mediaType: 'photo', quality: 0.8, saveToPhotos: true },
      (response) => {
        if (response.assets) {
          const newAssets = response.assets.map(asset => ({
            id: Date.now().toString() + Math.random().toString(),
            uri: asset.uri,
            name: asset.fileName || `SCAN_${Date.now()}.jpg`,
            size: formatFileSize(asset.fileSize || 0),
            bytes: asset.fileSize || 0,
            status: 'waiting'
          }));
          setImages(prev => [...prev, ...newAssets]);
        }
      }
    );
  };

  const handleConvert = async () => {
    if (images.length === 0) {
      showAlert('No Selection', 'Please curate at least one visual asset.', 'warning');
      return;
    }
    setLoading(true);
    setProgress(0);
    setQueueFiles(images);

    try {
      for (let i = 0; i < images.length; i++) {
        setQueueFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'processing' } : f));
        await new Promise(resolve => setTimeout(resolve, 600)); 
        setProgress((i + 1) / images.length);
      }

      const path = await convertImagesToPdf(images.map(img => img.uri), quality);
      const fileStat = await RNFS.stat(path);
      const name = path.split('/').pop() || 'document.pdf';
      const size = formatFileSize(fileStat.size);
      
      setLoading(false);
      setSuccessData({ path, name, size });
      setShowSuccess(true);
      
      if (notifications) {
        displayNotification('PDF Created', `Successfully compiled ${name} (${size})`);
      }

      if (loaded) interstitial.show();
      setImages([]);
    } catch (e: any) {
      console.error(e);
      setLoading(false);
      showAlert('Error', e.message || 'The document compilation failed.', 'error');
    }
  };

  const handleShare = async () => {
    if (!successData) return;
    try {
      const shareOptions = {
        title: 'Share PDF',
        url: `file://${successData.path}`,
        type: 'application/pdf',
        filename: successData.name,
      };
      await Share.open(shareOptions);
    } catch (error) {
      if (error && (error as any).message !== 'User did not share') {
        console.error('Sharing error:', error);
      }
    }
  };

  const handleOpen = () => {
    if (!successData) return;
    navigation.navigate('PdfViewer', { path: successData.path, fileName: successData.name });
  };

  const resetConversion = () => {
    setShowSuccess(false);
    setSuccessData(null);
    setImages([]);
  };

  const renderImageItem = useCallback(({ item, drag, isActive }: RenderItemParams<any>) => (
    <ScaleDecorator>
      <TouchableOpacity
        onLongPress={drag}
        activeOpacity={1}
        style={[
          styles.imageCard,
          { backgroundColor: isActive ? colors.primaryLight : colors.card }
        ]}
      >
        <Image source={{ uri: item.uri }} style={styles.imageThumb} />
        <View style={styles.imageInfo}>
          <View style={styles.imageTextContainer}>
            <Text style={[styles.imageName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.imageSize, { color: colors.textSecondary }]}>{item.size}</Text>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.actionIcon} onPress={() => {
              setImages(prev => prev.filter(img => img.id !== item.id));
            }}>
              <Icon name="trash-can-outline" size={20} color={colors.error} style={{ opacity: 0.8 }} />
            </TouchableOpacity>
            <TouchableOpacity onLongPress={drag} style={styles.actionIcon}>
              <Icon name="drag-vertical" size={24} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </ScaleDecorator>
  ), [colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar 
          barStyle={isDark ? "light-content" : "dark-content"} 
          backgroundColor={colors.background} 
        />
        
        <ProgressLoader 
          visible={loading} 
          progress={progress}
          title="Compiling your document..."
          files={queueFiles}
          totalSize={formatFileSize(images.reduce((acc, curr) => acc + (curr.bytes || 0), 0))}
        />
        <InfoModal
          visible={modalVisible}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
          onClose={() => setModalVisible(false)}
          onConfirm={modalConfig.onConfirm}
        />

        {showSuccess && successData ? (
          /* SUCCESS VIEW */
          <View style={{ flex: 1 }}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.headerIcon} onPress={resetConversion}>
                <Icon name="arrow-left" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: colors.text }]}>PDF Ready!</Text>
              <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.successContent} showsVerticalScrollIndicator={false}>
              <Animated.View 
                entering={FadeInUp.delay(200).duration(800)}
                style={styles.successIllustration}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primary + '99']}
                  style={styles.gradientCircle}
                >
                  <Icon name="file-check" size={60} color="#FFFFFF" />
                </LinearGradient>
                <View style={[styles.confettiContainer, { opacity: 0.6 }]}>
                  {[...Array(6)].map((_, i) => (
                    <View 
                      key={i} 
                      style={[
                        styles.confetti, 
                        { 
                          backgroundColor: i % 2 === 0 ? colors.primary : colors.secondary,
                          transform: [{ rotate: `${i * 60}deg` }, { translateY: -70 }]
                        }
                      ]} 
                    />
                  ))}
                </View>
              </Animated.View>
              
              <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.textCenter}>
                <Text style={[styles.successMainTitle, { color: colors.text }]}>Great Job!</Text>
                <Text style={[styles.successSubTitle, { color: colors.textSecondary }]}>
                  Your high-quality PDF has been generated and is ready for use.
                </Text>
              </Animated.View>

              <Animated.View 
                entering={FadeInDown.delay(600).duration(800)}
                style={[styles.premiumResultCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.fileIconWrapper, { backgroundColor: colors.primary + '15' }]}>
                  <Icon name="pdf-box" size={40} color={colors.primary} />
                </View>
                <View style={styles.fileDetails}>
                  <Text style={[styles.fileNameText, { color: colors.text }]} numberOfLines={1}>{successData.name}</Text>
                  <View style={styles.fileMetaRow}>
                    <Text style={[styles.fileMetaText, { color: colors.textSecondary }]}>{successData.size}</Text>
                    <View style={[styles.dot, { backgroundColor: colors.textTertiary }]} />
                    <Text style={[styles.fileMetaText, { color: colors.textSecondary }]}>PDF Document</Text>
                  </View>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(800).duration(800)} style={styles.successActionsContainer}>
                <TouchableOpacity 
                  onPress={handleOpen}
                  activeOpacity={0.8}
                  style={styles.mainActionWrapper}
                >
                  <LinearGradient
                    colors={[colors.primary, '#4F46E5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.slickPrimaryBtn}
                  >
                    <Icon name="eye-outline" size={22} color="#FFFFFF" />
                    <Text style={styles.primaryActionText}>View Document</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.secondaryActionsRow}>
                  <TouchableOpacity 
                    style={[styles.slickSecondaryBtn, { backgroundColor: colors.card, borderColor: colors.border }]} 
                    onPress={handleShare}
                    activeOpacity={0.7}
                  >
                    <Icon name="share-variant-outline" size={20} color={colors.text} />
                    <Text style={[styles.secondaryActionText, { color: colors.text }]}>Share</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.slickSecondaryBtn, { backgroundColor: colors.card, borderColor: colors.border }]} 
                    onPress={resetConversion}
                    activeOpacity={0.7}
                  >
                    <Icon name="plus-circle-outline" size={20} color={colors.text} />
                    <Text style={[styles.secondaryActionText, { color: colors.text }]}>Create New</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(1000).duration(800)} style={styles.footerInfo}>
                <Icon name="shield-check-outline" size={16} color={colors.success || '#10B981'} />
                <Text style={[styles.footerInfoText, { color: colors.textSecondary }]}>Saved securely in your local storage</Text>
              </Animated.View>
            </ScrollView>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {/* MAIN VIEW */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.headerIcon} onPress={() => (navigation as any).openDrawer()}>
                <Icon name="menu" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Images to PDF</Text>
              <TouchableOpacity style={[styles.userIconBg, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('Settings')}>
                <Icon name="cog" size={24} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }}>
              <DraggableFlatList
                data={images}
                onDragEnd={({ data }) => setImages(data)}
                keyExtractor={(item) => item.id}
                renderItem={renderImageItem}
                ListHeaderComponent={
                  <View style={{ padding: 12 }}>
                    <View style={styles.heroSection}>
                      <Text style={[styles.heroBadge, { color: colors.primary }]}>WORKSPACE</Text>
                      <Text style={[styles.heroTitle, { color: colors.text }]}>Create PDF</Text>
                      <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>Select and arrange photos to create your professional document.</Text>
                    </View>

                    <TouchableOpacity 
                      style={[styles.dropZone, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(26,31,44,0.3)' : '#F1F5F9' }]} 
                      onPress={selectImages} 
                      activeOpacity={0.8}
                    >
                      <View style={[styles.dropZoneIconBg, { backgroundColor: colors.card }]}>
                        <Icon name="plus" size={32} color={colors.text} />
                      </View>
                      <Text style={[styles.dropZoneTitle, { color: colors.text }]}>Add Photos</Text>
                      <Text style={[styles.dropZoneSub, { color: colors.textSecondary }]}>Select one or more images</Text>
                    </TouchableOpacity>
                    
                    {images.length > 0 && (
                      <Text style={[styles.reorderHint, { color: colors.textTertiary }]}>Hold and drag to reorder</Text>
                    )}
                  </View>
                }
                ListFooterComponent={
                  <View style={{ padding: 24, paddingBottom: 150 }}>
                    {images.length > 0 && (
                      <View style={styles.qualitySection}>
                        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 16 }]}>PDF Quality</Text>
                        <View style={styles.qualityCards}>
                          {[
                            { label: 'Small File', val: 0.45, icon: 'leaf', desc: 'Best for sharing via chat or email' },
                            { label: 'Standard', val: 0.7, icon: 'check-circle-outline', desc: 'Clear text and photos' },
                            { label: 'Best', val: 1.0, icon: 'crown-outline', desc: 'Original high quality' }
                          ].map((q) => (
                            <TouchableOpacity
                              key={q.label}
                              style={[
                                styles.qualityCard,
                                { backgroundColor: colors.card, borderColor: colors.border },
                                quality === q.val && { borderColor: colors.primary, backgroundColor: isDark ? 'rgba(37,99,235,0.05)' : '#F0F7FF' }
                              ]}
                              onPress={() => setQuality(q.val)}
                            >
                              <View style={[styles.qualityIconBg, { backgroundColor: quality === q.val ? colors.primary : colors.primaryLight }]}>
                                 <Icon name={q.icon} size={20} color={quality === q.val ? '#FFFFFF' : colors.primary} />
                              </View>
                              <View style={styles.qualityTextInfo}>
                                <Text style={[styles.qualityCardTitle, { color: colors.text }]}>{q.label}</Text>
                                <Text style={[styles.qualityCardDesc, { color: colors.textSecondary }]}>{q.desc}</Text>
                              </View>
                              <View style={[styles.radioOuter, { borderColor: colors.border }]}>
                                 {quality === q.val && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                              </View>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    {images.length > 0 && (
                      <TouchableOpacity onPress={handleConvert} style={[styles.compileBtn, { backgroundColor: colors.primary }]}>
                          <Text style={styles.compileBtnText}>Save as PDF ({images.length})</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                }
              />
            </View>

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

            <BottomNav navigation={navigation} activeTab="scanner" />
          </View>
        )}
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
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerIcon: {
    padding: 8,
  },
  novaText: {
    color: '#dae2fd',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 2,
  },
  userIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A1F2C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  heroSection: {
    marginBottom: 32,
  },
  heroBadge: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.9,
  },
  dropZone: {
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#2d3449',
    backgroundColor: 'rgba(26,31,44,0.3)',
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  dropZoneIconBg: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#1A1F2C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dropZoneTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  dropZoneSub: {
    fontSize: 14,
    fontWeight: '600',
  },
  reorderHint: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 20,
  },
  listContainer: {
    paddingBottom: 20,
  },
  imageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: 16,
    padding: 12,
  },
  imageThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 16,
  },
  imageInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageTextContainer: {
    flex: 1,
  },
  imageName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  imageSize: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    padding: 8,
    marginLeft: 4,
  },
  compileBtn: {
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compileBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  // Success View Styles
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  successIconWrapper: {
    backgroundColor: 'rgba(26,31,44,0.5)',
    padding: 30,
    borderRadius: 30,
    marginBottom: 40,
  },
  successBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successMainTitle: {
    fontSize: 40,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 48,
    letterSpacing: -1,
    marginBottom: 16,
  },
  successSubTitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  resultIconBg: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  resultMeta: {
    fontSize: 12,
    fontWeight: '600',
  },
  moreOptions: {
    padding: 8,
  },
  successActions: {
    width: '100%',
    gap: 12,
  },
  primaryActionBtn: {
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 10,
  },
  secondaryActionBtn: {
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 10,
  },
  footerLink: {
    marginTop: 32,
    padding: 10,
  },
  footerLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerLinkText: {
    fontSize: 15,
    fontWeight: '700',
  },
  // Slick Success View Styles
  successIllustration: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
    position: 'relative',
  },
  gradientCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  confettiContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 12,
    borderRadius: 2,
  },
  textCenter: {
    alignItems: 'center',
    marginBottom: 32,
  },
  premiumResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 40,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fileIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  fileDetails: {
    flex: 1,
  },
  fileNameText: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  fileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileMetaText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 8,
  },
  successActionsContainer: {
    width: '100%',
    gap: 16,
  },
  mainActionWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  slickPrimaryBtn: {
    height: 64,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  slickSecondaryBtn: {
    flex: 1,
    height: 60,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    paddingBottom: 40,
    gap: 8,
  },
  footerInfoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomNavContainer: {
    height: 100,
    justifyContent: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    height: 80,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    borderTopWidth: 1,
    borderColor: '#1A1F2C',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  activeNavBg: {
    width: 60,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1A1F2C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  navText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bannerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 60,
    marginBottom: 90, // Space for BottomNav
    backgroundColor: 'transparent',
  },
  qualitySection: {
    marginBottom: 32,
  },
  qualityCards: {
    gap: 12,
  },
  qualityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  qualityIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  qualityTextInfo: {
    flex: 1,
  },
  qualityCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  qualityCardDesc: {
    fontSize: 12,
    fontWeight: '500',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export default ImageToPdfScreen;
