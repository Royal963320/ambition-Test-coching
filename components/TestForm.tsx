import React, { useState } from 'react';
import { TestConfig } from '../types';
import { Button } from './Button';

interface TestFormProps {
  onSubmit: (config: TestConfig) => void;
  isLoading: boolean;
}

export const TestForm: React.FC<TestFormProps> = ({ onSubmit, isLoading }) => {
  const [config, setConfig] = useState<TestConfig>({
    subject: 'General Knowledge',
    topic: '',
    difficulty: 'Medium',
    language: 'English',
    questionCount: 10,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(config);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-xl border border-gray-100">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Create New Test</h2>
        <p className="text-gray-500">Enter the details below to generate an offline-ready exam paper.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
              placeholder="e.g. Physics, History, Math"
              value={config.subject}
              onChange={(e) => setConfig({ ...config, subject: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Language</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
              value={config.language}
              onChange={(e) => setConfig({ ...config, language: e.target.value as any })}
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi (हिंदी)</option>
              <option value="Hinglish">Hinglish</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Topic / Chapter Name</label>
          <textarea
            required
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition resize-none"
            placeholder="e.g. Newton's Laws of Motion, Indian Constitution, Tenses..."
            value={config.topic}
            onChange={(e) => setConfig({ ...config, topic: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
              value={config.difficulty}
              onChange={(e) => setConfig({ ...config, difficulty: e.target.value as any })}
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Questions</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
              value={config.questionCount}
              onChange={(e) => setConfig({ ...config, questionCount: Number(e.target.value) })}
            >
              <option value={5}>5 Questions</option>
              <option value={10}>10 Questions</option>
              <option value={15}>15 Questions</option>
              <option value={20}>20 Questions</option>
              <option value={30}>30 Questions</option>
            </select>
          </div>
        </div>

        <div className="pt-4">
          <Button 
            type="submit" 
            fullWidth 
            disabled={isLoading}
            className="flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Questions...
              </>
            ) : (
              'Generate Test Paper'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};