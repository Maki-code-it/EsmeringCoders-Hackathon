import { sendSuccess } from '../../middleware/apiResponse.js';
import {
  initiateDocumentUpload,
  processDocumentOcr,
  getDocumentsForUser,
  getDocumentDetail,
  saveDocumentCorrections,
  removeDocument,
} from './service.js';

export const handleInitiateUpload = async (req, res, next) => {
  try {
    const result = await initiateDocumentUpload(req.documentUserId, req.body);
    return sendSuccess(res, result, 'Upload initialized', 201);
  } catch (error) {
    return next(error);
  }
};

export const handleProcessOcr = async (req, res, next) => {
  try {
    const document = await processDocumentOcr(req.documentUserId, req.params.id);
    return sendSuccess(res, { document }, 'Document text extracted successfully');
  } catch (error) {
    return next(error);
  }
};

export const handleListDocuments = async (req, res, next) => {
  try {
    const documentType =
      req.query?.document_type === 'payslip' || req.query?.document_type === 'contract'
        ? req.query.document_type
        : undefined;
    const documents = await getDocumentsForUser(req.documentUserId, { documentType });
    return sendSuccess(res, { documents }, 'Documents retrieved');
  } catch (error) {
    return next(error);
  }
};

export const handleGetDocument = async (req, res, next) => {
  try {
    const document = await getDocumentDetail(req.documentUserId, req.params.id);
    return sendSuccess(res, { document }, 'Document retrieved');
  } catch (error) {
    return next(error);
  }
};

export const handleUpdateCorrections = async (req, res, next) => {
  try {
    const document = await saveDocumentCorrections(
      req.documentUserId,
      req.params.id,
      req.body,
    );
    return sendSuccess(res, { document }, 'Document corrections saved');
  } catch (error) {
    return next(error);
  }
};

export const handleDeleteDocument = async (req, res, next) => {
  try {
    await removeDocument(req.documentUserId, req.params.id);
    return sendSuccess(res, { id: req.params.id }, 'Document deleted');
  } catch (error) {
    return next(error);
  }
};