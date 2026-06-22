import { CreateOrganization } from "@clerk/nextjs";
import { Zap } from "lucide-react";

// First-run tenant provisioning: a signed-in user with no organization creates
// their own dedicated helpdesk space (named for their company). Creating the
// org makes them its admin; everything they then do is scoped to that tenant.
export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-aurora text-slate-200 flex flex-col items-center justify-center p-6">
      <div className="flex items-center space-x-2 mb-8">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-[0_0_20px_rgba(139,92,246,0.3)] flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-extrabold text-white">
          LeadAIStudio <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-sky-400">AIOps</span>
        </span>
      </div>

      <div className="text-center mb-8 max-w-md">
        <h1 className="text-2xl font-extrabold text-white mb-2">Create your helpdesk space</h1>
        <p className="text-slate-400 text-sm">
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
