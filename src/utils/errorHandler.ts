// Centralized error handling utilities

export interface APIError {
  code: string;
  message: string;
  details?: any;
}

export class ErrorHandler {
  static handleAPIError(error: any, context: string): string {
    console.error(`${context} error:`, error);

    // Network errors
    if (!navigator.onLine) {
      return 'No internet connection. Please check your network and try again.';
    }

    if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
      return 'Network connection failed. Please check your internet and try again.';
    }

    // Firebase Auth errors
    if (error.code?.startsWith('auth/')) {
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          return 'Invalid email or password. Please try again.';
        case 'auth/email-already-in-use':
          return 'An account with this email already exists.';
        case 'auth/weak-password':
          return 'Password should be at least 6 characters long.';
        case 'auth/invalid-email':
          return 'Please enter a valid email address.';
        case 'auth/too-many-requests':
          return 'Too many failed attempts. Please try again later.';
        default:
          return 'Authentication failed. Please try again.';
      }
    }

    // API specific errors
    if (error.status) {
      switch (error.status) {
        case 400:
          return 'Invalid request. Please check your input and try again.';
        case 401:
          return 'Please sign in to continue.';
        case 403:
          return 'You don\'t have permission to perform this action.';
        case 404:
          return 'The requested resource was not found.';
        case 429:
          return 'Too many requests. Please wait a moment and try again.';
        case 500:
          return 'Server error. Please try again later.';
        case 503:
          return 'Service temporarily unavailable. Please try again later.';
        default:
          return 'Something went wrong. Please try again.';
      }
    }

    // Location errors
    if (error.code === 1) { // PERMISSION_DENIED
      return 'Location access denied. Please enable location services and try again.';
    }
    if (error.code === 2) { // POSITION_UNAVAILABLE
      return 'Location unavailable. Please check your GPS settings.';
    }
    if (error.code === 3) { // TIMEOUT
      return 'Location request timed out. Please try again.';
    }

    // Generic error message
    return error.message || 'Something went wrong. Please try again.';
  }

  static showErrorNotification(message: string, duration: number = 5000) {
    // This would integrate with a toast notification system
    console.error('Error:', message);
    
    // For now, we'll use a simple alert
    // In production, replace with proper toast notification
    if (typeof window !== 'undefined') {
      // Create a temporary error notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 max-w-sm';
      notification.textContent = message;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, duration);
    }
  }

  static logError(error: any, context: string, additionalData?: any) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      additionalData,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.error('Error Log:', errorLog);

    // In production, send to error tracking service like Sentry
    // await sendToErrorTracking(errorLog);
  }
}

export const handleAPIError = ErrorHandler.handleAPIError;
export const showErrorNotification = ErrorHandler.showErrorNotification;
export const logError = ErrorHandler.logError;

