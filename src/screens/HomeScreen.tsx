import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import PdfCard from '../components/PdfCard';
import { useTheme } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import BottomNav from '../components/BottomNav';

const bannerAdUnitId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-1160568075790150/3063915712';

const HomeScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => (navigation as any).openDrawer()}>
            <Icon name="menu" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>PDF Laboratory</Text>
          <TouchableOpacity style={[styles.userIconBg, { backgroundColor: isDark ? colors.card : '#F8FAFC' }]} onPress={() => navigation.navigate('Settings')}>
            <Icon name="cog" size={24} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Promotional Card */}
          <View style={[
            styles.promoCard, 
            { 
              backgroundColor: isDark ? colors.card : colors.primary,
              borderColor: isDark ? colors.border : 'transparent',
              borderWidth: isDark ? 1 : 0
            }
          ]}>
            <View style={styles.promoContent}>
              <Text style={[styles.promoTitle, { color: isDark ? colors.text : '#FFFFFF' }]}>Create Perfect{"\n"}PDFs Fast</Text>
              <Text style={[styles.promoDesc, { color: isDark ? colors.textSecondary : 'rgba(255, 255, 255, 0.8)' }]}>
                Easily convert images, merge files, and organize your documents in seconds.
              </Text>
              <TouchableOpacity 
                style={[styles.promoButton, { backgroundColor: isDark ? colors.primary : '#FFFFFF' }]} 
                activeOpacity={0.9}
                onPress={() => navigation.navigate('ImageToPdf')}
              >
                <Text style={[styles.promoButtonText, { color: isDark ? '#FFFFFF' : colors.primary }]}>Get Started</Text>
              </TouchableOpacity>
            </View>
            
            {/* Decorative Stars */}
            <View style={styles.starsContainer}>
              <Icon name="sparkles" size={80} color={isDark ? "rgba(37, 99, 235, 0.1)" : "rgba(255, 255, 255, 0.15)"} style={styles.star1} />
              <Icon name="star-four-points" size={60} color={isDark ? "rgba(37, 99, 235, 0.08)" : "rgba(255, 255, 255, 0.1)"} style={styles.star2} />
              <Icon name="star-four-points" size={40} color={isDark ? "rgba(37, 99, 235, 0.05)" : "rgba(255, 255, 255, 0.08)"} style={styles.star3} />
            </View>
          </View>

          {/* Feature Grid */}
          <View style={styles.grid}>
            <PdfCard
              title="Images to PDF"
              description="Create PDF from photos"
              icon="image"
              watermark="image-outline"
              onPress={() => navigation.navigate('ImageToPdf')}
            />
            <PdfCard
              title="Merge PDFs"
              description="Combine multiple files"
              icon="arrow-up-bold"
              watermark="arrow-up-bold-outline"
              onPress={() => navigation.navigate('MergePdf')}
            />
            <PdfCard
              title="My Files"
              description="Manage your documents"
              icon="folder"
              watermark="folder-outline"
              onPress={() => navigation.navigate('MyFiles')}
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

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
        <BottomNav navigation={navigation} activeTab="home" />
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
  scrollContent: {
    paddingHorizontal: 20,
  },
  grid: {
    gap: 20,
  },
  bottomNavContainer: {
    height: 90,
    justifyContent: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
  bannerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 60,
    marginBottom: 90, // Space for BottomNav
    backgroundColor: 'transparent',
  },
  promoCard: {
    borderRadius: 32,
    padding: 28,
    marginTop: 10,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  promoContent: {
    zIndex: 2,
  },
  promoTitle: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    marginBottom: 16,
    letterSpacing: -1,
  },
  promoDesc: {
    fontSize: 15,
    lineHeight: 22,
    maxWidth: '80%',
    marginBottom: 24,
  },
  promoButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  promoButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  starsContainer: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 200,
    height: 200,
    zIndex: 1,
  },
  star1: {
    position: 'absolute',
    right: 20,
    bottom: 40,
  },
  star2: {
    position: 'absolute',
    right: 80,
    bottom: 100,
  },
  star3: {
    position: 'absolute',
    right: 30,
    bottom: 130,
  },
});

export default HomeScreen;
