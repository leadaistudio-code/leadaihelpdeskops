"use client";

import { useTransition } from "react";
import { assignDeviceOwner } from "@/app/actions/dexActions";
import { toast } from "@/components/toast";
import { Select } from "@/components/ui";

type TenantUser = { id: string; name: string };

// Compact owner picker for a device row. Assigns the authoritative app-user
// owner used by the chatbot's "my device health" and other per-user views.
export default function DeviceOwnerControl({
  deviceId,
  currentOwnerId,
  users,
  onAssigned,
}: {
  deviceId: string;
  currentOwnerId: string | null;
  users: TenantUser[];
  onAssigned: () => void;
}) {
  const [pending, startTransition] = useTransition();

  const onChange = (value: string) => {
    startTransition(async () => {
      try {
        await assignDeviceOwner(deviceId, value || null);
        const name = users.find((u) => u.id === value)?.name;
        toast(name ? `Owner set to ${name}` : "Owner cleared");
        onAssigned();
      } catch {
        toast("Couldn't set owner", "error");
      }
    });
  };

  return (
    <Select
      aria-label="Device owner"
      value={currentOwnerId ?? ""}
      disabled={pending}
      onChange={(e) => onChange(e.target.value)}
      className="text-xs py-1.5 min-w-[130px]"
    >
      <option value="">— Unassigned —</option>
      {users.map((u) => (
        <option key={u.id} value={u.id}>
          {u.name}
        </option>
      ))}
    </Select>
  );
}
