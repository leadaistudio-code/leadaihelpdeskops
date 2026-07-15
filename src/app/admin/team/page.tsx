export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { OrganizationProfile } from "@clerk/nextjs";
import { getSessionUser } from "@/lib/auth-utils";
import { PageHeader } from "@/components/ui";

// Tenant team management: members, roles, and email invitations — handled
// natively by Clerk Organizations.
export default async function TeamPage() {
  const me = await getSessionUser();
  if (!me || me.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <PageHeader
        title="Team & Invitations"
        description="Invite agents and employees to this tenant and manage their roles"
      />

      <div className="flex justify-center">
        <OrganizationProfile routing="hash" />
      </div>
    </div>
  );
}
