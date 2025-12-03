const { useEffect, useMemo, useState } = React;
import { policyService } from "./services/policyService.js";
import { createAiService } from "./services/aiService.js";
import { createAuthService } from "./services/authService.js";

const CATEGORIES = [
  "Emergency Procedures",
  "Clinical Care",
  "Equipment Management",
  "Patient Assessment",
  "Infection Control",
  "Documentation",
  "Administrative",
  "Uncategorized",
];

const defaultConfig = {
  apiBaseUrl: "",
  adminAuthEnabled: false,
  enableMockData: true,
};

const useConfig = () => {
  const [config, setConfig] = useState(() => ({ ...defaultConfig, ...(window.__APP_CONFIG__ || {}) }));
  useEffect(() => {
    const listener = () => setConfig({ ...defaultConfig, ...(window.__APP_CONFIG__ || {}) });
    window.addEventListener("app-config-changed", listener);
    return () => window.removeEventListener("app-config-changed", listener);
  }, []);
  return config;
};

const usePolicies = () => {
  const [policies, setPolicies] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [metadata, setMetadata] = useState({ lastUpdated: "Loading..." });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [policyData, bundleData, meta] = await Promise.all([
      policyService.listPolicies(),
      policyService.listBundles(),
      policyService.metadata(),
    ]);
    setPolicies(policyData);
    setBundles(bundleData);
    setMetadata(meta);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const savePolicy = async (policy) => {
    const updated = await policyService.savePolicy(policy);
    setPolicies(updated);
    const lastUpdated = await policyService.updateMetadata();
    setMetadata({ lastUpdated });
  };

  const deletePolicy = async (id) => {
    const updated = await policyService.deletePolicy(id);
    setPolicies(updated);
    const lastUpdated = await policyService.updateMetadata();
    setMetadata({ lastUpdated });
  };

  const updateCategory = async (id, category) => {
    const updated = await policyService.updateCategory(id, category);
    setPolicies(updated);
    const lastUpdated = await policyService.updateMetadata();
    setMetadata({ lastUpdated });
  };

  const saveBundle = async (bundle) => {
    const updated = await policyService.saveBundle(bundle);
    setBundles(updated);
    const lastUpdated = await policyService.updateMetadata();
    setMetadata({ lastUpdated });
  };

  const deleteBundle = async (id) => {
    const updated = await policyService.deleteBundle(id);
    setBundles(updated);
    const lastUpdated = await policyService.updateMetadata();
    setMetadata({ lastUpdated });
  };

  return {
    policies,
    bundles,
    metadata,
    loading,
    loadData,
    savePolicy,
    deletePolicy,
    updateCategory,
    saveBundle,
    deleteBundle,
  };
};

const sanitize = (html) => DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });

const PolicyCard = ({ policy, onSelect, onQuiz }) => (
  <tr className="hover:bg-blue-50/30 transition-colors group">
    <td onClick={() => onSelect(policy)} className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-500 cursor-pointer group-hover:text-blue-600 font-medium">
      {policy.code || <span className="text-gray-300">-</span>}
    </td>
    <td onClick={() => onSelect(policy)} className="px-6 py-4 text-sm text-gray-800 font-medium cursor-pointer group-hover:text-blue-600">
      {policy.title}
    </td>
    <td className="px-6 py-4 hidden md:table-cell">
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        {policy.category || "General"}
      </span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
      <button onClick={() => onQuiz(policy)} className="text-quik-600 hover:text-quik-500 bg-quik-50 hover:bg-quik-100 px-3 py-1 rounded transition-colors font-bold text-xs">
        Take Quiz
      </button>
    </td>
  </tr>
);

