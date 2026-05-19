import questions from "../../seed/questions.json";

type Question = {
  question: string;
  category: string;
};

/**
 * Returns today's question deterministically based on date + userId hash.
 */
export function getDailyQuestion(userId: string): Question & { id: string } {
  const today = new Date().toISOString().split("T")[0];
  const seed = hashCode(today + userId);
  const index = Math.abs(seed) % questions.length;
  return { ...questions[index], id: `seed-${index}` };
}

export function getAllQuestions(): (Question & { id: string })[] {
  return questions.map((q, i) => ({ ...q, id: `seed-${i}` }));
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}
