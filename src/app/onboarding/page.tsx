import { CreateOrganization } from "@clerk/nextjs";
import { Zap } from "lucide-react";

// First-run tenant provisioning: a signed-in user with no organization creates
// their own dedicated helpdesk space (named for their company). Creating the
// org makes them its admin; everything they then do is scoped to that tenant.
export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f7] text-[#3a3a3c] flex flex-col items-center justify-center p-6">
      <div className="flex items-center space-x-2 mb-8">
        <div className="w-9 h-9 rounded-xl bg-[#00d4a4]/12 border border-[#00d4a4]/25 flex items-center justify-center">
          <Zap className="w-5 h-5 text-[#00926f]" />
        </div>
        <span className="text-xl font-bold text-[#0a0a0a]">
          LeadAIStudio <span className="text-[#00926f]">AIOps</span>
        </span>
      </div>

      <div className="text-center mb-8 max-w-md">
        <h1 className="text-2xl font-bold text-[#0a0a0a] mb-2">Create your helpdesk space</h1>
        <p className="text-[#5a5a5c] text-sm">
          Name it after your organization. You&apos;ll become its admin and can invite your agents and employees next.
        </p>
      </div>

      <CreateOrganization
        afterCreateOrganizationUrl="/dashboard"
        skipInvitationScreen={false}
      />
    </div>
  );
}