const BundleCard = ({ bundle, onStart, onPrint }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all transform hover:-translate-y-1 overflow-hidden group">
    <div className="h-2 bg-quik-500 w-full"></div>
    <div className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-quik-50 rounded-lg text-quik-600">
          <i className="fas fa-layer-group text-xl"></i>
        </div>
        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-bold">
          {bundle.policyIds ? bundle.policyIds.length : 0} Modules
        </span>
      </div>
      <h3 className="font-bold text-lg text-gray-800 mb-2 group-hover:text-quik-600 transition-colors">{bundle.title}</h3>
      <p className="text-sm text-gray-500 mb-6 line-clamp-2">{bundle.description}</p>
      <div className="flex gap-2">
        <button onClick={() => onStart(bundle)} className="flex-1 njra-btn njra-btn-quik text-sm">
          <i className="fas fa-play mr-2"></i> Start
        </button>
        <button onClick={() => onPrint(bundle)} className="njra-btn njra-btn-outline text-sm" title="Instructor Guide">
          <i className="fas fa-print"></i>
        </button>
      </div>
    </div>
  </div>
);

const QuizComponent = ({ policy, isCourseMode = false, onPass }) => {
  const [userAnswers, setUserAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const questions = policy.questions || [];

  const handleSubmit = () => {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctIndex) correctCount++;
    });
    setScore(correctCount);
    setShowResult(true);
  };

  const isPassed = questions.length > 0 && score / questions.length >= 0.8;

  return (
    <div>
      {showResult && (
        <div className={`mb-6 p-6 rounded-lg border-l-4 text-center shadow-sm animate-fade-in ${isPassed ? "bg-green-50 border-green-500 text-green-800" : "bg-red-50 border-red-500 text-red-800"}`}>
          <h2 className="text-2xl font-bold mb-2">{isPassed ? "COMPETENCY MET" : "Not Met - Please Review"}</h2>
          <p className="font-bold text-3xl mb-4">{Math.round((score / questions.length) * 100)}%</p>
          {isCourseMode && isPassed && (
            <button onClick={onPass} className="njra-btn bg-green-700 text-white text-lg shadow-lg">
              Next Module <i className="fas fa-arrow-right ml-2"></i>
            </button>
          )}
        </div>
      )}
      <div className="space-y-6">
        {questions.map((q, idx) => (
          <div key={idx} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <div className="font-bold text-gray-800 mb-4 text-lg">{idx + 1}. {q.text}</div>
            <div className="space-y-3">
              {q.options.map((opt, oIdx) => (
                <button
                  key={oIdx}
                  onClick={() => !showResult && setUserAnswers((p) => ({ ...p, [idx]: oIdx }))}
                  disabled={showResult}
                  className={`block w-full text-left p-4 rounded-lg flex items-center transition-all ${
                    showResult ? (oIdx === q.correctIndex ? "bg-green-50 border border-green-500 text-green-800" : userAnswers[idx] === oIdx ? "bg-red-50 border border-red-500 text-red-800" : "bg-gray-50")
                    : userAnswers[idx] === oIdx ? "border-2 border-quik-500 bg-quik-50" : "border border-gray-200 bg-white hover:border-quik-500"}`}
                >
                  <span className="font-bold mr-3 text-gray-500">{String.fromCharCode(65 + oIdx)}.</span> {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
        {questions.length > 0 && !showResult && (
          <div className="text-right">
            <button onClick={handleSubmit} className="njra-btn njra-btn-quik px-8 py-3 shadow-lg">
              Submit Answers
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const CoursePlayer = ({ activeBundle, policies, courseState, setCourseState, onExit }) => {
  const bundlePolicies = useMemo(() => policies.filter((p) => activeBundle.policyIds.includes(p.id)), [activeBundle, policies]);
  const currentPolicy = bundlePolicies[courseState.index];

  if (courseState.mode === "summary") {
    return (
      <div className="max-w-4xl mx-auto p-8 bg-white rounded-xl shadow-lg text-center mt-10 border border-gray-100">
        <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-500 text-4xl"><i className="fas fa-trophy"></i></div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bundle Completed!</h1>
        <p className="text-lg text-gray-500 mb-8">You have successfully completed <strong>{activeBundle.title}</strong>.</p>
        <div className="flex justify-center gap-4 no-print">
          <button onClick={() => window.print()} className="njra-btn njra-btn-primary"><i className="fas fa-certificate mr-2"></i> Print Certificate</button>
          <button onClick={onExit} className="njra-btn njra-btn-outline">Return Home</button>
        </div>
      </div>
    );
  }

  if (!currentPolicy) return null;

  return (
    <div className="max-w-5xl mx-auto w-full bg-white min-h-screen flex flex-col shadow-2xl">
      <div className="bg-quik-600 text-white p-4 sticky top-0 z-30 shadow-md flex items-center justify-between">
        <div className="flex items-center"><h2 className="font-bold text-lg"><i className="fas fa-layer-group mr-3 opacity-50"></i> {activeBundle.title}</h2></div>
        <button onClick={() => { if (confirm("Exit course?")) onExit(); }} className="text-white/70 hover:text-white"><i className="fas fa-times"></i></button>
      </div>
      <div className="w-full bg-gray-200 h-1"><div className="bg-quik-500 h-1 transition-all duration-500" style={{ width: `${((courseState.index) / bundlePolicies.length) * 100}%` }}></div></div>
      <div className="flex-grow p-8 bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <div><span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Module {courseState.index + 1} of {bundlePolicies.length}</span><h1 className="text-2xl font-bold text-gray-900">{currentPolicy.title}</h1></div>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button onClick={() => setCourseState((p) => ({ ...p, mode: "read" }))} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${courseState.mode === "read" ? "bg-white shadow text-quik-600" : "text-gray-500"}`}>Read</button>
              <button onClick={() => setCourseState((p) => ({ ...p, mode: "quiz" }))} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${courseState.mode === "quiz" ? "bg-white shadow text-quik-600" : "text-gray-500"}`}>Quiz</button>
            </div>
          </div>
          {courseState.mode === "read" ? (
            <div className="animate-fade-in">
              <div className="policy-content prose max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: sanitize(currentPolicy.content) }}></div>
              <div className="mt-8 pt-6 border-t flex justify-end"><button onClick={() => setCourseState((p) => ({ ...p, mode: "quiz" }))} className="njra-btn njra-btn-quik text-lg px-8 py-3 shadow-lg hover:shadow-xl">Take Competency Quiz <i className="fas fa-arrow-right ml-2"></i></button></div>
            </div>
          ) : (
            <div className="animate-fade-in"><QuizComponent policy={currentPolicy} isCourseMode onPass={() => {
              if (courseState.index + 1 < bundlePolicies.length) {
                setCourseState((p) => ({ ...p, index: p.index + 1, mode: "read" }));
                window.scrollTo(0, 0);
              } else {
                setCourseState((p) => ({ ...p, mode: "summary" }));
                window.scrollTo(0, 0);
              }
            }} /></div>
          )}
        </div>
      </div>
    </div>
  );
};

const InstructorGuideView = ({ activeBundle, policies, onClose }) => {
  const bundlePolicies = policies.filter((p) => activeBundle.policyIds.includes(p.id));
  return (
    <div className="max-w-4xl mx-auto bg-white p-12 min-h-screen">
      <div className="no-print flex justify-between mb-8 pb-4 border-b"><h2 className="text-2xl font-bold">Instructor Guide Preview</h2><div className="flex gap-2"><button onClick={() => window.print()} className="njra-btn njra-btn-primary"><i className="fas fa-print mr-2"></i> Print Guide</button><button onClick={onClose} className="njra-btn njra-btn-secondary">Close</button></div></div>
      <div className="print-cover-page border-4 border-double border-gray-800 p-12"><div className="text-4xl font-bold text-njra-900 mb-4">Instructor Training Guide</div><div className="text-2xl text-gray-600 mb-8">{activeBundle.title}</div><div className="mt-auto font-bold text-red-600 border-2 border-red-600 px-4 py-2 rounded">CONTAINS ANSWER KEYS</div></div>
      {bundlePolicies.map((policy) => (
        <div key={policy.id} className="print-page-break mb-12 border-b-4 border-gray-300 pb-8">
          <div className="flex justify-between items-end border-b-2 border-black pb-2 mb-6"><h1 className="text-3xl font-bold text-black m-0">{policy.title}</h1><span className="font-mono text-gray-500">{policy.code}</span></div>
          <div className="policy-content mb-8" dangerouslySetInnerHTML={{ __html: sanitize(policy.content) }}></div>
          <div className="bg-gray-50 p-6 border-2 border-dashed border-gray-400 print:bg-white print:border-black"><h3 className="text-xl font-bold text-black mb-4 uppercase"><i className="fas fa-key"></i> Competency Answer Key</h3><div className="space-y-4">{policy.questions && policy.questions.map((q, qIdx) => (<div key={qIdx} className="print-avoid-break"><div className="font-bold text-black mb-1">{qIdx + 1}. {q.text}</div><ul className="pl-6 list-[lower-alpha]">{q.options.map((opt, oIdx) => (<li key={oIdx} className={oIdx === q.correctIndex ? "text-green-700 font-bold" : "text-gray-600"}>{opt}</li>))}</ul></div>))}</div></div>
        </div>
      ))}
    </div>
  );
};

const AdminDashboard = ({ policies, bundles, onSavePolicy, onDeletePolicy, onUpdateCategory, onSaveBundle, onDeleteBundle, metadata, aiService }) => {
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newPolicyTopic, setNewPolicyTopic] = useState("");
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [content, setContent] = useState("<p>New policy content...</p>");
  const [questions, setQuestions] = useState([{ text: "Competency question", options: ["Option A", "Option B"], correctIndex: 0 }]);
  const [bundleTitle, setBundleTitle] = useState("");
  const [bundleDesc, setBundleDesc] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [status, setStatus] = useState("");

  const handleUpload = (files) => setUploadQueue(Array.from(files || []));

  const saveManualPolicy = async () => {
    await onSavePolicy({ id: crypto.randomUUID(), title, code, category, content, questions });
    setTitle("");
    setCode("");
    setContent("<p>New policy content...</p>");
    setQuestions([{ text: "Competency question", options: ["Option A", "Option B"], correctIndex: 0 }]);
  };

  const saveBundle = async () => {
    await onSaveBundle({ id: crypto.randomUUID(), title: bundleTitle, description: bundleDesc, policyIds: Array.from(selectedIds) });
    setBundleTitle("");
    setBundleDesc("");
    setSelectedIds(new Set());
  };

  const createFromTopic = async () => {
    if (!newPolicyTopic) return;
    setIsProcessing(true);
    setStatus("Requesting secure AI backend...");
    try {
      const data = await aiService.generatePolicy(newPolicyTopic);
      await onSavePolicy({ ...data, id: crypto.randomUUID() });
      setNewPolicyTopic("");
    } catch (error) {
      alert(error.message);
    }
    setIsProcessing(false);
    setStatus("");
  };

  const processQueue = async () => {
    if (uploadQueue.length === 0) return;
    setIsProcessing(true);
    setStatus("Processing uploads. In this demo, files are not sent to the server.");
    setTimeout(() => {
      alert("Files received. Connect a backend to process documents securely.");
      setUploadQueue([]);
      setIsProcessing(false);
      setStatus("");
    }, 750);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {status && <div className="bg-yellow-50 text-yellow-800 text-center text-xs py-2 border-b border-yellow-200">{status}</div>}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-lg text-njra-500 mb-4 border-b pb-2">1. Create Policy</h3>
          <input className="w-full border p-3 rounded-lg mb-3" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="w-full border p-3 rounded-lg mb-3" placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} />
          <select className="w-full border p-3 rounded-lg mb-3" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <textarea className="w-full border p-3 rounded-lg mb-3" rows={6} value={content} onChange={(e) => setContent(e.target.value)}></textarea>
          <button onClick={saveManualPolicy} className="njra-btn njra-btn-primary w-full">Save Policy</button>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-lg text-njra-500 mb-4 border-b pb-2">2. AI Assist</h3>
          <p className="text-sm text-gray-600 mb-4">AI requests are routed to a secure backend. No keys are stored in the browser.</p>
          <input className="w-full border p-3 rounded-lg mb-3" placeholder="Topic to generate" value={newPolicyTopic} onChange={(e) => setNewPolicyTopic(e.target.value)} />
          <button onClick={createFromTopic} disabled={isProcessing} className="njra-btn njra-btn-quik w-full">{isProcessing ? "Working..." : "Generate via Backend"}</button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h3 className="font-bold text-lg text-quik-600 mb-4 border-b pb-2">3. Upload Source Documents</h3>
        <p className="text-sm text-gray-600 mb-2">Files are stored locally for demo purposes. Connect a backend pipeline to ingest securely.</p>
        <input type="file" multiple accept=".doc,.docx" onChange={(e) => handleUpload(e.target.files)} className="mb-4" />
        <button onClick={processQueue} disabled={isProcessing || uploadQueue.length === 0} className="njra-btn njra-btn-outline">Process {uploadQueue.length} file(s)</button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-lg text-njra-500">Policies</h3><span className="text-xs text-gray-500">Last Updated: {metadata.lastUpdated}</span></div>
        <div className="space-y-3">
          {policies.map((p) => (
            <div key={p.id} className="border rounded-lg p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold text-gray-800">{p.title}</div>
                  <div className="text-xs text-gray-500">{p.code}</div>
                </div>
                <button onClick={() => onDeletePolicy(p.id)} className="text-red-500 hover:text-red-700 p-2"><i className="fas fa-trash"></i></button>
              </div>
              <div className="flex gap-3 items-center">
                <label className="text-xs uppercase text-gray-500">Category</label>
                <select value={p.category} onChange={(e) => onUpdateCategory(p.id, e.target.value)} className="border rounded px-2 py-1 text-sm">
                  {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h3 className="font-bold text-lg text-quik-600 mb-4 border-b pb-2">4. QuikComp Bundle Builder</h3>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-4">
            <input className="w-full border p-3 rounded-lg" placeholder="Bundle Title" value={bundleTitle} onChange={(e) => setBundleTitle(e.target.value)} />
            <textarea className="w-full border p-3 rounded-lg" placeholder="Short Description" value={bundleDesc} onChange={(e) => setBundleDesc(e.target.value)} rows="2"></textarea>
            <div className="h-64 overflow-y-auto border p-2 rounded-lg bg-gray-50">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2 px-2">Select Policies to Include:</p>
              {policies.map((p) => (
                <div key={p.id} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer">
                  <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => {
                    const s = new Set(selectedIds);
                    if (s.has(p.id)) s.delete(p.id); else s.add(p.id);
                    setSelectedIds(s);
                  }} />
                  <span className="text-sm">{p.title}</span>
                </div>
              ))}
            </div>
            <button onClick={saveBundle} className="w-full njra-btn njra-btn-quik shadow-md">Save New Bundle</button>
          </div>
          <div className="flex-1 border-l pl-8">
            <h4 className="font-bold text-gray-700 mb-4">Existing Bundles</h4>
            <div className="all-bundles space-y-3">
              {bundles.map((b) => (
                <div key={b.id} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                  <div>
                    <div className="font-bold text-sm text-gray-800">{b.title}</div>
                    <div className="text-xs text-gray-500">{b.policyIds ? b.policyIds.length : 0} Modules</div>
                  </div>
                  <button onClick={() => onDeleteBundle(b.id)} className="text-red-400 hover:text-red-600"><i className="fas fa-trash"></i></button>
                </div>
              ))}
              {bundles.length === 0 && <p className="text-sm text-gray-400 italic">No bundles created yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const config = useConfig();
  const { policies, bundles, metadata, loading, savePolicy, deletePolicy, updateCategory, saveBundle, deleteBundle } = usePolicies();
  const [view, setView] = useState("home");
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [activeBundle, setActiveBundle] = useState(null);
  const [courseState, setCourseState] = useState({ active: false, index: 0, mode: "read" });
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminStatus, setAdminStatus] = useState("");
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({ email: "", password: "" });

  const aiService = useMemo(() => createAiService(config), [config]);
  const authService = useMemo(() => createAuthService(config), [config]);

  const startCourse = (bundle) => {
    setActiveBundle(bundle);
    setCourseState({ active: true, index: 0, mode: "read" });
    setView("course_player");
  };

  const printInstructorGuide = (bundle) => {
    setActiveBundle(bundle);
    setView("instructor_print");
    setTimeout(() => window.print(), 500);
  };

  const PolicyList = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const filteredPolicies = policies.filter(
      (p) => p.title.toLowerCase().includes(searchTerm.toLowerCase()) || (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
      <div className="w-full flex-grow bg-gray-50 min-h-screen flex flex-col">
        <div className="max-w-6xl mx-auto px-6 py-10 w-full">
          <div className="text-center mb-10 bg-white p-10 rounded-xl shadow-sm border border-gray-100">
            <h1 className="text-3xl font-extrabold text-njra-500 mb-2">Policy &amp; Competency Portal</h1>
            <p className="text-gray-500 mb-6">Search clinical protocols, staff competencies, and training bundles.</p>
            <div className="max-w-xl mx-auto relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <i className="fas fa-search"></i>
              </div>
              <input
                type="text"
                className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-full bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-njra-500 focus:border-transparent transition-all shadow-inner"
                placeholder="Search keywords, codes, or topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {bundles.length > 0 && !searchTerm && (
            <div className="mb-12 animate-fade-in">
              <div className="flex items-center gap-2 mb-4 ml-1">
                <h2 className="text-xl font-bold text-gray-800">QuikComp Bundles</h2>
                <span className="bg-quik-100 text-quik-600 text-xs px-2 py-0.5 rounded-full font-bold">Demo</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bundles.map((b) => <BundleCard key={b.id} bundle={b} onStart={startCourse} onPrint={printInstructorGuide} />)}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded text-gray-500"><i className="fas fa-file-alt"></i></div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Document Library</h2>
                  <p className="text-xs text-gray-500">Last Updated: {metadata.lastUpdated}</p>
                </div>
              </div>
              <span className="text-sm text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-200 font-mono">
                {filteredPolicies.length} Records
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Policy Title</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Category</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredPolicies.map((p) => (
                    <PolicyCard key={p.id} policy={p} onSelect={(policy) => { setSelectedPolicy(policy); setView("detail"); }} onQuiz={(policy) => { setSelectedPolicy(policy); setView("quiz"); }} />
                  ))}
                  {filteredPolicies.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                        <i className="fas fa-folder-open text-4xl mb-3 opacity-20"></i>
                        <p>No documents found matching "{searchTerm}"</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-auto bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-400">
          &copy; 2025 New Jersey Respiratory Associates. Internal Use Only.
        </div>
      </div>
    );
  };

  const login = async (e) => {
    e.preventDefault();
    setAdminStatus("Authenticating...");
    try {
      await authService.login(adminCredentials);
      setAdminAuthed(true);
      setShowAdminLogin(false);
      setView("admin");
    } catch (error) {
      alert(error.message);
    }
    setAdminStatus("");
  };

  return (
    <div className="min-h-screen flex flex-col w-full njra-inner-content bg-gray-50">
      {view !== "course_player" && view !== "instructor_print" && (
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 no-print">
          <div className="px-6 py-4 flex justify-between items-center max-w-7xl mx-auto">
            <div className="flex items-center cursor-pointer" onClick={() => setView("home")}>
              <span className="text-2xl mr-2 text-njra-500"><i className="fas fa-lungs"></i></span>
              <span className="text-xl font-bold text-gray-800">NJ Respiratory</span>
            </div>
            <button onClick={() => setShowAdminLogin(true)} className="text-gray-400 hover:text-njra-500 transition-colors">
              <i className="fas fa-lock"></i>
            </button>
          </div>
        </nav>
      )}

      {loading && (
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", color: "#af3030" }}>
          <i className="fas fa-circle-notch fa-spin fa-3x mb-4"></i>
          <p style={{ color: "#4b5563", fontWeight: 600 }}>Loading Portal...</p>
        </div>
      )}

      {!loading && (
        <>
          {view === "home" && <PolicyList />}
          {view === "course_player" && activeBundle && (
            <CoursePlayer activeBundle={activeBundle} policies={policies} courseState={courseState} setCourseState={setCourseState} onExit={() => setView("home")} />
          )}
          {view === "instructor_print" && activeBundle && (
            <InstructorGuideView activeBundle={activeBundle} policies={policies} onClose={() => setView("home")} />
          )}
          {view === "admin" && adminAuthed && (
            <AdminDashboard
              policies={policies}
              bundles={bundles}
              onSavePolicy={savePolicy}
              onDeletePolicy={deletePolicy}
              onUpdateCategory={updateCategory}
              onSaveBundle={saveBundle}
              onDeleteBundle={deleteBundle}
              metadata={metadata}
              aiService={aiService}
            />
          )}
          {view === "detail" && selectedPolicy && (
            <div className="p-8 max-w-4xl mx-auto bg-white min-h-screen">
              <button onClick={() => setView("home")} className="mb-6 text-gray-500 hover:text-njra-500 font-bold flex items-center"><i className="fas fa-arrow-left mr-2"></i> Back to Library</button>
              <div className="bg-gray-50 px-3 py-1 rounded inline-block text-xs font-mono mb-2 text-gray-500">CODE: {selectedPolicy.code}</div>
              <h1 className="text-4xl font-extrabold text-njra-500 leading-tight">{selectedPolicy.title}</h1>
              <div className="policy-content mt-8" dangerouslySetInnerHTML={{ __html: sanitize(selectedPolicy.content) }}></div>
            </div>
          )}
          {view === "quiz" && selectedPolicy && (
            <div className="p-8 max-w-3xl mx-auto bg-white min-h-screen">
              <button onClick={() => setView("home")} className="mb-6 text-gray-500 hover:text-njra-500 font-bold flex items-center"><i className="fas fa-arrow-left mr-2"></i> Cancel Quiz</button>
              <h1 className="text-3xl font-bold mb-1">Competency Evaluation</h1>
              <p className="text-gray-500 mb-8 text-lg">for {selectedPolicy.title}</p>
              <QuizComponent policy={selectedPolicy} />
            </div>
          )}
        </>
      )}

      {showAdminLogin && (
        <div className="fixed inset-0 bg-njra-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100 transform transition-all scale-100">
            <div className="text-center mb-6"><div className="inline-block p-3 bg-red-50 rounded-full text-njra-500 mb-2"><i className="fas fa-user-shield text-2xl"></i></div><h3 className="font-bold text-xl text-gray-900">Admin Access</h3></div>
            <p className="text-sm text-gray-600 mb-4">Authentication requires a server-issued session. Configure <code>apiBaseUrl</code> &amp; enable <code>adminAuthEnabled</code>.</p>
            <form onSubmit={login}>
              <input type="email" placeholder="Work email" className="w-full border border-gray-300 p-3 mb-3 rounded-lg outline-none focus:ring-2 focus:ring-njra-500" value={adminCredentials.email} onChange={(e) => setAdminCredentials((p) => ({ ...p, email: e.target.value }))} />
              <input type="password" placeholder="Password" className="w-full border border-gray-300 p-3 mb-6 rounded-lg outline-none focus:ring-2 focus:ring-njra-500" value={adminCredentials.password} onChange={(e) => setAdminCredentials((p) => ({ ...p, password: e.target.value }))} />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAdminLogin(false)} className="njra-btn njra-btn-outline flex-1 py-3">Cancel</button>
                <button type="submit" className="njra-btn njra-btn-primary flex-1 py-3 shadow-lg">Login</button>
              </div>
            </form>
            {adminStatus && <p className="text-xs text-gray-500 mt-3 text-center">{adminStatus}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("njra-app-root"));
root.render(<App />);
