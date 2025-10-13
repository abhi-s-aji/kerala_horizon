import { useState, useEffect, useCallback } from 'react';

interface UseBiometricAuthReturn {
  isBiometricEnabled: boolean;
  isSupported: boolean;
  biometricType: 'fingerprint' | 'face' | 'none';
  enableBiometric: () => Promise<void>;
  disableBiometric: () => void;
  authenticate: () => Promise<boolean>;
}

export const useBiometricAuth = (): UseBiometricAuthReturn => {
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'face' | 'none'>('none');

  // Check if biometric authentication is supported
  useEffect(() => {
    const checkBiometricSupport = async () => {
      try {
        // Check for WebAuthn support
        if (window.PublicKeyCredential) {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsSupported(available);
          
          if (available) {
            // Try to determine biometric type
            try {
              const credential = await navigator.credentials.create({
                publicKey: {
                  challenge: new Uint8Array(32),
                  rp: { name: 'Kerala Horizon' },
                  user: {
                    id: new Uint8Array(32),
                    name: 'user',
                    displayName: 'User'
                  },
                  pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
                  authenticatorSelection: {
                    authenticatorAttachment: 'platform'
                  }
                }
              });
              
              // If we get here, biometric is available
              setBiometricType('fingerprint'); // Default to fingerprint
            } catch (err) {
              console.log('Biometric setup failed:', err);
            }
          }
        }
      } catch (err) {
        console.log('Biometric support check failed:', err);
        setIsSupported(false);
      }
    };

    checkBiometricSupport();
  }, []);

  // Load biometric settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('biometric_settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setIsBiometricEnabled(settings.enabled);
      setBiometricType(settings.type);
    }
  }, []);

  // Enable biometric authentication
  const enableBiometric = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Biometric authentication is not supported on this device');
    }

    try {
      // Create a new credential for biometric authentication
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: { 
            name: 'Kerala Horizon',
            id: window.location.hostname
          },
          user: {
            id: new Uint8Array(32),
            name: 'user',
            displayName: 'User'
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 }, // ES256
            { type: 'public-key', alg: -257 } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required'
          },
          timeout: 60000,
          attestation: 'direct'
        }
      });

      if (credential) {
        setIsBiometricEnabled(true);
        
        // Save settings
        const settings = {
          enabled: true,
          type: biometricType,
          credentialId: credential.id
        };
        localStorage.setItem('biometric_settings', JSON.stringify(settings));
        
        console.log('Biometric authentication enabled successfully');
      }
    } catch (err) {
      console.error('Failed to enable biometric authentication:', err);
      throw new Error('Failed to set up biometric authentication');
    }
  }, [isSupported, biometricType]);

  // Disable biometric authentication
  const disableBiometric = useCallback(() => {
    setIsBiometricEnabled(false);
    setBiometricType('none');
    
    // Clear settings
    localStorage.removeItem('biometric_settings');
    
    console.log('Biometric authentication disabled');
  }, []);

  // Authenticate using biometric
  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!isBiometricEnabled || !isSupported) {
      return false;
    }

    try {
      // Get the stored credential
      const savedSettings = localStorage.getItem('biometric_settings');
      if (!savedSettings) {
        return false;
      }

      const settings = JSON.parse(savedSettings);
      
      // Attempt to authenticate using the stored credential
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          timeout: 60000,
          userVerification: 'required',
          allowCredentials: [{
            type: 'public-key',
            id: new Uint8Array(32) // In real implementation, use stored credential ID
          }]
        }
      });

      if (assertion) {
        console.log('Biometric authentication successful');
        return true;
      }
    } catch (err) {
      console.error('Biometric authentication failed:', err);
      return false;
    }

    return false;
  }, [isBiometricEnabled, isSupported]);

  return {
    isBiometricEnabled,
    isSupported,
    biometricType,
    enableBiometric,
    disableBiometric,
    authenticate
  };
};
