import RNImageToPdf from 'react-native-image-to-pdf';
import RNFS from 'react-native-fs';
import { format } from 'date-fns';

export const convertImagesToPdf = async (images: string[], quality: number = 0.7) => {
  try {
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    const fileName = `PDF_${timestamp}.pdf`;
    
    // Ensure we are sending absolute local paths
    const cleanPaths = images.map(img => {
      let path = img;
      if (path.startsWith('file://')) {
        path = path.replace('file://', '');
      }
      return path;
    });

    const options = {
      imagePaths: cleanPaths,
      name: fileName,
      maxSize: {
        width: 1200,
        height: 1600,
      },
      quality: quality,
    };

    const pdf = await RNImageToPdf.createPDFbyImages(options);
    
    if (!pdf || !pdf.filePath) {
      throw new Error('Native compilation failed to produce a file path.');
    }

    const finalPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
    
    // The library might save to cache, move to permanent storage
    if (pdf.filePath !== finalPath) {
      const exists = await RNFS.exists(pdf.filePath);
      if (exists) {
        await RNFS.copyFile(pdf.filePath, finalPath);
      } else {
        // Fallback: Check if it actually saved to DocumentDirectory automatically
        const checkFinal = await RNFS.exists(finalPath);
        if (!checkFinal) {
           throw new Error('Final document asset not found in expected repository.');
        }
      }
    }
    
    return finalPath;
  } catch (e: any) {
    console.error('PDF Conversion Error:', e);
    throw new Error(e.message || 'The architectural consolidation process encountered a native failure.');
  }
};

export const getSavedFiles = async () => {
  try {
    console.log('Searching for PDFs in:', RNFS.DocumentDirectoryPath);
    const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);
    console.log('Total files found:', files.length);
    const pdfs = files
      .filter(file => file.name.toLowerCase().endsWith('.pdf'))
      .sort((a, b) => {
        const timeA = a.mtime instanceof Date ? a.mtime.getTime() : new Date(a.mtime).getTime();
        const timeB = b.mtime instanceof Date ? b.mtime.getTime() : new Date(b.mtime).getTime();
        return timeB - timeA;
      });
    console.log('PDFs found:', pdfs.length);
    return pdfs;
  } catch (e) {
    console.error('Error reading files:', e);
    return [];
  }
};

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};
