import React from 'react';
import {
  StyleSheet,
  Dimensions,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Pdf from 'react-native-pdf';
import { useTheme } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Share from 'react-native-share';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { checkStoragePermission, requestStoragePermission } from '../utils/permissions';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

const bannerAdUnitId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-1160568075790150/7611090332';

const PdfViewerScreen = ({ route, navigation }: any) => {
  const { colors, isDark } = useTheme();
  const { path, fileName } = route.params;
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      // Use check first, then request if needed
      const currentStatus = await checkStoragePermission();
      if (currentStatus) {
        setHasPermission(true);
      } else {
        const granted = await requestStoragePermission();
        setHasPermission(granted);
      }
    };
    
    checkPermission();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        checkPermission();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (hasPermission === false) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Icon name="shield-alert-outline" size={64} color={colors.error} />
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 16 }}>Permission Denied</Text>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginHorizontal: 40, marginTop: 8 }}>
          Storage access is required to view this PDF. Please enable it in settings.
        </Text>
        <TouchableOpacity 
          style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 24 }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  const source = { uri: `file://${path}`, cache: true };

  const handleShare = async () => {
    try {
      const shareOptions = {
        title: 'Share PDF',
        message: 'Shared from PDF Maker',
        url: `file://${path}`,
        type: 'application/pdf',
        filename: fileName,
      };
      await Share.open(shareOptions);
    } catch (error) {
      if (error && (error as any).message !== 'User did not share') {
        console.error('Sharing error:', error);
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerBrand, { color: colors.text }]}>{fileName || 'Document View'}</Text>
        <TouchableOpacity style={styles.headerIcon} onPress={handleShare}>
          <Icon name="share-variant-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.pdfContainer, { backgroundColor: colors.background }]}>
        <Pdf
          source={source}
          onLoadComplete={(numberOfPages, filePath) => {
            console.log(`Number of pages: ${numberOfPages}`);
          }}
          onPageChanged={(page, numberOfPages) => {
            console.log(`Current page: ${page}`);
          }}
          onError={(error) => {
            console.log(error);
          }}
          style={[styles.pdf, { backgroundColor: isDark ? colors.background : '#525659' }]}
        />
      </View>

      <View style={styles.bannerContainer}>
        <BannerAd
          unitId={bannerAdUnitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerIcon: {
    padding: 5,
  },
  headerBrand: {
    flex: 1,
    marginHorizontal: 16,
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: '#525659',
  },
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    backgroundColor: '#525659',
  },
  bannerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
});

export default PdfViewerScreen;
