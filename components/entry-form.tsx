"use client";

import { useState, useEffect } from "react";
import type { CreateEntryInput, Entry, EntryGroup, Tag, WorkflowTemplate } from "@/lib/types";
import { GROUP_LABELS } from "@/lib/types";
import { api } from "@/lib/api-client";
import CollapsibleSection from "@/components/collapsible-section";
import TagInput from "@/components/tag-input";

interface Props {
  entry?: Entry;
  defaultGroup?: string;
  onSubmit: (data: CreateEntryInput & { tag_ids?: number[] }) => Promise<void>;
  onClose: () => void;
}

const groups: EntryGroup[] = ["incoming_control", "production", "client"];
const currencies = ["EUR", "USD", "GBP", "SEK"];

export default function EntryForm({
  entry,
  defaultGroup,
  onSubmit,
  onClose,
}: Props) {
  const [title, setTitle] = useState(entry?.title ?? "");
  const [description, setDescription] = useState(entry?.description ?? "");
  const [severity, setSeverity] = useState(entry?.severity ?? "minor");
  const [group, setGroup] = useState(
    entry?.group ?? defaultGroup ?? "incoming_control"
  );
  const [assignedTo, setAssignedTo] = useState(entry?.assigned_to ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Workflow
  const [workflowType, setWorkflowType] = useState<string>(
    entry?.workflow_template_key ?? "standard"
  );
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);

  // Traceability
  const [productName, setProductName] = useState(entry?.product_name ?? "");
  const [orderNumber, setOrderNumber] = useState(entry?.order_number ?? "");
  const [batchNumber, setBatchNumber] = useState(entry?.batch_number ?? "");

  // Cost
  const [estimatedCost, setEstimatedCost] = useState(
    entry?.estimated_cost != null ? String(entry.estimated_cost / 100) : ""
  );
  const [currency, setCurrency] = useState(entry?.currency ?? "EUR");

  // Tags
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [tagIds, setTagIds] = useState<number[]>([]);

  useEffect(() => {
    api.workflowTemplates.list().then(setTemplates).catch(() => {});
    api.tags.list().then((tags) => {
      setAllTags(tags);
      if (entry) {
        api.entries.tags(entry.id).then((entryTags) => {
          setSelectedTags(entryTags);
          setTagIds(entryTags.map((t) => t.id));
        }).catch(() => {});
      }
    }).catch(() => {});
  }, [entry]);

  function handleTagChange(ids: number[]) {
    setTagIds(ids);
    setSelectedTags(allTags.filter((t) => ids.includes(t.id)));
  }

  async function handleCreateTag(name: string): Promise<Tag> {
    const tag = await api.tags.create(name);
    setAllTags((prev) => [...prev, tag]);
    return tag;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const costCents = estimatedCost
        ? Math.round(parseFloat(estimatedCost) * 100)
        : null;

      const templateKey =
        workflowType === "standard"
          ? group // use group name as template key for standard
          : "8d";

      await onSubmit({
        title,
        description,
        severity,
        group,
        assigned_to: assignedTo,
        workflow_template_key: templateKey,
        product_name: productName || undefined,
        order_number: orderNumber || undefined,
        batch_number: batchNumber || undefined,
        estimated_cost: costCents,
        currency,
        tag_ids: tagIds.length > 0 ? tagIds : undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{entry ? "Edit Entry" : "New Entry"}</h2>
        {error && (
          <div style={{ color: "var(--error)", marginBottom: 12 }}>{error}</div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the nonconformity"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description, root cause, observations..."
            />
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Group</label>
              <select value={group} onChange={(e) => setGroup(e.target.value)}>
                {groups.map((g) => (
                  <option key={g} value={g}>
                    {GROUP_LABELS[g]}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                <option value="minor">Minor</option>
                <option value="major">Major</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Workflow type toggle */}
          <div className="form-group">
            <label>Workflow Type</label>
            <div className="form-toggle-group">
              <button
                type="button"
                className={`form-toggle ${workflowType === "standard" ? "form-toggle--active" : ""}`}
                onClick={() => setWorkflowType("standard")}
              >
                Standard (D1–D6)
              </button>
              <button
                type="button"
                className={`form-toggle ${workflowType === "8d" ? "form-toggle--active" : ""}`}
                onClick={() => setWorkflowType("8d")}
              >
                8D Report (D1–D8)
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Assigned To</label>
            <input
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="person.name"
            />
          </div>

          {/* More Details — collapsed by default */}
          <CollapsibleSection title="More Details">
            <div className="form-group">
              <label>Product Name</label>
              <input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Product or part name"
              />
            </div>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Order Number</label>
                <input
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="PO-12345"
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Batch Number</label>
                <input
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="BATCH-001"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Estimated Cost</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group" style={{ flex: 0.6 }}>
                <label>Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {currencies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Tags</label>
              <TagInput
                tags={selectedTags}
                allTags={allTags}
                onChange={handleTagChange}
                onCreateTag={handleCreateTag}
              />
            </div>
          </CollapsibleSection>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? "Saving..." : entry ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
