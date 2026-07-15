export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-utils";
import { ArrowLeft } from "lucide-react";
import DeflectionPanel from "@/components/DeflectionPanel";
import NewIncidentForm from "@/components/NewIncidentForm";
import { PageHeader, Button, Panel, PanelHeader } from "@/components/ui";

export default async function NewIncidentPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <PageHeader
        title="New Incident"
        action={
          <Button href="/incidents" variant="secondary" icon={ArrowLeft}>
            Back to Incidents
          </Button>
        }
      />

      <DeflectionPanel />

      <Panel className="max-w-4xl mx-auto overflow-hidden">
        <PanelHeader title="Incident Form" />
        <NewIncidentForm user={{ id: user.id, name: user.name, role: user.role }} />
      </Panel>
    </div>
  );
}
