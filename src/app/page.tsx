"use client";

import { useState, useMemo } from "react";
import { Search, Filter, History, RotateCcw, Download } from "lucide-react";
import { questions } from "@/data/questions";
import KnowledgeGraph from "@/components/KnowledgeGraph";
import QuestionCard from "@/components/QuestionCard";
import { toJpeg } from 'html-to-image'; // <-- Added this
import jsPDF from 'jspdf';             // <-- Added this
// ... your other imports

// Define the shape of our new sidebar tracking log
type ActivityLog = {
  id: string;
  qNum: number | string;
  subject: string;
  year?: number | null;
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

  



  // ... other states
  const [activityTracker, setActivityTracker] = useState<ActivityLog[]>([]);
  
  // ADD THIS EXACT LINE RIGHT HERE:
  const [resetCount, setResetCount] = useState(0); 

  // ... rest of your code

  const availableSubjects = useMemo(() => {
    const subjects = questions.map(q => q.subject).filter(Boolean) as string[];
    return Array.from(new Set(subjects)).sort();
  }, []);

  const availableYears = useMemo(() => {
    const years = questions.map(q => q.year).filter(Boolean) as number[];
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, []);

  const filteredQuestions = useMemo(() => {
    const results = questions.filter((q) => {
      if (graphSelectedType === "subject" && q.subject !== graphSelectedNode) return false;
      if (graphSelectedType === "topic" && q.topic !== graphSelectedNode) return false;
      
      // NEW ADDITIVE LOGIC: If items are selected, ONLY show questions that match them!
      if (excludedSubjects.size > 0 && (!q.subject || !excludedSubjects.has(q.subject))) return false;
      if (excludedYears.size > 0 && (!q.year || !excludedYears.has(q.year))) return false;

      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;
      const tokens = query.split(/\s+/);
      const searchableText = [
        q.text, q.subject, q.topic, q.year?.toString(), ...(q.options || [])
      ].filter(Boolean).join(" ").toLowerCase();

      return tokens.every((token) => searchableText.includes(token));
    });

    // Sort the feed: Year (Newest First) -> Question Number (1-125)
    return results.sort((a, b) => {
      const yearA = a.year || 0;
      const yearB = b.year || 0;
      if (yearA !== yearB) return yearB - yearA; 

      const numA = parseInt(String(a.question_number)) || 0;
      const numB = parseInt(String(b.question_number)) || 0;
      return numA - numB; 
    });
  }, [searchQuery, excludedSubjects, excludedYears, graphSelectedNode, graphSelectedType]);

  const toggleExclusion = (set: Set<any>, updateState: React.Dispatch<React.SetStateAction<any>>, value: any) => {
    const newSet = new Set(set);
    if (newSet.has(value)) newSet.delete(value);
    else newSet.add(value);
    updateState(newSet);
  };

  // NEW: Wipes the activity log and forces all QuestionCards to respawn
  const handleResetAll = () => {
    setActivityTracker([]); 
    setResetCount(prev => prev + 1); 
  };

  // NEW: Generates and downloads the OMR PDF
  // NEW: Generates and downloads the OMR PDF (Now using html-to-image!)
  // NEW: Generates and downloads the OMR PDF (With Multi-Page Support!)
  // NEW: Generates Multi-Page, Compressed OMR PDF
  const handleDownloadOMR = async () => {
    const pages = document.querySelectorAll('.omr-page-template');
    if (pages.length === 0) return;

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();

      for (let i = 0; i < pages.length; i++) {
        const element = pages[i] as HTMLElement;
        
        // Use JPEG with 80% quality. This drops the file size by like 95%
        const dataUrl = await toJpeg(element, { 
          quality: 0.8, 
          pixelRatio: 1.5, 
          backgroundColor: '#ffffff' 
        });

        if (i > 0) pdf.addPage(); // Add a new PDF page for every loop after the first
        
        // Calculate proportional height to prevent stretching
        const imgProps = pdf.getImageProperties(dataUrl);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, imgHeight);
      }
      
      pdf.save('PYQ_Vault_OMR_Sheet.pdf');
    } catch (err) {
      console.error('PDF Generation Failed:', err);
    }
  };

  // NEW: Function to catch the signal from QuestionCard and add it to the sidebar
  // NEW: Smart Function to catch the signal and prevent duplicates
  const handleLogActivity = (qNum: number | null | undefined, subject: string, letter: string,year: number | null | undefined) => {
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
      const newEntry : ActivityLog = {
        id: Math.random().toString(36).substr(2, 9),
        qNum: questionId,
        subject: subject,
        year: year,
        letter: letter
      };
      
      return [newEntry, ...prev];
    });
  };

  // Helper to match sidebar text colors to the QuestionCard glowing edge colors
  const getSubjectColor = (subject: string) => {
    const key = subject.toLowerCase();
    const colors: Record<string, string> = {
      computer: "text-purple-400",
      economics: "text-emerald-400",
      polity: "text-sky-400",
      geography: "text-amber-400",
      environment: "text-teal-400",
      science: "text-blue-400",
      maths: "text-rose-400",    // <-- Add this
    };
    return colors[key] || "text-neutral-500";
  };

  // NEW: Split the tracked answers into pages of 24 questions each for perfect PDF slicing
  // NEW: Sort the tracked answers for the OMR Sheet
  // Sort priority: Year -> Subject -> Question Number
  // NEW: Sort the tracked answers for the OMR Sheet
  // Sort priority: Year (Oldest First) -> Question Number
  const sortedForOMR = [...activityTracker].sort((a, b) => {
    // 1. Sort by Year (Ascending: 2021, 2022, 2023...)
    const yearA = a.year || 9999; 
    const yearB = b.year || 9999;
    if (yearA !== yearB) return yearA - yearB;

    // 2. Sort strictly by Question Number numerically (1, 2, 3...)
    // This perfectly reconstructs the original test paper sequence!
    const numA = parseInt(String(a.qNum)) || 0;
    const numB = parseInt(String(b.qNum)) || 0;
    return numA - numB;
  });

  // NEW: Split the sorted answers into pages of 24 questions each for perfect PDF slicing
  const QUESTIONS_PER_PAGE = 20;
  const chunkedLogs = [];
  for (let i = 0; i < sortedForOMR.length; i += QUESTIONS_PER_PAGE) {
    chunkedLogs.push(sortedForOMR.slice(i, i + QUESTIONS_PER_PAGE));
  }
  // Ensure we at least generate one blank page if the tracker is empty
  if (chunkedLogs.length === 0) chunkedLogs.push([]);

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
                <h2 className="text-lg font-semibold text-white">Filter Specific Data</h2>
                <button onClick={() => { setExcludedSubjects(new Set()); setExcludedYears(new Set()); }} className="text-sm text-neutral-500 hover:text-neutral-300">
                  Clear All
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-medium text-neutral-400 mb-3 uppercase tracking-wider">Select Subjects</h3>
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
                  <h3 className="text-sm font-medium text-neutral-400 mb-3 uppercase tracking-wider">Select Years</h3>
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
                key={`${index}-${resetCount}`} 
                question={q} 
                onOptionMarked={(letter) => handleLogActivity(q.question_number, q.subject, letter, q.year)}
              />
            ))}
          </div>

        </div>

        {/* ─── RIGHT COLUMN: Sticky Sidebar Tracker (Takes up 1/4 of the screen) ─── */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-8 bg-neutral-900/30 border border-neutral-800/60 rounded-2xl p-5 backdrop-blur-xl shadow-2xl h-[calc(100vh-4rem)] overflow-y-auto flex flex-col">
            
            {/* FIX: Changed to flex-col so the title and buttons stack cleanly */}
            <div className="flex flex-col gap-4 border-b border-neutral-800/80 pb-5 mb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-neutral-400" />
                <h3 className="text-lg font-semibold text-white tracking-wide">Activity Log</h3>
              </div>
              
              {activityTracker.length > 0 && (
                <div className="flex gap-2 w-full">
                  <button 
                    onClick={handleDownloadOMR}
                    className="flex-1 flex justify-center items-center gap-1.5 px-2 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-all text-xs font-semibold tracking-wide shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button 
                    onClick={handleResetAll}
                    className="flex-1 flex justify-center items-center gap-1.5 px-2 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all text-xs font-semibold tracking-wide shadow-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                </div>
              )}
            </div>

            <div className="flex-grow space-y-3">
              {activityTracker.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-neutral-600 opacity-60">
                  <p className="text-sm text-center">Mark an option to see it tracked here.</p>
                </div>
              ) : (
                activityTracker.map((log) => (
                  <div key={log.id} className="bg-neutral-950/60 border border-neutral-800/60 rounded-xl p-3.5 shadow-inner transition-all animate-in fade-in slide-in-from-right-4 duration-300">
                    
                    {/* FIX: Stacked the Question Number and Subject so they never overlap */}
                    <div className="flex flex-col gap-2 mb-3">
                      <span className="self-start text-xs font-mono font-medium px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-neutral-400">
                        Q. {log.qNum}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest drop-shadow-sm ${getSubjectColor(log.subject)}`}>
                        {log.subject}{log.year ? ` • ${log.year}` : ""}
                      </span>
                    </div>
                    
                    <div className="text-sm text-neutral-300 flex items-center justify-between border-t border-neutral-800/50 pt-2.5">
                      <span>Marked Option:</span>
                      <strong className="text-white bg-white/10 px-3 py-0.5 rounded shadow-sm">
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
      {/* --- HIDDEN MULTI-PAGE OMR TEMPLATE FOR PDF EXPORT --- */}
      <div className="fixed top-[200%] left-0 z-[-50] pointer-events-none flex flex-col gap-10">
        {chunkedLogs.map((chunk, pageIndex) => (
          <div key={pageIndex} className="omr-page-template bg-white text-black p-12 w-[800px] h-[1131px] flex flex-col">
            {/* Explicitly sized A4 container (800x1131px) */}
            
            {/* OMR Header */}
            <div className="border-b-4 border-black pb-6 mb-8 text-center flex flex-col items-center shrink-0">
              <h1 className="text-4xl font-extrabold uppercase tracking-widest mb-2">PYQ Vault</h1>
              <div className="bg-black text-white px-6 py-1.5 rounded-full text-xl font-bold tracking-widest inline-block">
                OMR ANSWER SHEET {chunkedLogs.length > 1 ? `- PAGE ${pageIndex + 1}` : ""}
              </div>
              <div className="w-full flex justify-between mt-6 text-sm font-bold uppercase tracking-wider border-t-2 border-black pt-4">
                <span>Candidate Sign: ____________________</span>
                <span>Total Marked: {activityTracker.length}</span>
                <span>Date: {new Date().toLocaleDateString()}</span>
              </div>
            </div>

            {/* OMR Body: Grid of Answers - Reduced gap-y to 4 */}
            <div className="grid grid-cols-2 gap-x-16 gap-y-4 flex-grow content-start">
              {chunk.map((log) => (
                <div key={log.id} className="flex items-center justify-between border-b border-gray-300 pb-2">
                  
                  {/* Question Info */}
                  <div className="flex flex-col w-1/2">
                    <span className="font-extrabold text-lg">Q. {log.qNum}</span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      {log.subject} {log.year ? `• ${log.year}` : ""}
                    </span>
                  </div>

                  {/* Bubbles */}
                  <div className="flex gap-3">
                    {['A', 'B', 'C', 'D'].map(letter => (
                      <div 
                        key={letter} 
                        className={`w-8 h-8 rounded-full border-[3px] border-black flex items-center justify-center font-bold text-sm
                          ${log.letter === letter ? 'bg-black text-white' : 'bg-white text-black'}`}
                      >
                        {letter}
                      </div>
                    ))}
                  </div>

                </div>
              ))}
            </div>

            {/* OMR Footer */}
            <div className="mt-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest border-t-2 border-black pt-4 shrink-0">
              Generated by PYQ Vault Tracker • Page {pageIndex + 1} of {chunkedLogs.length}
            </div>
            
          </div>
        ))}
      </div> {/* <-- Closes the Hidden OMR Template */}
    
      </div>

  );
}