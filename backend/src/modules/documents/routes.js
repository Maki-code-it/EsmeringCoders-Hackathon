import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { requireAuthenticatedUser } from './userContext.js';
import {
  validateCreateDocument,
  validateDocumentIdParam,
  validateCorrectionPayload,
} from './validators.js';
import {
  handleInitiateUpload,
  handleProcessOcr,
  handleListDocuments,
  handleGetDocument,
  handleUpdateCorrections,
  handleDeleteDocument,
} from './controller.js';

const router = Router();

router.use(requireAuthenticatedUser);

router.get('/', handleListDocuments);
router.post('/upload-url', validateRequest(validateCreateDocument), handleInitiateUpload);
router.get('/:id', validateRequest(validateDocumentIdParam), handleGetDocument);
router.post('/:id/extract', validateRequest(validateDocumentIdParam), handleProcessOcr);
router.patch(
  '/:id',
  validateRequest(validateDocumentIdParam),
  validateRequest(validateCorrectionPayload),
  handleUpdateCorrections,
);
router.delete('/:id', validateRequest(validateDocumentIdParam), handleDeleteDocument);

export default router;