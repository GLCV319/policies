const defaultPolicies = [
  {
    id: "demo-001",
    code: "RT-01",
    title: "Airway Management",
    category: "Clinical Care",
    content: `<h1>Airway Management</h1><p>Ensure patency using head tilt/chin lift or jaw thrust as indicated.</p><ul><li>Assess respiratory effort.</li><li>Prepare suction.</li></ul>`,
    questions: [
      { text: "Primary maneuver to open airway without spinal concerns?", options: ["Jaw thrust", "Head tilt/chin lift"], correctIndex: 1 },
      { text: "What equipment must be ready?", options: ["Suction", "Nebulizer"], correctIndex: 0 }
    ],
  },
];

const defaultBundles = [
  {
    id: "bundle-1",
    title: "Orientation Essentials",
    description: "Core airway and infection control policies for onboarding.",
    policyIds: ["demo-001"],
  },
];

const METADATA_KEY = "njra_metadata";
const POLICY_KEY = "njra_policies";
const BUNDLE_KEY = "njra_bundles";

const load = (key, fallback) => {
  const value = localStorage.getItem(key);
  return value ? JSON.parse(value) : fallback;
};

const persist = (key, value) => localStorage.setItem(key, JSON.stringify(value));

export const policyService = {
  async listPolicies() {
    return load(POLICY_KEY, defaultPolicies);
  },
  async listBundles() {
    return load(BUNDLE_KEY, defaultBundles);
  },
  async savePolicy(policy) {
    const policies = load(POLICY_KEY, defaultPolicies);
    const exists = policies.find((p) => p.id === policy.id);
    const updated = exists ? policies.map((p) => (p.id === policy.id ? policy : p)) : [...policies, { ...policy, id: crypto.randomUUID() }];
    persist(POLICY_KEY, updated);
    return updated;
  },
  async deletePolicy(id) {
    const policies = load(POLICY_KEY, defaultPolicies).filter((p) => p.id !== id);
    persist(POLICY_KEY, policies);
    return policies;
  },
  async updateCategory(id, category) {
    const policies = load(POLICY_KEY, defaultPolicies).map((p) => (p.id === id ? { ...p, category } : p));
    persist(POLICY_KEY, policies);
    return policies;
  },
  async saveBundle(bundle) {
    const bundles = load(BUNDLE_KEY, defaultBundles);
    const exists = bundles.find((b) => b.id === bundle.id);
    const updated = exists ? bundles.map((b) => (b.id === bundle.id ? bundle : b)) : [...bundles, { ...bundle, id: crypto.randomUUID() }];
    persist(BUNDLE_KEY, updated);
    return updated;
  },
  async deleteBundle(id) {
    const bundles = load(BUNDLE_KEY, defaultBundles).filter((b) => b.id !== id);
    persist(BUNDLE_KEY, bundles);
    return bundles;
  },
  async metadata() {
    return load(METADATA_KEY, { lastUpdated: "Demo Data" });
  },
  async updateMetadata() {
    const now = new Date().toLocaleString();
    persist(METADATA_KEY, { lastUpdated: now });
    return now;
  },
};
