import { useState, useEffect, useCallback } from 'react';

interface NotificationData {
  documentId: string;
  type: 'expiry_alert' | 'reminder' | 'general';
  daysRemaining?: number;
  documentName?: string;
  expiryDate?: string;
}

interface ScheduledNotification {
  title: string;
  body: string;
  data: NotificationData;
  scheduledTime: Date;
  actions?: Array<{ action: string; title: string }>;
}

interface UseNotificationServiceReturn {
  permission: NotificationPermission;
  requestPermission: () => Promise<boolean>;
  scheduleNotification: (notification: ScheduledNotification) => Promise<void>;
  showNotification: (title: string, body: string, options?: NotificationOptions) => void;
  scheduleExpiryNotification: (document: any) => Promise<void>;
  cancelNotification: (documentId: string) => void;
}

export const useNotificationService = (): UseNotificationServiceReturn => {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      setPermission('granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('Notification permission has been denied');
      setPermission('denied');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return false;
    }
  }, []);

  // Enhanced notification scheduling
  const scheduleNotification = useCallback(async (notification: ScheduledNotification) => {
    if (permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    // Store notification in localStorage for persistence
    const scheduledNotifications = JSON.parse(localStorage.getItem('scheduledNotifications') || '[]');
    scheduledNotifications.push({
      ...notification,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
    localStorage.setItem('scheduledNotifications', JSON.stringify(scheduledNotifications));

    // Schedule the notification
    const delay = notification.scheduledTime.getTime() - Date.now();
    if (delay > 0) {
      setTimeout(() => {
        new Notification(notification.title, {
          body: notification.body,
          icon: '/logo192.png',
          badge: '/logo192.png',
          tag: 'kerala-horizon',
          requireInteraction: true,
          data: notification.data,
          actions: notification.actions?.map(action => ({
            action: action.action,
            title: action.title
          }))
        });
      }, delay);
    }
  }, [permission]);

  // Schedule expiry notifications for documents
  const scheduleExpiryNotification = useCallback(async (document: any) => {
    if (!document.expiryDate) return;

    const expiryDate = new Date(document.expiryDate);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Enhanced notification scheduling
    const notificationDays = [30, 15, 7, 5, 1];
    const notificationMessages = {
      30: `Your document "${document.name}" expires in 30 days`,
      15: `Your document "${document.name}" expires in 15 days`,
      7: `Your document "${document.name}" expires in 7 days`,
      5: `Your document "${document.name}" expires in 5 days`,
      1: `Your document "${document.name}" expires tomorrow`
    };
    
    for (const days of notificationDays) {
      if (diffDays <= days && diffDays > 0) {
        const notificationTime = new Date(expiryDate.getTime() - (days * 24 * 60 * 60 * 1000));
        
        if (notificationTime > today) {
          await scheduleNotification({
            title: 'Document Expiry Alert',
            body: notificationMessages[days as keyof typeof notificationMessages],
            data: { 
              documentId: document.id, 
              type: 'expiry_alert',
              daysRemaining: days,
              documentName: document.name,
              expiryDate: document.expiryDate
            },
            scheduledTime: notificationTime,
            actions: [
              { action: 'view', title: 'View Document' },
              { action: 'snooze', title: 'Snooze' },
              { action: 'dismiss', title: 'Dismiss' }
            ]
          });
        }
      }
    }
  }, [scheduleNotification]);

  // Cancel notifications for a specific document
  const cancelNotification = useCallback((documentId: string) => {
    const scheduledNotifications = JSON.parse(localStorage.getItem('scheduledNotifications') || '[]');
    const filteredNotifications = scheduledNotifications.filter(
      (notification: any) => notification.data.documentId !== documentId
    );
    localStorage.setItem('scheduledNotifications', JSON.stringify(filteredNotifications));
  }, []);

  // Show immediate notification
  const showNotification = useCallback((title: string, body: string, options?: NotificationOptions) => {
    if (permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    const notification = new Notification(title, {
      body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      ...options
    });

    // Handle notification click
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);
  }, [permission]);

  return {
    permission,
    requestPermission,
    scheduleNotification,
    showNotification,
    scheduleExpiryNotification,
    cancelNotification
  };
};

