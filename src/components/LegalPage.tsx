// Created: 2025-12-22
// Last updated: 2025-12-22 (uses local public paths for PDFs)

import { useEffect, useState } from 'react';
import { ArrowLeft, Download, ExternalLink, FileText, AlertCircle, Loader2 } from 'lucide-react';
import {
  fetchLegalManifest,
  getPdfPublicUrl,
  formatDate,
  type LegalManifest,
  type LegalDocument,
} from '../lib/legalService';

interface LegalPageProps {
  type: 'terms' | 'privacy';
}

export default function LegalPage({ type }: LegalPageProps) {
  const [manifest, setManifest] = useState<LegalManifest | null>(null);
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoadError, setPdfLoadError] = useState(false);

  const title = type === 'terms' ? 'Terms of Service' : 'Privacy Policy';

  useEffect(() => {
    loadDocument();
  }, [type]);

  async function loadDocument() {
    setLoading(true);
    setError(null);
    setPdfLoadError(false);

    const fetchedManifest = await fetchLegalManifest();

    if (!fetchedManifest) {
      setError('Unable to load legal documents. Please try again later.');
      setLoading(false);
      return;
    }

    setManifest(fetchedManifest);

    const doc = type === 'terms' ? fetchedManifest.terms : fetchedManifest.privacy;
    setDocument(doc);

    const url = getPdfPublicUrl(doc.filePath);
    setPdfUrl(url);
    setLoading(false);
  }

  function handleBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  }

  function handleOpenExternal() {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    }
  }

  function handleDownload() {
    if (pdfUrl) {
      const link = window.document.createElement('a');
      link.href = pdfUrl;
      link.download = type === 'terms' ? 'terms-of-service.pdf' : 'privacy-policy.pdf';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  }

  function handlePdfError() {
    setPdfLoadError(true);
  }

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading document...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Unable to Load Document</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleBack}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={loadDocument}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
                {document && (
                  <p className="text-sm text-slate-500">
                    Version {document.version} - Updated {formatDate(document.lastUpdated)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm"
                title="Download PDF"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </button>
              <button
                onClick={handleOpenExternal}
                className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Open</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {pdfLoadError || isMobile ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-2">
                {isMobile ? 'PDF Viewer Not Available on Mobile' : 'Unable to Display PDF'}
              </h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                {isMobile
                  ? 'For the best viewing experience, please open the document externally or download it.'
                  : 'The PDF could not be displayed in your browser. You can still view it by opening or downloading the document.'}
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <button
                  onClick={handleOpenExternal}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Document
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            </div>
          ) : (
            <iframe
              src={`${pdfUrl}#toolbar=1&navpanes=0`}
              className="w-full h-[calc(100vh-180px)] min-h-[600px]"
              title={title}
              onError={handlePdfError}
            />
          )}
        </div>
      </main>
    </div>
  );
}
