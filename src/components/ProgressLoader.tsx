import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Dimensions,
  ProgressBarAndroid,
  Platform,
  FlatList,
  Animated,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface ProgressLoaderProps {
  visible: boolean;
  progress: number;
  title: string;
  files: any[];
  totalSize: string;
}

const ProgressLoader: React.FC<ProgressLoaderProps> = ({ visible, progress, title, files, totalSize }) => {
  const { colors, isDark } = useTheme();
  
  // Circular progress calculation
  const radius = 90;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar 
          barStyle={isDark ? "light-content" : "dark-content"} 
          backgroundColor={colors.background} 
        />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIcon}>
            <Icon name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Merging Documents</Text>
          <TouchableOpacity style={styles.headerIcon}>
            <Icon name="dots-vertical" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Circular Progress */}
          <View style={styles.progressContainer}>
            <Svg height={radius * 2} width={radius * 2}>
              <Circle
                stroke={colors.border}
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              <Circle
                stroke={colors.primary}
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
            </Svg>
            <View style={styles.percentageContainer}>
              <Text style={[styles.percentageText, { color: colors.primary }]}>{Math.round(progress * 100)}%</Text>
              <Text style={[styles.processingLabel, { color: colors.textTertiary }]}>PROCESSING</Text>
            </View>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>Combining your files...</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>This may take a moment.</Text>

          {/* Queue Section */}
          <View style={styles.queueHeader}>
            <Text style={[styles.queueTitle, { color: colors.text }]}>Queue ({files.length} Files)</Text>
            <Text style={[styles.totalSize, { color: colors.textSecondary }]}>{totalSize} total</Text>
          </View>

          <FlatList
            data={files}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[
                styles.queueCard, 
                { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
                item.status === 'processing' && [styles.processingCard, { borderLeftColor: colors.primary }]
              ]}>
                 <View style={[styles.fileIconBg, { backgroundColor: colors.primaryLight }]}>
                    <Icon name="image" size={24} color={colors.primary} />
                 </View>
                 <View style={styles.fileInfo}>
                    <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.fileStatus, { color: item.status === 'processing' ? colors.primary : colors.textSecondary }]}>
                       {item.status === 'processing' ? 'Currently merging...' : 'Waiting in queue'}
                    </Text>
                 </View>
                 {item.status === 'processing' ? (
                   <Icon name="refresh" size={20} color={colors.primary} />
                 ) : (
                   <Icon name="clock-outline" size={20} color={colors.textTertiary} />
                 )}
              </View>
            )}
            style={styles.queueList}
          />
        </View>

        {/* Bottom Nav Mock */}
        <View style={[styles.bottomNav, { backgroundColor: colors.background, borderColor: colors.border }]}>
           <TouchableOpacity style={styles.navItem}>
             <Icon name="image-outline" size={24} color={colors.textTertiary} />
             <Text style={[styles.navText, { color: colors.textTertiary }]}>Convert</Text>
           </TouchableOpacity>
           <TouchableOpacity style={styles.navItem}>
             <View style={[styles.activeNavBg, { backgroundColor: colors.card }]}><Icon name="tray-arrow-up" size={24} color={colors.primary} /></View>
             <Text style={[styles.navText, { color: colors.primary }]}>Merge</Text>
           </TouchableOpacity>
           <TouchableOpacity style={styles.navItem}>
             <Icon name="folder-outline" size={24} color={colors.textTertiary} />
             <Text style={[styles.navText, { color: colors.textTertiary }]}>Files</Text>
           </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  progressContainer: {
    marginTop: 40,
    marginBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#2563eb',
  },
  processingLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#dae2fd',
    letterSpacing: 2,
    marginTop: -4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  queueTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  totalSize: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  queueList: {
    width: '100%',
  },
  queueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  processingCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
  },
  fileIconBg: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(26,31,44,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  fileStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomNav: {
    flexDirection: 'row',
    height: 100,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#1A1F2C',
    backgroundColor: '#0B111D',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeNavBg: {
    width: 60,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1A1F2C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  navText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
});

export default ProgressLoader;
