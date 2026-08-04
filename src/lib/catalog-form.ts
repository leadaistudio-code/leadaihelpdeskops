import { z } from "zod";

// `CatalogItem.formSchema` is a `Json?` column, so what comes back from the
// database is genuinely unknown at compile time — it is whatever was written
// there, possibly by an older version of the app.
//
// The previous code bridged that gap with `formSchema as any[]`, which does not
// check anything: a malformed row reached the render and produced a blank or
// broken form with no indication of why. Parsing at the boundary means the type
// the component receives is one the data actually satisfies, and a bad row
// degrades to "no custom fields" instead of a broken page.

const fieldSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(["text", "textarea", "select", "number", "date", "email"]).optional(),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
});

export type CatalogFormField = z.infer<typeof fieldSchema>;

const schemaArray = z.array(fieldSchema);

export function parseCatalogFormSchema(value: unknown): CatalogFormField[] | undefined {
  if (value == null) return undefined;
  const parsed = schemaArray.safeParse(value);
  if (!parsed.success) {
    console.error("[catalog] ignoring malformed formSchema:", parsed.error.issues);
    return undefined;
  }
  return parsed.data.length > 0 ? parsed.data : undefined;
}
