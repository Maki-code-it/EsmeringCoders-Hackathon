import { useRef, useState } from 'react';
import { FileUp, FileText, AlertCircle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { validateSelectedFile } from '../lib/documentValidation.js';

export default function DocumentUploader({ onUploadComplete }) {
  const inputRef = useRef(null);
  const [documentType, setDocumentType] = useState('payslip');
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFilePick = (file) => {
    setError('');
    const validationError = validateSelectedFile(file);
    if (validationError) {
      setSelectedFile(null);
      setError(validationError);
      return;
    }
    setSelectedFile(file);
  };

  const handleRemoveFile = (event) => {
    // Do not let the click reach the drop zone, which would open the file picker.
    event.stopPropagation();
    setSelectedFile(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) handleFilePick(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateSelectedFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setError('');
    try {
      await onUploadComplete(selectedFile, documentType);
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err) {
      setError(err?.message || 'Upload and OCR extraction failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Document for OCR Extraction</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Document type">
            {[
              { id: 'payslip', label: 'Payslip' },
              { id: 'contract', label: 'Employment Contract' },
            ].map((type) => (
              <Button
                key={type.id}
                type="button"
                variant={documentType === type.id ? 'default' : 'outline'}
                onClick={() => setDocumentType(type.id)}
                disabled={uploading}
              >
                {type.label}
              </Button>
            ))}
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-accent/60'
                : 'border-border hover:border-primary/60 hover:bg-accent/30'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => handleFilePick(e.target.files?.[0])}
              disabled={uploading}
            />
            {selectedFile ? (
              <>
                <FileText className="mb-2 h-8 w-8 text-primary" aria-hidden="true" />
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB — Click to choose a different file
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={handleRemoveFile}
                  disabled={uploading}
                  aria-label={`Remove ${selectedFile.name}`}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  Remove file
                </Button>
              </>
            ) : (
              <>
                <FileUp className="mb-2 h-8 w-8 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm font-medium">
                  Drag and drop your {documentType} here, or click to browse
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Supports PDF, PNG, JPG, and WEBP up to 10 MB
                </p>
              </>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive"
            >
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={!selectedFile || uploading}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Extracting with Lumen OCR…
                </>
              ) : (
                <>
                  <FileUp className="h-4 w-4" aria-hidden="true" />
                  Upload &amp; Extract Text
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}