const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const Tesseract = require('tesseract.js');
const admin = require('firebase-admin');
const Joi = require('joi');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

const db = admin.firestore();
const bucket = admin.storage().bucket('kerala-horizon.firebasestorage.app');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'), false);
    }
  }
});

// Middleware to verify Firebase token
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid authentication token'
    });
  }
};

// Validation schemas
const documentUpdateSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  category: Joi.string().valid('passport', 'visa', 'insurance', 'vaccination', 'other').optional(),
  tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
  expiryDate: Joi.date().optional(),
  notes: Joi.string().max(500).optional()
});

// Upload document
router.post('/upload', verifyFirebaseToken, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { uid } = req.user;
    const { category = 'other', name, tags = [] } = req.body;

    // Generate unique filename
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `${uid}/${crypto.randomUUID()}${fileExtension}`;

    // Process and optimize image
    let processedBuffer = req.file.buffer;
    
    if (req.file.mimetype.startsWith('image/')) {
      processedBuffer = await sharp(req.file.buffer)
        .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
    }

    // Upload to Firebase Storage
    const file = bucket.file(fileName);
    await file.save(processedBuffer, {
      metadata: {
        contentType: req.file.mimetype,
        metadata: {
          userId: uid,
          originalName: req.file.originalname,
          uploadedAt: new Date().toISOString()
        }
      }
    });

    // Get download URL
    const [downloadURL] = await file.getSignedUrl({
      action: 'read',
      expires: '03-01-2500' // Far future date
    });

    // Perform OCR if it's an image
    let ocrText = '';
    let extractedData = {};
    
    if (req.file.mimetype.startsWith('image/')) {
      try {
        const { data: { text } } = await Tesseract.recognize(processedBuffer, 'eng');
        ocrText = text;
        
        // Extract structured data based on document category
        extractedData = extractDocumentData(text, category);
      } catch (ocrError) {
        console.warn('OCR processing failed:', ocrError.message);
      }
    }

    // Create document record
    const documentId = crypto.randomUUID();
    const document = {
      id: documentId,
      userId: uid,
      name: name || req.file.originalname,
      category,
      tags,
      fileName,
      downloadURL,
      fileSize: processedBuffer.length,
      mimeType: req.file.mimetype,
      ocrText,
      extractedData,
      isSecure: true,
      sharedWith: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('documents').doc(documentId).set(document);

    // Schedule expiry notification if expiry date is extracted
    if (extractedData.expiryDate) {
      await scheduleExpiryNotification(uid, documentId, extractedData.expiryDate);
    }

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        document: {
          id: documentId,
          name: document.name,
          category: document.category,
          tags: document.tags,
          downloadURL: document.downloadURL,
          extractedData: document.extractedData,
          createdAt: document.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Scan document (upload + OCR)
router.post('/scan', verifyFirebaseToken, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { uid } = req.user;

    // Process image for OCR
    const processedBuffer = await sharp(req.file.buffer)
      .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 95 })
      .toBuffer();

    // Perform OCR
    const { data: { text } } = await Tesseract.recognize(processedBuffer, 'eng');
    
    // Auto-detect document type and extract data
    const detectedCategory = detectDocumentCategory(text);
    const extractedData = extractDocumentData(text, detectedCategory);

    res.json({
      success: true,
      message: 'Document scanned successfully',
      data: {
        ocrText: text,
        detectedCategory,
        extractedData,
        suggestions: {
          name: generateDocumentName(extractedData, detectedCategory),
          tags: generateTags(extractedData, detectedCategory)
        }
      }
    });

  } catch (error) {
    console.error('Document scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to scan document',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get user documents
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { category, tag, limit = 20, offset = 0 } = req.query;

    let query = db.collection('documents')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc');

    // Apply filters
    if (category) {
      query = query.where('category', '==', category);
    }

    const snapshot = await query.limit(parseInt(limit)).offset(parseInt(offset)).get();
    
    let documents = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        category: data.category,
        tags: data.tags,
        downloadURL: data.downloadURL,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        extractedData: data.extractedData,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
    });

    // Filter by tag if specified
    if (tag) {
      documents = documents.filter(doc => 
        doc.tags && doc.tags.includes(tag)
      );
    }

    // Get total count
    const totalSnapshot = await db.collection('documents')
      .where('userId', '==', uid)
      .get();

    res.json({
      success: true,
      data: {
        documents,
        pagination: {
          total: totalSnapshot.size,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: totalSnapshot.size > parseInt(offset) + parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get single document
router.get('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;

    const doc = await db.collection('documents').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const document = doc.data();
    
    if (document.userId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        document: {
          id: doc.id,
          ...document
        }
      }
    });

  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update document
router.put('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;
    const { error, value } = documentUpdateSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const doc = await db.collection('documents').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const document = doc.data();
    
    if (document.userId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updateData = {
      ...value,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('documents').doc(id).update(updateData);

    // Update expiry notification if expiry date changed
    if (value.expiryDate && value.expiryDate !== document.extractedData?.expiryDate) {
      await scheduleExpiryNotification(uid, id, value.expiryDate);
    }

    res.json({
      success: true,
      message: 'Document updated successfully'
    });

  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update document',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete document
router.delete('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;

    const doc = await db.collection('documents').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const document = doc.data();
    
    if (document.userId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete file from storage
    try {
      await bucket.file(document.fileName).delete();
    } catch (storageError) {
      console.warn('Failed to delete file from storage:', storageError.message);
    }

    // Delete document record
    await db.collection('documents').doc(id).delete();

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Share document
router.post('/:id/share', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;
    const { method, recipient } = req.body;

    if (!method || !recipient) {
      return res.status(400).json({
        success: false,
        message: 'Method and recipient are required'
      });
    }

    const doc = await db.collection('documents').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const document = doc.data();
    
    if (document.userId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Create share record
    const shareId = crypto.randomUUID();
    const shareRecord = {
      id: shareId,
      documentId: id,
      sharedBy: uid,
      sharedWith: recipient,
      method,
      sharedAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // 7 days
    };

    await db.collection('documentShares').doc(shareId).set(shareRecord);

    // Generate share link if method is 'link'
    let shareLink = null;
    if (method === 'link') {
      const [shareURL] = await bucket.file(document.fileName).getSignedUrl({
        action: 'read',
        expires: '03-01-2500'
      });
      shareLink = shareURL;
    }

    res.json({
      success: true,
      message: 'Document shared successfully',
      data: {
        shareId,
        method,
        recipient,
        shareLink,
        expiresAt: shareRecord.expiresAt
      }
    });

  } catch (error) {
    console.error('Share document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share document',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get expiry alerts
router.get('/expiry-alerts/:days', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { days = 30 } = req.params;

    const alertDate = new Date();
    alertDate.setDate(alertDate.getDate() + parseInt(days));

    const snapshot = await db.collection('documents')
      .where('userId', '==', uid)
      .where('extractedData.expiryDate', '<=', admin.firestore.Timestamp.fromDate(alertDate))
      .get();

    const alerts = snapshot.docs.map(doc => {
      const data = doc.data();
      const expiryDate = data.extractedData?.expiryDate?.toDate();
      const daysUntilExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
      
      return {
        id: doc.id,
        name: data.name,
        category: data.category,
        expiryDate: expiryDate,
        daysUntilExpiry,
        isExpired: daysUntilExpiry < 0,
        urgency: daysUntilExpiry <= 5 ? 'high' : daysUntilExpiry <= 15 ? 'medium' : 'low'
      };
    });

    res.json({
      success: true,
      data: {
        alerts,
        totalAlerts: alerts.length,
        expiredCount: alerts.filter(alert => alert.isExpired).length,
        expiringSoonCount: alerts.filter(alert => alert.daysUntilExpiry <= 5 && !alert.isExpired).length
      }
    });

  } catch (error) {
    console.error('Get expiry alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expiry alerts',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper functions
function detectDocumentCategory(text) {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('passport') || lowerText.includes('passport no')) {
    return 'passport';
  } else if (lowerText.includes('visa') || lowerText.includes('visa no')) {
    return 'visa';
  } else if (lowerText.includes('insurance') || lowerText.includes('policy')) {
    return 'insurance';
  } else if (lowerText.includes('vaccination') || lowerText.includes('vaccine')) {
    return 'vaccination';
  } else {
    return 'other';
  }
}

function extractDocumentData(text, category) {
  const extractedData = {};
  const lowerText = text.toLowerCase();

  // Extract dates (DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY formats)
  const dateRegex = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/g;
  const dates = text.match(dateRegex) || [];
  
  if (dates.length > 0) {
    extractedData.dates = dates;
    
    // Try to identify expiry date based on category
    if (category === 'passport' || category === 'visa' || category === 'insurance') {
      // Usually the last date mentioned is the expiry date
      const expiryDate = new Date(dates[dates.length - 1].replace(/[\/\-\.]/g, '/'));
      if (!isNaN(expiryDate.getTime())) {
        extractedData.expiryDate = admin.firestore.Timestamp.fromDate(expiryDate);
      }
    }
  }

  // Extract document numbers
  if (category === 'passport') {
    const passportRegex = /[A-Z]{1,2}\d{6,8}/g;
    const passportNumbers = text.match(passportRegex);
    if (passportNumbers) {
      extractedData.documentNumber = passportNumbers[0];
    }
  }

  // Extract names
  const nameRegex = /([A-Z][a-z]+ [A-Z][a-z]+)/g;
  const names = text.match(nameRegex);
  if (names) {
    extractedData.names = names;
    extractedData.primaryName = names[0];
  }

  return extractedData;
}

function generateDocumentName(extractedData, category) {
  if (extractedData.primaryName) {
    return `${extractedData.primaryName} - ${category.toUpperCase()}`;
  } else if (extractedData.documentNumber) {
    return `${category.toUpperCase()} - ${extractedData.documentNumber}`;
  } else {
    return `${category.toUpperCase()} - ${new Date().toLocaleDateString()}`;
  }
}

function generateTags(extractedData, category) {
  const tags = [category];
  
  if (extractedData.documentNumber) {
    tags.push('has-document-number');
  }
  
  if (extractedData.expiryDate) {
    const expiryDate = extractedData.expiryDate.toDate();
    const daysUntilExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      tags.push('expired');
    } else if (daysUntilExpiry <= 30) {
      tags.push('expiring-soon');
    }
  }
  
  return tags;
}

async function scheduleExpiryNotification(userId, documentId, expiryDate) {
  // This would integrate with a notification service
  // For now, we'll just store the notification record
  
  const notificationId = crypto.randomUUID();
  const notification = {
    id: notificationId,
    userId,
    documentId,
    type: 'document_expiry',
    expiryDate,
    isSent: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await db.collection('notifications').doc(notificationId).set(notification);
}

module.exports = router;
