import { useCallback, useEffect, useState } from 'react';
import { Calculator } from 'lucide-react';
import PageHeader from '@/components/PageHeader.jsx';
import { Button } from '@/components/ui/button.jsx';
import DocumentUploader from './components/DocumentUploader.jsx';
import ExtractedDataEditor from './components/ExtractedDataEditor.jsx';
import DocumentList from './components/DocumentList.jsx';
import {
  uploadAndExtractDocument,
  listDocuments,
  reExtractDocument,
  saveDocumentCorrections,
  deleteDocument,
} from './services/documentService.js';

export default function DocumentsPage({ onNavigate }) {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');

  const refreshDocuments = useCallback(async () => {
    setLoadingList(true);
    setLoadError('');
    try {
      const items = await listDocuments();
      setDocuments(items);
      setSelectedDoc((prev) =>
        prev ? items.find((item) => item.id === prev.id) || items[0] || null : items[0] || null,
      );
    } catch (err) {
      setLoadError(err?.message || 'Unable to load your uploaded documents.');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  const handleUploadComplete = async (file, documentType) => {
    const created = await uploadAndExtractDocument(file, documentType);
    setDocuments((prev) => [created, ...prev]);
    setSelectedDoc(created);
  };

  const handleSaveCorrections = async (documentId, payload) => {
    const updated = await saveDocumentCorrections(documentId, payload);
    setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    setSelectedDoc(updated);
  };

  const handleReExtract = async (documentId) => {
    const updated = await reExtractDocument(documentId);
    setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    setSelectedDoc(updated);
  };

  const handleDelete = async (documentId) => {
    // Native confirm keeps this simple and accessible (same as the payroll page).
    // eslint-disable-next-line no-alert
    if (!window.confirm('Delete this document? Its extracted text and contract reviews are removed. Saved payroll breakdowns stay.')) return;
    setActionError('');
    try {
      await deleteDocument(documentId);
    } catch (err) {
      setActionError(err?.message || 'Could not delete this document. Please try again.');
      return;
    }
    setDocuments((prev) => prev.filter((d) => d.id !== documentId));
    setSelectedDoc((current) => {
      if (current?.id !== documentId) return current;
      return documents.find((d) => d.id !== documentId) || null;
    });
  };

  return (
    <>
      <PageHeader
        title="Documents &amp; OCR"
        description="Upload your payslip or contract, extract text with Lumen OCR, and verify the fields."
      >
        {onNavigate && selectedDoc?.document_type === 'payslip' && (
          <Button variant="outline" onClick={() => onNavigate('payroll', { documentId: selectedDoc.id })}>
            <Calculator className="h-4 w-4" aria-hidden="true" />
            Analyze in Payroll
          </Button>
        )}
      </PageHeader>

      <div className="space-y-6">
        <DocumentUploader onUploadComplete={handleUploadComplete} />

        {actionError && (
          <p role="alert" className="text-sm text-destructive">
            {actionError}
          </p>
        )}

        {selectedDoc && (
          <ExtractedDataEditor
            document={selectedDoc}
            onSave={handleSaveCorrections}
            onReExtract={handleReExtract}
          />
        )}

        {loadingList ? (
          <p role="status" className="text-sm text-muted-foreground">
            Loading your documents…
          </p>
        ) : loadError ? (
          <p role="alert" className="text-sm text-destructive">
            {loadError}
          </p>
        ) : (
          <DocumentList
            documents={documents}
            selectedId={selectedDoc?.id}
            onSelect={setSelectedDoc}
            onDelete={handleDelete}
          />
        )}
      </div>
    </>
  );
}