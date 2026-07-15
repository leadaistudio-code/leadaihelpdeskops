export const dynamic = "force-dynamic";

import { getSlaDefinitions, toggleSlaStatus, deleteSlaDefinition, createSlaDefinition } from "@/app/actions/slaActions";
import { ShieldAlert, Plus, Trash2, Power } from "lucide-react";
import type { Priority, TicketType, SlaSchedule } from "@prisma/client";
import {
  PageHeader,
  Panel,
  PanelHeader,
  Button,
  Badge,
  priorityTone,
  Field,
  Label,
  Input,
  Select,
  DataTable,
  THead,
  TH,
  TBody,
  TR,
  TD,
} from "@/components/ui";

export default async function AdminSlaPage() {
  const slas = await getSlaDefinitions();

  const handleToggle = async (formData: FormData) => {
    "use server";
    const id = formData.get("id") as string;
    const isActive = formData.get("isActive") === "true";
    await toggleSlaStatus(id, !isActive);
  };

  const handleDelete = async (formData: FormData) => {
    "use server";
    const id = formData.get("id") as string;
    await deleteSlaDefinition(id);
  };

  const handleCreate = async (formData: FormData) => {
    "use server";
    const name = formData.get("name") as string;
    const type = formData.get("type") as TicketType;
    const priority = formData.get("priority") as Priority;
    const durationHours = parseInt(formData.get("durationHours") as string);
    const schedule = (formData.get("schedule") as SlaSchedule) || "ALWAYS";
    await createSlaDefinition({ name, type, priority, durationHours, schedule });
  };

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <PageHeader
        title="SLA Management"
        description="Configure service level agreements across incident and request queues."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Create Form */}
        <Panel className="h-fit">
          <PanelHeader title="New SLA Policy" icon={Plus} />
          <form action={handleCreate} className="p-6 space-y-4">
            <Field label="Policy Name" htmlFor="sla-name">
              <Input required id="sla-name" name="name" type="text" placeholder="e.g. Server Outage Resolution" />
            </Field>
            <Field label="Ticket Type" htmlFor="sla-type">
              <Select id="sla-type" name="type">
                <option value="INCIDENT">INCIDENT (IT Issues)</option>
                <option value="REQUEST">REQUEST (Service Catalog)</option>
              </Select>
            </Field>
            <Field label="Target Priority" htmlFor="sla-priority">
              <Select id="sla-priority" name="priority">
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </Select>
            </Field>
            <Field label="Resolution Time (Hours)" htmlFor="sla-duration">
              <Input required id="sla-duration" name="durationHours" type="number" min="1" placeholder="e.g. 4" />
            </Field>
            <Field label="Business Calendar" htmlFor="sla-schedule">
              <Select id="sla-schedule" name="schedule">
                <option value="ALWAYS">24×7 — calendar hours</option>
                <option value="BUSINESS">Business hours — Mon–Fri, 9–5</option>
              </Select>
            </Field>
            <Button type="submit" icon={Plus} className="w-full mt-2">
              Create Policy
            </Button>
          </form>
        </Panel>

        {/* Existing SLAs Table */}
        <Panel className="lg:col-span-2 overflow-hidden">
          <PanelHeader title="Active Policies" icon={ShieldAlert} />
          <DataTable>
            <THead>
              <tr>
                <TH>Policy Name</TH>
                <TH>Type</TH>
                <TH>Priority</TH>
                <TH>Target</TH>
                <TH>Calendar</TH>
                <TH align="right">Actions</TH>
              </tr>
            </THead>
            <TBody>
              {slas.length === 0 ? (
                <tr>
                  <TD colSpan={6} align="center" className="py-8 text-slate-500 italic">No SLA policies defined.</TD>
                </tr>
              ) : (
                slas.map((sla) => (
                  <TR key={sla.id} className={!sla.isActive ? "opacity-50" : undefined}>
                    <TD className="font-semibold text-slate-200">{sla.name}</TD>
                    <TD>
                      <Badge tone="neutral">{sla.type}</Badge>
                    </TD>
                    <TD>
                      <Badge tone={priorityTone(sla.priority)}>{sla.priority}</Badge>
                    </TD>
                    <TD className="font-mono text-slate-300">{sla.durationHours} hrs</TD>
                    <TD>
                      <span className="text-xs font-mono font-semibold text-slate-400 border border-white/10 rounded px-2 py-1">
                        {sla.schedule === "BUSINESS" ? "8×5" : "24×7"}
                      </span>
                    </TD>
                    <TD align="right">
                      <div className="flex justify-end gap-2">
                        <form action={handleToggle}>
                          <input type="hidden" name="id" value={sla.id} />
                          <input type="hidden" name="isActive" value={sla.isActive ? "true" : "false"} />
                          <Button
                            type="submit"
                            size="sm"
                            variant={sla.isActive ? "secondary" : "primary"}
                            icon={Power}
                            title={sla.isActive ? "Disable SLA" : "Enable SLA"}
                          />
                        </form>
                        <form action={handleDelete}>
                          <input type="hidden" name="id" value={sla.id} />
                          <Button type="submit" size="sm" variant="danger" icon={Trash2} title="Delete SLA" />
                        </form>
                      </div>
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </DataTable>
        </Panel>

      </div>
    </div>
  );
}
