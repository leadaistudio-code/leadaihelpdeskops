export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { createAsset } from "@/app/actions/assetActions";
import { redirect } from "next/navigation";
import { getActiveDomain } from "@/lib/tenant";
import { ChevronLeft } from "lucide-react";
import {
  PageHeader,
  Button,
  Panel,
  PanelHeader,
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/ui";

export default async function NewAssetPage() {
  const users = await prisma.user.findMany({ where: { domain: await getActiveDomain() } });

  async function handleCreate(formData: FormData) {
    "use server";
    await createAsset(formData);
    redirect("/assets");
  }

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <PageHeader
        title="Register New Asset"
        action={
          <Button href="/assets" variant="secondary" icon={ChevronLeft}>
            Back
          </Button>
        }
      />

      <Panel padded={false} className="max-w-4xl mx-auto overflow-hidden">
        <PanelHeader title="Asset Details" />

        <form action={handleCreate} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Field label="Asset Tag" htmlFor="assetTag">
              <Input id="assetTag" type="text" name="assetTag" required placeholder="e.g., MAC-2026-001" />
            </Field>

            <Field label="Status" htmlFor="status">
              <Select id="status" name="status" required>
                <option value="IN_STOCK">In Stock</option>
                <option value="IN_USE">In Use</option>
                <option value="RETIRED">Retired</option>
                <option value="MISSING">Missing</option>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Field label="Name / Model" htmlFor="name">
              <Input id="name" type="text" name="name" required placeholder="e.g., MacBook Pro 16-inch M3" />
            </Field>

            <Field label="Category" htmlFor="category">
              <Select id="category" name="category" required>
                <option value="Hardware">Hardware</option>
                <option value="Software License">Software License</option>
                <option value="Peripherals">Peripherals</option>
                <option value="Networking">Networking</option>
              </Select>
            </Field>
          </div>

          <div className="mb-6">
            <Field label="Assigned To (Optional)" htmlFor="assigneeId">
              <Select id="assigneeId" name="assigneeId">
                <option value="">-- Unassigned --</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="mb-6">
            <Field label="Notes" htmlFor="notes">
              <Textarea id="notes" name="notes" rows={4} placeholder="Any additional information..." />
            </Field>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
            <Button type="submit">Register Asset</Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
