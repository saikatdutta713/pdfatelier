import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';

interface PdfCardProps {
  title: string;
  icon: string;
  onPress: () => void;
  description: string;
  watermark?: string;
}

const PdfCard: React.FC<PdfCardProps> = ({ title, icon, onPress, description, watermark }) => {
  const { colors, isDark } = useTheme();

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }
      ]} 
      onPress={onPress} 
      activeOpacity={0.8}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
        <Icon name={icon} size={28} color={colors.primary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      </View>
      {watermark && (
        <View style={styles.watermarkContainer}>
          <Icon name={watermark} size={64} color={isDark ? colors.border : '#F1F5F9'} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'column',
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  textContainer: {
    flex: 1,
    zIndex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    maxWidth: '85%',
  },
  watermarkContainer: {
    position: 'absolute',
    right: 15,
    bottom: 20,
    opacity: 0.8,
  },
});

export default PdfCard;
