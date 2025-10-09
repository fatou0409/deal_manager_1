import { z } from "zod";

export const dealSchema = z.object({
  projet: z.string().min(2),
  client: z.string().min(2),
  secteur: z.string().min(1),
  dateCreation: z.string().min(1),
  typeDeal: z.string().min(1),
  commercial: z.string().min(1),
  supportAV: z.string().min(1),
  semestre: z.string().min(1),
  ca: z.coerce.number().nonnegative(),
  marge: z.coerce.number().nonnegative(),
  statut: z.string().min(1),
  dateDerniereModif: z.string().optional().default(""),
});
