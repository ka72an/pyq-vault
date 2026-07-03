"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { Question } from "@/data/questions";

// We import this dynamically with SSR disabled because HTML5 canvas needs the browser window object to exist
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

interface KnowledgeGraphProps {
  questions: Question[];
  onSelectNode: (nodeId: string | null, nodeType: "subject" | "topic" | null) => void;
  selectedNode: string | null;
}

export default function KnowledgeGraph({ questions, onSelectNode, selectedNode }: KnowledgeGraphProps) {
  
  // Transform our data dynamically into nodes and linking lines
  const graphData = useMemo(() => {
    const nodes: any[] = [{ id: "All Subjects", val: 18, color: "#eab308", type: "root" }];
    const links: any[] = [];
    
    const subjects = new Set<string>();
    const topicMap = new Map<string, string>(); // topic -> subject

    // Extract unique subjects and topics from current questions array
    questions.forEach((q) => {
      if (q.subject) subjects.add(q.subject);
      if (q.topic && q.subject) topicMap.set(q.topic, q.subject);
    });

    // 1. Generate Subject Nodes (e.g., Computer, Environment)
    subjects.forEach((subject) => {
      // Custom styling colors per subject area
      let color = "#38bdf8"; // Sky Blue default
      if (subject.toLowerCase().includes("computer")) color = "#a855f7"; // Premium Purple
      if (subject.toLowerCase().includes("environment")) color = "#10b981"; // Mint Emerald

      nodes.push({ id: subject, val: 12, color, type: "subject" });
      links.push({ source: "All Subjects", target: subject });
    });

    // 2. Generate Sub-Topic Nodes branching outward
    topicMap.forEach((subject, topic) => {
      nodes.push({ id: topic, val: 7, color: "#f87171", type: "topic" }); // Coral highlights
      links.push({ source: subject, target: topic });
    });

    return { nodes, links };
  }, [questions]);

  return (
    <div className="w-full h-[380px] bg-neutral-900/40 border border-neutral-850 rounded-2xl overflow-hidden relative backdrop-blur-md shadow-inner">
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h3 className="text-sm font-semibold text-white tracking-wide">Interactive Topic Map</h3>
        <p className="text-xs text-neutral-500">Click any node to filter questions instantly</p>
      </div>
      
      {selectedNode && (
        <button 
          onClick={() => onSelectNode(null, null)}
          className="absolute top-4 right-4 z-10 bg-neutral-800 hover:bg-neutral-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors border border-neutral-700"
        >
          Reset View
        </button>
      )}
      
      <ForceGraph2D
        graphData={graphData}
        height={380}
        backgroundColor="rgba(0,0,0,0)" // Transparent canvas to show the pitch dark background
        nodeLabel="id"
        nodeRelSize={1}
        nodeVal={(node: any) => node.val}
        // If a node is selected, highlight it white, otherwise show its native color
        nodeColor={(node: any) => (node.id === selectedNode ? "#ffffff" : node.color)}
        linkColor={() => "#262626"} // Deep dark zinc links
        linkWidth={2}
        cooldownTicks={80} // Limits physics computing time so your laptop fan doesn't go crazy
        onNodeClick={(node: any) => {
          if (node.type === "root") {
            onSelectNode(null, null);
          } else {
            onSelectNode(node.id, node.type);
          }
        }}
      />
    </div>
  );
}