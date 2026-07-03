
import React, { useState, useEffect, useRef } from 'react';
import { Question, TestSettings, StudentResult } from '../types';
import { Button } from './Button';

interface StudentTestProps {
  questions: Question[];
  settings: TestSettings;
  studentInfo: { name: string, shift: string };
  onExit: () => void;
  onComplete: (result: Partial<StudentResult>) => void;
  isAdminView?: boolean;
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

const ConfettiCanvas = () => {
    useEffect(() => {
        const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const particles: any[] = [];
        const colors = ['#3b82f6', '#2563eb', '#1d4ed8', '#1e3a8a', '#60a5fa'];
        for (let i = 0; i < 200; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                w: Math.random() * 8 + 4,
                h: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                speed: Math.random() * 3 + 1,
                angle: Math.random() * 360,
                spin: Math.random() * 8 - 4
            });
        }
        let animationId: number;
        const draw = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                ctx.save();
                ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
                ctx.rotate(p.angle * Math.PI / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
                p.y += p.speed;
                p.angle += p.spin;
                if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width; }
            });
            animationId = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(animationId);
    }, []);
    return <canvas id="confetti-canvas" className="fixed inset-0 pointer-events-none z-50" />;
};

const playAlarmBeep = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
    
    // Play a secondary beep slightly delayed for a warning pattern
    setTimeout(() => {
      try {
        const ctx2 = new AudioCtx();
        const osc2 = ctx2.createOscillator();
        const gain2 = ctx2.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1000, ctx2.currentTime);
        gain2.gain.setValueAtTime(0, ctx2.currentTime);
        gain2.gain.linearRampToValueAtTime(0.6, ctx2.currentTime + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx2.currentTime + 0.8);
        osc2.connect(gain2);
        gain2.connect(ctx2.destination);
        osc2.start();
        osc2.stop(ctx2.currentTime + 0.8);
      } catch (e) {}
    }, 400);
  } catch (err) {
    console.error("Failed to play alarm beep:", err);
  }
};

