import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, Dimensions, Animated, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import packageJson from '../../package.json';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const SplashScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const progress = new Animated.Value(0);

  useEffect(() => {
    // Progress bar animation
    Animated.timing(progress, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false,
    }).start();

    // Navigate to Home after 3 seconds
    const timer = setTimeout(() => {
      navigation.replace('Home');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  const progressBarWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#2563EB' }]}>
      <StatusBar barStyle="light-content" backgroundColor={isDark ? colors.background : '#2563EB'} />
      
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Image 
            source={require('../assets/logo.png')} 
            style={styles.logoImage} 
            resizeMode="contain"
          />
        </View>
        <Text style={[styles.title, { color: '#FFFFFF' }]}>PDF Maker</Text>
        <View style={styles.taglineRow}>
          <View style={styles.taglineLine} />
          <Text style={styles.taglineText}>FAST & OFFLINE</Text>
          <View style={styles.taglineLine} />
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarActive, { width: progressBarWidth }]} />
        </View>
        <Text style={styles.versionText}>VERSION {packageJson.version}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 140,
    height: 140,
    marginBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 140,
    height: 140,
    borderRadius: 40,
  },
  title: {
    fontSize: 56,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
    letterSpacing: -1,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taglineText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginHorizontal: 15,
    letterSpacing: 2,
    opacity: 0.9,
  },
  taglineLine: {
    width: 30,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  footer: {
    width: '100%',
    paddingHorizontal: 60,
    paddingBottom: 50,
    alignItems: 'center',
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBarActive: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1,
  },
});

export default SplashScreen;
