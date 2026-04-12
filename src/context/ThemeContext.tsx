import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeType;
  isDark: boolean;
  toggleTheme: () => void;
  colors: typeof LightColors;
}

const LightColors = {
  background: '#F9FAFB',
  card: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  primary: '#0055FF',
  primaryLight: '#E0EBFF',
  border: '#F1F5F9',
  surface: '#FFFFFF',
  error: '#EF4444',
  success: '#10B981',
};

const DarkColors = {
  background: '#0B111D',
  card: '#1A1F2C',
  text: '#dae2fd',
  textSecondary: '#c3c6d7',
  textTertiary: '#94a3b8',
  primary: '#2563eb',
  primaryContainer: '#2d3449',
  primaryLight: 'rgba(37, 99, 235, 0.1)',
  border: '#2d3449',
  surface: '#1A1F2C',
  error: '#f87171',
  success: '#34d399',
  onSurface: '#dae2fd',
  onSurfaceVariant: '#c3c6d7',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>(systemColorScheme || 'light');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        setTheme(savedTheme as ThemeType);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
  };

  const isDark = theme === 'dark';
  const colors = isDark ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, colors }}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
