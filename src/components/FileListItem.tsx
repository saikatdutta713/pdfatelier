import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';
import { formatFileSize } from '../utils/pdfHelper';

interface FileListItemProps {
  name: string;
  size: number;
  date: Date;
  index: number;
  onOpen: () => void;
  onShare: () => void;
  onDelete: () => void;
}

const FileListItem: React.FC<FileListItemProps> = ({ name, size, date, index, onOpen, onShare, onDelete }) => {
  const { colors, isDark } = useTheme();
  const formattedSize = formatFileSize(size);
  const formattedDate = format(date, 'MMM dd, yyyy');
  
  const iconBgColor = index % 2 === 0 
    ? (isDark ? 'rgba(239,68,68,0.1)' : '#FFE4E1') 
    : (isDark ? 'rgba(37,99,235,0.1)' : '#E0E7FF'); 
  const iconColor = index % 2 === 0 ? colors.error : colors.primary;

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.card }]} 
      onPress={onOpen} 
      onLongPress={onDelete} 
      activeOpacity={0.9}
    >
      <View style={[styles.iconBox, { backgroundColor: iconBgColor }]}>
        <Icon name="file-pdf-box" size={32} color={iconColor} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{name}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.sizeBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
            <Text style={[styles.sizeText, { color: colors.textSecondary }]}>{formattedSize}</Text>
          </View>
          <Text style={[styles.dateText, { color: colors.textTertiary }]}>{formattedDate}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      }
    }),
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sizeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 12,
  },
  sizeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default FileListItem;
