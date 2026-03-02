import { db } from "./db";
import {
  workflowTemplates,
  workflowTemplateSteps,
  workflowSteps,
  entries,
} from "./schema";
import { eq, asc, sql, and, inArray } from "drizzle-orm";
import { VALID_WORKFLOW_STEP_STATUSES } from "./validation";
import type {
  WorkflowTemplate,
  WorkflowTemplateStep,
  WorkflowStep,
  UpdateWorkflowStepInput,
  WorkflowProgress,
} from "./types";

export class WorkflowError extends Error {}

function toWorkflowTemplate(
  row: typeof workflowTemplates.$inferSelect
): WorkflowTemplate {
  return {
    id: row.id,
    name: row.name,
    template_key: row.templateKey,
    description: row.description ?? null,
    created_at: row.createdAt?.toISOString() ?? "",
  };
}

function toWorkflowTemplateStep(
  row: typeof workflowTemplateSteps.$inferSelect
): WorkflowTemplateStep {
  return {
    id: row.id,
    template_id: row.templateId,
    step_order: row.stepOrder,
    code: row.code,
    name: row.name,
    description: row.description ?? null,
    default_assignee: row.defaultAssignee ?? null,
    default_due_days: row.defaultDueDays ?? null,
  };
}

function toWorkflowStep(
  row: typeof workflowSteps.$inferSelect
): WorkflowStep {
  return {
    id: row.id,
    entry_id: row.entryId,
    template_step_id: row.templateStepId ?? null,
    step_order: row.stepOrder,
    code: row.code,
    name: row.name,
    description: row.description ?? null,
    assigned_to: row.assignedTo ?? null,
    due_date: row.dueDate ?? null,
    status: row.status,
    completed_at: row.completedAt?.toISOString() ?? null,
    notes: row.notes ?? null,
    created_at: row.createdAt?.toISOString() ?? "",
    updated_at: row.updatedAt?.toISOString() ?? "",
  };
}

export async function listWorkflowTemplates(): Promise<WorkflowTemplate[]> {
  const rows = await db
    .select()
    .from(workflowTemplates)
    .orderBy(asc(workflowTemplates.name));
  return rows.map(toWorkflowTemplate);
}

export async function getWorkflowTemplate(
  key: string
): Promise<{ template: WorkflowTemplate; steps: WorkflowTemplateStep[] }> {
  const [templateRow] = await db
    .select()
    .from(workflowTemplates)
    .where(eq(workflowTemplates.templateKey, key));

  if (!templateRow) throw new WorkflowError("workflow template not found");

  const stepRows = await db
    .select()
    .from(workflowTemplateSteps)
    .where(eq(workflowTemplateSteps.templateId, templateRow.id))
    .orderBy(asc(workflowTemplateSteps.stepOrder));

  return {
    template: toWorkflowTemplate(templateRow),
    steps: stepRows.map(toWorkflowTemplateStep),
  };
}

export async function assignWorkflow(
  entryId: number,
  templateKey: string
): Promise<WorkflowStep[]> {
  const { template, steps: templateSteps } =
    await getWorkflowTemplate(templateKey);

  if (templateSteps.length === 0) {
    throw new WorkflowError("workflow template has no steps");
  }

  // Remove existing workflow steps for this entry
  await db.delete(workflowSteps).where(eq(workflowSteps.entryId, entryId));

  const now = new Date();
  const values = templateSteps.map((ts) => {
    let dueDate: string | null = null;
    if (ts.default_due_days) {
      const d = new Date(now);
      d.setDate(d.getDate() + ts.default_due_days);
      dueDate = d.toISOString().split("T")[0];
    }

    return {
      entryId,
      templateStepId: ts.id,
      stepOrder: ts.step_order,
      code: ts.code,
      name: ts.name,
      description: ts.description,
      assignedTo: ts.default_assignee,
      dueDate,
      status: "pending",
    };
  });

  await db.insert(workflowSteps).values(values);

  // Update entry's workflow_template_key
  await db
    .update(entries)
    .set({ workflowTemplateKey: templateKey })
    .where(eq(entries.id, entryId));

  return listWorkflowSteps(entryId);
}

