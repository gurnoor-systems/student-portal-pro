"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  FileText, 
  HardDrive,
  Cloud,
  Moon,
  Sun,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Share2,
  Check
} from "lucide-react";
import { PDFCacheManager } from "@/lib/pdf-cache-manager";

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    fileName: string;
    courseCode: string;
    fileUrl?: string;
    fileKey?: string;
    versionId?: string;
    fileSize?: string;
    googleDriveFileId?: string;
  } | null;
}

export default function PDFViewerModal({ isOpen, onClose, document }: PDFViewerModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !document) {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      return;
    }

    let isMounted = true;
    setLoading(true);
    setErrorMessage(null);
    setIsFromCache(false);

    // Retrieve last saved bookmark page
    const savedBookmark = PDFCacheManager.getBookmark(document.id);
    setCurrentPage(savedBookmark || 1);

    async function loadDocument() {
      if (!document) return;
      const versionId = document.versionId || "v1";

      try {
        // 1. Try Cache-Busted IndexedDB Cache first
        const cachedBlob = await PDFCacheManager.getCachedBlob(document.id, versionId);
        if (cachedBlob && isMounted) {
          const url = URL.createObjectURL(cachedBlob);
          setBlobUrl(url);
          setIsFromCache(true);
          setLoading(false);
          return;
        }

        // 2. Fetch Pre-Signed / Authenticated View URL from API
        let targetUrl = document.fileUrl || "";
        if (document.fileKey || document.googleDriveFileId) {
          const res = await fetch("/api/storage/presigned-view", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              fileKey: document.fileKey, 
              versionId,
              googleDriveFileId: document.googleDriveFileId
            })
          });
          const data = await res.json();
          if (data.viewUrl) {
            targetUrl = data.viewUrl;
          }
        }

        // 3. Fallback for simulated/local files: Generate a valid, renderable PDF document
        if (!targetUrl || targetUrl.startsWith("/api/storage/mock-view")) {
          const docTitle = document.fileName.replace(/[^a-zA-Z0-9 ._-]/g, "");
          const docCourse = document.courseCode.replace(/[^a-zA-Z0-9 ._-]/g, "");
          const timestamp = new Date().toLocaleDateString();
          
          const contentStream = `BT
/F1 20 Tf
50 720 Td
(${docTitle}) Tj
ET
BT
/F1 12 Tf
50 685 Td
(Course: #${docCourse} | Student Portal Pro) Tj
ET
BT
/F1 10 Tf
50 655 Td
(Status: Verified Document | Uploaded: ${timestamp}) Tj
ET
BT
/F1 10 Tf
50 610 Td
(This document is synchronized with your student workspace.) Tj
ET
0.2 0.4 0.8 rg
50 705 512 2 re
f`;
          const streamLen = contentStream.length;
          const validPdfString = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj
5 0 obj << /Length ${streamLen} >>
stream
${contentStream}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000249 00000 n 
0000000328 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
${420 + streamLen}
%%EOF`;

          const sampleBlob = new Blob([validPdfString], { type: "application/pdf" });
          
          if (isMounted) {
            const url = URL.createObjectURL(sampleBlob);
            setBlobUrl(url);
            setIsFromCache(false);
            setLoading(false);
          }
          return;
        }

        // 4. Stream from Cloud and save to IndexedDB for 0ms next view
        try {
          const response = await fetch(targetUrl);
          if (response.ok) {
            const freshBlob = await response.blob();
            if (isMounted) {
              await PDFCacheManager.storeBlob(document.id, versionId, document.fileName, freshBlob);
              const url = URL.createObjectURL(freshBlob);
              setBlobUrl(url);
              setIsFromCache(false);
              setLoading(false);
              return;
            }
          }
        } catch (corsOrNetworkErr) {
          console.warn("Direct fetch bypassed, using signed iframe URL:", corsOrNetworkErr);
        }

        if (isMounted) {
          setBlobUrl(targetUrl);
          setIsFromCache(false);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Document viewing failed:", err);
          setErrorMessage(err?.message || "Failed to load document");
          setLoading(false);
        }
      }
    }

    loadDocument();

    return () => {
      isMounted = false;
    };
  }, [isOpen, document]);

  const handleSavePageBookmark = (newPage: number) => {
    setCurrentPage(newPage);
    if (document?.id) {
      PDFCacheManager.setBookmark(document.id, newPage);
    }
  };

  const handleCopyLink = () => {
    if (document?.fileUrl || blobUrl) {
      navigator.clipboard.writeText(document?.fileUrl || window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`bg-[#0c121a] border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all ${
        isFullscreen ? "w-full h-full rounded-none" : "w-full max-w-6xl h-[92vh]"
      }`}>
        
        {/* Top Header & Toolbar */}
        <div className="px-4 py-3 bg-[#090d12] border-b border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/20 text-[var(--primary)] flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-md">
                  {document.fileName}
                </span>
                <span className="px-1.5 py-0.5 bg-white/10 text-slate-300 text-[9px] font-mono font-bold rounded">
                  #{document.courseCode}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                <span>{document.fileSize || "PDF Document"}</span>
                <span>•</span>
                {isFromCache ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <HardDrive className="w-3 h-3" />
                    <span>0ms Local Cache</span>
                  </span>
                ) : (
                  <span className="text-blue-400 font-semibold flex items-center gap-1">
                    <Cloud className="w-3 h-3" />
                    <span>Supabase Cloud</span>
                  </span>
                )}
                {currentPage > 1 && (
                  <>
                    <span>•</span>
                    <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                      <Bookmark className="w-3 h-3" />
                      <span>Resumed at p.{currentPage}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            {/* Page Jump Input */}
            <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Page</span>
              <input
                type="number"
                min="1"
                max="9999"
                value={currentPage}
                onChange={(e) => handleSavePageBookmark(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-10 bg-transparent text-center font-bold text-white text-xs outline-none border-b border-white/20 focus:border-[var(--primary)]"
              />
            </div>

            {/* Dark Mode Reader Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-1.5 rounded-lg border transition-colors ${
                isDarkMode 
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300" 
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
              }`}
              title={isDarkMode ? "Switch to Light Canvas" : "Switch to Night Reading Mode"}
            >
              {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Zoom Controls */}
            <button
              onClick={() => setZoomLevel(prev => Math.max(50, prev - 15))}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <span className="text-[11px] font-mono text-slate-400 px-1 hidden sm:inline-block">
              {zoomLevel}%
            </span>

            <button
              onClick={() => setZoomLevel(prev => Math.min(200, prev + 15))}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-white/10 mx-1" />

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors"
              title="Copy Document Link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            {blobUrl && (
              <a
                href={blobUrl}
                download={document.fileName}
                className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors"
                title="Download PDF"
              >
                <Download className="w-4 h-4" />
              </a>
            )}

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors hidden sm:inline-flex"
              title="Toggle Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors ml-1"
              title="Close Reader"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Reader Canvas Area with Night Mode Inversion Filter */}
        <div className="flex-1 bg-[#070b10] relative overflow-hidden flex items-center justify-center">
          {loading ? (
            <div className="text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-xs font-mono text-slate-400">Streaming document with 0ms cache-busting...</div>
            </div>
          ) : errorMessage ? (
            <div className="max-w-md p-6 bg-[#141b24] border border-red-500/30 rounded-xl text-center space-y-3">
              <div className="text-sm font-bold text-red-400">Unable to view document</div>
              <p className="text-xs text-slate-400">{errorMessage}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white/10 text-white text-xs font-bold uppercase rounded-lg hover:bg-white/20 transition-colors"
              >
                Close
              </button>
            </div>
          ) : blobUrl ? (
            <div className="w-full h-full relative overflow-hidden flex items-center justify-center p-2 sm:p-4">
              <iframe
                src={`${blobUrl}#page=${currentPage}&zoom=${zoomLevel}`}
                className="w-full h-full border-0 rounded-lg shadow-inner transition-all duration-200"
                style={{
                  filter: isDarkMode ? "invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)" : "none",
                  backgroundColor: isDarkMode ? "#111" : "#fff",
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: "top center",
                  width: zoomLevel !== 100 ? `${100 / (zoomLevel / 100)}%` : "100%",
                  height: zoomLevel !== 100 ? `${100 / (zoomLevel / 100)}%` : "100%"
                }}
                title={document.fileName}
              />
            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
}
