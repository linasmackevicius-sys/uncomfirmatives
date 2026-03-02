"use client";

import { useState, useRef, useCallback } from "react";
import type { Attachment } from "@/lib/types";

interface Props {
  attachments: Attachment[];
  entryId: number;
  onUpload: (file: File) => Promise<void>;
  onDelete: (attachmentId: number) => Promise<void>;
}

function formatSize(bytes: number | null): string {
  if (bytes === null || bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function fileIcon(mime: string | null): string {
  if (!mime) return "📄";
  if (mime.startsWith("image/")) return "🖼";
  if (mime.startsWith("video/")) return "🎬";
  if (mime.includes("pdf")) return "📕";
  if (mime.includes("spreadsheet") || mime.includes("excel")) return "📊";
  if (mime.includes("word") || mime.includes("document")) return "📝";
  return "📄";
}

export default function AttachmentList({
  attachments,
  entryId,
  onUpload,
  onDelete,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUploading(true);
      try {
        for (const file of Array.from(files)) {
          await onUpload(file);
        }
      } finally {
        setUploading(false);
      }
    },
    [onUpload]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  return (
    <div className="attachment-section">
      <div
        className={`attachment-dropzone ${dragOver ? "attachment-dropzone--active" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <span className="attachment-dropzone-text">Uploading...</span>
        ) : (
          <span className="attachment-dropzone-text">
            Drop files here or click to upload
          </span>
        )}
      </div>

      {attachments.length > 0 && (
        <ul className="attachment-list">
          {attachments.map((att) => (
            <li key={att.id} className="attachment-item">
              <span className="attachment-icon">
                {fileIcon(att.mime_type)}
              </span>
              <a
                className="attachment-name"
                href={`/api/attachments/${att.id}/download`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {att.filename}
              </a>
              <span className="attachment-size">
                {formatSize(att.size_bytes)}
              </span>
              <button
                className="attachment-delete"
                onClick={() => onDelete(att.id)}
                title="Delete attachment"
                type="button"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
