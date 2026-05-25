// Tier definitions and access checks (Atum_Generator pattern)
export const TIERS = {
  free: {
    label: "Free",
    scanLimit: 10,
    features: ["scan", "topics_basic", "learn_basic"],
  },
  pro: {
    label: "Pro",
    scanLimit: 100,
    features: ["scan", "topics_basic", "topics_advanced", "learn_basic", "learn_analytics", "reports_md"],
  },
  premium: {
    label: "Premium",
    scanLimit: 1000,
    features: ["scan", "topics_basic", "topics_advanced", "learn_basic", "learn_analytics", "reports_md", "reports_pdf", "priority"],
  },
};

export function hasFeature(user, feature) {
  if (!user) return false;
  const tier = user.tier || "free";
  return TIERS[tier]?.features.includes(feature) ?? false;
}

export function scanLimit(user) {
  const tier = user?.tier || "free";
  return TIERS[tier]?.scanLimit ?? 0;
}

export function canScan(user) {
  if (!user) return false;
  return (user.scans_this_month || 0) < scanLimit(user);
}