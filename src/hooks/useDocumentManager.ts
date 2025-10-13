import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Document {
  id: string;
  name: string;
  type: string;
  tags: string[];
  expiryDate?: string;
  createdAt: string;
  thumbnail?: string;
  fileData?: string;
  extractedData?: {
    name?: string;
    documentNumber?: string;
    expiryDate?: string;
    issueDate?: string;
    issuingCountry?: string;
  };
}

interface UseDocumentManagerReturn {
  documents: Document[];
  loading: boolean;
  error: string | null;
  addDocument: (document: Document) => Promise<void>;
  updateDocument: (id: string, document: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  syncWithCloud: () => Promise<void>;
  isCloudSyncEnabled: boolean;
}

// Mock encryption functions
const encryptData = (data: string, key: string): string => {
  // In a real implementation, use proper encryption like Web Crypto API
  return btoa(data + key);
};

const decryptData = (encryptedData: string, key: string): string => {
  // In a real implementation, use proper decryption
  try {
    const decrypted = atob(encryptedData);
    return decrypted.replace(key, '');
  } catch {
    return '';
  }
};

const generateKey = (): string => {
  return 'user-key-' + Date.now();
};

export const useDocumentManager = (): UseDocumentManagerReturn => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCloudSyncEnabled, setIsCloudSyncEnabled] = useState(false);

  // Load documents from localStorage
  const loadDocuments = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const storageKey = `documents_${user.uid}`;
      const encryptedData = localStorage.getItem(storageKey);
      
      if (encryptedData) {
        const userKey = generateKey(); // In real app, derive from user credentials
        const decryptedData = decryptData(encryptedData, userKey);
        const parsedDocuments = JSON.parse(decryptedData);
        setDocuments(parsedDocuments);
      }
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Save documents to localStorage
  const saveDocuments = useCallback(async (docs: Document[]) => {
    if (!user) return;

    try {
      const storageKey = `documents_${user.uid}`;
      const userKey = generateKey();
      const encryptedData = encryptData(JSON.stringify(docs), userKey);
      localStorage.setItem(storageKey, encryptedData);
      setDocuments(docs);
    } catch (err) {
      console.error('Error saving documents:', err);
      setError('Failed to save documents');
    }
  }, [user]);

  // Add new document
  const addDocument = useCallback(async (document: Document) => {
    if (!user) return;

    try {
      setLoading(true);
      const newDocument = {
        ...document,
        id: document.id || Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      
      const updatedDocuments = [...documents, newDocument];
      await saveDocuments(updatedDocuments);
      
      // Schedule expiry notifications
      if (newDocument.expiryDate) {
        scheduleExpiryNotification(newDocument);
      }
    } catch (err) {
      console.error('Error adding document:', err);
      setError('Failed to add document');
    } finally {
      setLoading(false);
    }
  }, [user, documents, saveDocuments]);

  // Update existing document
  const updateDocument = useCallback(async (id: string, updates: Partial<Document>) => {
    if (!user) return;

    try {
      setLoading(true);
      const updatedDocuments = documents.map(doc =>
        doc.id === id ? { ...doc, ...updates } : doc
      );
      await saveDocuments(updatedDocuments);
    } catch (err) {
      console.error('Error updating document:', err);
      setError('Failed to update document');
    } finally {
      setLoading(false);
    }
  }, [user, documents, saveDocuments]);

  // Delete document
  const deleteDocument = useCallback(async (id: string) => {
    if (!user) return;

    try {
      setLoading(true);
      const updatedDocuments = documents.filter(doc => doc.id !== id);
      await saveDocuments(updatedDocuments);
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document');
    } finally {
      setLoading(false);
    }
  }, [user, documents, saveDocuments]);

  // Sync with cloud (Firebase)
  const syncWithCloud = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      // In a real implementation, sync with Firebase Firestore
      // For now, just toggle the sync status
      setIsCloudSyncEnabled(!isCloudSyncEnabled);
      
      if (!isCloudSyncEnabled) {
        // Simulate cloud sync
        console.log('Syncing documents to cloud...');
        // await firestore.collection('documents').doc(user.uid).set({ documents });
      }
    } catch (err) {
      console.error('Error syncing with cloud:', err);
      setError('Failed to sync with cloud');
    } finally {
      setLoading(false);
    }
  }, [user, isCloudSyncEnabled]);

  // Schedule expiry notifications
  const scheduleExpiryNotification = useCallback((document: Document) => {
    if (!document.expiryDate) return;

    const expiryDate = new Date(document.expiryDate);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Schedule notifications for 30, 15, 5 days before expiry and on expiry day
    const notificationDays = [30, 15, 5, 0];
    
    notificationDays.forEach(days => {
      if (diffDays >= days) {
        const notificationDate = new Date(expiryDate);
        notificationDate.setDate(notificationDate.getDate() - days);
        
        if (notificationDate > today) {
          // In a real implementation, use a proper notification scheduler
          console.log(`Scheduling notification for ${document.name} in ${days} days`);
        }
      }
    });
  }, []);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return {
    documents,
    loading,
    error,
    addDocument,
    updateDocument,
    deleteDocument,
    syncWithCloud,
    isCloudSyncEnabled
  };
};









