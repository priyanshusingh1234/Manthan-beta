"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ChevronLeft, Plus, Trash2, Save, Loader2, GripVertical, CheckCircle } from 'lucide-react';

type QuestionType = 'mcq' | 'written';

interface QuestionDraft {
  id: string; // temp id for UI
  type: QuestionType;
  question_text: string;
  options: string[]; // only for mcq
  correct_option: string; // only for mcq
  max_marks: number;
}

export default function AdminCreateTestPage() {
  const router = useRouter();

  // Test details state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('History');
  const [duration, setDuration] = useState('60');
  const [classGrade, setClassGrade] = useState('10');
  const [testType, setTestType] = useState('subjective');

  // Questions state
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const addQuestion = (type: QuestionType) => {
    setQuestions([
      ...questions,
      {
        id: Math.random().toString(36).substr(2, 9),
        type,
        question_text: '',
        options: type === 'mcq' ? ['', '', '', ''] : [],
        correct_option: '',
        max_marks: type === 'mcq' ? 1 : 5
      }
    ]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, updates: Partial<QuestionDraft>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const updateOption = (qId: string, optIndex: number, val: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const newOpts = [...q.options];
        newOpts[optIndex] = val;
        return { ...q, options: newOpts };
      }
      return q;
    }));
  };

  const handlePublish = async () => {
    if (!title.trim() || !subject.trim()) {
      setError('Title and Subject are required.');
      return;
    }
    if (questions.length === 0) {
      setError('Please add at least one question.');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        setError(`Question ${i + 1} is empty.`);
        return;
      }
      if (q.type === 'mcq') {
        if (q.options.some(o => !o.trim())) {
          setError(`Question ${i + 1} has empty options.`);
          return;
        }
        if (!q.correct_option) {
          setError(`Question ${i + 1} must have a correct option selected.`);
          return;
        }
      }
    }

    setSaving(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not logged in');

      const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
      
      const res = await fetch(`${API_URL}/api/admin/tests/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          testDetails: {
            title,
            description,
            subject,
            duration,
            class_grade: classGrade,
            type: testType
          },
          questions: questions
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish test');

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col h-[70vh] items-center justify-center text-center px-6">
        <CheckCircle className="w-20 h-20 text-emerald-500 mb-4 animate-bounce" />
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Test Published!</h1>
        <p className="text-slate-500 font-medium">Students can now see and attempt this test.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 pt-8 pb-32">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-bold transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
        <button 
          onClick={handlePublish}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-transform active:scale-95 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Publish Test
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">Create New Test</h1>
        <p className="text-slate-500 font-medium mt-1">Configure test details and add questions dynamically.</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6 font-semibold">
          {error}
        </div>
      )}

      {/* Test Details Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8 mb-8">
        <h2 className="text-xl font-black mb-6 text-slate-900 dark:text-white">1. Test Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Test Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g. History Chapter 1 Unit Test"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description / Instructions</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Instructions for students..."
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Subject</label>
            <input 
              type="text" 
              value={subject} 
              onChange={e => setSubject(e.target.value)} 
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Class / Grade</label>
            <input 
              type="text" 
              value={classGrade} 
              onChange={e => setClassGrade(e.target.value)} 
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Duration (minutes)</label>
            <input 
              type="number" 
              value={duration} 
              onChange={e => setDuration(e.target.value)} 
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Test Type</label>
            <select 
              value={testType} 
              onChange={e => setTestType(e.target.value)} 
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white appearance-none"
            >
              <option value="subjective">Subjective (Requires Grading)</option>
              <option value="objective">Objective (Auto Graded)</option>
              <option value="mock_test">Mock Test</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">2. Questions ({questions.length})</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => addQuestion('mcq')}
            className="flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-indigo-200 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add MCQ
          </button>
          <button 
            onClick={() => addQuestion('written')}
            className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-purple-200 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Written
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((q, index) => (
          <div key={q.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex gap-4 relative">
            
            <div className="flex flex-col items-center gap-4 mt-2 text-slate-400 cursor-move">
              <GripVertical className="w-5 h-5" />
              <span className="font-black text-lg text-slate-300 dark:text-slate-700">{index + 1}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${q.type === 'mcq' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400'}`}>
                  {q.type === 'mcq' ? 'Multiple Choice' : 'Written / Subjective'}
                </span>
                
                <button 
                  onClick={() => removeQuestion(q.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <textarea 
                value={q.question_text}
                onChange={e => updateQuestion(q.id, { question_text: e.target.value })}
                placeholder="Type your question here..."
                rows={2}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white mb-4"
              />

              {q.type === 'mcq' && (
                <div className="space-y-3 mb-4">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-3">
                      <button 
                        onClick={() => updateQuestion(q.id, { correct_option: opt })}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          q.correct_option === opt && opt !== '' 
                            ? 'border-emerald-500 bg-emerald-500' 
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {q.correct_option === opt && opt !== '' && <CheckCircle className="w-4 h-4 text-white" />}
                      </button>
                      <input 
                        type="text"
                        value={opt}
                        onChange={e => updateOption(q.id, oIdx, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                        className={`flex-1 bg-transparent border-b px-2 py-1 focus:outline-none font-medium ${
                          q.correct_option === opt && opt !== '' 
                            ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold' 
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:border-indigo-500'
                        }`}
                      />
                    </div>
                  ))}
                  <p className="text-xs text-slate-500 mt-2 font-medium">Click the circle next to an option to mark it as correct.</p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Max Marks:</label>
                <input 
                  type="number"
                  value={q.max_marks}
                  onChange={e => updateQuestion(q.id, { max_marks: parseInt(e.target.value, 10) || 0 })}
                  className="w-20 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

            </div>
          </div>
        ))}

        {questions.length === 0 && (
          <div className="text-center py-12 bg-slate-100 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
            <p className="text-slate-500 font-bold mb-4">No questions added yet.</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => addQuestion('mcq')} className="text-indigo-600 font-bold hover:underline">Add MCQ</button>
              <button onClick={() => addQuestion('written')} className="text-purple-600 font-bold hover:underline">Add Written</button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
