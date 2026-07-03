import { NextResponse } from "next/server";
import { questions } from "@/data/questions";
import Fuse from "fuse.js";

// Set up the local fuzzy search engine
const fuse = new Fuse(questions, {
  keys: ["text", "subject", "topic", "chapter", "exam", "tags"],
  threshold: 0.3, // 0 is exact match, 1 is loose match
  includeScore: true,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json(questions); // Return all if no search query
  }

  const results = fuse.search(query).map(result => result.item);
  return NextResponse.json(results);
}