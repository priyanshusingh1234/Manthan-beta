"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, CheckCircle, AlertCircle, ChevronLeft, Save } from 'lucide-react';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '')
  .split(',').map(e => e.trim().toLowerCase());

export default function AdminGradingDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  
  const [grades, setGrades] = useState<Record<string, number>>({}); // answerId -> marksAwarded
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email?.toLowerCase() || '';
      const authorized = ['kpk22128@gmail.com', 's61038955@gmail.com', ...ADMIN_EMAILS].includes(userEmail);
      
      setIsAdmin(authorized);
      if (authorized) {
        fetchTests();
      } else {
        setLoading(false);
      }
    } catch (e) {
      setIsAdmin(false);
      setLoading(false);
    }
  };

  const fetchTests = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('tests').select('id, title, created_at').order('created_at', { ascending: false });
      setTests(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (testId: string) => {
    setSelectedTestId(testId);
    setSelectedSubmissionId(null);
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
      
      const res = await fetch(`${API_URL}/api/admin/submissions?testId=${testId}`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });
      
      if (!res.ok) throw new Error('Failed to fetch submissions');
      const data = await res.json();
      setSubmissions(data.submissions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissionDetails = async (subId: string, testId: string) => {
    setSelectedSubmissionId(subId);
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
      
      const res = await fetch(`${API_URL}/api/admin/submissions?testId=${testId}&submissionId=${subId}`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });
      
      if (!res.ok) throw new Error('Failed to fetch details');
      const data = await res.json();
        
      setQuestions(data.questions || []);
      setAnswers(data.answers || []);
      
      // Init grades state
      const initialGrades: Record<string, number> = {};
      (data.answers || []).forEach((ans: any) => {
        initialGrades[ans.id] = ans.marks_awarded || 0;
      });
      setGrades(initialGrades);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGrades = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
      
      const payloadGrades = Object.entries(grades).map(([answerId, marksAwarded]) => ({
        answerId,
        marksAwarded: Number(marksAwarded)
      }));

      const res = await fetch(`${API_URL}/api/admin/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          submissionId: selectedSubmissionId,
          grades: payloadGrades
        })
      });

      if (!res.ok) throw new Error('Failed to save grades');
      
      alert('Grades saved successfully!');
      
      // Update local submission status
      setSubmissions(subs => subs.map(s => 
        s.id === selectedSubmissionId ? { ...s, status: 'completed' } : s
      ));
      
    } catch (e: any) {
      alert('Error saving: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="animate-spin text-indigo-600 w-10 h-10" /></div>;
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-black mb-2">Access Denied</h1>
        <p className="text-slate-500">You do not have administrative privileges to view this page.</p>
        <button onClick={() => router.push('/')} className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold">Go Home</button>
      </div>
    );
  }

  // View 3: Grading a specific submission
  if (selectedSubmissionId && selectedTestId) {
    const submission = submissions.find(s => s.id === selectedSubmissionId);
    const studentName = submission?.profiles?.full_name || submission?.profiles?.username || 'Unknown Student';

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-10 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => setSelectedSubmissionId(null)}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold mb-6 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Submissions
          </button>
          
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-10 border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
            <h1 className="text-2xl font-black mb-2">Grading: {studentName}</h1>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${submission?.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30'}`}>
                {submission?.status}
              </span>
              <span className="text-slate-500 text-sm font-bold">Current Total: {submission?.total_score || 0}</span>
            </div>
          </div>

          <div className="space-y-6">
            {questions.map((q, idx) => {
              const ans = answers.find(a => a.question_id === q.id);
              return (
                <div key={q.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-slate-500 dark:text-slate-400">Question {idx + 1}</h3>
                    <span className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-lg text-xs font-black uppercase">Max {q.marks} Marks</span>
                  </div>
                  <p className="text-lg font-bold mb-6">{q.question_text}</p>
                  
                  {ans ? (
                    <div className="space-y-4">
                      {q.type === 'mcq' && (
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                          <p className="text-sm text-slate-500 mb-1 font-bold">Student's Answer:</p>
                          <p className="font-medium">{ans.answer_text}</p>
                          <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 font-bold">Correct Answer: {q.correct_answer}</p>
                        </div>
                      )}
                      
                      {q.type === 'written' && ans.image_url && (
                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                          <img src={ans.image_url} alt="Student upload" className="w-full h-auto object-contain bg-slate-100 dark:bg-slate-950 max-h-[600px]" />
                        </div>
                      )}

                      {q.type === 'written' && ans.answer_text && !ans.image_url && (
                         <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                           <p className="font-medium whitespace-pre-wrap">{ans.answer_text}</p>
                         </div>
                      )}

                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
                        <label className="font-bold text-sm text-slate-600 dark:text-slate-300">Marks Awarded:</label>
                        <input 
                          type="number" 
                          min={0}
                          max={q.marks}
                          value={grades[ans.id] !== undefined ? grades[ans.id] : ''}
                          onChange={(e) => setGrades(prev => ({ ...prev, [ans.id]: Number(e.target.value) }))}
                          className="w-24 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-900/30 font-bold text-sm">
                      No answer submitted for this question.
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="sticky bottom-8 mt-10">
            <button 
              onClick={handleSaveGrades}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-500/30 transition-all disabled:opacity-70 disabled:hover:bg-indigo-600"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Grades & Complete
            </button>
          </div>
        </div>
      </div>
    );
  }

  // View 2: List Submissions for a Test
  if (selectedTestId) {
    const test = tests.find(t => t.id === selectedTestId);
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-10 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <button 
            onClick={() => setSelectedTestId(null)}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold mb-6 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Tests
          </button>
          
          <h1 className="text-3xl font-black mb-8">{test?.title} - Submissions</h1>
          
          {loading ? (
             <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600 w-8 h-8" /></div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <p className="text-slate-500 font-bold">No submissions yet for this test.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {submissions.map(sub => (
                <div key={sub.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${sub.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30'}`}>
                      {sub.status}
                    </span>
                    <span className="text-xs font-bold text-slate-400">Score: {sub.total_score || 0}</span>
                  </div>
                  <h3 className="font-black text-lg mb-1 truncate">{sub.profiles?.full_name || sub.profiles?.username || 'Unknown'}</h3>
                  <p className="text-xs text-slate-500 font-medium mb-6">{new Date(sub.created_at).toLocaleString()}</p>
                  <button 
                    onClick={() => fetchSubmissionDetails(sub.id, selectedTestId)}
                    className="w-full py-3 bg-slate-50 dark:bg-slate-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-sm rounded-xl transition-colors"
                  >
                    Grade Submission
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // View 1: List Tests
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white py-10 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
           <div>
             <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-black text-[10px] uppercase tracking-widest mb-3">Admin Restricted</div>
             <h1 className="text-4xl font-black italic tracking-tight">Grading Dashboard</h1>
           </div>
           <button onClick={() => router.push('/')} className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
             Exit Dashboard
           </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600 w-8 h-8" /></div>
        ) : tests.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <p className="text-slate-500 font-bold">No subjective tests found in the database.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {tests.map(test => (
              <div 
                key={test.id} 
                onClick={() => fetchSubmissions(test.id)}
                className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer group"
              >
                <h3 className="text-xl font-black mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{test.title}</h3>
                <p className="text-sm text-slate-500 font-medium">Created: {new Date(test.created_at).toLocaleDateString()}</p>
                <div className="mt-6 flex justify-end">
                   <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all text-slate-400">
                     <ChevronLeft className="w-5 h-5 rotate-180" />
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
