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

const PdfViewerScreen = ({ route, navigation }: any) => {
  const { colors, isDark } = useTheme();
  const { path, fileName } = route.params;
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
});

export default PdfViewerScreen;
