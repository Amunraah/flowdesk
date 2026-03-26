// Typer för Prompt Library

export type PromptCategory =
  | "youtube"
  | "business"
  | "creative"
  | "coding"
  | "marketing";

export type AgentType =
  | "strategy"
  | "ideas"
  | "design"
  | "script"
  | "seo"
  | "community"
  | "monetization"
  | "general";

export interface Prompt {
  id:          string;
  title:       string;
  description: string;
  category:    PromptCategory;
  agentType:   AgentType;
  promptText:  string;
  tags:        string[];
  createdAt:   number;
  updatedAt:   number;
}

// Visningsnamn för kategorier och agenttyper
export const CATEGORY_LABELS: Record<PromptCategory, string> = {
  youtube:   "YouTube",
  business:  "Business",
  creative:  "Creative",
  coding:    "Coding",
  marketing: "Marketing",
};

export const AGENT_LABELS: Record<AgentType, string> = {
  strategy:     "Strategi",
  ideas:        "Idéer",
  design:       "Design",
  script:       "Script",
  seo:          "SEO",
  community:    "Community",
  monetization: "Monetisering",
  general:      "Generell",
};
