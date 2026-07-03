
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Question, TestSettings, StudentResult } from '../types';
import { Button } from './Button';
import { TestPaper } from './TestPaper';

interface AdminPanelProps {
  questions: Question[];
  settings: TestSettings;
  results: StudentResult[];
  securityQuestion?: string;
  securityAnswer?: string;
  onSecurityChange?: (q: string, a: string) => void;
  onSettingsChange: (settings: TestSettings) => void;
  onAddQuestion: (q: Question) => void;
  onUpdateQuestion: (q: Question) => void;
  onDeleteQuestion: (id: number) => void;
  onStartTest: () => void;
  onPasscodeChange: (newPin: string) => void;
  onClearResults: () => void;
  onBulkAddQuestions?: (qs: Question[]) => void;
}

const SUBJECT_OPTIONS = ['Computer', 'Physics', 'Chemistry', 'Maths', 'Biology', 'History', 'Other', 'Custom'];
const FREQUENCY_OPTIONS = ['Once', 'Daily', 'Weekly', 'Bi-Weekly', 'Monthly'];
const COMPUTER_CATEGORIES = ['Keyboard Typing', 'MS Office Basics', 'Programming (C) / Python', 'Networking & Internet', 'Computer Hardware', 'Operating Systems'];

export const getFormattedShift = (shiftValue: any): string => {
  if (!shiftValue) return '';
  const s = String(shiftValue).trim();
  if (s.toLowerCase() === 'all') return 'All';
  if (/^\d+$/.test(s)) {
    return `SHIFT ${s}`;
  }
  const upper = s.toUpperCase();
  if (upper.startsWith('SHIFT')) {
    const numPart = upper.replace('SHIFT', '').trim();
    return `SHIFT ${numPart}`;
  }
  return `SHIFT ${upper}`;
};

const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(dateStr);
};

const formatLocalDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const CustomDatePicker: React.FC<{ value: string; onChange: (val: string) => void; variant?: 'dark' | 'light' }> = ({ value, onChange, variant = 'dark' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => parseLocalDate(value));
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handleDayClick = (day: number) => {
    const selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onChange(formatLocalDate(selectedDate));
    setIsOpen(false);
  };

  const adjustMonth = (delta: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1));
  };

  return (
    <div className="relative w-full" ref={calendarRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex justify-between items-center px-4 py-3 rounded-xl cursor-pointer font-bold text-sm shadow-md transition-all ${
          variant === 'dark' 
            ? 'bg-[#333333] border border-[#444444] text-white hover:bg-[#3a3a3a]' 
            : 'bg-white border-2 border-brand-100 text-gray-800 hover:bg-gray-50 focus:border-brand-500'
        }`}
      >
        <span className="flex items-center gap-2">
          <span>📅</span>
          <span>
            {value ? (() => {
              const d = parseLocalDate(value);
              if (!isNaN(d.getTime())) {
                return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
              }
              return value;
            })() : 'Select Date'}
          </span>
        </span>
        <div className="flex items-center gap-2">
          {value && (
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              title="Clear Date"
            >
              ✕
            </button>
          )}
          <span className="text-gray-400 text-xs">▼</span>
        </div>
      </div>

      {isOpen && (
        <div className={`absolute top-full left-0 mt-2 z-[100] w-72 rounded-2xl shadow-2xl p-4 animate-pop border ${
          variant === 'dark' 
            ? 'bg-[#2d2d2d] border-[#404040]' 
            : 'bg-white border-gray-100 text-gray-800'
        }`}>
          <div className="flex justify-between items-center mb-6">
            <div className={`flex items-center gap-1 cursor-pointer px-2 py-1 rounded-lg ${variant === 'dark' ? 'hover:bg-[#444]' : 'hover:bg-gray-100'}`}>
              <span className={`font-black text-sm ${variant === 'dark' ? 'text-white' : 'text-gray-900'}`}>{months[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
              <span className="text-gray-400 text-[10px]">▼</span>
            </div>
            <div className="flex gap-4">
              <button onClick={() => adjustMonth(-1)} className="text-gray-400 hover:text-brand-500 text-xl">↑</button>
              <button onClick={() => adjustMonth(1)} className="text-gray-400 hover:text-brand-500 text-xl">↓</button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center mb-2">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
              <span key={d} className="text-gray-400 text-[10px] font-black uppercase">{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: (firstDay + 6) % 7 }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected = value === formatLocalDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                    isSelected 
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30 scale-110 z-10' 
                      : variant === 'dark' ? 'text-gray-200 hover:bg-[#444444]' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className={`flex justify-between items-center mt-6 pt-4 border-t ${variant === 'dark' ? 'border-[#404040]' : 'border-gray-100'}`}>
            <button onClick={() => { onChange(''); setIsOpen(false); }} className="text-brand-500 text-xs font-black uppercase tracking-widest hover:text-brand-600">Clear</button>
            <button onClick={() => { onChange(formatLocalDate(new Date())); setIsOpen(false); }} className="text-brand-500 text-xs font-black uppercase tracking-widest hover:text-brand-600">Today</button>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  questions, 
  settings,
  results,
  securityQuestion = 'What is your school name?',
  securityAnswer = 'ambition',
  onSecurityChange,
  onSettingsChange,
  onAddQuestion, 
  onUpdateQuestion,
  onDeleteQuestion,
  onStartTest,
  onPasscodeChange,
  onClearResults,
  onBulkAddQuestions
}) => {
  const [qText, setQText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'build' | 'results' | 'security'>('build');
  const [newPinInput, setNewPinInput] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterShift, setFilterShift] = useState<string>('All');
  const [filterMode, setFilterMode] = useState<string>('All');
  const [filterDate, setFilterDate] = useState<string>('');
  const [minPerf, setMinPerf] = useState<string>('');
  const [maxPerf, setMaxPerf] = useState<string>('');
  const [sidebarSelectedId, setSidebarSelectedId] = useState<string>('All');

  // Sorting State
  const [sortKey, setSortKey] = useState<'name' | 'timestamp' | 'performance'>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'All'>(10);

  // Reset pagination when filters, sort, or itemsPerPage change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterShift, filterMode, filterDate, minPerf, maxPerf, sidebarSelectedId, sortKey, sortDirection, itemsPerPage]);

  const [totalRegistered, setTotalRegistered] = useState<number>(() => {
    const saved = localStorage.getItem('admin_total_registered_students');
    return saved ? parseInt(saved, 10) : 50;
  });

  useEffect(() => {
    localStorage.setItem('admin_total_registered_students', String(totalRegistered));
  }, [totalRegistered]);

  const totalUniqueExamsGiven = useMemo(() => {
    return new Set(results.map(r => r.studentId.trim().toUpperCase())).size;
  }, [results]);

  const hours = Math.floor(settings.timeLimit / 60);
  const minutes = settings.timeLimit % 60;

  const handleTimeChange = (type: 'hours' | 'minutes', value: number) => {
    const safeValue = isNaN(value) ? 0 : value;
    const newTotal = type === 'hours' ? (safeValue * 60) + minutes : (hours * 60) + safeValue;
    onSettingsChange({ ...settings, timeLimit: Math.max(1, newTotal) });
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      
      const newQuestions: Question[] = [];
      // Skip header if it exists
      const startIdx = lines[0].toLowerCase().includes('question') ? 1 : 0;

      for (let i = startIdx; i < lines.length; i++) {
        // Simple CSV split (note: doesn't handle commas in quotes perfectly, but sufficient for basic tool)
        const parts = lines[i].split(',').map(p => p.trim());
        if (parts.length >= 6) {
          const [q, a, b, c, d, ans] = parts;
          const opts = [a, b, c, d];
          // Map A/B/C/D to correct option text
          let correct = opts[0];
          const ansKey = ans.toUpperCase();
          if (ansKey === 'B') correct = opts[1];
          else if (ansKey === 'C') correct = opts[2];
          else if (ansKey === 'D') correct = opts[3];
          else if (ansKey === 'A') correct = opts[0];
          else correct = ans; // assume it's the full text if not A-D

          newQuestions.push({
            id: Date.now() + i,
            questionText: q,
            options: opts,
            correctAnswer: correct
          });
        }
      }

      if (newQuestions.length > 0 && onBulkAddQuestions) {
        onBulkAddQuestions(newQuestions);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAddOrUpdate = () => {
    if (!qText.trim() || options.some(opt => !opt.trim())) {
      alert("Please fill in the question and all options!");
      return;
    }

    const questionData: Question = {
      id: editingId || Date.now(),
      questionText: qText,
      options: [...options],
      correctAnswer: options[correctIndex],
    };

    if (editingId) {
      onUpdateQuestion(questionData);
      setEditingId(null);
    } else {
      onAddQuestion(questionData);
    }

    setQText('');
    setOptions(['', '', '', '']);
    setCorrectIndex(0);
  };

  const handleEditQuestion = (q: Question) => {
    setEditingId(q.id);
    setQText(q.questionText);
    setOptions([...q.options]);
    const cIdx = q.options.indexOf(q.correctAnswer);
    setCorrectIndex(cIdx !== -1 ? cIdx : 0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setQText('');
    setOptions(['', '', '', '']);
    setCorrectIndex(0);
  };

  const toggleSort = (key: 'name' | 'timestamp' | 'performance') => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const uniqueStudentIds = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase().trim();
    const cleanSearch = lowerSearch.replace(/[^a-z0-9]/g, '');
    
    const matchingResults = results.filter(res => {
      const cleanStudentId = res.studentId ? res.studentId.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
      
      let dateMatch = false;
      if (res.timestamp) {
        try {
          const d = new Date(res.timestamp);
          if (!isNaN(d.getTime())) {
            const formattedLocal = d.toLocaleString().toLowerCase();
            const formattedDate = d.toLocaleDateString().toLowerCase();
            const formattedUS = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).toLowerCase();
            const formattedUSLong = d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).toLowerCase();
            const formattedManualHyphen = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
            const formattedManualSlash = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
            
            dateMatch = formattedLocal.includes(lowerSearch) ||
                        formattedDate.includes(lowerSearch) ||
                        formattedUS.includes(lowerSearch) ||
                        formattedUSLong.includes(lowerSearch) ||
                        formattedManualHyphen.includes(lowerSearch) ||
                        formattedManualSlash.includes(lowerSearch);
          } else {
            dateMatch = res.timestamp.toLowerCase().includes(lowerSearch);
          }
        } catch {
          dateMatch = res.timestamp.toLowerCase().includes(lowerSearch);
        }
      }

      return !lowerSearch || 
             res.name.toLowerCase().includes(lowerSearch) || 
             (cleanStudentId && cleanStudentId.includes(cleanSearch)) ||
             (res.studentId && res.studentId.toLowerCase().includes(lowerSearch)) ||
             dateMatch;
    });

    const ids = Array.from(new Set(matchingResults.map(r => r.studentId))).filter(Boolean);
    ids.sort();
    return ids;
  }, [results, searchTerm]);

  const filteredResults = useMemo(() => {
    let list = results.filter(res => {
      const lowerSearch = searchTerm.toLowerCase().trim();
      const cleanSearch = lowerSearch.replace(/[^a-z0-9]/g, '');
      const cleanStudentId = res.studentId ? res.studentId.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
      
      let dateMatch = false;
      if (res.timestamp) {
        try {
          const d = new Date(res.timestamp);
          if (!isNaN(d.getTime())) {
            const formattedLocal = d.toLocaleString().toLowerCase();
            const formattedDate = d.toLocaleDateString().toLowerCase();
            const formattedUS = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).toLowerCase();
            const formattedUSLong = d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).toLowerCase();
            const formattedManualHyphen = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
            const formattedManualSlash = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
            
            dateMatch = formattedLocal.includes(lowerSearch) ||
                        formattedDate.includes(lowerSearch) ||
                        formattedUS.includes(lowerSearch) ||
                        formattedUSLong.includes(lowerSearch) ||
                        formattedManualHyphen.includes(lowerSearch) ||
                        formattedManualSlash.includes(lowerSearch);
          } else {
            dateMatch = res.timestamp.toLowerCase().includes(lowerSearch);
          }
        } catch {
          dateMatch = res.timestamp.toLowerCase().includes(lowerSearch);
        }
      }

      const matchesSearch = !lowerSearch || 
                            res.name.toLowerCase().includes(lowerSearch) || 
                            (cleanStudentId && cleanStudentId.includes(cleanSearch)) ||
                            (res.studentId && res.studentId.toLowerCase().includes(lowerSearch)) ||
                            dateMatch;
                            
      const matchesShift = filterShift === 'All' || getFormattedShift(res.shift) === getFormattedShift(filterShift);
      const matchesMode = filterMode === 'All' || res.testMode === filterMode;
      const matchesSidebarId = sidebarSelectedId === 'All' || res.studentId === sidebarSelectedId;
      
      let matchesDate = true;
      if (filterDate) {
        const resultDateObj = new Date(res.timestamp);
        if (!isNaN(resultDateObj.getTime())) {
          const year = resultDateObj.getFullYear();
          const month = String(resultDateObj.getMonth() + 1).padStart(2, '0');
          const day = String(resultDateObj.getDate()).padStart(2, '0');
          const resultLocalDateStr = `${year}-${month}-${day}`;
          matchesDate = (resultLocalDateStr === filterDate);
        } else {
          matchesDate = false;
        }
      }

      const performanceValue = res.testMode === 'MCQ' ? (res.score || 0) : (res.wpm || 0);
      let matchesPerformance = true;
      if (minPerf !== '') matchesPerformance = matchesPerformance && performanceValue >= parseFloat(minPerf);
      if (maxPerf !== '') matchesPerformance = matchesPerformance && performanceValue <= parseFloat(maxPerf);
      
      return matchesSearch && matchesShift && matchesMode && matchesDate && matchesPerformance && matchesSidebarId;
    });

    // Sorting Logic
    list.sort((a, b) => {
      let comparison = 0;
      if (sortKey === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortKey === 'timestamp') {
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (sortKey === 'performance') {
        const valA = a.testMode === 'MCQ' ? (a.score || 0) : (a.wpm || 0);
        const valB = b.testMode === 'MCQ' ? (b.score || 0) : (b.wpm || 0);
        comparison = valA - valB;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [results, searchTerm, filterShift, filterMode, filterDate, minPerf, maxPerf, sortKey, sortDirection, sidebarSelectedId]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 animate-pop">
      <div className="flex justify-center lg:justify-start mb-8">
        <div className="flex flex-wrap gap-1.5 sm:gap-2 bg-white p-1.5 sm:p-2 rounded-2xl w-fit shadow-sm border border-gray-100 mx-auto lg:mx-0">
          <button onClick={() => setActiveTab('build')} className={`px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all ${activeTab === 'build' ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>📝 Exam Paper</button>
          <button onClick={() => setActiveTab('results')} className={`px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all ${activeTab === 'results' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>👨‍🎓 Student Data</button>
          <button onClick={() => setActiveTab('security')} className={`px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all ${activeTab === 'security' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>🔒 Security</button>
        </div>
      </div>

      {activeTab === 'build' ? (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-[420px] space-y-6">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
              <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center justify-between">
                Test Setup
                <span className="text-[10px] bg-brand-50 text-brand-600 px-3 py-1 rounded-full uppercase tracking-tighter">Config v2.0</span>
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Exam Title</label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-brand-500 transition-all" 
                    placeholder="Enter Exam Name" 
                    value={settings.title} 
                    onChange={(e) => onSettingsChange({...settings, title: e.target.value})} 
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Primary Exam Mode</label>
                  <div className="relative flex bg-gray-100 p-1.5 rounded-2xl shadow-inner h-12">
                    <button 
                      onClick={() => onSettingsChange({...settings, testMode: 'MCQ'})}
                      className={`relative z-10 flex-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${settings.testMode === 'MCQ' ? 'text-brand-600' : 'text-gray-400'}`}
                    >
                      MCQ
                    </button>
                    <button 
                      onClick={() => onSettingsChange({...settings, testMode: 'TYPING'})}
                      className={`relative z-10 flex-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${settings.testMode === 'TYPING' ? 'text-brand-600' : 'text-gray-400'}`}
                    >
                      Typing
                    </button>
                    <div 
                      className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-md transition-all duration-300 ease-out ${settings.testMode === 'MCQ' ? 'left-1.5' : 'left-[calc(50%+1.5px)]'}`}
                    ></div>
                  </div>
                </div>

                {settings.testMode === 'TYPING' && (
                  <div className="animate-pop">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Typing Test Content</label>
                    <textarea 
                      className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-mono font-medium min-h-[150px] outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed transition-all" 
                      placeholder="Enter the text for students to type here..." 
                      value={settings.typingText || ''} 
                      onChange={e => onSettingsChange({...settings, typingText: e.target.value})} 
                    />
                    <div className="mt-1 text-right">
                      <span className="text-[9px] font-black text-brand-400 uppercase tracking-tighter">Words: {(settings.typingText?.split(/\s+/).filter(w => w.length > 0).length || 0)}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Subject</label>
                    <select className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-brand-500" value={settings.subject} onChange={(e) => onSettingsChange({...settings, subject: e.target.value})}>
                      {SUBJECT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Test Frequency</label>
                    <select className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-brand-500" value={settings.frequency} onChange={(e) => onSettingsChange({...settings, frequency: e.target.value})}>
                      {FREQUENCY_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>

                {settings.subject === 'Computer' && (
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Category</label>
                    <select className="w-full p-4 bg-indigo-50 border-none rounded-2xl text-sm font-black outline-none" value={settings.subSubject} onChange={(e) => onSettingsChange({...settings, subSubject: e.target.value})}>
                      {COMPUTER_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Exam Date (Calendar)</label>
                  <CustomDatePicker value={settings.date} onChange={(val) => onSettingsChange({...settings, date: val})} />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Duration</label>
                  <div className="flex items-center gap-2 bg-gray-50 p-4 rounded-2xl">
                    <div className="flex-1">
                      <p className="text-[8px] text-center font-black text-gray-400 uppercase mb-1">Hrs</p>
                      <input type="number" min="0" className="w-full bg-white p-2 rounded-lg text-center font-black" value={hours} onChange={(e) => handleTimeChange('hours', parseInt(e.target.value))} />
                    </div>
                    <span className="font-black text-gray-300 pt-4">:</span>
                    <div className="flex-1">
                      <p className="text-[8px] text-center font-black text-gray-400 uppercase mb-1">Min</p>
                      <input type="number" min="0" max="59" className="w-full bg-white p-2 rounded-lg text-center font-black" value={minutes} onChange={(e) => handleTimeChange('minutes', parseInt(e.target.value))} />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                    <button 
                        onClick={() => onSettingsChange({...settings, strictMode: !settings.strictMode})}
                        className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all group ${settings.strictMode ? 'bg-red-50 border-2 border-red-200' : 'bg-gray-50 hover:bg-white border-2 border-transparent hover:border-brand-200'}`}
                    >
                        <div className="text-left">
                            <p className="text-xs font-black text-gray-800 uppercase leading-none mb-1">Strict Mode</p>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tight">Lock navigation until answered (No Jumping)</p>
                        </div>
                        <div className={`w-10 h-6 rounded-full relative transition-colors ${settings.strictMode ? 'bg-red-500' : 'bg-gray-300'}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.strictMode ? 'left-5' : 'left-1'}`} />
                        </div>
                    </button>
                </div>
              </div>
            </div>

            {settings.testMode === 'MCQ' && (
              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 animate-pop">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                      <span className="w-8 h-8 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center text-sm">{editingId ? '✏️' : '➕'}</span>
                      {editingId ? 'Edit MCQ' : 'Manage MCQs'}
                    </h3>
                    {!editingId && (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[10px] font-black text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg uppercase tracking-widest hover:bg-brand-100 transition-all"
                      >
                        Bulk Upload
                      </button>
                    )}
                    <input type="file" accept=".csv" ref={fileInputRef} onChange={handleCSVUpload} className="hidden" />
                  </div>
                  <textarea className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-bold min-h-[100px] mb-4 outline-none focus:ring-2 focus:ring-brand-500" placeholder="Question Text" value={qText} onChange={e => setQText(e.target.value)} />
                  
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Options (Select the correct one)</label>
                  <div className="space-y-3 mb-6">
                    {options.map((opt, i) => (
                      <div 
                        key={i} 
                        onClick={() => setCorrectIndex(i)}
                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${correctIndex === i ? 'border-brand-500 bg-green-50 ring-4 ring-green-50' : 'border-gray-50 bg-gray-50 hover:bg-white hover:border-brand-200'}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border-2 transition-all ${correctIndex === i ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-200 text-gray-300'}`}>
                          {correctIndex === i ? '✓' : String.fromCharCode(65+i)}
                        </div>
                        <input 
                          type="text" 
                          className="flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-gray-300" 
                          value={opt} 
                          onClick={(e) => e.stopPropagation()}
                          onChange={e => { const n = [...options]; n[i] = e.target.value; setOptions(n); }} 
                          placeholder={`Option ${String.fromCharCode(65+i)}`} 
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddOrUpdate} fullWidth className="py-4 rounded-2xl shadow-lg font-black uppercase text-xs tracking-widest">
                      {editingId ? 'Update Question' : 'Add MCQ Question'}
                    </Button>
                    {editingId && (
                      <button onClick={handleCancelEdit} className="px-6 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-all">
                        Cancel
                      </button>
                    )}
                  </div>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-6">
            <div className={`p-8 rounded-[3rem] text-white flex justify-between items-center shadow-xl transition-colors duration-500 ${settings.testMode === 'MCQ' ? 'bg-brand-900' : 'bg-indigo-900'}`}>
              <div className="flex gap-10">
                {settings.testMode === 'MCQ' ? (
                  <div className="animate-pop">
                    <h4 className="text-5xl font-black mb-1">{questions.length}</h4>
                    <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">MCQs Ready</p>
                  </div>
                ) : (
                  <div className="animate-pop">
                    <h4 className="text-5xl font-black mb-1">{(settings.typingText?.split(/\s+/).filter(w => w.length > 0).length || 0)}</h4>
                    <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">Typing Words</p>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowPreview(true)} className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-xs uppercase transition-all shadow-lg flex items-center gap-2 border border-white/20">
                  <span>🖨️</span> Print Preview
                </button>
                <button onClick={onStartTest} className="px-8 py-4 bg-white text-gray-900 rounded-2xl font-black hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2">
                  <span>👁️</span> Open Student View
                </button>
              </div>
            </div>
            
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 h-[850px] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 gap-12">
                {settings.testMode === 'MCQ' && (
                  <section className="animate-pop">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 pb-4">MCQ Question Bank</h4>
                      {questions.length === 0 ? (
                          <p className="text-gray-300 italic font-bold text-center py-20">No questions added yet.</p>
                      ) : (
                          <div className="space-y-6">
                              {questions.map((q, i) => (
                                  <div key={q.id} className={`p-8 bg-gray-50 rounded-[2.5rem] relative group border-2 transition-all ${editingId === q.id ? 'border-brand-500 bg-white shadow-xl ring-4 ring-brand-50' : 'border-transparent hover:border-brand-200 hover:bg-white hover:shadow-xl'}`}>
                                      <div className="flex justify-between items-start mb-4">
                                          <span className="w-8 h-8 bg-brand-600 text-white rounded-lg flex items-center justify-center font-black text-xs">{i+1}</span>
                                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                              <button onClick={() => handleEditQuestion(q)} className="p-2 text-brand-600 hover:bg-brand-50 rounded-xl transition-all font-black text-[10px] uppercase">✏️ Edit</button>
                                              <button onClick={() => onDeleteQuestion(q.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-black text-[10px] uppercase">🗑️ Remove</button>
                                          </div>
                                      </div>
                                      <p className="font-bold text-gray-800 text-lg leading-relaxed mb-4">{q.questionText}</p>
                                      <div className="grid grid-cols-2 gap-3">
                                          {q.options.map((opt, idx) => (
                                              <div key={idx} className={`p-3 rounded-xl border text-[10px] font-black uppercase ${opt === q.correctAnswer ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-100 text-gray-400'}`}>
                                                  {String.fromCharCode(65+idx)}. {opt} {opt === q.correctAnswer && "✓"}
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </section>
                )}
                
                {settings.testMode === 'TYPING' && (
                  <section className="animate-pop">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 pb-4">Typing Content Preview</h4>
                      <div className="bg-gray-50 p-10 rounded-[2.5rem] border-2 border-dashed border-gray-200 min-h-[400px]">
                          {settings.typingText ? (
                              <p className="font-mono text-lg leading-loose text-gray-600 whitespace-pre-wrap">{settings.typingText}</p>
                          ) : (
                              <p className="text-center text-gray-300 font-black uppercase tracking-widest pt-40">Add content in the sidebar to preview</p>
                          )}
                      </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'results' ? (
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] shadow-sm border border-gray-100 animate-slide-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900">Student Exam Records</h3>
              <p className="text-gray-500 font-medium text-xs sm:text-sm">Monitoring overall performance across all shifts.</p>
            </div>
            <button onClick={onClearResults} className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl font-black text-[10px] sm:text-xs uppercase hover:bg-red-600 hover:text-white transition-all border border-red-100">🗑️ Clear Database</button>
          </div>

          {/* Attendance Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6 font-sans">
            {/* Present Card */}
            <div className="p-4 bg-green-50/60 rounded-xl border border-green-100 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 bg-green-500 text-white rounded-lg flex items-center justify-center text-lg shadow-md shrink-0">🟢</div>
              <div>
                <p className="text-[10px] font-black text-green-700 uppercase tracking-wider leading-none">Exam Given / Present</p>
                <p className="text-[8px] font-bold text-green-500 uppercase mt-0.5">(आए / परीक्षा दी)</p>
                <p className="text-xl font-extrabold text-green-950 mt-0.5">{totalUniqueExamsGiven}</p>
              </div>
            </div>

            {/* Absent Card */}
            <div className="p-4 bg-red-50/60 rounded-xl border border-red-100 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 bg-red-500 text-white rounded-lg flex items-center justify-center text-lg shadow-md shrink-0">🔴</div>
              <div>
                <p className="text-[10px] font-black text-red-700 uppercase tracking-wider leading-none">Remaining / Absent</p>
                <p className="text-[8px] font-bold text-red-500 uppercase mt-0.5">(नहीं दिया)</p>
                <p className="text-xl font-extrabold text-red-950 mt-0.5">
                  {Math.max(0, totalRegistered - totalUniqueExamsGiven)}
                </p>
              </div>
            </div>

            {/* Total Registered Stepper Card */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 bg-gray-500 text-white rounded-lg flex items-center justify-center text-lg shadow-md shrink-0">👥</div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-wider leading-none">Total Students</p>
                <p className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">(कुल पंजीकृत)</p>
                <div className="flex items-center gap-2 mt-1">
                  <button 
                    type="button"
                    onClick={() => setTotalRegistered(prev => Math.max(0, prev - 1))}
                    className="w-6 h-6 flex items-center justify-center bg-white rounded border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-black transition-colors"
                    title="Decrease"
                  >
                    -
                  </button>
                  <input 
                    type="number"
                    value={totalRegistered}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setTotalRegistered(isNaN(val) ? 0 : Math.max(0, val));
                    }}
                    className="w-10 text-center text-base font-extrabold bg-transparent border-none p-0 outline-none focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-gray-800"
                  />
                  <button 
                    type="button"
                    onClick={() => setTotalRegistered(prev => prev + 1)}
                    className="w-6 h-6 flex items-center justify-center bg-white rounded border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-black transition-colors"
                    title="Increase"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Attendance Rate Card */}
            <div className="p-4 bg-brand-50/60 rounded-xl border border-brand-100 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 bg-brand-600 text-white rounded-lg flex items-center justify-center text-lg shadow-md shrink-0">📊</div>
              <div>
                <p className="text-[10px] font-black text-brand-700 uppercase tracking-wider leading-none">Attendance Rate</p>
                <p className="text-[8px] font-bold text-brand-500 uppercase mt-0.5">(उपस्थिति दर)</p>
                <p className="text-xl font-extrabold text-brand-950 mt-0.5">
                  {totalRegistered > 0 ? ((totalUniqueExamsGiven / totalRegistered) * 100).toFixed(0) : 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-4 bg-gray-50/50 p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-inner">
             <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[280px]">
                    <label className="text-[10px] font-black text-gray-400 uppercase mb-1.5 block tracking-widest">Search Student</label>
                    <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-base transition-colors group-focus-within:text-brand-500">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Search by name or SPA ID..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border-none font-bold text-xs shadow-sm outline-none focus:ring-4 focus:ring-brand-500/10 transition-all placeholder:text-gray-300 text-gray-800" 
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setSidebarSelectedId('All');
                            }}
                        />
                    </div>
                </div>

                <div className="min-w-[200px]">
                    <label className="text-[10px] font-black text-gray-400 uppercase mb-1.5 block tracking-widest">Performance Range</label>
                    <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                        <input 
                            type="number" 
                            placeholder="Min" 
                            className="w-20 px-3 py-1.5 rounded-lg text-xs font-black border-none bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-brand-500/20 transition-all text-gray-800"
                            value={minPerf}
                            onChange={(e) => setMinPerf(e.target.value)}
                        />
                        <div className="w-3 h-px bg-gray-200 self-center"></div>
                        <input 
                            type="number" 
                            placeholder="Max" 
                            className="w-20 px-3 py-1.5 rounded-lg text-xs font-black border-none bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-brand-500/20 transition-all text-gray-800"
                            value={maxPerf}
                            onChange={(e) => setMaxPerf(e.target.value)}
                        />
                    </div>
                </div>

                <div className="min-w-[240px]">
                  <label className="text-[10px] font-black text-gray-400 uppercase mb-1.5 block tracking-widest">Filter by Date (Calendar)</label>
                  <CustomDatePicker value={filterDate} onChange={(val) => setFilterDate(val)} variant="light" />
                </div>
             </div>

             <div className="flex flex-wrap gap-4 items-end border-t border-gray-100 pt-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Exam Mode</label>
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 gap-1">
                        {['All', 'MCQ', 'TYPING'].map(m => (
                            <button 
                                key={m} 
                                onClick={() => setFilterMode(m)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterMode === m ? 'bg-indigo-600 text-white shadow-md scale-[1.02]' : 'text-gray-400 hover:bg-gray-50'}`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Shift</label>
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 gap-1">
                        {['All', 'Shift 1', 'Shift 2', 'Shift 3'].map(s => (
                            <button 
                                key={s} 
                                onClick={() => setFilterShift(s)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterShift === s ? 'bg-brand-600 text-white shadow-md scale-[1.02]' : 'text-gray-400 hover:bg-gray-50'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-1.5 flex-1 min-w-[300px]">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Sort Results By</label>
                    <div className="flex flex-wrap items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex bg-gray-50 p-0.5 rounded-lg gap-0.5">
                            {[
                                { id: 'name', label: 'Name' },
                                { id: 'timestamp', label: 'Completion' },
                                { id: 'performance', label: 'Top' }
                            ].map(s => (
                                <button 
                                    key={s.id}
                                    onClick={() => toggleSort(s.id as any)}
                                    className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-tight transition-all flex items-center gap-1 ${sortKey === s.id ? 'bg-[#1e293b] text-white shadow-md' : 'text-gray-400 hover:bg-gray-200'}`}
                                >
                                    {s.label}
                                    {sortKey === s.id && (sortDirection === 'asc' ? '↑' : '↓')}
                                </button>
                            ))}
                        </div>
                        
                        <div className="flex bg-gray-50 p-0.5 rounded-lg gap-0.5">
                            <button onClick={() => setSortDirection('asc')} className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${sortDirection === 'asc' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-200'}`}>Asc</button>
                            <button onClick={() => setSortDirection('desc')} className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${sortDirection === 'desc' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-200'}`}>Desc</button>
                        </div>
                    </div>
                </div>
             </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-start">
            {/* INTEGRATED RESPONSIVE STUDENT ID LIST */}
            <div className="w-full lg:w-[160px] bg-gray-50 rounded-xl p-2.5 flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-y-auto max-h-[70px] lg:max-h-[500px] shadow-inner border border-gray-100 custom-scrollbar shrink-0 items-center lg:items-stretch select-none">
               <h4 className="hidden lg:block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2.5 border-b border-gray-200 pb-2">Student ID List</h4>
               <button 
                onClick={() => setSidebarSelectedId('All')}
                className={`shrink-0 px-3 py-2 lg:py-2.5 rounded-lg text-[9px] sm:text-[10px] font-black transition-all flex items-center justify-between uppercase tracking-widest ${sidebarSelectedId === 'All' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 bg-white lg:bg-transparent border border-gray-100 lg:border-transparent hover:bg-white hover:shadow-sm'}`}
              >
                All Students
              </button>
              {uniqueStudentIds.map(id => (
                <button 
                  key={id} 
                  onClick={() => setSidebarSelectedId(id)}
                  className={`shrink-0 px-3 py-2 lg:py-2.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${sidebarSelectedId === id ? 'bg-brand-600 text-white shadow-md' : 'text-gray-500 bg-white lg:bg-transparent border border-gray-100 lg:border-transparent hover:bg-white hover:shadow-sm'}`}
                >
                  {id}
                </button>
              ))}
            </div>

            {/* TABLE AREA */}
            <div className="flex-1 overflow-x-auto bg-white rounded-xl border border-gray-100">
                <table className="w-full min-w-[650px] lg:min-w-full text-left">
                <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th onClick={() => toggleSort('name')} className="py-3 px-4 text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-brand-600 group transition-colors select-none">
                        Student Details
                        <span className={`ml-1 transition-opacity ${sortKey === 'name' ? 'opacity-100 text-brand-500' : 'opacity-0 group-hover:opacity-40'}`}>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    </th>
                    <th className="py-3 px-4 text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">Shift</th>
                    <th className="py-3 px-4 text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">Mode</th>
                    <th onClick={() => toggleSort('performance')} className="py-3 px-4 text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-brand-600 group transition-colors select-none">
                        Performance
                        <span className={`ml-1 transition-opacity ${sortKey === 'performance' ? 'opacity-100 text-brand-500' : 'opacity-0 group-hover:opacity-40'}`}>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    </th>
                    <th onClick={() => toggleSort('timestamp')} className="py-3 px-4 text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest text-right cursor-pointer hover:text-brand-600 group transition-colors select-none">
                        Completed At
                        <span className={`ml-1 transition-opacity ${sortKey === 'timestamp' ? 'opacity-100 text-brand-500' : 'opacity-0 group-hover:opacity-40'}`}>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {filteredResults.length === 0 ? (
                    <tr><td colSpan={5} className="py-20 text-center font-black text-gray-300 uppercase tracking-widest text-xs">No matching records found.</td></tr>
                    ) : (
                      (() => {
                        const limit = itemsPerPage === 'All' ? filteredResults.length || 1 : Number(itemsPerPage);
                        const totalPages = Math.ceil(filteredResults.length / limit);
                        const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages || 1));
                        const startIndex = (safeCurrentPage - 1) * limit;
                        const paginatedResults = filteredResults.slice(startIndex, startIndex + limit);

                        return paginatedResults.map((res) => (
                          <tr key={res.id} className="hover:bg-gray-50/50 transition-all group">
                              <td className="py-3 px-4">
                                  <div className="flex flex-col">
                                      <span className="font-black text-gray-900 text-sm">{res.name}</span>
                                      <span className="text-[9px] font-black text-brand-500 uppercase tracking-widest mt-0.5">ID: {res.studentId}</span>
                                  </div>
                              </td>
                              <td className="py-3 px-4">
                                  {(() => {
                                    const formatted = getFormattedShift(res.shift);
                                    const colorClass = formatted === 'SHIFT 1' 
                                      ? 'bg-blue-50 text-blue-600' 
                                      : formatted === 'SHIFT 2' 
                                      ? 'bg-purple-50 text-purple-600' 
                                      : 'bg-orange-50 text-orange-600';
                                    return (
                                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${colorClass}`}>
                                        {formatted}
                                      </span>
                                    );
                                  })()}
                              </td>
                              <td className="py-3 px-4">
                                  <span className={`text-[9px] font-black uppercase tracking-widest ${res.testMode === 'MCQ' ? 'text-brand-500' : 'text-indigo-500'}`}>
                                  {res.testMode}
                                  </span>
                              </td>
                              <td className="py-3 px-4">
                                  {res.testMode === 'MCQ' ? (
                                  <div className="flex flex-col">
                                      <span className="font-black text-brand-900 text-base">{res.score}/{res.totalQuestions} <span className="text-[9px] text-gray-400 font-bold ml-1 uppercase">Correct</span></span>
                                  </div>
                                  ) : (
                                  <div className="flex flex-col">
                                      <span className="font-black text-indigo-900 text-base">{res.wpm} <small className="text-[9px] uppercase">WPM</small></span>
                                      <span className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">{res.accuracy}% Accuracy</span>
                                  </div>
                                  )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                  <p className="text-[10px] font-black text-gray-400 uppercase">
                                    {(() => {
                                      try {
                                        const d = new Date(res.timestamp);
                                        return isNaN(d.getTime()) ? res.timestamp : d.toLocaleString();
                                      } catch {
                                        return res.timestamp;
                                      }
                                    })()}
                                  </p>
                              </td>
                          </tr>
                        ));
                      })()
                    )}
                </tbody>
                </table>
                
                {/* PAGINATION CONTROLS */}
                {(() => {
                  const limit = itemsPerPage === 'All' ? filteredResults.length || 1 : Number(itemsPerPage);
                  const totalPages = Math.ceil(filteredResults.length / limit);
                  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages || 1));
                  const startIndex = (safeCurrentPage - 1) * limit;

                  return (
                    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-gray-50/50 border-t border-gray-100 rounded-b-xl gap-3">
                      <div className="flex flex-wrap items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <div>
                          Showing <span className="text-gray-700">{filteredResults.length === 0 ? 0 : startIndex + 1}</span> to <span className="text-gray-700">{Math.min(startIndex + limit, filteredResults.length)}</span> of <span className="text-gray-700">{filteredResults.length}</span> students
                        </div>
                        <span className="hidden sm:inline text-gray-200">|</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-400">Show:</span>
                          <select 
                            value={itemsPerPage} 
                            onChange={(e) => {
                              const val = e.target.value;
                              setItemsPerPage(val === 'All' ? 'All' : Number(val));
                            }}
                            className="bg-white border border-gray-200 text-gray-700 rounded px-1.5 py-1 font-bold outline-none cursor-pointer text-[10px]"
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value="All">All</option>
                          </select>
                        </div>
                      </div>
                      
                      {totalPages > 1 && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={safeCurrentPage === 1}
                            className="px-2.5 py-1.5 bg-white rounded-lg text-[9px] font-black uppercase tracking-wider text-gray-500 border border-gray-100 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition-all"
                          >
                            ⬅️ Prev
                          </button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }).map((_, idx) => {
                              const pageNum = idx + 1;
                              if (totalPages > 5 && Math.abs(safeCurrentPage - pageNum) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                                if (pageNum === 2 || pageNum === totalPages - 1) {
                                  return <span key={pageNum} className="text-gray-400 text-[9px] font-black px-0.5">...</span>;
                                }
                                return null;
                              }
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  className={`w-6 h-6 rounded-md text-[9px] font-black transition-all ${safeCurrentPage === pageNum ? 'bg-brand-600 text-white shadow-sm' : 'bg-white border border-gray-100 text-gray-400 hover:bg-gray-50'}`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={safeCurrentPage === totalPages}
                            className="px-2.5 py-1.5 bg-white rounded-lg text-[9px] font-black uppercase tracking-wider text-gray-500 border border-gray-100 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition-all"
                          >
                            Next ➡️
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-xl mx-auto space-y-8 animate-pop">
          {/* Card 1: Passcode Manager */}
          <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-xl border border-gray-100 text-center">
            <div className="w-20 h-20 bg-brand-50 text-brand-600 rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-inner">🔒</div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Admin Passcode</h3>
            <p className="text-gray-500 text-sm mb-8 font-medium">Update the portal secret code to restrict access to this dashboard.</p>
            <input 
              type="text" 
              className="w-full p-5 bg-gray-50 rounded-2xl text-center text-xl font-black mb-6 border-2 border-transparent focus:border-brand-500 outline-none transition-all" 
              value={newPinInput} 
              onChange={e => setNewPinInput(e.target.value)} 
              placeholder="Enter New Passcode" 
            />
            <Button fullWidth onClick={() => { if(newPinInput.length >= 4) { onPasscodeChange(newPinInput); setNewPinInput(''); } }} disabled={newPinInput.length < 4} className="py-4 rounded-2xl text-base font-black shadow-brand-100">
              Update Passcode
            </Button>
            <p className="mt-4 text-[10px] text-gray-400 font-black uppercase">Current Default: admin@123</p>
          </div>

          {/* Card 2: Password Recovery Hint */}
          <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-xl border border-gray-100 text-center">
            <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-inner">💡</div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Security recovery hint</h3>
            <p className="text-gray-500 text-sm mb-8 font-medium">Configure a security question and secret answer so you can reset your passcode if forgotten.</p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const q = (form.elements.namedItem('rec_q') as HTMLInputElement).value;
              const a = (form.elements.namedItem('rec_a') as HTMLInputElement).value;
              if (onSecurityChange) {
                onSecurityChange(q, a);
              }
            }} className="space-y-4 text-left">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Security Hint Question</label>
                <input 
                  type="text"
                  name="rec_q"
                  required
                  defaultValue={securityQuestion}
                  className="w-full p-4 bg-gray-50 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-brand-500 focus:bg-white transition-all text-gray-800"
                  placeholder="e.g. What is your school name?"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Secret Answer</label>
                <input 
                  type="text"
                  name="rec_a"
                  required
                  defaultValue={securityAnswer}
                  className="w-full p-4 bg-gray-50 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-brand-500 focus:bg-white transition-all text-gray-800"
                  placeholder="Answer is case-insensitive"
                />
              </div>

              <div className="pt-2">
                <Button fullWidth type="submit" className="py-4 rounded-2xl text-base font-black shadow-brand-100">
                  Save Hint Options
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPreview && (
        <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-md z-[200] flex flex-col items-center justify-start overflow-y-auto p-4 md:p-10 no-print">
            <div className="w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-pop">
                <div className="bg-gray-100 p-6 flex justify-between items-center border-b border-gray-200">
                    <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest">Print Preview</h2>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => window.print()}
                            className="px-8 py-3 bg-brand-600 text-white rounded-xl font-black text-xs uppercase shadow-lg hover:scale-105 active:scale-95 transition-all"
                        >
                            Print Now
                        </button>
                        <button 
                            onClick={() => setShowPreview(false)}
                            className="px-8 py-3 bg-gray-200 text-gray-600 rounded-xl font-black text-xs uppercase hover:bg-gray-300 transition-all"
                        >
                            Close
                        </button>
                    </div>
                </div>
                <div className="p-10">
                    <TestPaper 
                      questions={questions} 
                      config={{
                          subject: settings.subject,
                          topic: settings.subSubject || settings.subject,
                          difficulty: 'Medium',
                          language: 'English',
                          questionCount: questions.length
                      }} 
                      showAnswers={false} 
                    />
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
