"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";
import type { Comment } from "@/lib/types";

interface Props {
  entryId: number;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function CommentTimeline({ entryId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("comment-author") || "User";
    }
    return "User";
  });
  const [submitting, setSubmitting] = useState(false);

  const loadComments = useCallback(async () => {
    try {
      const data = await api.entries.comments(entryId);
      setComments(data);
    } catch {
      // silently fail
    }
  }, [entryId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  async function handleSubmit() {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      localStorage.setItem("comment-author", authorName);
      await api.entries.addComment(entryId, {
        author: authorName,
        content: newComment.trim(),
      });
      setNewComment("");
      loadComments();
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="comment-timeline">
      <div className="section-title">Activity</div>

      <div className="comment-form">
        <div className="comment-author-row">
          <input
            className="comment-author-input"
            placeholder="Your name"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
          />
        </div>
        <textarea
          className="comment-input"
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
        />
        <div className="comment-form-actions">
          <span className="comment-hint">Ctrl+Enter to submit</span>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSubmit}
            disabled={submitting || !newComment.trim()}
          >
            Comment
          </button>
        </div>
      </div>

      {comments.length > 0 && (
        <div className="timeline">
          {comments.map((c) => (
            <div key={c.id} className="timeline-item">
              <div className="timeline-dot" />
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className="timeline-author">{c.author}</span>
                  <span className="timeline-time">{timeAgo(c.created_at)}</span>
                </div>
                <div className="timeline-body">{c.content}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {comments.length === 0 && (
        <div className="timeline-empty">No activity yet</div>
      )}
    </div>
  );
}
