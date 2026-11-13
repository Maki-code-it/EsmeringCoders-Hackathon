import { api } from '@/services/apiClient.js';
import { getSupabaseClient } from '@/config/supabase.js';

// Uploads a document to the private Supabase `documents` bucket using a backend-issued signed upload token, then triggers Lumen OCR extraction.
export async function uploadAndExtractDocument(file, documentType) {
  const { document, upload } = await api.post('/documents/upload-url', {
    document_type: documentType,
    file_name: file.name,
    file_type: file.type,
    file_size: file.size,
  });

  const supabase = getSupabaseClient();
  if (supabase && upload?.path && upload?.token) {
    const { error: storageError } = await supabase.storage
      .from('documents')
      .uploadToSignedUrl(upload.path, upload.token, file, {
        contentType: file.type,
      });

    if (storageError) {
      throw new Error(storageError.message || 'Failed to upload file to secure storage');
    }
  }

  const extracted = await api.post(`/documents/${document.id}/extract`);
  return extracted.document;
}

export async function listDocuments(documentType) {
  const query = documentType ? `?document_type=${encodeURIComponent(documentType)}` : '';
  const data = await api.get(`/documents${query}`);
  return data.documents || [];
}

export async function getDocument(documentId) {
  const data = await api.get(`/documents/${documentId}`);
  return data.document;
}

export async function reExtractDocument(documentId) {
  const data = await api.post(`/documents/${documentId}/extract`);
  return data.document;
}

export async function saveDocumentCorrections(documentId, payload) {
  const data = await api.patch(`/documents/${documentId}`, payload);
  return data.document;
}

export async function deleteDocument(documentId) {
  return api.delete(`/documents/${documentId}`);
}