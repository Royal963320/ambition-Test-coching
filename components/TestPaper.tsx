
import React from 'react';
import { Question, TestConfig } from '../types';

interface TestPaperProps {
  questions: Question[];
  config: TestConfig;
  showAnswers: boolean;
}

export const TestPaper: React.FC<TestPaperProps> = ({ questions, config, showAnswers }) => {
  const currentDate = new Date().toLocaleDateString();

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-none md:shadow-lg min-h-screen print:shadow-none print:p-0">
      {/* Header Section - Looks like a real exam paper */}
      <div className="border-b-4 border-gray-900 pb-8 mb-10 text-center">
        <h1 className="text-4xl font-black uppercase tracking-[0.2em] mb-3 text-gray-900">Official Exam Portal</h1>
        <p className="text-gray-500 font-bold uppercase text-xs mb-6 tracking-widest">Coaching Institute Academic Assessment</p>
        
        <div className="grid grid-cols-2 gap-8 text-sm font-black text-gray-800 border-t border-gray-100 pt-6">
            <div className="space-y-2 text-left">
                <p><span className="text-gray-400 uppercase text-[10px] tracking-widest block mb-1">Subject</span> {config.subject}</p>
                <p><span className="text-gray-400 uppercase text-[10px] tracking-widest block mb-1">Topic</span> {config.topic}</p>
            </div>
            <div className="space-y-2 text-right">
                <p><span className="text-gray-400 uppercase text-[10px] tracking-widest block mb-1">Date</span> {currentDate}</p>
                <p><span className="text-gray-400 uppercase text-[10px] tracking-widest block mb-1">Total Marks</span> {questions.length}</p>
            </div>
        </div>
      </div>

      {/* Student Details Section for Print */}
      <div className="grid grid-cols-2 gap-6 mb-10 border-2 border-gray-900 p-6 rounded-xl">
          <div className="border-b border-gray-300 pb-2">
              <span className="text-[10px] font-black text-gray-400 uppercase">Student Name</span>
          </div>
          <div className="border-b border-gray-300 pb-2">
              <span className="text-[10px] font-black text-gray-400 uppercase">Student ID</span>
          </div>
      </div>

      {/* Instructions */}
      <div className="mb-10 p-6 bg-gray-50 rounded-2xl border border-gray-200 print:bg-transparent print:border-gray-900">
        <h3 className="font-black text-gray-900 mb-3 uppercase text-xs tracking-widest">General Instructions:</h3>
        <ul className="list-decimal list-inside text-sm text-gray-700 space-y-2 font-medium">
            <li>Read each question carefully before choosing an option.</li>
            <li>Use a blue or black pen to mark your answers on the OMR sheet or paper.</li>
            <li>Each question carries equal marks. There is no negative marking.</li>
            <li>Do not write anything on the question paper except your details.</li>
        </ul>
      </div>

      {/* Questions List */}
      <div className="space-y-12">
        {questions.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl">
              <p className="text-gray-300 font-black uppercase tracking-widest">No questions added to this test yet.</p>
          </div>
        ) : questions.map((q, index) => (
          <div key={q.id} className="break-inside-avoid">
            <div className="flex gap-4">
              <span className="font-black text-gray-900 min-w-[36px] h-9 flex items-center justify-center bg-gray-100 rounded-lg text-lg print:bg-white print:border print:border-gray-900">{index + 1}</span>
              <div className="flex-1 pt-1">
                <p className="font-bold text-gray-900 text-xl mb-6 leading-relaxed">{q.questionText}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
                  {q.options.map((option, optIndex) => {
                    const isCorrect = option === q.correctAnswer;
                    let optionStyle = "flex items-center p-3 rounded-xl border border-transparent";
                    
                    if (showAnswers && isCorrect) {
                        optionStyle += " font-black text-green-700 bg-green-50 border-green-200 print:border-none print:underline";
                    }

                    return (
                      <div key={optIndex} className={optionStyle}>
                        <span className="w-8 h-8 flex items-center justify-center border-2 border-gray-900 rounded-lg mr-4 text-xs font-black text-gray-900">
                          {String.fromCharCode(65 + optIndex)}
                        </span>
                        <span className="text-gray-800 font-bold">{option}</span>
                      </div>
                    );
                  })}
                </div>

                {showAnswers && q.explanation && (
                  <div className="mt-6 p-4 bg-brand-50 text-sm text-brand-800 rounded-2xl border border-brand-100 print:mt-4">
                    <span className="font-black uppercase text-[10px] tracking-widest block mb-1">Answer Key & Explanation</span>
                    <p className="font-medium">{q.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer for Print */}
      <div className="mt-20 pt-10 border-t-2 border-gray-100 text-center text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] hidden print:block">
        Official Examination Document • Trusted Exam Portal Technology
      </div>
    </div>
  );
};
