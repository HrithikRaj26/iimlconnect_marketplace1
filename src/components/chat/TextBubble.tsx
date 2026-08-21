import React, { useState } from "react";
import { ChatMessage } from "@/types";
import { MessageTicks } from "@/components/chat/MessageTicks";
import { CURRENT_USER_ID } from "@/constants/chat";
import { useToast } from "@/context/ToastContext";

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
  const [showPreview, setShowPreview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(msgText);
  const { confirmAction } = useToast();

  // Sync state if text changes (e.g. edited by another client)
  React.useEffect(() => {
    setEditText(msgText);
  }, [msgText]);

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
    <div className={["flex group items-center gap-2", isMine ? "justify-end" : "justify-start"].join(" ")}>
      {isMine && !isEditing && message.status !== "failed" && (
        <div className="flex gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
          {message.kind === "text" && !msgText.startsWith("data:") && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 hover:text-blue-500 transition-colors cursor-pointer"
            >
              Edit
            </button>
          )}
          <button
            type="button"
            onClick={handleDeleteClick}
            className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
          >
            Delete
          </button>
        </div>
      )}

      <div className={["max-w-[75%]", isMine ? "items-end" : "items-start"].join(" ")}>
        <div
          className={[
            "rounded-2xl px-4 py-2.5 text-sm min-w-[140px]",
            isMine
              ? "rounded-br-md bg-brand text-white"
              : "rounded-bl-md border border-gray-200 bg-white text-gray-800",
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
          ) : msgText.startsWith("data:") ? (
            <div className="flex items-center gap-3 py-1.5 px-0.5">
              <span className="text-3xl cursor-pointer hover:scale-105 transition-transform" onClick={() => setShowPreview(true)} title="Preview File">📁</span>
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
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/5 shadow-lg"
            onClick={() => setShowPreview(false)}
          >
            ✕
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
