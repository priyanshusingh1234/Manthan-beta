import React, { createContext, useContext } from 'react';
import { useSharedValue, SharedValue } from 'react-native-reanimated';

interface ScrollContextType {
  headerTranslation: SharedValue<number>;
  footerTranslation: SharedValue<number>;
}

const ScrollContext = createContext<ScrollContextType | null>(null);

export const ScrollProvider = ({ children }: { children: React.ReactNode }) => {
  // Use shared values to control translations smoothly across the app
  const headerTranslation = useSharedValue(0);
  const footerTranslation = useSharedValue(0);

  return (
    <ScrollContext.Provider value={{ headerTranslation, footerTranslation }}>
      {children}
    </ScrollContext.Provider>
  );
};

export const useScrollContext = () => {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error('useScrollContext must be used within a ScrollProvider');
  }
  return context;
};
