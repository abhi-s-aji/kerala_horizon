const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const sharp = require('sharp');
const { 
  addDocument, 
  getDocument, 
  updateDocument, 
  deleteDocument,
  queryDocuments,
  uploadFile,
  COLLECTIONS 
} = require('../services/firebase');
const { scheduleExpiryNotification } = require('../services/notificationService');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Upload and process document
router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { name, type, tags = [], expiryDate, notes = '' } = req.body;
    const userId = req.user.uid;

    // Process image with Sharp
    const processedImage = await sharp(req.file.buffer)
      .resize(800, 600, { fit: 'inside' })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Upload to Firebase Storage
    const fileName = `documents/${userId}/${Date.now()}_${req.file.originalname}`;
    const uploadResult = await uploadFile('kerala-horizon.appspot.com', fileName, processedImage, {
      userId,
      type: 'document'
    });

    // Create document record
    const documentData = {
      userId,
      name: name || req.file.originalname,
      type: type || 'other',
      tags: Array.isArray(tags) ? tags : [tags],
      expiryDate: expiryDate || null,
      notes,
      fileUrl: uploadResult.publicUrl,
      fileName: uploadResult.name,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      thumbnailUrl: uploadResult.publicUrl, // In production, create thumbnail
      isEncrypted: true,
      isOfflineAvailable: true,
      createdAt: new Date().toISOString()
    };

    const document = await addDocument(COLLECTIONS.WALLET, documentData);

    // Schedule expiry notification if expiry date is provided
    if (expiryDate) {
      await scheduleExpiryNotification(document);
    }

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      document: {
        id: document.id,
        name: document.name,
        type: document.type,
        tags: document.tags,
        expiryDate: document.expiryDate,
        fileUrl: document.fileUrl,
        thumbnailUrl: document.thumbnailUrl,
        createdAt: document.createdAt
      }
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document'
    });
  }
});

// Scan document with OCR
router.post('/scan', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image uploaded'
      });
    }

    const userId = req.user.uid;

    // Process image for OCR
    const processedImage = await sharp(req.file.buffer)
      .resize(1200, 800, { fit: 'inside' })
      .jpeg({ quality: 90 })
      .toBuffer();

    // Simulate OCR processing
    const ocrResult = await processOCR(processedImage);

    // Upload processed image
    const fileName = `scanned/${userId}/${Date.now()}_scanned.jpg`;
    const uploadResult = await uploadFile('kerala-horizon.appspot.com', fileName, processedImage, {
      userId,
      type: 'scanned_document'
    });

    res.json({
      success: true,
      message: 'Document scanned successfully',
      ocrResult: {
        extractedText: ocrResult.text,
        confidence: ocrResult.confidence,
        documentType: ocrResult.documentType,
        fields: ocrResult.fields,
        suggestedTags: ocrResult.suggestedTags
      },
      imageUrl: uploadResult.publicUrl
    });
  } catch (error) {
    console.error('Document scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to scan document'
    });
  }
});

// Get user documents
router.get('/documents', async (req, res) => {
  try {
    const { type, tag, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const userId = req.user.uid;

    let conditions = [
      { field: 'userId', operator: '==', value: userId }
    ];

    if (type && type !== 'all') {
      conditions.push({ field: 'type', operator: '==', value: type });
    }

    if (tag) {
      conditions.push({ field: 'tags', operator: 'array-contains', value: tag });
    }

    const documents = await queryDocuments(COLLECTIONS.WALLET, conditions);

    // Filter by search term if provided
    let filteredDocuments = documents;
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredDocuments = documents.filter(doc => 
        doc.name.toLowerCase().includes(searchTerm) ||
        doc.notes.toLowerCase().includes(searchTerm) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Sort documents
    filteredDocuments.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    res.json({
      success: true,
      documents: filteredDocuments.map(doc => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        tags: doc.tags,
        expiryDate: doc.expiryDate,
        thumbnailUrl: doc.thumbnailUrl,
        fileSize: doc.fileSize,
        createdAt: doc.createdAt,
        isExpiring: doc.expiryDate ? isExpiringSoon(doc.expiryDate) : false
      })),
      total: filteredDocuments.length
    });
  } catch (error) {
    console.error('Documents fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents'
    });
  }
});

// Get document details
router.get('/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const document = await getDocument(COLLECTIONS.WALLET, id);
    
    if (!document || document.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.json({
      success: true,
      document: {
        id: document.id,
        name: document.name,
        type: document.type,
        tags: document.tags,
        expiryDate: document.expiryDate,
        notes: document.notes,
        fileUrl: document.fileUrl,
        thumbnailUrl: document.thumbnailUrl,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        createdAt: document.createdAt,
        isExpiring: document.expiryDate ? isExpiringSoon(document.expiryDate) : false
      }
    });
  } catch (error) {
    console.error('Document details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document details'
    });
  }
});

