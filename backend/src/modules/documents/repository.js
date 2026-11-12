import { getSupabaseAdminClient } from '../../config/supabase.js';
import { AppError } from '../../middleware/apiResponse.js';

const DOCUMENTS_BUCKET = 'documents';
const DOCUMENT_COLUMNS =
  'id, user_id, document_type, file_name, file_path, file_type, file_size, extracted_text, extracted_data, status, error_message, created_at, updated_at';

export const createDocumentRecord = async (record) => {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('documents')
    .insert(record)
    .select(DOCUMENT_COLUMNS)
    .single();

  if (error) {
    throw new AppError('Failed to save document metadata', 500, 'DOCUMENT_CREATE_FAILED');
  }
  return data;
};

export const listUserDocuments = async (userId, { documentType } = {}) => {
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from('documents')
    .select(DOCUMENT_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (documentType) {
    query = query.eq('document_type', documentType);
  }

  const { data, error } = await query;
  if (error) {
    throw new AppError('Failed to load documents', 500, 'DOCUMENTS_FETCH_FAILED');
  }
  return data || [];
};

export const getUserDocumentById = async (userId, documentId) => {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('documents')
    .select(DOCUMENT_COLUMNS)
    .eq('id', documentId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new AppError('Failed to fetch document', 500, 'DOCUMENT_FETCH_FAILED');
  }
  if (!data) {
    throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
  }
  return data;
};

export const updateUserDocument = async (userId, documentId, updates) => {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', documentId)
    .eq('user_id', userId)
    .select(DOCUMENT_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new AppError('Failed to update document', 500, 'DOCUMENT_UPDATE_FAILED');
  }
  if (!data) {
    throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
  }
  return data;
};

export const deleteUserDocument = async (userId, documentId, filePath) => {
  const supabase = getSupabaseAdminClient();

  if (filePath) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([filePath]);
  }

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)
    .eq('user_id', userId);

  if (error) {
    throw new AppError('Failed to delete document', 500, 'DOCUMENT_DELETE_FAILED');
  }
};

export const createSignedUploadTarget = async (filePath) => {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUploadUrl(filePath);

  if (error || !data) {
    throw new AppError('Failed to prepare secure file upload', 500, 'STORAGE_UPLOAD_URL_FAILED');
  }
  return data;
};

export const downloadPrivateDocument = async (filePath) => {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).download(filePath);

  if (error || !data) {
    throw new AppError('Uploaded file could not be retrieved from storage', 404, 'STORAGE_FILE_MISSING');
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

export const createShortLivedDownloadUrl = async (filePath, expiresInSeconds = 300) => {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(filePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    return null;
  }
  return data.signedUrl;
};