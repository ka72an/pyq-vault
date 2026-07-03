"use client";

import { useState, useMemo } from "react";
import { Search, Filter, History } from "lucide-react";
import { questions } from "@/data/questions";
import KnowledgeGraph from "@/components/KnowledgeGraph";
import QuestionCard from "@/components/QuestionCard";

// Define the shape of our new sidebar tracking log
type ActivityLog = {
  id: string;
  qNum: number | string;
  subject: string;
  letter: string;
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [graphSelectedNode, setGraphSelectedNode] = useState<string | null>(null);
  const [graphSelectedType, setGraphSelectedType] = useState<"subject" | "topic" | null>(null);
  
  const [showFilters, setShowFilters] = useState(false);
  const [excludedSubjects, setExcludedSubjects] = useState<Set<string>>(new Set());
  const [excludedYears, setExcludedYears] = useState<Set<number>>(new Set());
  const [showMap, setShowMap] = useState<boolean>(false);

  // NEW: State to hold the history of marked answers for the sidebar
  const [activityTracker, setActivityTracker] = useState<ActivityLog[]>([]);

  const availableSubjects = useMemo(() => {
    const subjects = questions.map(q => q.subject).filter(Boolean) as string[];
    return Array.from(new Set(subjects)).sort();
  }, []);

  const availableYears = useMemo(() => {
    const years = questions.map(q => q.year).filter(Boolean) as number[];
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, []);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (graphSelectedType === "subject" && q.subject !== graphSelectedNode) return false;
      if (graphSelectedType === "topic" && q.topic !== graphSelectedNode) return false;
      if (q.subject && excludedSubjects.has(q.subject)) return false;
      if (q.year && excludedYears.has(q.year)) return false;

      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;
      const tokens = query.split(/\s+/);
      const searchableText = [
        q.text, q.subject, q.topic, q.year?.toString(), ...(q.options || [])
      ].filter(Boolean).join(" ").toLowerCase();

      return tokens.every((token) => searchableText.includes(token));
    });
  }, [searchQuery, excludedSubjects, excludedYears, graphSelectedNode, graphSelectedType]);

  const toggleExclusion = (set: Set<any>, updateState: React.Dispatch<React.SetStateAction<any>>, value: any) => {
    const newSet = new Set(set);
    if (newSet.has(value)) newSet.delete(value);
    else newSet.add(value);
    updateState(newSet);
  };

  // NEW: Function to catch the signal from QuestionCard and add it to the sidebar
  // NEW: Smart Function to catch the signal and prevent duplicates
  const handleLogActivity = (qNum: number | null | undefined, subject: string, letter: string) => {
    setActivityTracker(prev => {
      const questionId = qNum || "N/A";
      
      // 1. Check if this exact question is already in the log
      const existingIndex = prev.findIndex(log => log.qNum === questionId && log.subject === subject);

      if (existingIndex !== -1) {
        // 2. If they clicked the exact SAME option again, do absolutely nothing
        if (prev[existingIndex].letter === letter) {
          return prev;
        }
        
        // 3. If they clicked a DIFFERENT option, update it and bring it to the top
        const newTracker = [...prev];
        const [updatedEntry] = newTracker.splice(existingIndex, 1);
        
        updatedEntry.letter = letter;
        // We give it a fresh ID so the cool slide-in animation triggers again
        updatedEntry.id = Math.random().toString(36).substr(2, 9); 
        
        return [updatedEntry, ...newTracker];
      }

      // 4. If it is a brand new question, add it to the top normally
      const newEntry = {
        id: Math.random().toString(36).substr(2, 9),
        qNum: questionId,
        subject: subject,
        letter: letter
      };
      
      return [newEntry, ...prev].slice(0, 15);
    });
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-6 lg:p-8 font-sans">
      
      {/* EXPANDED CONTAINER: max-w-[1400px] and grid layout */}
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* ─── LEFT COLUMN: Main Feed (Takes up 3/4 of the screen) ─── */}
        <div className="lg:col-span-3 space-y-8">
          
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <h1 className="text-3xl font-bold text-white tracking-tight">PYQ Vault</h1>
              <span className="text-neutral-500 text-sm">{filteredQuestions.length} questions found</span>
            </div>

            {showMap && (
              <div className="transition-all duration-350 ease-in-out">
                <KnowledgeGraph 
                  questions={questions} 
                  selectedNode={graphSelectedNode}
                  onSelectNode={(id, type) => {
                    setGraphSelectedNode(id);
                    setGraphSelectedType(type);
                  }}
                />
              </div>
            )}
            
            <div className="flex gap-3">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-lg"
                />
              </div>
              <button 
                onClick={() => setShowMap(!showMap)}
                className={`px-4 rounded-xl border flex items-center gap-2 transition-all ${
                  showMap || graphSelectedNode
                    ? "bg-amber-500/10 border-amber-500/50 text-amber-400" 
                    : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                <span className="text-sm font-medium">{showMap ? "Hide Map" : "Show Map"}</span>
              </button>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 rounded-xl border flex items-center gap-2 transition-all ${
                  showFilters || excludedSubjects.size > 0 || excludedYears.size > 0
                    ? "bg-blue-500/10 border-blue-500/50 text-blue-400" 
                    : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                <Filter className="w-5 h-5" />
                Filters {(excludedSubjects.size > 0 || excludedYears.size > 0) && `(${excludedSubjects.size + excludedYears.size})`}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-xl p-6 space-y-6 shadow-xl">
              {/* ... (Filter toggles code remains same) ... */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">Exclude Specific Data</h2>
                <button onClick={() => { setExcludedSubjects(new Set()); setExcludedYears(new Set()); }} className="text-sm text-neutral-500 hover:text-neutral-300">
                  Clear All
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-medium text-neutral-400 mb-3 uppercase tracking-wider">Exclude Subjects</h3>
                  <div className="space-y-2">
                    {availableSubjects.map((subject) => (
                      <label key={subject} className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" checked={excludedSubjects.has(subject)} onChange={() => toggleExclusion(excludedSubjects, setExcludedSubjects, subject)} className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-blue-500" />
                        <span className={`text-sm transition-colors ${excludedSubjects.has(subject) ? 'text-neutral-600 line-through' : 'text-neutral-300'}`}>{subject}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-neutral-400 mb-3 uppercase tracking-wider">Exclude Years</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableYears.map((year) => (
                      <label key={year} className="cursor-pointer">
                        <input type="checkbox" className="peer sr-only" checked={excludedYears.has(year)} onChange={() => toggleExclusion(excludedYears, setExcludedYears, year)} />
                        <div className="px-3 py-1.5 text-sm rounded-md border border-neutral-800 bg-neutral-950 text-neutral-400 transition-all peer-checked:bg-red-500/10 peer-checked:border-red-500/30 peer-checked:text-red-400">{year}</div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {filteredQuestions.map((q, index) => (
              <QuestionCard 
                key={index} 
                question={q} 
                // We pass the function down to listen for clicks
                onOptionMarked={(letter) => handleLogActivity(q.question_number, q.subject, letter)}
              />
            ))}
          </div>

        </div>

        {/* ─── RIGHT COLUMN: Sticky Sidebar Tracker (Takes up 1/4 of the screen) ─── */}
        <div className="hidden lg:block lg:col-span-1">
          {/* position: sticky keeps it on screen even when you scroll down 90 pages */}
          <div className="sticky top-8 bg-neutral-900/30 border border-neutral-800/60 rounded-2xl p-5 backdrop-blur-xl shadow-2xl h-[calc(100vh-4rem)] overflow-y-auto flex flex-col">
            
            <div className="flex items-center gap-2 border-b border-neutral-800/80 pb-4 mb-4">
              <History className="w-5 h-5 text-neutral-400" />
              <h3 className="text-base font-semibold text-white tracking-wide">Activity Log</h3>
            </div>

            <div className="flex-grow space-y-3">
              {activityTracker.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-neutral-600 opacity-60">
                  <p className="text-sm text-center">Mark an option to see it tracked here.</p>
                </div>
              ) : (
                activityTracker.map((log) => (
                  <div key={log.id} className="bg-neutral-950/60 border border-neutral-800/60 rounded-xl p-3.5 shadow-inner transition-all animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-mono font-medium px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-neutral-400">
                        Q. {log.qNum}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">
                        {log.subject}
                      </span>
                    </div>
                    <div className="text-sm text-neutral-300 flex items-center justify-between">
                      <span>Marked Option:</span>
                      <strong className="text-white bg-white/10 px-2 py-0.5 rounded shadow-sm">
                        {log.letter}
                      </strong>
                    </div>
                  </div>
                ))
              )}
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}