// Update document
router.put('/documents/:id', [
  body('name').optional().isString(),
  body('tags').optional().isArray(),
  body('expiryDate').optional().isISO8601(),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const userId = req.user.uid;
    const updateData = req.body;

    // Check if document exists and belongs to user
    const document = await getDocument(COLLECTIONS.WALLET, id);
    if (!document || document.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Update document
    const updatedDocument = await updateDocument(COLLECTIONS.WALLET, id, {
      ...updateData,
      updatedAt: new Date().toISOString()
    });

    // Reschedule expiry notification if expiry date changed
    if (updateData.expiryDate) {
      await scheduleExpiryNotification(updatedDocument);
    }

    res.json({
      success: true,
      message: 'Document updated successfully',
      document: updatedDocument
    });
  } catch (error) {
    console.error('Document update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update document'
    });
  }
});

// Delete document
router.delete('/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    // Check if document exists and belongs to user
    const document = await getDocument(COLLECTIONS.WALLET, id);
    if (!document || document.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Delete from storage
    if (document.fileName) {
      await deleteFile('kerala-horizon.appspot.com', document.fileName);
    }

    // Delete from database
    await deleteDocument(COLLECTIONS.WALLET, id);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Document deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document'
    });
  }
});

// Get expiry alerts
router.get('/expiry-alerts', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { days = 30 } = req.query;

    const documents = await queryDocuments(COLLECTIONS.WALLET, [
      { field: 'userId', operator: '==', value: userId },
      { field: 'expiryDate', operator: '!=', value: null }
    ]);

    const expiringDocuments = documents.filter(doc => {
      if (!doc.expiryDate) return false;
      const expiryDate = new Date(doc.expiryDate);
      const today = new Date();
      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= parseInt(days) && diffDays >= 0;
    });

    res.json({
      success: true,
      alerts: expiringDocuments.map(doc => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        expiryDate: doc.expiryDate,
        daysRemaining: Math.ceil((new Date(doc.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)),
        isExpired: new Date(doc.expiryDate) < new Date()
      }))
    });
  } catch (error) {
    console.error('Expiry alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expiry alerts'
    });
  }
});

// Share document
router.post('/documents/:id/share', [
  body('method').isIn(['whatsapp', 'email', 'bluetooth', 'copy']),
  body('recipient').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { method, recipient } = req.body;
    const userId = req.user.uid;

    const document = await getDocument(COLLECTIONS.WALLET, id);
    if (!document || document.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const shareResult = await shareDocument(document, method, recipient);

    res.json({
      success: true,
      message: 'Document shared successfully',
      shareResult
    });
  } catch (error) {
    console.error('Document share error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share document'
    });
  }
});

// Helper functions
async function processOCR(imageBuffer) {
  try {
    // Mock OCR processing - in production, use Google Vision API or Tesseract
    const mockOCRResult = {
      text: 'PASSPORT\nJOHN DOE\nA12345678\nEXP: 12/31/2025\nUSA',
      confidence: 0.95,
      documentType: 'passport',
      fields: {
        name: 'John Doe',
        documentNumber: 'A12345678',
        expiryDate: '2025-12-31',
        issuingCountry: 'USA'
      },
      suggestedTags: ['passport', 'travel', 'international']
    };

    return mockOCRResult;
  } catch (error) {
    console.error('OCR processing error:', error);
    throw error;
  }
}

function isExpiringSoon(expiryDate, days = 30) {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= days && diffDays >= 0;
}

async function shareDocument(document, method, recipient) {
  try {
    const shareData = {
      name: document.name,
      type: document.type,
      url: document.fileUrl,
      thumbnail: document.thumbnailUrl
    };

    switch (method) {
      case 'whatsapp':
        return {
          method: 'whatsapp',
          url: `https://wa.me/?text=${encodeURIComponent(`Check out this document: ${document.name}`)}`,
          message: 'WhatsApp share link generated'
        };
      
      case 'email':
        return {
          method: 'email',
          url: `mailto:${recipient}?subject=${encodeURIComponent(`Document: ${document.name}`)}&body=${encodeURIComponent(`Please find the document: ${document.name}`)}`,
          message: 'Email share link generated'
        };
      
      case 'bluetooth':
        return {
          method: 'bluetooth',
          message: 'Bluetooth sharing initiated',
          data: shareData
        };
      
      case 'copy':
        return {
          method: 'copy',
          message: 'Document details copied to clipboard',
          data: shareData
        };
      
      default:
        throw new Error('Invalid share method');
    }
  } catch (error) {
    console.error('Share document error:', error);
    throw error;
  }
}

module.exports = router;










