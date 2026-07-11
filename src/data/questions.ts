// 1. Import your raw JSON files
import computerRaw from "./raw_json/computer.json";
import environmentRaw from "./raw_json/environment.json"; 
import polityRaw from "./raw_json/polity.json";
import economicsRaw from "./raw_json/economics.json";
import scienceRaw from "./raw_json/science.json";
import geographyRaw from "./raw_json/geography.json";
import mathsRaw from "./raw_json/maths.json";// <-- Cleaned up the name here
import answerKeyRaw from "./raw_json/answer_key.json";

const answerKey: Record<string, string> = answerKeyRaw;

// Define the shape of your question so TypeScript doesn't yell at you
export interface Question {
  question_number?: number | null;
  year?: number | null;
  text: string;
  options?: string[];
  answer?: string | null;
  explanation?: string | null;
  subject: string;
  topic?: string;    // <-- Added this
  chapter?: string;  // <-- Added this
}

// 2. Inject the subject name (and cast 'q' as 'any' to fix the squiggly line)
const computerQuestions: Question[] = computerRaw.map((q: any) => ({
  ...q,
  subject: "Computer"
}));

const environmentQuestions: Question[] = environmentRaw.map((q: any) => ({
  ...q,
  subject: "Environment"
}));
const polityQuestions: Question[] = polityRaw.map((q: any) => ({
  ...q,
  subject: "Polity"
}));
const economicsQuestions: Question[] = economicsRaw.map((q: any) => ({
  ...q,
  subject: "Economics"
}));
const scienceQuestions: Question[] = scienceRaw.map((q: any) => ({
  ...q,
  subject: "Science"
}));
const geographyQuestions: Question[] = geographyRaw.map((q: any) => ({
  ...q,
  subject: "Geography"
}));
const mathsQuestions: Question[] = mathsRaw.map((q: any) => ({
  ...q,
  subject: "Maths"
}));

// 3. Export the final, massive combined array
const combinedQuestions: Question[] = [
  ...computerQuestions,
  ...environmentQuestions,
  ...polityQuestions,
  ...economicsQuestions,
  ...scienceQuestions,
  ...geographyQuestions,
  ...mathsQuestions,
];

// 4. Inject the correct answers dynamically on export
export const questions: Question[] = combinedQuestions.map((q) => {
  const searchKey = `${q.year}_${q.subject}_${q.question_number}`;
  
  return {
    ...q,
    // It checks the generated answer key first, falls back to the original JSON answer, or leaves it null
    answer: answerKey[searchKey] || q.answer || null 
  };
});