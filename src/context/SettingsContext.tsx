import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsContextType {
  notifications: boolean;
  setNotifications: (value: boolean) => void;
  smartCompression: boolean;
  setSmartCompression: (value: boolean) => void;
  highQuality: boolean;
  setHighQuality: (value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState(true);
  const [smartCompression, setSmartCompression] = useState(false);
  const [highQuality, setHighQuality] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedNotifications = await AsyncStorage.getItem('notifications');
      const savedSmartCompression = await AsyncStorage.getItem('smartCompression');
      const savedHighQuality = await AsyncStorage.getItem('highQuality');

      if (savedNotifications !== null) setNotifications(JSON.parse(savedNotifications));
      if (savedSmartCompression !== null) setSmartCompression(JSON.parse(savedSmartCompression));
      if (savedHighQuality !== null) setHighQuality(JSON.parse(savedHighQuality));
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const updateNotifications = async (val: boolean) => {
    setNotifications(val);
    await AsyncStorage.setItem('notifications', JSON.stringify(val));
  };

  const updateSmartCompression = async (val: boolean) => {
    setSmartCompression(val);
    await AsyncStorage.setItem('smartCompression', JSON.stringify(val));
  };

  const updateHighQuality = async (val: boolean) => {
    setHighQuality(val);
    await AsyncStorage.setItem('highQuality', JSON.stringify(val));
  };

  return (
    <SettingsContext.Provider value={{ 
      notifications, 
      setNotifications: updateNotifications,
      smartCompression,
      setSmartCompression: updateSmartCompression,
      highQuality,
      setHighQuality: updateHighQuality
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
