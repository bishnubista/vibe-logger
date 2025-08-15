import { z } from 'zod';

export const SessionTemplateSchema = z.enum([
  'project_log',
  'adr', 
  'feature_spec',
  'troubleshooting',
  'retrospective'
]);

export const ActivityCategorySchema = z.enum([
  'implementation',
  'debugging', 
  'research',
  'planning'
]);

export const ImpactLevelSchema = z.enum(['high', 'medium', 'low']);

export const StartSessionSchema = z.object({
  project: z.string().min(1, 'Project name is required'),
  objective: z.string().min(1, 'Session objective is required'),
  template: SessionTemplateSchema.optional().default('project_log')
});

export const ContinueSessionSchema = z.object({
  project: z.string().optional()
});

export const EndSessionSchema = z.object({
  summary: z.string().optional(),
  nextSteps: z.array(z.string()).optional()
});

export const LogDecisionSchema = z.object({
  decision: z.string().min(1, 'Decision description is required'),
  rationale: z.string().min(1, 'Decision rationale is required'),
  alternatives: z.array(z.string()).optional(),
  impact: ImpactLevelSchema.optional()
});

export const LogActivitySchema = z.object({
  activity: z.string().min(1, 'Activity description is required'),
  category: ActivityCategorySchema,
  outcome: z.string().optional()
});

export const SaveConversationSchema = z.object({
  topic: z.string().min(1, 'Conversation topic is required'),
  includeFullText: z.boolean().optional().default(false)
});

export type StartSessionInput = z.infer<typeof StartSessionSchema>;
export type ContinueSessionInput = z.infer<typeof ContinueSessionSchema>;
export type EndSessionInput = z.infer<typeof EndSessionSchema>;
export type LogDecisionInput = z.infer<typeof LogDecisionSchema>;
export type LogActivityInput = z.infer<typeof LogActivitySchema>;
export type SaveConversationInput = z.infer<typeof SaveConversationSchema>;