import { z } from "zod";

export const DomainWideDelegationCreateSchema = z.object({
  workspacePlatformSlug: z.string(),
  domain: z.string(),
});

export const DomainWideDelegationUpdateSchema = z.object({
  id: z.string().optional(),
  workspacePlatformSlug: z.string(),
  domain: z.string(),
  enabled: z.boolean(),
});

export const DomainWideDelegationDeleteSchema = z.object({
  id: z.string(),
});
