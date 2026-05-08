import { PermissionsAndroid, Platform, Linking, Alert } from 'react-native';

export const checkStoragePermission = async () => {
  if (Platform.OS !== 'android') return true;

  if (Number(Platform.Version) >= 33) {
    return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
  } else {
    const readGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
    // WRITE_EXTERNAL_STORAGE is not needed for API 29+ if using scoped storage, 
    // but for simplicity and compatibility with older devices we check it for < 29.
    if (Number(Platform.Version) < 29) {
      const writeGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
      return readGranted && writeGranted;
    }
    return readGranted;
  }
};

export const requestStoragePermission = async () => {
  if (Platform.OS !== 'android') return true;

  // Check first to avoid unnecessary requests/alerts
  const alreadyGranted = await checkStoragePermission();
  if (alreadyGranted) return true;

  try {
    let granted: any;
    if (Number(Platform.Version) >= 33) {
      granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
      const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
      if (!isGranted && granted !== PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        // Just returned from the system dialog, don't show our alert yet if they just clicked Deny once
        // but if it's already denied or never ask again, we show it.
      }
      if (!isGranted) handlePermissionDenied();
      return isGranted;
    } else {
      const permissions = [PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE];
      if (Number(Platform.Version) < 29) {
        permissions.push(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
      }
      
      const results = await PermissionsAndroid.requestMultiple(permissions);
      const isGranted = permissions.every(p => results[p] === PermissionsAndroid.RESULTS.GRANTED);
      
      if (!isGranted) {
        handlePermissionDenied();
      }
      return isGranted;
    }
  } catch (err) {
    console.warn(err);
    return false;
  }
};

export const requestMediaPermission = async () => {
  return requestStoragePermission();
};

const handlePermissionDenied = () => {
  Alert.alert(
    'Permission Required',
    'This app requires storage access to select images and save PDF files. Please enable it in your device settings.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings() },
    ]
  );
};
