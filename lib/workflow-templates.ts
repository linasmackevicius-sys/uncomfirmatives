import { db } from "./db";
import { workflowTemplates, workflowTemplateSteps } from "./schema";
import { count } from "drizzle-orm";

type TemplateDefinition = {
  name: string;
  templateKey: string;
  description: string;
  steps: {
    code: string;
    name: string;
    description: string;
    defaultDueDays: number;
  }[];
};

const DEFAULT_TEMPLATES: TemplateDefinition[] = [
  {
    name: "Incoming Control",
    templateKey: "incoming_control",
    description:
      "Standard workflow for non-conformances detected during incoming goods inspection",
    steps: [
      {
        code: "D1",
        name: "Register",
        description: "Log the non-conformance and gather initial details",
        defaultDueDays: 1,
      },
      {
        code: "D2",
        name: "Investigate",
        description:
          "Investigate root cause and assess impact on incoming materials",
        defaultDueDays: 5,
      },
      {
        code: "D3",
        name: "Corrective Action",
        description: "Define and document corrective actions",
        defaultDueDays: 7,
      },
      {
        code: "D4",
        name: "Approve",
        description: "Review and approve proposed corrective actions",
        defaultDueDays: 3,
      },
      {
        code: "D5",
        name: "Implement",
        description: "Execute corrective actions and verify effectiveness",
        defaultDueDays: 10,
      },
      {
        code: "D6",
        name: "Close",
        description: "Final review and closure of the non-conformance",
        defaultDueDays: 2,
      },
    ],
  },
  {
    name: "Production",
    templateKey: "production",
    description:
      "Workflow for non-conformances found during production processes",
    steps: [
      {
        code: "D1",
        name: "Register",
        description:
          "Log the production non-conformance with line and batch details",
        defaultDueDays: 1,
      },
      {
        code: "D2",
        name: "Investigate",
        description:
          "Analyze production data and identify root cause of defect",
        defaultDueDays: 5,
      },
      {
        code: "D3",
        name: "Corrective Action",
        description: "Define corrective actions for the production process",
        defaultDueDays: 7,
      },
      {
        code: "D4",
        name: "Approve",
        description: "Quality manager approval of corrective actions",
        defaultDueDays: 3,
      },
      {
        code: "D5",
        name: "Implement",
        description:
          "Implement process changes and validate with production runs",
        defaultDueDays: 10,
      },
      {
        code: "D6",
        name: "Close",
        description: "Confirm resolution and close the non-conformance",
        defaultDueDays: 2,
      },
    ],
  },
  {
    name: "Client Complaint",
    templateKey: "client",
    description:
      "Expedited workflow for client-reported non-conformances with tighter deadlines",
    steps: [
      {
        code: "D1",
        name: "Register",
        description:
          "Log client complaint and acknowledge receipt to the customer",
        defaultDueDays: 1,
      },
      {
        code: "D2",
        name: "Investigate",
        description:
          "Investigate the reported issue and reproduce if applicable",
        defaultDueDays: 3,
      },
      {
        code: "D3",
        name: "Corrective Action",
        description:
          "Define corrective actions and prepare customer communication",
        defaultDueDays: 5,
      },
      {
        code: "D4",
        name: "Approve",
        description: "Management approval of response and corrective actions",
        defaultDueDays: 2,
      },
      {
        code: "D5",
        name: "Implement",
        description:
          "Execute corrective actions and send resolution to customer",
        defaultDueDays: 5,
      },
      {
        code: "D6",
        name: "Close",
        description:
          "Confirm customer satisfaction and close the complaint",
        defaultDueDays: 2,
      },
    ],
  },
  {
    name: "8D Report",
    templateKey: "8d",
    description:
      "Full 8 Disciplines problem-solving methodology for complex non-conformances",
    steps: [
      {
        code: "D1",
        name: "Team Formation",
        description:
          "Establish a cross-functional team with relevant expertise",
        defaultDueDays: 2,
      },
      {
        code: "D2",
        name: "Problem Description",
        description:
          "Define the problem using 5W2H (Who, What, Where, When, Why, How, How Many)",
        defaultDueDays: 3,
      },
      {
        code: "D3",
        name: "Containment",
        description:
          "Implement interim containment actions to protect the customer",
        defaultDueDays: 3,
      },
      {
        code: "D4",
        name: "Root Cause Analysis",
        description:
          "Identify root causes using tools like 5 Whys, fishbone diagram, or fault tree analysis",
        defaultDueDays: 7,
      },
      {
        code: "D5",
        name: "Corrective Action",
        description:
          "Define permanent corrective actions that address the root cause",
        defaultDueDays: 7,
      },
      {
        code: "D6",
        name: "Implementation & Validation",
        description:
          "Implement corrective actions and validate their effectiveness",
        defaultDueDays: 14,
      },
      {
        code: "D7",
        name: "Preventive Action",
        description:
          "Implement systemic changes to prevent recurrence across similar processes",
        defaultDueDays: 14,
      },
      {
        code: "D8",
        name: "Recognition & Closure",
        description:
          "Recognize team contributions, document lessons learned, and close the report",
        defaultDueDays: 3,
      },
    ],
  },
];

export async function seedTemplates(): Promise<void> {
  const [result] = await db
    .select({ total: count() })
    .from(workflowTemplates);

  if (result.total > 0) {
    return;
  }

  for (const template of DEFAULT_TEMPLATES) {
    const [inserted] = await db.insert(workflowTemplates).values({
      name: template.name,
      templateKey: template.templateKey,
      description: template.description,
    });

    const templateId = inserted.insertId;

    await db.insert(workflowTemplateSteps).values(
      template.steps.map((step, index) => ({
        templateId,
        stepOrder: index + 1,
        code: step.code,
        name: step.name,
        description: step.description,
        defaultDueDays: step.defaultDueDays,
      }))
    );
  }
}