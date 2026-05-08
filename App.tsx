import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Text } from 'react-native';
import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { requestMediaPermission } from './src/utils/permissions';
import mobileAds from 'react-native-google-mobile-ads';
import { ThemeProvider } from './src/context/ThemeContext';
import { SettingsProvider } from './src/context/SettingsContext';

const App = () => {
  useEffect(() => {
    console.log('App starting defensive check...');
    try {
      if (mobileAds && typeof mobileAds === 'function') {
        const ads = mobileAds();
        ads.setRequestConfiguration({
          testDeviceIds: ['1C52D41B33AF0361BD9686A672BFE4EC'],
        })
        .then(() => ads.initialize())
        .then(adapterStatuses => {
          console.log('AdMob Initialized Status:', JSON.stringify(adapterStatuses, null, 2));
          Object.keys(adapterStatuses).forEach(key => {
            console.log(`Adapter ${key} is ${adapterStatuses[key].state}`);
          });
        })
        .catch(err => console.error('AdMob Init Error:', err));
      } else {
        console.warn('mobileAds module not found');
      }
    } catch (e) {
      console.error('Crash avoided in AdMob init:', e);
    }

    // Request permissions on startup
    try {
      requestMediaPermission();
    } catch (e) {
      console.error('Permission request failed:', e);
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <ThemeProvider>
          <AppNavigator />
        </ThemeProvider>
      </SettingsProvider>
    </GestureHandlerRootView>
  );
};

export default App;
