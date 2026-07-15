"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { createCatalogRequest } from "@/app/actions/catalogActions";
import { toast } from "@/components/toast";
import { Panel, PanelHeader, Button, Badge, Field, Input, Select, Textarea } from "@/components/ui";

export default function CatalogRequestForm({
  itemId,
  description,
  requiresApproval,
  formSchema,
}: {
  itemId: string;
  description: string;
  requiresApproval: boolean;
  formSchema?: any[];
}) {
  const [justification, setJustification] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    // Compile notes based on dynamic schema or fallback
    let compiledNotes = "";
    if (formSchema && formSchema.length > 0) {
      for (const field of formSchema) {
        if (field.required && !formData[field.id]) return; // Client validation fallback
        compiledNotes += `**${field.label}:**\n${formData[field.id] || "Not provided"}\n\n`;
      }
    } else {
      if (!justification.trim()) return;
      compiledNotes = justification;
    }

    startTransition(async () => {
      try {
        await createCatalogRequest(itemId, compiledNotes);
        toast("Request submitted");
        setSuccess(true);
      } catch {
        toast("Couldn't submit request", "error");
      }
    });
  };

  const handleFieldChange = (id: string, val: string) => {
    setFormData(prev => ({ ...prev, [id]: val }));
  };

  const isFormValid = () => {
    if (formSchema && formSchema.length > 0) {
      return formSchema.every(field => !field.required || formData[field.id]?.trim());
    }
    return justification.trim().length > 0;
  };

  if (success) {
    return (
      <Panel className="max-w-3xl border-emerald-500/30 p-10 text-center">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Request Submitted</h2>
        <p className="text-slate-400 mb-8 leading-relaxed">
          {requiresApproval ? (
            <>Your request has been routed to the <strong className="text-amber-300">Approvals Queue</strong>. You&apos;ll be notified once it&apos;s approved.</>
          ) : (
            <>Your request has been received and is being processed by the IT team.</>
          )}
        </p>
        <Button href="/catalog" variant="secondary">Return to Catalog</Button>
      </Panel>
    );
  }

  return (
    <Panel className="max-w-3xl overflow-hidden">
      <PanelHeader
        title="Order Details"
        action={requiresApproval ? <Badge tone="warning">Approval Required</Badge> : undefined}
      />

      <form onSubmit={submit} className="p-8">
        <p className="text-slate-300 mb-8 leading-relaxed bg-white/5 p-6 rounded-2xl border border-white/5">
          {description}
        </p>

        <div className="space-y-6 mb-8">
          {formSchema && formSchema.length > 0 ? (
            formSchema.map((field) => (
              <Field
                key={field.id}
                label={<>{field.label} {field.required && <span className="text-rose-400">*</span>}</>}
              >
                {field.type === "textarea" ? (
                  <Textarea
                    required={field.required}
                    rows={4}
                    value={formData[field.id] || ""}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  />
                ) : field.type === "select" ? (
                  <Select
                    required={field.required}
                    value={formData[field.id] || ""}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  >
                    <option value="" disabled>Select an option...</option>
                    {field.options?.map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    type={field.type || "text"}
                    required={field.required}
                    value={formData[field.id] || ""}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  />
                )}
              </Field>
            ))
          ) : (
            <Field label="Business Justification">
              <Textarea
                required
                rows={4}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Why do you need this item or access? Be specific."
              />
            </Field>
          )}
        </div>

        <div className="flex justify-end pt-6 border-t border-white/5">
          <Button
            type="submit"
            size="lg"
            disabled={pending || !isFormValid()}
            loading={pending}
            icon={requiresApproval ? Clock : CheckCircle2}
          >
            {pending ? "Submitting…" : requiresApproval ? "Submit for Approval" : "Order Now"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
