import crypto from 'node:crypto';
import { AppError } from '../../middleware/apiResponse.js';
import { sanitizeFileName } from './validators.js';
import { extractWithLumenOcr } from './ocrService.js';
import {
  createDocumentRecord,
  listUserDocuments,
  getUserDocumentById,
  updateUserDocument,
  deleteUserDocument,
  createSignedUploadTarget,
  downloadPrivateDocument,
  createShortLivedDownloadUrl,
} from './repository.js';

/**
 * Step 1 of upload: generates a deterministic private Storage path
 * (<user_id>/<document_id>/<sanitized_filename>) and signed upload URL
 * so files bypass Express's 1 MB JSON body limit safely.
 */
export const initiateDocumentUpload = async (userId, { document_type, file_name, file_type, file_size }) => {
  const documentId = crypto.randomUUID();
  const cleanName = sanitizeFileName(file_name);
  const filePath = `${userId}/${documentId}/${cleanName}`;

  const uploadTarget = await createSignedUploadTarget(filePath);
  const document = await createDocumentRecord({
    id: documentId,
    user_id: userId,
    document_type,
    file_name: cleanName,
    file_path: filePath,
    file_type: file_type || null,
    file_size: file_size ? Number(file_size) : null,
    status: 'uploaded',
  });

  return {
    document,
    upload: {
      path: uploadTarget.path,
      token: uploadTarget.token,
      signedUrl: uploadTarget.signedUrl,
    },
  };
};

/**
 * Step 2 of upload (or re-run): downloads the private file from Storage,
 * runs Lumen OCR extraction on the backend, and persists extracted text & fields.
 */
export const processDocumentOcr = async (userId, documentId) => {
  const existing = await getUserDocumentById(userId, documentId);

  const expectedPrefix = `${userId}/`;
  if (!existing.file_path.startsWith(expectedPrefix)) {
    throw new AppError('Invalid storage path ownership', 403, 'FORBIDDEN_STORAGE_PATH');
  }

  await updateUserDocument(userId, documentId, {
    status: 'processing',
    error_message: null,
  });

  try {
    const fileBuffer = await downloadPrivateDocument(existing.file_path);
    const { extractedText, extractedData } = await extractWithLumenOcr({
      fileBuffer,
      fileName: existing.file_name,
      fileType: existing.file_type,
      documentType: existing.document_type,
    });

    return await updateUserDocument(userId, documentId, {
      extracted_text: extractedText,
      extracted_data: extractedData,
      status: 'completed',
      error_message: null,
    });
  } catch (err) {
    const safeMessage =
      err instanceof AppError ? err.message : 'Document OCR extraction failed';
    await updateUserDocument(userId, documentId, {
      status: 'failed',
      error_message: safeMessage,
    });
    throw err;
  }
};

export const getDocumentsForUser = async (userId, filters) =>
  listUserDocuments(userId, filters);

export const getDocumentDetail = async (userId, documentId) => {
  const document = await getUserDocumentById(userId, documentId);
  const previewUrl = await createShortLivedDownloadUrl(document.file_path, 300);
  return { ...document, preview_url: previewUrl };
};

/**
 * Saves user corrections to extracted fields or raw extracted text.
 */
export const saveDocumentCorrections = async (
  userId,
  documentId,
  { extracted_data, extracted_text, document_type },
) => {
  const existing = await getUserDocumentById(userId, documentId);

  const updates = {};
  if (document_type !== undefined) {
    updates.document_type = document_type;
  }
  if (extracted_text !== undefined) {
    updates.extracted_text = extracted_text;
  }
  if (extracted_data !== undefined) {
    updates.extracted_data = {
      ...(existing.extracted_data || {}),
      ...extracted_data,
      verified_by_user: true,
      verified_at: new Date().toISOString(),
    };
  }
  if (existing.status === 'uploaded' || existing.status === 'failed') {
    updates.status = 'completed';
    updates.error_message = null;
  }

  return updateUserDocument(userId, documentId, updates);
};

export const removeDocument = async (userId, documentId) => {
  const existing = await getUserDocumentById(userId, documentId);
  await deleteUserDocument(userId, documentId, existing.file_path);
};