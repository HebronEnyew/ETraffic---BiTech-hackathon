/**
 * OCR Verification Service
 * Validates Ethiopian National ID photos using metadata and pattern detection
 */

import fs from 'fs';
import path from 'path';

interface OCRResult {
  isValid: boolean;
  idNumber?: string;
  fullName?: string;
  birthdate?: string;
  countryHeader?: string;
  errors: string[];
}

/**
 * Validate ID photo metadata
 * - File size > 200 KB
 * - File type: JPG, PNG, or PDF
 * - Rectangular aspect ratio (approximate)
 */
export async function validateIDPhotoMetadata(filePath: string): Promise<{
  isValid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  const stats = fs.statSync(filePath);
  const fileSizeKB = stats.size / 1024;

  // Check file size (> 200 KB)
  if (fileSizeKB < 200) {
    errors.push('File size must be greater than 200 KB');
  }

  // Check file extension
  const ext = path.extname(filePath).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.pdf'];
  if (!allowedExts.includes(ext)) {
    errors.push('File must be JPG, PNG, or PDF');
  }

  // For images, check aspect ratio (if it's an image file)
  if (['.jpg', '.jpeg', '.png'].includes(ext)) {
    // Note: In production, use a library like 'sharp' or 'jimp' to get actual dimensions
    // For now, we'll skip aspect ratio check or use a placeholder
    // In real implementation, check if width > height (rectangular)
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * OCR Pattern Detection (Stub)
 * In production, use a real OCR library like Tesseract.js or cloud OCR API
 * 
 * Detects:
 * - ID number pattern (Ethiopian ID format)
 * - Full name
 * - Birthdate
 * - Country header "ETHIOPIA"
 */
export async function detectOCRPatterns(filePath: string): Promise<OCRResult> {
  const errors: string[] = [];
  const result: OCRResult = {
    isValid: false,
    errors: [],
  };

  // Note: This is a stub implementation
  // In production, integrate with:
  // - Tesseract.js for client-side OCR
  // - Google Cloud Vision API
  // - AWS Textract
  // - Azure Computer Vision

  try {
    // Read file content (for images, extract text using OCR)
    // For PDFs, extract text directly
    
    // Placeholder OCR text extraction
    // In real implementation:
    // const ocrText = await extractTextFromImage(filePath);
    const ocrText = ''; // Would contain extracted text from OCR

    // Pattern detection
    // Ethiopian ID pattern: typically 10-13 digits
    const idPattern = /\b\d{10,13}\b/g;
    const idMatch = ocrText.match(idPattern);
    if (idMatch) {
      result.idNumber = idMatch[0];
    } else {
      errors.push('ID number not detected in photo');
    }

    // Country header detection
    if (ocrText.toUpperCase().includes('ETHIOPIA')) {
      result.countryHeader = 'ETHIOPIA';
    } else {
      errors.push('Country header "ETHIOPIA" not detected');
    }

    // Name detection (look for capitalized words, typically 2-4 words)
    const namePattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g;
    const nameMatch = ocrText.match(namePattern);
    if (nameMatch && nameMatch.length > 0) {
      result.fullName = nameMatch[0];
    } else {
      errors.push('Full name not detected in photo');
    }

    // Birthdate detection (common formats: DD/MM/YYYY, DD-MM-YYYY)
    const datePattern = /\b\d{2}[\/\-]\d{2}[\/\-]\d{4}\b/g;
    const dateMatch = ocrText.match(datePattern);
    if (dateMatch) {
      result.birthdate = dateMatch[0];
    } else {
      errors.push('Birthdate not detected in photo');
    }

    result.errors = errors;
    result.isValid = errors.length === 0 && !!result.idNumber && !!result.countryHeader;

    // If all patterns found, consider it valid
    if (result.idNumber && result.countryHeader && result.fullName && result.birthdate) {
      result.isValid = true;
      result.errors = [];
    }
  } catch (error) {
    errors.push('OCR processing failed');
    result.errors = errors;
    result.isValid = false;
  }

  return result;
}

/**
 * Complete ID photo verification
 * Combines metadata validation and OCR pattern detection
 */
export async function verifyIDPhoto(filePath: string): Promise<OCRResult & {
  metadataValid: boolean;
}> {
  const metadataResult = await validateIDPhotoMetadata(filePath);
  const ocrResult = await detectOCRPatterns(filePath);

  return {
    ...ocrResult,
    metadataValid: metadataResult.isValid,
    isValid: metadataResult.isValid && ocrResult.isValid,
    errors: [...metadataResult.errors, ...ocrResult.errors],
  };
}

