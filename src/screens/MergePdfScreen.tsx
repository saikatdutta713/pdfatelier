import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { displayNotification } from '../utils/notifications';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import BottomNav from '../components/BottomNav';
import DocumentPicker from 'react-native-document-picker';
import { PDFDocument } from 'pdf-lib';
import RNFS from 'react-native-fs';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import ProgressLoader from '../components/ProgressLoader';
import InfoModal from '../components/InfoModal';
import { InterstitialAd, AdEventType, TestIds, BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import Share from 'react-native-share';
import { formatFileSize } from '../utils/pdfHelper';
import { decode as atob } from 'base-64';

const { width } = Dimensions.get('window');

const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-1160568075790150/9036704803';
const bannerAdUnitId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-1160568075790150/7611090332';
const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
  requestNonPersonalizedAdsOnly: true,
});

const MergePdfScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const { notifications } = useSettings();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [queueFiles, setQueueFiles] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{ path: string; name: string; size: string } | null>(null);

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

  const selectFiles = async () => {
    try {
      const results = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf],
        allowMultiSelection: true,
      });

      const newFiles = results.map(res => ({
        id: Date.now().toString() + Math.random().toString(),
        uri: res.uri,
        name: res.name || 'document.pdf',
        size: formatFileSize(res.size || 0),
        bytes: res.size || 0,
        status: 'waiting'
      }));

      setFiles(prev => [...prev, ...newFiles]);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        console.error(err);
      }
    }
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      showAlert('Selection Incomplete', 'Please provide at least two PDF documents for compilation.', 'warning');
      return;
    }

    setLoading(true);
    setProgress(0);
    setQueueFiles(files);

    try {
      const mergedPdf = await PDFDocument.create();
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setQueueFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'processing' } : f));
        
        await new Promise(resolve => setTimeout(resolve, 800));

        const content = await RNFS.readFile(file.uri, 'base64');
        const uint8Array = new Uint8Array(
          atob(content)
            .split('')
            .map(c => c.charCodeAt(0))
        );
        
        const pdf = await PDFDocument.load(uint8Array);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));

        setProgress((i + 1) / files.length);
      }

      const mergedPdfBase64 = await mergedPdf.saveAsBase64();
      const fileName = `Merged_${Date.now()}.pdf`;
      const path = `${RNFS.DownloadDirectoryPath}/${fileName}`;

      await RNFS.writeFile(path, mergedPdfBase64, 'base64');
      const fileStat = await RNFS.stat(path);
      const size = formatFileSize(fileStat.size);

      setLoading(false);
      setSuccessData({ path, name: fileName, size });
      setShowSuccess(true);
      
      if (notifications) {
        displayNotification('PDF Merged Successfully', `Joined into ${fileName} (${size})`);
      }

      if (loaded) interstitial.show();
      setFiles([]);
    } catch (e: any) {
      console.error(e);
      setLoading(false);
      showAlert('Error', e.message || 'Failed to merge files.', 'error');
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

  const renderFileItem = useCallback(({ item, drag, isActive }: RenderItemParams<any>) => (
    <ScaleDecorator>
      <TouchableOpacity
        onLongPress={drag}
        activeOpacity={1}
        style={[
          styles.fileCard,
          { backgroundColor: isActive ? colors.primaryLight : colors.card }
        ]}
      >
        <TouchableOpacity onLongPress={drag} style={styles.dragHandle}>
          <Icon name="drag-vertical" size={24} color={colors.textTertiary} />
        </TouchableOpacity>

        <View style={[styles.fileIconContainer, { backgroundColor: colors.primaryLight }]}>
          <Icon name="file-pdf-box" size={30} color={colors.primary} />
          <Text style={[styles.pdfBadgeText, { color: colors.primary }]}>PDF</Text>
        </View>

        <View style={styles.fileInfo}>
          <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.fileMeta, { color: colors.textSecondary }]}>{item.size} • 12 Pages</Text>
        </View>

        <TouchableOpacity 
          style={styles.removeBtn} 
          onPress={() => setFiles(prev => prev.filter(f => f.id !== item.id))}
        >
          <Icon name="close" size={20} color="#f87171" style={{ opacity: 0.6 }} />
        </TouchableOpacity>
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
          title="Combining your files..."
          files={queueFiles}
          totalSize={formatFileSize(files.reduce((acc, curr) => acc + (curr.bytes || 0), 0))}
        />
        <InfoModal
          visible={modalVisible}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
          onClose={() => setModalVisible(false)}
          onConfirm={modalConfig.onConfirm}
        />        {showSuccess && successData ? (
          /* SUCCESS VIEW */
          <View style={{ flex: 1 }}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.headerIcon} onPress={() => setShowSuccess(false)}>
                <Icon name="arrow-left" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Merge Complete!</Text>
              <View style={{ width: 44 }} />
            </View>

            <View style={styles.successContent}>
              <View style={styles.successIconWrapper}>
                <View style={[styles.successBadge, { backgroundColor: colors.primary }]}>
                  <Icon name="check" size={50} color="#FFFFFF" />
                </View>
              </View>
              
              <Text style={[styles.successMainTitle, { color: colors.text }]}>PDF Merged{"\n"}Successfully</Text>
              <Text style={[styles.successSubTitle, { color: colors.textSecondary }]}>
                Your combined document is ready to be shared or saved.
              </Text>

              <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
                <View style={styles.resultIconBg}>
                  <Icon name="file-document-outline" size={32} color={colors.textTertiary} />
                </View>
                <View style={styles.resultInfo}>
                  <Text style={[styles.resultName, { color: colors.text }]} numberOfLines={1}>{successData.name}</Text>
                  <Text style={[styles.resultMeta, { color: colors.textSecondary }]}>{successData.size} • JUST NOW</Text>
                </View>
                <TouchableOpacity style={styles.moreOptions}>
                   <Icon name="dots-vertical" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.successActions}>
                <TouchableOpacity 
                  onPress={handleOpen}
                  style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
                >
                  <Icon name="open-in-new" size={22} color="#FFFFFF" />
                  <Text style={styles.primaryActionText}>Open</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.secondaryActionBtn, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]} onPress={handleShare}>
                  <Icon name="share-variant" size={22} color={isDark ? "#dae2fd" : colors.primary} />
                  <Text style={[styles.secondaryActionText, { color: isDark ? "#dae2fd" : colors.primary }]}>Share</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.footerLink} onPress={() => setShowSuccess(false)}>
                <View style={styles.footerLinkRow}>
                  <Icon name="arrow-left" size={20} color={colors.textSecondary} />
                  <Text style={[styles.footerLinkText, { color: colors.textSecondary }]}>Merge more files</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* MAIN VIEW */
          <View style={{ flex: 1 }}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.headerIcon} onPress={() => (navigation as any).openDrawer()}>
                <Icon name="menu" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Merge PDFs</Text>
              <TouchableOpacity style={[styles.userIconBg, { backgroundColor: isDark ? colors.card : '#F8FAFC' }]} onPress={() => navigation.navigate('Settings')}>
                <Icon name="cog" size={24} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }}>
              <DraggableFlatList
                data={files}
                onDragEnd={({ data }) => setFiles(data)}
                keyExtractor={(item) => item.id}
                renderItem={renderFileItem}
                ListHeaderComponent={
                  <View style={{ padding: 12 }}>
                    <View style={styles.heroSection}>
                      <Text style={[styles.heroBadge, { color: colors.primary }]}>MERGE TOOL</Text>
                      <Text style={[styles.heroTitle, { color: colors.text }]}>Merge PDFs</Text>
                      <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>Combine multiple PDF files into one single document.</Text>
                    </View>

                    <TouchableOpacity 
                      style={[styles.dropZone, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(26,31,44,0.3)' : '#F1F5F9' }]} 
                      onPress={selectFiles} 
                      activeOpacity={0.8}
                    >
                      <View style={[styles.dropZoneIconBg, { backgroundColor: colors.card }]}>
                        <Icon name="file-plus" size={32} color={colors.text} />
                      </View>
                      <Text style={[styles.dropZoneTitle, { color: colors.text }]}>Select PDFs</Text>
                      <Text style={[styles.dropZoneSub, { color: colors.textSecondary }]}>Choose files from your device</Text>
                    </TouchableOpacity>
                    
                    {files.length > 0 && (
                      <Text style={[styles.reorderHint, { color: colors.textTertiary }]}>Hold and drag to reorder files</Text>
                    )}
                  </View>
                }
                ListFooterComponent={
                  <View style={{ padding: 24, paddingBottom: 150 }}>
                    {files.length > 0 && (
                      <TouchableOpacity onPress={handleMerge} style={[styles.compileBtn, { backgroundColor: colors.primary }]}>
                          <Text style={styles.compileBtnText}>Merge Files ({files.length})</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                }
                contentContainerStyle={styles.listContainer}
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
              />
            </View>

            <BottomNav navigation={navigation} activeTab="none" />
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
  listContainer: {
    paddingBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  heroSection: {
    marginBottom: 32,
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
    marginBottom: 32,
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
    marginBottom: 8,
  },
  dropZoneSub: {
    fontSize: 14,
    fontWeight: '600',
  },
  dropZoneSub: {
    fontSize: 14,
    fontWeight: '600',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  storageBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  storageText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
  },
  dragHandle: {
    marginRight: 12,
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: 'rgba(37,99,235,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  pdfBadgeText: {
    position: 'absolute',
    bottom: 4,
    fontSize: 8,
    fontWeight: '900',
    color: '#2563eb',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  fileMeta: {
    fontSize: 12,
    fontWeight: '600',
  },
  removeBtn: {
    padding: 4,
  },
  footer: {
    padding: 24,
  },
  compileBtn: {
    height: 60,
    borderRadius: 12,
    flexDirection: 'row',
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
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  infoCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
    borderLeftWidth: 4,
  },
  infoIconWrapper: {
    marginRight: 16,
    paddingTop: 2,
  },
  infoTextWrapper: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});

export default MergePdfScreen;
