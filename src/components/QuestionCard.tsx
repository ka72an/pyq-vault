"use client";

import { useState } from "react";
import { Question } from "@/data/questions";
import { Calendar, Tag, CheckCircle2 } from "lucide-react";

interface QuestionCardProps {
  question: Question;
  onOptionMarked?: (letter: string) => void;
}

// Map unique subject aesthetics dynamically
const SUBJECT_STYLING: Record<string, { badge: string; border: string; glow: string; text: string }> = {
  computer: {
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    border: "group-hover:border-purple-500/30",
    glow: "from-purple-500/20 to-transparent",
    text: "text-purple-400"
  },
  economics: {
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    border: "group-hover:border-emerald-500/30",
    glow: "from-emerald-500/20 to-transparent",
    text: "text-emerald-400"
  },
  polity: {
    badge: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    border: "group-hover:border-sky-500/30",
    glow: "from-sky-500/20 to-transparent",
    text: "text-sky-400"
  },
  geography: {
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    border: "group-hover:border-amber-500/30",
    glow: "from-amber-500/20 to-transparent",
    text: "text-amber-400"
  },
  environment: {
    badge: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    border: "group-hover:border-teal-500/30",
    glow: "from-teal-500/20 to-transparent",
    text: "text-teal-400"
  },
  default: {
    badge: "bg-zinc-800 text-zinc-400 border-zinc-700",
    border: "group-hover:border-zinc-700",
    glow: "from-zinc-700/10 to-transparent",
    text: "text-zinc-400"
  }
};

export default function QuestionCard({ question, onOptionMarked }: QuestionCardProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  // Determine the styling based on the subject name
  const subjectKey = question.subject?.toLowerCase() || "default";
  const style = SUBJECT_STYLING[subjectKey] || SUBJECT_STYLING.default;

  return (
    <div className={`group relative bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-6 transition-all duration-300 backdrop-blur-md hover:bg-neutral-900/60 overflow-hidden ${style.border}`}>
      
      {/* Subtle colorful edge glow indicator based on subject */}
      <div className={`absolute top-0 left-0 w-[3px] h-full bg-gradient-to-b ${style.glow}`} />

      {/* Top Metadata Header - Better Spacing Layout */}
      <div className="flex flex-wrap items-center gap-2 mb-4 text-xs font-medium">
        {question.question_number && (
          <span className="bg-neutral-800 text-neutral-400 border border-neutral-700/60 px-2.5 py-1 rounded-md">
            Q. {question.question_number}
          </span>
        )}
        
        {question.year && (
          <span className="bg-neutral-800 text-neutral-400 border border-neutral-700/60 px-2.5 py-1 rounded-md flex items-center gap-1">
            <Calendar className="w-3 h-3 text-neutral-500" />
            {question.year}
          </span>
        )}

        {question.subject && (
          <span className={`px-2.5 py-1 rounded-md border font-semibold tracking-wide uppercase text-[10px] ${style.badge}`}>
            {question.subject}
          </span>
        )}

        {question.topic && (
          <span className="text-neutral-500 flex items-center gap-1 ml-1 font-normal max-w-[200px] truncate">
            <Tag className="w-3 h-3 flex-shrink-0" />
            {question.topic}
          </span>
        )}
      </div>

      {/* Question Main Body */}
      <h2 className="text-lg font-medium text-neutral-100 leading-relaxed mb-5 pr-2 whitespace-pre-wrap">
        {question.text}
      </h2>

      {/* Options Stack - Wrapped in safety check to prevent crash if options are missing */}
      {question.options && question.options.length > 0 && (
        <div className="space-y-2.5 mb-6">
          {question.options.map((option, idx) => {
            const optionLetter = String.fromCharCode(65 + idx); // A, B, C, D
            const isSelected = selectedOption === idx;
            
            return (
              <button
                key={idx}
                onClick={() => {
                  if (!revealed) {
                    setSelectedOption(idx);
                    if (onOptionMarked) onOptionMarked(optionLetter);
                  }
                }}
                disabled={revealed}
                className={`w-full text-left flex items-start gap-4 p-3.5 rounded-xl border transition-all duration-200 text-sm font-normal ${
                  isSelected 
                    ? "bg-neutral-800 border-neutral-600 text-white font-medium shadow-md" 
                    : "bg-neutral-900/50 border-neutral-800/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                }`}
              >
                <span className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-semibold ${
                  isSelected ? "bg-white text-black" : "bg-neutral-800 text-neutral-500 group-hover:text-neutral-400"
                }`}>
                  {optionLetter}
                </span>
                <span className="leading-normal pt-0.5">{option}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Footer Actions Panel */}
      <div className="flex items-center justify-between pt-2 border-t border-neutral-850">
        <button
          onClick={() => setRevealed(!revealed)}
          disabled={selectedOption === null}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide border transition-all shadow-md ${
            selectedOption === null 
              ? "bg-neutral-900 text-neutral-600 border-neutral-850 cursor-not-allowed" 
              : "bg-white text-black border-white hover:bg-neutral-200"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          {revealed ? "Hide Answer" : "Check Answer"}
        </button>

        {revealed && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider animate-fade-in">
            Correct Option: {question.answer || "N/A"}
          </div>
        )}
      </div>
    </div>
  );
}