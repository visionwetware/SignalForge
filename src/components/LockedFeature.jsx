import { Lock } from "lucide-react";
import { Link } from "react-router-dom";

export default function LockedFeature({ feature, requiredTier = "pro" }) {
  return (
    <div className="border border-dashed border-[#E6F7FF]/20 rounded-lg p-10 text-center bg-white/30">
      <div className="w-10 h-10 mx-auto rounded-full bg-[#E6F7FF]/5 flex items-center justify-center mb-4">
        <Lock className="w-4 h-4 text-[#E6F7FF]/60" />
      </div>
      <div className="font-serif text-xl">This is a {requiredTier} feature</div>
      <p className="text-sm text-[#E6F7FF]/60 mt-2 max-w-sm mx-auto">
        Upgrade your plan to unlock {feature}. Visit settings to learn more.
      </p>
      <Link to="/settings" className="inline-block mt-5 px-4 py-2 bg-[#E6F7FF] text-[#FAF7F2] text-sm rounded-md hover:bg-[#E6F7FF]/85 transition">
        View plans
      </Link>
    </div>
  );
}