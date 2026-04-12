import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, StatusBar, ImageBackground } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';

const PremiumScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const features = [
    { icon: 'lightning-bolt', title: 'Ultra-Fast Conversion', desc: 'Process documents 3x faster with priority servers.' },
    { icon: 'ads-off', title: 'Ad-Free Experience', desc: 'Remove all banner and interstitial ads permanently.' },
    { icon: 'infinity', title: 'Unlimited Merges', desc: 'Combine as many files as you need without limits.' },
    { icon: 'shield-lock-outline', title: 'Advanced Encryption', desc: 'Secure your documents with bank-grade protection.' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Go Premium</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Icon name="crown" size={80} color="#FFD700" style={styles.heroIcon} />
          <Text style={[styles.heroTitle, { color: colors.text }]}>Unlock All Features</Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>Experience the ultimate document productivity toolset without any restrictions.</Text>
        </View>

        <View style={styles.featuresList}>
          {features.map((f, i) => (
            <View key={i} style={[styles.featureItem, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <View style={[styles.featureIconBox, { backgroundColor: colors.primaryLight }]}>
                <Icon name={f.icon} size={28} color={colors.primary} />
              </View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>{f.title}</Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.pricingSection}>
          <TouchableOpacity style={[styles.priceCard, { backgroundColor: colors.primary }]}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>BEST VALUE</Text>
            </View>
            <Text style={styles.priceDuration}>Lifetime Access</Text>
            <Text style={styles.priceAmount}>$9.99</Text>
            <Text style={styles.priceDetail}>One-time payment</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.subscribeBtn, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: colors.border, borderWidth: isDark ? 1 : 0 }]}>
          <Text style={[styles.subscribeText, { color: colors.primary }]}>Upgrade Now</Text>
        </TouchableOpacity>

        <Text style={[styles.restoreText, { color: colors.textTertiary }]}>Restore Purchase</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E293B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    padding: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  heroIcon: {
    marginBottom: 20,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSub: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  featuresList: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 20,
  },
  featureIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 85, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
  pricingSection: {
    marginBottom: 32,
  },
  priceCard: {
    backgroundColor: '#0055FF',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  badge: {
    position: 'absolute',
    top: -12,
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1E293B',
  },
  priceDuration: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  priceAmount: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  priceDetail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  subscribeBtn: {
    backgroundColor: '#FFFFFF',
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  subscribeText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0055FF',
  },
  restoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});

export default PremiumScreen;
