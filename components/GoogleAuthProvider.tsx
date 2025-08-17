import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface GoogleAuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  signIn: () => Promise<void>;
  signOut: () => void;
  apiKey: string | null;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

export const useGoogleAuth = () => {
  const context = useContext(GoogleAuthContext);
  if (context === undefined) {
    throw new Error('useGoogleAuth must be used within a GoogleAuthProvider');
  }
  return context;
};

interface GoogleAuthProviderProps {
  children: ReactNode;
}

export const GoogleAuthProvider: React.FC<GoogleAuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already authenticated
    const savedAuth = localStorage.getItem('google_auth');
    if (savedAuth) {
      const authData = JSON.parse(savedAuth);
      setIsAuthenticated(true);
      setUser(authData.user);
      setApiKey(authData.apiKey);
    }
  }, []);

  const signIn = async () => {
    try {
      // For demo purposes, we'll simulate the OAuth flow
      // In a real implementation, you would use Google OAuth 2.0
      const mockUser = {
        id: 'demo_user',
        name: 'Demo User',
        email: 'demo@example.com',
        picture: 'https://via.placeholder.com/40'
      };
      
      // In a real implementation, you would get the API key from Google's OAuth flow
      // For now, we'll prompt the user to enter their API key
      const userApiKey = prompt('Please enter your Google Gemini API key:');
      
      if (userApiKey) {
        const authData = {
          user: mockUser,
          apiKey: userApiKey
        };
        
        localStorage.setItem('google_auth', JSON.stringify(authData));
        setIsAuthenticated(true);
        setUser(mockUser);
        setApiKey(userApiKey);
      }
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };

  const signOut = () => {
    localStorage.removeItem('google_auth');
    setIsAuthenticated(false);
    setUser(null);
    setApiKey(null);
  };

  return (
    <GoogleAuthContext.Provider value={{
      isAuthenticated,
      user,
      signIn,
      signOut,
      apiKey
    }}>
      {children}
    </GoogleAuthContext.Provider>
  );
};