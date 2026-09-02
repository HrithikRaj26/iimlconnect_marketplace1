import React, { useState } from "react";
import { ChatMessage } from "@/types";
import { MessageTicks } from "@/components/chat/MessageTicks";
import { CURRENT_USER_ID } from "@/constants/chat";
import { useToast } from "@/context/ToastContext";
import { Pencil, Trash2, FileText, X } from "lucide-react";

interface TextBubbleProps {
  message: ChatMessage;
  time: string;
  onRetry: (id: string) => void;
  onEdit?: (id: string, text: string) => void;
  onDelete?: (id: string) => void;
}

export function TextBubble({ message, time, onRetry, onEdit, onDelete }: TextBubbleProps) {
  const isMine = message.authorId === CURRENT_USER_ID;
  const msgText = message.text || "";
  const isPdf = msgText.startsWith("data:application/pdf") || (msgText.startsWith("http") && msgText.toLowerCase().includes(".pdf"));
  
  let pdfName = "Shared Document.pdf";
  if (msgText.startsWith("http")) {
    const parts = msgText.split("/");
    const lastPart = parts[parts.length - 1];
    if (lastPart && lastPart.toLowerCase().endsWith(".pdf")) {
      pdfName = decodeURIComponent(lastPart);
    }
  }

  const [showPreview, setShowPreview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(msgText);
  const { confirmAction } = useToast();

  // Sync state if text changes (e.g. edited by another client)
  React.useEffect(() => {
    setEditText(msgText);
  }, [msgText]);

  // Listen to Escape key to close the lightbox preview modal
  React.useEffect(() => {
    if (!showPreview) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowPreview(false);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showPreview]);

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editText.trim()) return;
    if (onEdit) {
      onEdit(message.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleDeleteClick = () => {
    confirmAction(
      "Are you sure you want to delete this message? This cannot be undone.",
      () => {
        if (onDelete) {
          onDelete(message.id);
        }
      },
      "Delete Message",
      "danger"
    );
  };

  return (
    <div className={["flex group items-end gap-2", isMine ? "justify-end" : "justify-start"].join(" ")}>
      {isMine && !isEditing && message.status !== "failed" && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150 shrink-0 items-center mb-1">
          {message.kind === "text" && !msgText.startsWith("data:") && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              aria-label="Edit message"
              className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              <Pencil size={11} />
              <span>Edit</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleDeleteClick}
            aria-label="Delete message"
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
          >
            <Trash2 size={11} />
            <span>Delete</span>
          </button>
        </div>
      )}

      <div className={["max-w-[75%]", isMine ? "items-end" : "items-start"].join(" ")}>
        <div
          className={[
            "rounded-2xl px-4 py-2.5 text-sm min-w-[140px]",
            isMine
              ? "rounded-br-sm bg-brand text-white shadow-md shadow-brand/20"
              : "rounded-bl-sm bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100",
          ].join(" ")}
        >
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-1.5 min-w-[150px] w-full">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full bg-white/10 text-white rounded-lg px-2.5 py-1.5 outline-none text-xs border border-white/20 focus:border-white/40 font-medium"
                autoFocus
              />
              <div className="flex gap-2 justify-end text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    setEditText(msgText);
                    setIsEditing(false);
                  }}
                  className="text-white/60 hover:text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-sky-300 font-extrabold hover:text-white"
                >
                  Save
                </button>
              </div>
            </form>
          ) : msgText.startsWith("data:image/") || (msgText.startsWith("http") && (msgText.match(/\.(jpeg|jpg|gif|png|webp)/i))) ? (
            <div className="overflow-hidden rounded-lg max-w-full cursor-zoom-in" onClick={() => setShowPreview(true)}>
              <img src={msgText} alt="Attachment" className="max-h-60 max-w-full rounded-lg object-cover hover:brightness-95 transition-all" />
            </div>
          ) : isPdf ? (
            <div className="flex items-center gap-3.5 py-2 px-1 rounded-xl bg-white/5 dark:bg-black/20 border border-white/10 dark:border-white/5 shadow-inner min-w-[200px] sm:min-w-[260px]">
              {/* PDF Icon Badge */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 shadow-sm animate-pulse">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-extrabold truncate text-gray-900 dark:text-gray-100 hover:underline cursor-pointer" onClick={() => setShowPreview(true)}>
                  {pdfName}
                </span>
                <span className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 mt-0.5">
                  PDF Document (1.4 MB)
                </span>
                <div className="flex gap-3 mt-1.5 select-none">
                  <a
                    href={msgText}
                    download={pdfName}
                    className={["text-[10px] font-black tracking-wide uppercase hover:underline", isMine ? "text-blue-100 hover:text-white" : "text-brand hover:text-brand-dark"].join(" ")}
                  >
                    Download
                  </a>
                  <span className={isMine ? "text-white/20 text-[10px]" : "text-gray-300 dark:text-gray-700 text-[10px]"}>|</span>
                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className={["text-[10px] font-black tracking-wide uppercase hover:underline", isMine ? "text-blue-100 hover:text-white" : "text-brand hover:text-brand-dark"].join(" ")}
                  >
                    Preview
                  </button>
                </div>
              </div>
            </div>
          ) : msgText.startsWith("data:") ? (
            <div className="flex items-center gap-3 py-1.5 px-0.5">
              <span className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 cursor-pointer transition-colors" onClick={() => setShowPreview(true)} title="Preview File">
                <FileText size={20} />
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold truncate max-w-[150px] cursor-pointer hover:underline" onClick={() => setShowPreview(true)}>
                  Attachment File
                </span>
                <div className="flex gap-2.5 mt-1">
                  <a
                    href={msgText}
                    download="attachment"
                    className={["text-[10px] underline font-black", isMine ? "text-blue-100 hover:text-white" : "text-brand hover:text-brand-dark"].join(" ")}
                  >
                    Download
                  </a>
                  <span className={isMine ? "text-blue-200/50 text-[10px]" : "text-gray-300 text-[10px]"}>|</span>
                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className={["text-[10px] underline font-black", isMine ? "text-blue-100 hover:text-white" : "text-brand hover:text-brand-dark"].join(" ")}
                  >
                    Preview
                  </button>
                </div>
              </div>
            </div>
          ) : (
            msgText
          )}
        </div>
        <div
          className={[
            "mt-1 flex items-center gap-1.5 px-1 text-[10px]",
            isMine ? "justify-end text-gray-400" : "text-gray-400",
          ].join(" ")}
        >
          <span>{time}</span>
          {isMine && <MessageTicks status={message.status} />}
        </div>
        {isMine && message.status === "failed" && (
          <button
            type="button"
            onClick={() => onRetry(message.id)}
            className="mt-0.5 px-1 text-[11px] font-semibold text-red-500 underline"
          >
            Tap to retry
          </button>
        )}
      </div>

      {/* Fullscreen Image/Document Lightbox Preview Window */}
      {showPreview && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 cursor-zoom-out"
          onClick={() => setShowPreview(false)}
        >
          {/* Close button */}
          <button 
            type="button"
            aria-label="Close preview"
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/5 shadow-lg"
            onClick={() => setShowPreview(false)}
          >
            <X size={18} />
          </button>
          
          {msgText.startsWith("data:image/") || (msgText.startsWith("http") && msgText.match(/\.(jpeg|jpg|gif|png|webp)/i)) ? (
            <div className="relative max-h-full max-w-full flex items-center justify-center">
              <img 
                src={msgText} 
                alt="Preview" 
                className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl border border-white/10 select-none animate-in zoom-in-95 duration-200" 
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ) : (
            <div className="relative w-[85vw] h-[85vh] flex items-center justify-center bg-white rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <iframe 
                src={msgText} 
                title="Document Preview"
                className="w-full h-full border-0" 
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          
          <div className="absolute bottom-4 text-center text-white/50 text-[10px] font-semibold select-none">
            Click outside to close
          </div>
        </div>
      )}
    </div>
  );
}
