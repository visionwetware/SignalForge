import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Check, X } from "lucide-react";

export default function LearnPractice() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [marked, setMarked] = useState({});
  const [startedAt] = useState(new Date());

  useEffect(() => {
    base44.entities.Question.list("-created_date", 50).then((qs) => {
      // Shuffle
      setQuestions(qs.sort(() => Math.random() - 0.5).slice(0, 8));
    });
  }, []);

  const q = questions[idx];

  const mark = async (correct) => {
    setMarked({ ...marked, [idx]: correct });
    setShowAnswer(true);
  };

  const next = async () => {
    if (idx + 1 >= questions.length) {
      // End session
      const correct = Object.values(marked).filter(Boolean).length;
      await base44.entities.Session.create({
        started_at: startedAt.toISOString(),
        completed_at: new Date().toISOString(),
        correct_count: correct,
        total_count: questions.length,
        topic: "General",
      });
      navigate("/learn");
      return;
    }
    setIdx(idx + 1);
    setShowAnswer(false);
  };

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 md:px-12 py-20 text-center">
        <div className="text-[#1A1814]/50">No questions available yet.</div>
        <Link to="/learn" className="text-sm underline mt-3 inline-block">Back to Learn</Link>
      </div>
    );
  }

  if (!q) return null;

  return (
    <div className="max-w-2xl mx-auto px-6 md:px-12 py-12">
      <Link to="/learn" className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-[#1A1814]/60 hover:text-[#1A1814] mb-8">
        <ArrowLeft className="w-3 h-3" /> Exit
      </Link>

      <div className="text-[10px] uppercase tracking-[0.22em] text-[#1A1814]/50">
        Question {idx + 1} of {questions.length}
      </div>
      <div className="w-full h-0.5 bg-[#1A1814]/8 mt-3 rounded-full overflow-hidden">
        <div className="h-full bg-[#D97706] transition-all duration-500" style={{ width: `${((idx + (showAnswer ? 1 : 0)) / questions.length) * 100}%` }} />
      </div>

      <h2 className="font-serif text-2xl md:text-3xl mt-10 leading-snug">{q.prompt}</h2>

      {q.tags?.length > 0 && (
        <div className="flex gap-2 mt-4">
          {q.tags.map((t, i) => <span key={i} className="text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 bg-[#1A1814]/5 rounded">{t}</span>)}
        </div>
      )}

      {showAnswer ? (
        <div className="mt-8 border border-[#1A1814]/10 rounded-lg p-6 bg-white/60">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1814]/50">Answer</div>
          <div className="font-serif text-xl mt-1.5">{q.answer}</div>
          {q.explanation && <p className="text-[15px] text-[#1A1814]/70 mt-3 leading-relaxed">{q.explanation}</p>}
          <button onClick={next} className="mt-6 px-6 py-2.5 bg-[#1A1814] text-[#FAF7F2] text-sm rounded-md hover:bg-[#1A1814]/85 transition">
            {idx + 1 >= questions.length ? "Finish session" : "Next question →"}
          </button>
        </div>
      ) : (
        <div className="mt-10 flex gap-3">
          <button onClick={() => mark(true)} className="flex-1 flex items-center justify-center gap-2 py-3 border border-[#1A1814]/15 rounded-md hover:bg-white transition">
            <Check className="w-4 h-4" /> I think I know
          </button>
          <button onClick={() => mark(false)} className="flex-1 flex items-center justify-center gap-2 py-3 border border-[#1A1814]/15 rounded-md hover:bg-white transition">
            <X className="w-4 h-4" /> Not sure
          </button>
        </div>
      )}
    </div>
  );
}