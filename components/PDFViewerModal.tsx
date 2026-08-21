"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2, 
  FileText, 
  ExternalLink,
  ShieldCheck,
  HardDrive,
  Cloud,
  CheckCircle2
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
  } | null;
}

export default function PDFViewerModal({ isOpen, onClose, document }: PDFViewerModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
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

        // 2. Fetch Pre-Signed View URL from API
        let targetUrl = document.fileUrl || "";
        if (document.fileKey) {
          const res = await fetch("/api/storage/presigned-view", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileKey: document.fileKey, versionId })
          });
          const data = await res.json();
          if (data.viewUrl) {
            targetUrl = data.viewUrl;
          }
        }

        // Fallback for simulated/local files
        if (!targetUrl || targetUrl.startsWith("/api/storage/mock-view")) {
          // Create dummy sample PDF preview if simulated
          const sampleBlob = new Blob([
            `%PDF-1.4\n1 0 obj\n<< /Title (${document.fileName}) >>\nendobj\n%%EOF`
          ], { type: "application/pdf" });
          
          if (isMounted) {
            const url = URL.createObjectURL(sampleBlob);
            setBlobUrl(url);
            setIsFromCache(false);
            setLoading(false);
          }
          return;
        }

        // 3. Stream from Cloudflare R2 and save to IndexedDB for 0ms next view
        const response = await fetch(targetUrl);
        if (!response.ok) throw new Error("Could not download file from cloud storage");
        const freshBlob = await response.blob();

        if (isMounted) {
          // Cache in IndexedDB
          await PDFCacheManager.storeBlob(document.id, versionId, document.fileName, freshBlob);
          const url = URL.createObjectURL(freshBlob);
          setBlobUrl(url);
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

  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`bg-[#0c121a] border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all ${
        isFullscreen ? "w-full h-full rounded-none" : "w-full max-w-5xl h-[90vh]"
      }`}>
        
        {/* Top Control Bar */}
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
                    <span>Cloud Stream</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setZoomLevel(prev => Math.max(50, prev - 15))}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <span className="text-[11px] font-mono text-slate-400 px-1">
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

        {/* PDF Reader Canvas Area */}
        <div className="flex-1 bg-[#070b10] relative overflow-auto flex items-center justify-center p-4">
          {loading ? (
            <div className="text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-xs font-mono text-slate-400">Loading document with cache verification...</div>
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
            <iframe
              src={`${blobUrl}#zoom=${zoomLevel}`}
              className="w-full h-full border-0 rounded-lg shadow-inner bg-white"
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: "top center",
                width: zoomLevel !== 100 ? `${100 / (zoomLevel / 100)}%` : "100%",
                height: zoomLevel !== 100 ? `${100 / (zoomLevel / 100)}%` : "100%"
              }}
              title={document.fileName}
            />
          ) : null}
        </div>

      </div>
    </div>
  );
}
