/**
 * Cookie Management Utility for GDPR/ePrivacy Compliance
 * Modern SaaS approach with user-friendly controls
 */

export interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export interface CookieConsent {
  hasConsented: boolean;
  consentDate: string;
  preferences: CookiePreferences;
  version: string;
}

const COOKIE_CONSENT_KEY = 'agilelinks-cookie-consent';
const CONSENT_VERSION = '1.0';

// Default preferences - only essential cookies enabled
const defaultPreferences: CookiePreferences = {
  essential: true, // Always required
  analytics: false,
  marketing: false,
  preferences: false,
};

/**
 * Get current cookie consent status
 */
export const getCookieConsent = (): CookieConsent | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) return null;
    
    const consent: CookieConsent = JSON.parse(stored);
    
    // Check if consent is still valid (version matches)
    if (consent.version !== CONSENT_VERSION) {
      return null;
    }
    
    return consent;
  } catch (error) {
    console.error('Error reading cookie consent:', error);
    return null;
  }
};

/**
 * Save cookie consent preferences
 */
export const saveCookieConsent = (preferences: CookiePreferences): void => {
  if (typeof window === 'undefined') return;
  
  const consent: CookieConsent = {
    hasConsented: true,
    consentDate: new Date().toISOString(),
    preferences: {
      ...preferences,
      essential: true, // Always required
    },
    version: CONSENT_VERSION,
  };
  
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    
    // Apply consent immediately
    applyCookieConsent(consent.preferences);
    
    // Dispatch custom event for other components to listen
    window.dispatchEvent(
      new CustomEvent('cookieConsentChanged', {
        detail: consent,
      })
    );
  } catch (error) {
    console.error('Error saving cookie consent:', error);
  }
};

/**
 * Apply cookie consent settings
 */
export const applyCookieConsent = (preferences: CookiePreferences): void => {
  if (typeof window === 'undefined') return;
  
  // Google Analytics
  if (preferences.analytics) {
    enableGoogleAnalytics();
  } else {
    disableGoogleAnalytics();
  }
  
  // Marketing/Advertising cookies
  if (!preferences.marketing) {
    clearMarketingCookies();
  }
  
  // Preferences cookies
  if (!preferences.preferences) {
    clearPreferenceCookies();
  }
};

/**
 * Enable Google Analytics
 */
const enableGoogleAnalytics = (): void => {
  // Enable GA if tracking ID is available
  if (window.gtag) {
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
    });
  }
};

/**
 * Disable Google Analytics
 */
const disableGoogleAnalytics = (): void => {
  if (window.gtag) {
    window.gtag('consent', 'update', {
      analytics_storage: 'denied',
    });
  }
};

/**
 * Clear marketing cookies
 */
const clearMarketingCookies = (): void => {
  const marketingCookies = [
    '_fbp',
    '_fbc',
    'fr',
    '_gcl_au',
    '_gac_',
  ];
  
  marketingCookies.forEach(cookieName => {
    deleteCookie(cookieName);
  });
};

/**
 * Clear preference cookies
 */
const clearPreferenceCookies = (): void => {
  const preferenceCookies = [
    'theme-preference',
    'language-preference',
  ];
  
  preferenceCookies.forEach(cookieName => {
    deleteCookie(cookieName);
  });
};

/**
 * Delete a specific cookie
 */
const deleteCookie = (name: string): void => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
};

/**
 * Check if user needs to see cookie banner
 */
export const shouldShowCookieBanner = (): boolean => {
  const consent = getCookieConsent();
  return !consent?.hasConsented;
};

/**
 * Accept all cookies (convenience function)
 */
export const acceptAllCookies = (): void => {
  saveCookieConsent({
    essential: true,
    analytics: true,
    marketing: true,
    preferences: true,
  });
};

/**
 * Accept only essential cookies
 */
export const acceptEssentialOnly = (): void => {
  saveCookieConsent(defaultPreferences);
};

/**
 * Initialize cookie management on page load
 */
export const initializeCookieManager = (): void => {
  if (typeof window === 'undefined') return;
  
  const consent = getCookieConsent();
  if (consent?.hasConsented) {
    applyCookieConsent(consent.preferences);
  }
};

// Cookie category descriptions for UI
export const cookieCategories = {
  essential: {
    name: 'Essential',
    description: 'Required for the website to function properly. These cannot be disabled.',
    examples: ['Authentication', 'Security', 'Basic functionality'],
  },
  analytics: {
    name: 'Analytics', 
    description: 'Help us understand how you use our platform so we can improve it.',
    examples: ['Google Analytics', 'Usage statistics', 'Performance monitoring'],
  },
  marketing: {
    name: 'Marketing',
    description: 'Used to show you relevant content and advertisements.',
    examples: ['Social media integration', 'Advertising tracking', 'Campaign attribution'],
  },
  preferences: {
    name: 'Preferences',
    description: 'Remember your settings and personalize your experience.',
    examples: ['Theme preference', 'Language settings', 'User preferences'],
  },
} as const;

// Extend Window interface for TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}