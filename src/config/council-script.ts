export interface CouncilScriptLine {
  departmentId: string;
  text: string;
}

export const councilScript: CouncilScriptLine[] = [
  {
    departmentId: "council",
    text: "I've brought in Sales, Finance, and Operations to review the product-line transition.",
  },
  {
    departmentId: "sales",
    text: "From the client relationship perspective, I recommend a phased transition. The upgraded line gives us a stronger quality story without forcing a sudden change on active projects.",
  },
  {
    departmentId: "finance",
    text: "Financially, I would not make the transition universal until final model pricing is confirmed. The decision should protect the target gross margin.",
  },
  {
    departmentId: "operations",
    text: "Operationally, future projects are the cleanest place to transition. Changing active jobs introduces unnecessary service and finish-matching risk.",
  },
  {
    departmentId: "council",
    text: "The combined recommendation is to transition future projects after final pricing is confirmed, while leaving active contracted jobs unchanged unless specifically approved.",
  },
];