export async function listWorkflowSteps(
  entryId: number
): Promise<WorkflowStep[]> {
  const rows = await db
    .select()
    .from(workflowSteps)
    .where(eq(workflowSteps.entryId, entryId))
    .orderBy(asc(workflowSteps.stepOrder));
  return rows.map(toWorkflowStep);
}

export async function updateWorkflowStep(
  stepId: number,
  input: UpdateWorkflowStepInput
): Promise<WorkflowStep> {
  const [existing] = await db
    .select()
    .from(workflowSteps)
    .where(eq(workflowSteps.id, stepId));

  if (!existing) throw new WorkflowError("workflow step not found");

  const updates: Partial<typeof workflowSteps.$inferInsert> = {};

  if (input.status !== undefined) {
    if (!VALID_WORKFLOW_STEP_STATUSES.has(input.status)) {
      throw new WorkflowError(
        "invalid status: must be pending, in_progress, completed, or skipped"
      );
    }

    // Enforce sequential completion: can't complete a step if prior steps aren't done
    if (input.status === "completed" || input.status === "in_progress") {
      const priorIncomplete = await db
        .select({ count: sql<number>`count(*)` })
        .from(workflowSteps)
        .where(
          and(
            eq(workflowSteps.entryId, existing.entryId),
            sql`${workflowSteps.stepOrder} < ${existing.stepOrder}`,
            sql`${workflowSteps.status} NOT IN ('completed', 'skipped')`
          )
        );

      if (priorIncomplete[0].count > 0) {
        throw new WorkflowError(
          "cannot advance step: prior steps are not completed or skipped"
        );
      }
    }

    updates.status = input.status;
    if (input.status === "completed") {
      updates.completedAt = new Date();
    }
  }

  if (input.assigned_to !== undefined) {
    updates.assignedTo = input.assigned_to || null;
  }
  if (input.notes !== undefined) {
    updates.notes = input.notes || null;
  }
  if (input.due_date !== undefined) {
    updates.dueDate = input.due_date;
  }

  if (Object.keys(updates).length > 0) {
    await db.update(workflowSteps).set(updates).where(eq(workflowSteps.id, stepId));
  }

  const [updated] = await db
    .select()
    .from(workflowSteps)
    .where(eq(workflowSteps.id, stepId));
  return toWorkflowStep(updated);
}

export async function getWorkflowProgress(
  entryId: number
): Promise<WorkflowProgress> {
  const steps = await listWorkflowSteps(entryId);

  if (steps.length === 0) {
    return { total: 0, completed: 0, current_step: null, percent: 0 };
  }

  const completed = steps.filter(
    (s) => s.status === "completed" || s.status === "skipped"
  ).length;

  const current = steps.find(
    (s) => s.status === "in_progress" || s.status === "pending"
  );

  return {
    total: steps.length,
    completed,
    current_step: current ? current.code : null,
    percent: Math.round((completed / steps.length) * 100),
  };
}

export async function batchWorkflowProgress(
  entryIds: number[]
): Promise<Record<number, WorkflowProgress>> {
  if (entryIds.length === 0) return {};

  const rows = await db
    .select()
    .from(workflowSteps)
    .where(inArray(workflowSteps.entryId, entryIds))
    .orderBy(asc(workflowSteps.stepOrder));

  const grouped: Record<number, typeof rows> = {};
  for (const row of rows) {
    (grouped[row.entryId] ??= []).push(row);
  }

  const result: Record<number, WorkflowProgress> = {};
  for (const id of entryIds) {
    const steps = grouped[id] ?? [];
    if (steps.length === 0) {
      result[id] = { total: 0, completed: 0, current_step: null, percent: 0 };
      continue;
    }
    const completed = steps.filter(
      (s) => s.status === "completed" || s.status === "skipped"
    ).length;
    const current = steps.find(
      (s) => s.status === "in_progress" || s.status === "pending"
    );
    result[id] = {
      total: steps.length,
      completed,
      current_step: current ? current.code : null,
      percent: Math.round((completed / steps.length) * 100),
    };
  }
  return result;
}

export async function deleteWorkflowSteps(entryId: number): Promise<void> {
  await db.delete(workflowSteps).where(eq(workflowSteps.entryId, entryId));
}