export const StudentTest: React.FC<StudentTestProps> = ({ questions, settings, studentInfo, onExit, onComplete, isAdminView, onNotify }) => {
  const hasMCQs = questions.length > 0;
  const hasTyping = (settings.typingText?.length || 0) > 10;
  
  const [activeSection, setActiveSection] = useState<'MCQ' | 'TYPING'>(() => {
    if (settings.testMode === 'MCQ' && hasMCQs) return 'MCQ';
    if (settings.testMode === 'TYPING' && hasTyping) return 'TYPING';
    const saved = localStorage.getItem(`test_active_section_${studentInfo.name}`);
    if (saved === 'MCQ' || saved === 'TYPING') return saved;
    return hasMCQs ? 'MCQ' : 'TYPING';
  });

  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    const saved = localStorage.getItem(`test_answers_${studentInfo.name}`);
    return saved ? JSON.parse(saved) : {};
  });

  const [typingInput, setTypingInput] = useState(() => {
    return localStorage.getItem(`typing_progress_${studentInfo.name}_${studentInfo.shift}`) || '';
  });

  const [submitted, setSubmitted] = useState(() => {
    if (isAdminView) return false;
    return localStorage.getItem(`test_submitted_${studentInfo.name}_${studentInfo.shift}`) === 'true';
  });

  const [showResults, setShowResults] = useState(() => {
    if (isAdminView) return false;
    return localStorage.getItem(`test_show_results_${studentInfo.name}_${studentInfo.shift}`) === 'true';
  });

  const [currentStep, setCurrentStep] = useState<number>(() => {
    const saved = localStorage.getItem(`test_current_step_${studentInfo.name}`);
    return saved ? parseInt(saved, 10) : 0;
  });

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const saved = localStorage.getItem(`test_time_left_${studentInfo.name}`);
    return saved ? parseInt(saved, 10) : settings.timeLimit * 60;
  });

  const [showAutoSaveToast, setShowAutoSaveToast] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentQuestion = questions[currentStep];
  const isCurrentQuestionAnswered = (hasMCQs && currentQuestion) ? !!answers[currentQuestion.id] : true;
  const totalAnswered = Object.keys(answers).length;
  const allQuestionsAnswered = totalAnswered === questions.length;

  useEffect(() => {
    if (studentInfo?.name) {
      localStorage.setItem(`test_active_section_${studentInfo.name}`, activeSection);
    }
  }, [activeSection, studentInfo?.name]);

  useEffect(() => {
    if (studentInfo?.name) {
      localStorage.setItem(`test_answers_${studentInfo.name}`, JSON.stringify(answers));
    }
  }, [answers, studentInfo?.name]);

  useEffect(() => {
    if (studentInfo?.name) {
      localStorage.setItem(`test_current_step_${studentInfo.name}`, String(currentStep));
    }
  }, [currentStep, studentInfo?.name]);

  useEffect(() => {
    if (studentInfo?.name && !submitted) {
      localStorage.setItem(`test_time_left_${studentInfo.name}`, String(timeLeft));
    }
  }, [timeLeft, studentInfo?.name, submitted]);

  useEffect(() => {
    if (studentInfo?.name && !submitted) {
      localStorage.setItem(`typing_progress_${studentInfo.name}_${studentInfo.shift}`, typingInput);
    }
  }, [typingInput, studentInfo?.name, studentInfo?.shift, submitted]);

  useEffect(() => {
    if (studentInfo?.name && !isAdminView) {
      localStorage.setItem(`test_show_results_${studentInfo.name}_${studentInfo.shift}`, String(showResults));
    }
  }, [showResults, studentInfo?.name, studentInfo?.shift, isAdminView]);

  useEffect(() => {
    if (submitted) return;
    if (timeLeft <= 0) { handleFinish(true); return; }
    const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, submitted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const calculateMCQScore = () => {
    return questions.filter(q => answers[q.id] === q.correctAnswer).length;
  };

  const calculateTypingMetrics = () => {
    const original = settings.typingText || '';
    const input = typingInput;
    let correct = 0;
    const minLength = Math.min(input.length, original.length);
    for (let i = 0; i < minLength; i++) {
        if (input[i] === original[i]) correct++;
    }
    const accuracy = input.length > 0 ? Math.round((correct / input.length) * 100) : 0;
    const timeInMinutes = (settings.timeLimit * 60 - timeLeft) / 60;
    const wpm = timeInMinutes > 0.01 ? Math.round((input.length / 5) / timeInMinutes) : 0;
    return { accuracy, wpm };
  };

  const handleFinish = (force: boolean = false) => {
    if (!force) {
      if (hasMCQs && activeSection === 'MCQ' && !allQuestionsAnswered) {
        if (onNotify) onNotify("Please answer all MCQ questions before finishing!", "error");
        const firstUnansweredIdx = questions.findIndex(q => !answers[q.id]);
        if (firstUnansweredIdx !== -1) setCurrentStep(firstUnansweredIdx);
        return;
      }

      if (hasTyping && activeSection === 'TYPING' && typingInput.trim().length === 0) {
        if (onNotify) onNotify("Please type something in the typing section!", "error");
        return;
      }
    } else {
      // Time is up! Play the alarm beep
      playAlarmBeep();
    }

    const metrics = activeSection === 'MCQ' ? {
      score: calculateMCQScore(),
      totalQuestions: questions.length,
      testMode: 'MCQ' as const
    } : {
        ...calculateTypingMetrics(),
        testMode: 'TYPING' as const
    };

    if (!isAdminView) {
      onComplete(metrics);
      localStorage.setItem(`test_submitted_${studentInfo.name}_${studentInfo.shift}`, 'true');
    }
    setSubmitted(true);
    if (onNotify) {
      if (force) {
        onNotify("Time's Up! Exam submitted automatically. ⚠️", "error");
      } else {
        onNotify("Exam submitted successfully! ✅");
      }
    }
  };

  const currentTypingMetrics = calculateTypingMetrics();
  const mcqScore = calculateMCQScore();

  const renderTypingFeedback = () => {
    const original = settings.typingText || '';
    const input = typingInput;
    return original.split('').map((char, i) => {
      let colorClass = "text-gray-300";
      if (i < input.length) {
        colorClass = input[i] === char ? "text-green-600" : "text-white bg-red-500 rounded-sm";
      }
      return <span key={i} className={`${colorClass} font-mono transition-colors duration-100`}>{char}</span>;
    });
  };

  const handleSectionSwitch = (section: 'MCQ' | 'TYPING') => {
    if (settings.strictMode && activeSection === 'MCQ' && !isCurrentQuestionAnswered) {
        if (onNotify) onNotify("Strict Mode: Answer this question before moving!", "error");
        return;
    }
    setActiveSection(section);
  }

  const handleNextStep = () => {
    if (settings.strictMode && !isCurrentQuestionAnswered) {
        if (onNotify) onNotify("Strict Mode: Locked until answered!", "error");
        return;
    }
    setCurrentStep(prev => prev + 1);
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <style>{`
        @keyframes border-flash {
          0%, 100% { border-color: rgba(220, 38, 38, 1); box-shadow: 0 0 0px rgba(220, 38, 38, 0); }
          50% { border-color: rgba(220, 38, 38, 0.4); box-shadow: 0 0 15px rgba(220, 38, 38, 0.3); }
        }
        .animate-border-flash { animation: border-flash 0.5s infinite; }
      `}</style>

      {showAutoSaveToast && (
        <div className="fixed bottom-10 right-10 z-[100] bg-gray-900 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl animate-pop border border-gray-700">
          💾 Progress Auto-Saved
        </div>
      )}

      {!submitted ? (
        <>
          <div className="sticky top-0 bg-white border-b border-gray-200 shadow-sm z-40">
            <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-center gap-3 max-w-[1400px] mx-auto">
                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-100 text-brand-700 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-lg sm:text-xl shrink-0">
                    {studentInfo.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p className="text-[9px] sm:text-[10px] font-black text-brand-600 uppercase tracking-widest">{studentInfo.shift}</p>
                    <h1 className="text-base sm:text-lg font-black text-gray-800 line-clamp-1">{studentInfo.name}</h1>
                </div>
                </div>
                
                <div className="flex flex-col items-center sm:block text-center shrink-0">
                    <h2 className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-tighter">{settings.title || 'Official Exam'}</h2>
                    {settings.strictMode && <span className="text-[8px] font-black text-red-500 uppercase block mt-0.5">🔒 Strict Mode Active</span>}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto border-t sm:border-t-0 border-gray-100 pt-2.5 sm:pt-0">
                    {(isAdminView || timeLeft <= 0 || submitted) && (
                        <button 
                            onClick={onExit}
                            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-white rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-md"
                        >
                            <span>🚪</span> Exit Exam
                        </button>
                    )}
                    <div className="hidden md:block text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ongoing Exam</p>
                        <p className="text-sm font-bold text-gray-600">{settings.subject}</p>
                    </div>
                    <div className={`px-4 sm:px-8 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-mono font-black text-xl sm:text-3xl border-2 transition-all duration-300 ${timeLeft < 30 ? 'bg-red-50 text-red-600 animate-border-flash' : timeLeft < 60 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-900 text-white border-gray-900'}`}>
                        {formatTime(timeLeft)}
                    </div>
                </div>
            </div>

            {(hasMCQs && hasTyping) && (
                <div className="bg-gray-50 border-t border-gray-200 px-4 sm:px-6 py-2">
                    <div className="max-w-[1400px] mx-auto flex gap-1.5 sm:gap-2">
                        <button 
                            onClick={() => handleSectionSwitch('MCQ')}
                            className={`flex-1 sm:flex-initial px-3 sm:px-6 py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${activeSection === 'MCQ' ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100'}`}
                        >
                            1. MCQ Section {Object.keys(answers).length > 0 && `(${Object.keys(answers).length}/${questions.length})`}
                        </button>
                        <button 
                            onClick={() => handleSectionSwitch('TYPING')}
                            className={`flex-1 sm:flex-initial px-3 sm:px-6 py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${activeSection === 'TYPING' ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100'}`}
                        >
                            2. Typing Section {typingInput.length > 0 && `(Typing...)`}
                        </button>
                    </div>
                </div>
            )}
          </div>

          {timeLeft <= 0 && (
            <div className="bg-red-600 text-white font-black text-center py-3 px-4 uppercase tracking-widest text-[10px] sm:text-xs animate-pulse sticky top-[72px] z-30 flex items-center justify-center gap-2">
              ⚠️ Time Out! Your exam is frozen/blocked. Click "Exit Exam" above to close. ⚠️
            </div>
          )}

          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 mt-4 sm:mt-8 animate-pop">
            {activeSection === 'MCQ' && hasMCQs ? (
               <div className="max-w-4xl mx-auto">
                  <div className="bg-white p-5 sm:p-12 rounded-3xl sm:rounded-[3rem] shadow-xl border border-gray-100">
                    <div className="flex justify-between items-center mb-6 sm:mb-10">
                        <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-100 text-gray-500 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase">Question {currentStep + 1} of {questions.length}</span>
                        {!settings.strictMode && (
                            <div className="flex gap-1">
                                {questions.map((_, idx) => (
                                    <div key={idx} className={`w-4 sm:w-8 h-1 rounded-full ${idx === currentStep ? 'bg-brand-600' : answers[questions[idx].id] ? 'bg-green-400' : 'bg-gray-100'}`}></div>
                                ))}
                            </div>
                        )}
                    </div>

                    <h2 className="text-xl sm:text-3xl font-black text-gray-900 mb-6 sm:mb-12 leading-tight">
                        {questions[currentStep]?.questionText || "Question not available"}
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {questions[currentStep]?.options.map((opt, idx) => (
                        <button 
                          key={idx} 
                          disabled={timeLeft <= 0}
                          onClick={() => {
                            if (timeLeft > 0) {
                              setAnswers({...answers, [questions[currentStep].id]: opt});
                            }
                          }} 
                          className={`group text-left p-3.5 sm:p-6 rounded-2xl sm:rounded-[2rem] border-2 transition-all flex items-center gap-3 sm:gap-5 hover:scale-[1.02] ${timeLeft <= 0 ? 'opacity-60 cursor-not-allowed' : ''} ${answers[questions[currentStep].id] === opt ? 'border-brand-500 bg-brand-50 ring-4 sm:ring-8 ring-brand-50' : 'border-gray-50 bg-gray-50 hover:bg-white hover:border-brand-200'}`}
                        >
                          <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl flex items-center justify-center font-black text-base sm:text-xl transition-colors ${answers[questions[currentStep].id] === opt ? 'bg-brand-600 text-white' : 'bg-white text-gray-400 border border-gray-100 group-hover:bg-brand-100 group-hover:text-brand-600'}`}>
                            {String.fromCharCode(65+idx)}
                          </div>
                          <span className={`font-bold text-sm sm:text-lg ${answers[questions[currentStep].id] === opt ? 'text-brand-900' : 'text-gray-600'}`}>{opt}</span>
                        </button>
                      ))}
                    </div>

                    <div className="mt-8 sm:mt-16 pt-4 sm:pt-8 border-t border-gray-50 flex flex-col items-center gap-4 sm:gap-6">
                      {!isCurrentQuestionAnswered && (
                        <p className="text-red-500 font-bold text-xs sm:text-sm animate-pulse text-center">⚠️ {settings.strictMode ? "Strict Mode: Answer this question to unlock next" : "Please select an option to proceed"}</p>
                      )}
                      
                      <div className="w-full flex justify-between items-center">
                        <button 
                          disabled={currentStep === 0 || settings.strictMode} 
                          onClick={() => setCurrentStep(prev => prev - 1)} 
                          className="px-4 sm:px-8 py-3 sm:py-4 font-black text-gray-400 hover:text-gray-800 disabled:opacity-20 transition-all text-xs sm:text-sm"
                        >
                          {settings.strictMode ? "Locked" : "← Back"}
                        </button>
                        
                        <div className="flex gap-2 sm:gap-3">
                          {currentStep < questions.length - 1 ? (
                              <button 
                              disabled={!isCurrentQuestionAnswered}
                              onClick={handleNextStep} 
                              className={`px-6 sm:px-12 py-3.5 sm:py-5 bg-brand-600 text-white rounded-xl sm:rounded-[2rem] font-black text-sm sm:text-lg shadow-xl shadow-brand-200 hover:scale-105 active:scale-95 transition-all ${!isCurrentQuestionAnswered ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
                              >
                              Next →
                              </button>
                          ) : (
                              <button 
                              disabled={!isCurrentQuestionAnswered || !allQuestionsAnswered}
                              onClick={handleFinish} 
                              className={`px-6 sm:px-12 py-3.5 sm:py-5 bg-green-600 text-white rounded-xl sm:rounded-[2rem] font-black text-sm sm:text-lg shadow-xl shadow-green-200 hover:scale-105 active:scale-95 transition-all ${(!isCurrentQuestionAnswered || !allQuestionsAnswered) ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
                              >
                              Finish Exam ✅
                              </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 items-stretch lg:h-[calc(100vh-220px)] min-h-0">
                <div className="bg-white p-5 sm:p-10 rounded-3xl sm:rounded-[3rem] shadow-xl border border-gray-100 flex flex-col h-[220px] sm:h-[300px] lg:h-auto">
                  <div className="flex justify-between items-center mb-3 sm:mb-6">
                    <h3 className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">Typing Content</h3>
                    <div className="text-center">
                        <p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase leading-none">Total Words</p>
                        <p className="font-black text-brand-600 text-sm sm:text-base">{(settings.typingText?.split(/\s+/).filter(w => w.length > 0).length || 0)}</p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/50 p-4 sm:p-8 rounded-2xl sm:rounded-[2rem] border-2 border-dashed border-gray-100">
                    {hasTyping ? (
                      <div className="text-sm sm:text-xl leading-relaxed sm:leading-loose select-none whitespace-pre-wrap">
                        {renderTypingFeedback()}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-300 font-black uppercase tracking-widest text-xs">
                        No Typing Content Available
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-4 sm:gap-6">
                  <div className="bg-indigo-900 p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] text-white flex justify-around items-center shadow-xl">
                    <div className="text-center">
                        <p className="text-[9px] sm:text-[10px] font-black text-indigo-300 uppercase">Speed</p>
                        <p className="text-xl sm:text-3xl font-black">{currentTypingMetrics.wpm} <span className="text-xs sm:text-sm">WPM</span></p>
                    </div>
                    <div className="w-px h-6 sm:h-8 bg-white/10"></div>
                    <div className="text-center">
                        <p className="text-[9px] sm:text-[10px] font-black text-indigo-300 uppercase">Accuracy</p>
                        <p className="text-xl sm:text-3xl font-black">{currentTypingMetrics.accuracy}%</p>
                    </div>
                  </div>

                  <textarea 
                    ref={inputRef} 
                    autoFocus 
                    className={`flex-1 p-4 sm:p-10 bg-white rounded-3xl sm:rounded-[3rem] shadow-2xl border-4 border-transparent focus:border-brand-500 outline-none font-mono text-sm sm:text-xl leading-relaxed sm:leading-loose transition-all resize-none placeholder:text-gray-200 min-h-[140px] lg:min-h-0 ${timeLeft <= 0 ? 'opacity-60 bg-gray-50' : ''}`} 
                    placeholder={timeLeft <= 0 ? "Time's up! Typing section is frozen." : "Type here..."} 
                    value={typingInput} 
                    onChange={e => {
                      if (timeLeft > 0) {
                        setTypingInput(e.target.value);
                      }
                    }} 
                    spellCheck={false}
                    disabled={timeLeft <= 0 || !hasTyping}
                  />
                  
                  <div className="flex gap-3 sm:gap-4">
                     {hasMCQs && (
                        <button 
                            onClick={() => handleSectionSwitch('MCQ')}
                            className="flex-1 py-4 sm:py-6 bg-gray-900 text-white rounded-xl sm:rounded-[2rem] font-black text-sm sm:text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            Back to MCQs 📝
                        </button>
                     )}
                    <button 
                        disabled={hasTyping ? typingInput.length < 1 : !hasMCQs}
                        onClick={handleFinish} 
                        className={`flex-1 py-4 sm:py-6 bg-green-600 text-white rounded-xl sm:rounded-[2rem] font-black text-sm sm:text-xl shadow-xl shadow-green-200 hover:scale-[1.02] active:scale-95 transition-all ${(hasTyping && typingInput.length < 1) ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
                    >
                        Submit Exam ✅
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {!hasMCQs && !hasTyping && (
              <div className="flex flex-col items-center justify-center py-40">
                <p className="text-2xl font-black text-gray-400 uppercase tracking-widest mb-8">No exam content found</p>
                <button onClick={onExit} className="px-12 py-5 bg-brand-600 text-white rounded-2xl font-black shadow-xl">Return to Dashboard</button>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Final Completion Screen */
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 sm:p-8 text-center relative overflow-hidden">
          <ConfettiCanvas />
          
          <div className="relative z-10 max-w-4xl w-full py-6">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-green-50 text-green-600 rounded-2xl sm:rounded-[2.5rem] flex items-center justify-center mb-4 sm:mb-8 text-3xl sm:text-5xl mx-auto shadow-inner animate-pop">🎉</div>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-2 sm:mb-4">Exam Completed!</h2>
              <p className="text-sm sm:text-xl text-gray-500 mb-6 sm:mb-12 font-medium">Excellent work, <span className="text-brand-600 font-black">{studentInfo.name}</span>! Here are your final results:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
                {/* Column 1: Student Information */}
                <div className="bg-brand-50 p-6 sm:p-10 rounded-2xl sm:rounded-[3rem] border-2 border-brand-100 shadow-sm text-left flex flex-col justify-center">
                    <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mb-1 sm:mb-2">Registration</p>
                    <p className="text-xl sm:text-2xl font-black text-gray-800 break-words">{studentInfo.name}</p>
                    <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase mt-1 sm:mt-2">{studentInfo.shift}</p>
                </div>

                {/* Column 2: Performance Results */}
                <div className="bg-white p-6 sm:p-10 rounded-2xl sm:rounded-[3rem] border-4 border-brand-500 shadow-2xl z-20 flex flex-col justify-center items-center">
                    <div className="text-4xl sm:text-6xl mb-2 sm:mb-4 animate-bounce">🏆</div>
                    <div className="text-center h-20 sm:h-24 flex flex-col justify-center">
                        {!showResults ? (
                            <>
                                <p className="text-xl sm:text-3xl font-black text-gray-900 uppercase leading-tight tracking-tighter">
                                    Coming Soon<br/>Result
                                </p>
                                <div className="mt-2 sm:mt-4 h-1 w-12 bg-brand-500 mx-auto rounded-full"></div>
                            </>
                        ) : (
                            <div className="animate-pop">
                                {activeSection === 'MCQ' ? (
                                    <>
                                        <p className="text-xs font-black text-brand-600 uppercase tracking-widest mb-1">Score</p>
                                        <p className="text-3xl sm:text-5xl font-black text-gray-900">{mcqScore}/{questions.length}</p>
                                        <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase mt-1 sm:mt-2">Correct Answers</p>
                                    </>
                                ) : (
                                    <div className="flex gap-4 sm:gap-6 items-center">
                                        <div>
                                            <p className="text-[9px] sm:text-[10px] font-black text-brand-600 uppercase mb-1">Speed</p>
                                            <p className="text-xl sm:text-3xl font-black text-gray-900">{currentTypingMetrics.wpm} <span className="text-xs">WPM</span></p>
                                        </div>
                                        <div className="w-px h-8 sm:h-10 bg-gray-100"></div>
                                        <div>
                                            <p className="text-[9px] sm:text-[10px] font-black text-brand-600 uppercase mb-1">Accuracy</p>
                                            <p className="text-xl sm:text-3xl font-black text-gray-900">{currentTypingMetrics.accuracy}%</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Column 3: Subject & Date */}
                <div className="bg-indigo-900 p-6 sm:p-10 rounded-2xl sm:rounded-[3rem] text-white shadow-xl flex flex-col justify-center text-left">
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1 sm:mb-2">Exam Subject</p>
                    <p className="text-xl sm:text-2xl font-black break-words">{settings.subject}</p>
                    <p className="text-[9px] sm:text-[10px] font-bold text-indigo-400 uppercase mt-1 sm:mt-2">{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center no-print">
                {!showResults && (
                   <button 
                    onClick={() => setShowResults(true)} 
                    className="w-full sm:w-auto px-8 sm:px-12 py-3.5 sm:py-5 bg-brand-600 text-white rounded-xl sm:rounded-[2rem] font-black text-base sm:text-lg hover:scale-105 active:scale-95 transition-all shadow-2xl"
                  >
                    View My Results 📈
                  </button>
                )}
                <button 
                    onClick={onExit} 
                    className="w-full sm:w-auto px-8 sm:px-12 py-3.5 sm:py-5 bg-red-600 hover:bg-red-700 text-white rounded-xl sm:rounded-[2rem] font-black text-base sm:text-lg hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                    Logout & Close 🚪
                </button>
                <button 
                    onClick={() => window.print()} 
                    className="w-full sm:w-auto px-6 sm:px-10 py-3.5 sm:py-5 border-2 border-gray-200 text-gray-600 rounded-xl sm:rounded-[2rem] font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-sm"
                >
                    <span>🖨️</span> Print Summary
                </button>
              </div>
          </div>
          
          <div className="absolute bottom-10 left-0 right-0 text-[10px] font-black text-gray-300 uppercase tracking-widest">
            Certified Exam Portal • Official Performance Record
          </div>
        </div>
      )}
    </div>
  );
};
