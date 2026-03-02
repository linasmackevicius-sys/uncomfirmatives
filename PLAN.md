# Monitor ERP-Style Non-Conformance Enhancements

## Context

The app currently tracks non-conformances with basic fields (title, description, status, severity, group, CAPA fields, comments). To align with Monitor ERP's quality management approach, we need: workflow automation with step tracking, 8D report methodology, cost/financial impact tracking, file attachments, tags, and product traceability fields.

---

## Implementation Steps

### Step 1: Schema + Types + Validation
**Status: DONE**

Add to `lib/schema.ts`:
- New columns on `entries`: workflowTemplateKey, productName, orderNumber, batchNumber, estimatedCost (int cents), actualCost (int cents), currency (default "EUR")
- New table `workflow_templates`: id, name, templateKey (unique), description, createdAt
- New table `workflow_template_steps`: id, templateId, stepOrder, code, name, description, defaultAssignee, defaultDueDays
- New table `workflow_steps`: id, entryId, templateStepId, stepOrder, code, name, description, assignedTo, dueDate, status (pending/in_progress/completed/skipped), completedAt, notes, createdAt, updatedAt
- New table `attachments`: id, entryId, filename, storedPath, mimeType, sizeBytes, uploadedBy, createdAt
- New table `tags`: id, name (unique), color
- New table `entry_tags`: id, entryId, tagId (unique index on pair)

Add to `lib/types.ts`:
- Extend `Entry` with: workflow_template_key, product_name, order_number, batch_number, estimated_cost, actual_cost, currency
- Extend `CreateEntryInput` / `UpdateEntryInput` with corresponding optional fields
- Add: WorkflowTemplate, WorkflowTemplateStep, WorkflowStep, UpdateWorkflowStepInput, WorkflowProgress
- Add: Attachment, Tag, CostSummary
- Extend Stats with cost totals and workflow completion counts

Add to `lib/validation.ts`:
- VALID_WORKFLOW_STEP_STATUSES: pending, in_progress, completed, skipped
- VALID_CURRENCIES: EUR, USD, GBP, SEK

Run `drizzle-kit push` to apply schema changes.

---

### Step 2: Workflow Template Seed Data
**Status: DONE**

Create `lib/workflow-templates.ts` with default templates:
- incoming_control: D1–D6 (Register, Investigate, Corrective Action, Approve, Implement, Close)
- production: D1–D6 (same structure)
- client: D1–D6 (tighter deadlines)
- 8d: D1–D8 (all 8 disciplines: Team Formation, Problem Description, Containment, Root Cause Analysis, Corrective Action, Implementation & Validation, Preventive Action, Recognition & Closure)

Create `seedTemplates()` function that inserts defaults if `workflow_templates` table is empty.

---

### Step 3: Service Layer — Workflows, Attachments, Tags
**Status: DONE**

**Create `lib/workflows.ts`:**
- listWorkflowTemplates()
- getWorkflowTemplate(key) — with steps
- assignWorkflow(entryId, templateKey) — instantiate steps with due dates
- listWorkflowSteps(entryId)
- updateWorkflowStep(stepId, input) — enforce sequential completion
- getWorkflowProgress(entryId) — { total, completed, current_step, percent }

**Create `lib/attachments.ts`:**
- listAttachments(entryId)
- createAttachment(entryId, file, uploadedBy) — save to `uploads/entries/{id}/`
- deleteAttachment(id) — remove file + DB record
- getAttachmentForDownload(id)

**Create `lib/tags.ts`:**
- listTags(), createTag(), deleteTag()
- setEntryTags(entryId, tagIds), getEntryTags(entryId)

**Modify `lib/entries.ts`:**
- createEntry: accept new fields, call assignWorkflow() after insert
- updateEntry: handle traceability + cost fields
- deleteEntry: cascade delete workflow_steps, attachments (+ files), entry_tags
- toEntry(): map new columns

---

### Step 4: API Routes
**Status: DONE**

New routes:
- GET/POST `/api/entries/[id]/workflow` — list/assign workflow steps
- PATCH `/api/entries/[id]/workflow/[stepId]` — update step
- GET `/api/workflow-templates` — list templates
- GET `/api/workflow-templates/[key]` — template with steps
- GET/POST `/api/entries/[id]/attachments` — list/upload
- DELETE `/api/attachments/[id]` — delete
- GET `/api/attachments/[id]/download` — stream file
- GET/POST `/api/tags` — list/create
- DELETE `/api/tags/[id]` — delete
- PUT/GET `/api/entries/[id]/tags` — set/get entry tags
- GET `/api/costs/summary` — aggregate cost stats

Also add `uploads/` to `.gitignore`.

---

### Step 5: API Client
**Status: DONE**

Extend `lib/api-client.ts` with all new methods:
- entries.workflow(), entries.assignWorkflow(), entries.updateWorkflowStep()
- entries.workflowProgress()
- entries.attachments(), entries.uploadAttachment(), entries.deleteAttachment()
- entries.tags(), entries.setTags()
- tags.list(), tags.create(), tags.delete()
- workflowTemplates.list(), workflowTemplates.get()
- costs.summary()

---

### Step 6: New UI Components
**Status: DONE**

- `components/workflow-stepper.tsx` — horizontal step progress bar (D1–D8 nodes)
- `components/collapsible-section.tsx` — reusable expand/collapse wrapper
- `components/tag-input.tsx` — chip-style tag add/remove input
- `components/attachment-list.tsx` — file list + upload dropzone

---

### Step 7: Entry Form Changes
**Status: TODO**

Modify `components/entry-form.tsx`:
- Add workflow type toggle (Standard / 8D) below group/severity
- Add "More Details" collapsible section (collapsed by default):
  - Product Name, Order Number, Batch Number
  - Estimated Cost + Currency select
  - Tag input

---

### Step 8: Entry Detail Page Changes
**Status: TODO**

Modify `components/entry-detail.tsx`:
- Workflow stepper (always visible if steps exist)
- Collapsible sections: Workflow Steps (checklist), CAPA, Attachments, Tags
- Sidebar additions: Traceability fields, Financial fields (red if actual > estimated)

---

### Step 9: Entry Table Changes
**Status: TODO**

Modify `components/entry-table.tsx`:
- Progress column: "3/6" with mini bar
- Cost column: formatted amount
- Tags column: tag pills
- Column visibility toggle

---

### Step 10: Dashboard + Analytics + Reports
**Status: TODO**

**dashboard-client.tsx:**
- Financial Impact widget (estimated vs actual, by severity)
- Workflow Progress widget (completion bar + counts)

**analytics-view.tsx:**
- Cost over time chart
- Workflow completion stats

**reports-view.tsx:**
- Financial summary section
- Workflow status overview
- 8D print button for 8D entries

---

### Step 11: Filter Bar + Export + Events
**Status: TODO**

- filter-bar.tsx: Add tags as filter option
- lib/export.ts: Add new columns to CSV
- lib/event-emitter.ts: Add workflow event types
- CSS in globals.css: All new styles (stepper, collapsible, tag chips, attachment dropzone, cost display)

---

## Verification Checklist

- [ ] `rm -rf .next && npm run build` succeeds
- [ ] Create entry → workflow steps auto-generated
- [ ] Create 8D entry → 8 disciplines appear
- [ ] Upload/download/delete attachments
- [ ] Add/remove tags, filter by tag
- [ ] Cost fields visible in dashboard
- [ ] Workflow step completion tracking works
- [ ] CSV export includes new fields
- [ ] Analytics charts show cost + workflow data