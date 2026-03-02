"use client";

import type { WorkflowStep } from "@/lib/types";

interface Props {
  steps: WorkflowStep[];
  onStepClick?: (step: WorkflowStep) => void;
}

function stepStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return "✓";
    case "skipped":
      return "–";
    case "in_progress":
      return "●";
    default:
      return "";
  }
}

export default function WorkflowStepper({ steps, onStepClick }: Props) {
  if (steps.length === 0) return null;

  const completed = steps.filter(
    (s) => s.status === "completed" || s.status === "skipped"
  ).length;
  const percent = Math.round((completed / steps.length) * 100);

  return (
    <div className="stepper">
      <div className="stepper-track">
        <div className="stepper-fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="stepper-nodes">
        {steps.map((step) => (
          <button
            key={step.id}
            className={`stepper-node stepper-node--${step.status}`}
            title={`${step.code}: ${step.name} (${step.status})`}
            onClick={() => onStepClick?.(step)}
            type="button"
          >
            <span className="stepper-node-dot">
              {stepStatusIcon(step.status)}
            </span>
            <span className="stepper-node-label">{step.code}</span>
          </button>
        ))}
      </div>
      <div className="stepper-summary">
        {completed}/{steps.length} steps completed ({percent}%)
      </div>
    </div>
  );
}
