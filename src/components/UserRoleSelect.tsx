"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";
import { updateUserRole } from "@/app/actions/userActions";
import { toast } from "@/components/toast";
import { Select } from "@/components/ui";

const ROLES: Role[] = ["EMPLOYEE", "IT_AGENT", "ADMIN"];
const LABEL: Record<Role, string> = { EMPLOYEE: "Employee", IT_AGENT: "IT Agent", ADMIN: "Admin" };

export default function UserRoleSelect({
  userId,
  current,
  disabled,
}: {
  userId: string;
  current: Role;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const change = (role: Role) =>
    startTransition(async () => {
      try {
        const res = await updateUserRole(userId, role);
        toast(res.clerkSynced ? `Role updated to ${LABEL[role]}` : `Role saved (Clerk sync skipped)`, res.clerkSynced ? "success" : "error");
        router.refresh();
      } catch (e) {
        toast(e instanceof Error ? e.message : "Couldn't update role", "error");
        router.refresh();
      }
    });

  return (
    <Select
      defaultValue={current}
      disabled={disabled || pending}
      onChange={(e) => change(e.target.value as Role)}
      className="w-auto"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>{LABEL[r]}</option>
      ))}
    </Select>
  );
}
