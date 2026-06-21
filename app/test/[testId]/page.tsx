"use client";

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Upload, CheckCircle, Loader2 } from 'lucide-react';

export default function WebTestTakingScreen({ params }: { params: { testId: string } }) {
  const testId = params.testId;
  const router = useRouter();
  
  const [testInfo, setTestInfo] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, { type: string, answerText?: string, imageUrl?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingQId, setUploadingQId] = useState<string | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: subData } = await supabase
            .from('test_submissions')
            .select('id')
            .eq('test_id', testId)
            .eq('user_id', session.user.id)
            .maybeSingle();
            
          if (subData) {
            setHasAttempted(true);
            setLoading(false);
            return;
          }
        }

        const { data: testData, error: testErr } = await supabase
          .from('tests')
          .select('*')
          .eq('id', testId)
          .single();
        if (testErr) throw testErr;
        setTestInfo(testData);

        const { data: qData, error: qErr } = await supabase
          .from('test_questions')
          .select('*')
          .eq('test_id', testId)
          .order('order_index', { ascending: true });
        if (qErr) throw qErr;
        setQuestions(qData || []);
      } catch (e: any) {
        alert('Error loading test: ' + e.message);
      } finally {
        setLoading(false);
      }
    };
    if (testId) fetchTest();
  }, [testId]);

  const handleSelectOption = (qId: string, option: string) => {
    setAnswers(prev => ({ ...prev, [qId]: { type: 'mcq', answerText: option } }));
  };

  const uploadToSupabase = async (qId: string, file: File) => {
    try {
      setUploadingQId(qId);
      const { data: { session } } = await supabase.auth.getSession();
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_URL}/api/posts/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        },
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        setAnswers(prev => ({ ...prev, [qId]: { type: 'written', imageUrl: data.url } }));
      } else {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Upload failed');
      }
    } catch (e: any) {
      alert('Upload Error: ' + e.message);
    } finally {
      setUploadingQId(null);
    }
  };

  const handleFileChange = (qId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadToSupabase(qId, file);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert('Please answer all questions before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
      
      const formattedAnswers = Object.entries(answers).map(([qId, ans]) => ({
        questionId: qId,
        ...ans
      }));

      const res = await fetch(`${API_URL}/api/tests/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          testId,
          answers: formattedAnswers
        })
      });
      
      if (!res.ok) throw new Error('Submission failed on server');
      
      alert('Success! Your test has been securely submitted.');
      router.replace('/');
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;
  }

  if (hasAttempted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-6 text-center">
        <CheckCircle size={64} className="text-emerald-500 mb-4" />
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Test Attempted!</h2>
        <p className="text-slate-500 font-medium max-w-md">You have already submitted this test. Re-attempts are not allowed to maintain fairness.</p>
        <button 
          onClick={() => router.replace('/')}
          className="mt-8 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-6 py-3 rounded-xl transition-colors"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  if (!testInfo) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">Test not found</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-black mb-2">{testInfo.title}</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">{testInfo.description}</p>

        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl mb-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-500 dark:text-slate-400 mb-2">Question {idx + 1} ({q.marks} Marks)</h3>
            <p className="text-xl font-bold mb-6">{q.question_text}</p>

            {q.type === 'mcq' && q.options && (
              <div className="flex flex-col gap-3">
                {(q.options as string[]).map((opt, i) => {
                  const isSelected = answers[q.id]?.answerText === opt;
                  return (
                    <button 
                      key={i}
                      onClick={() => handleSelectOption(q.id, opt)}
                      className={`text-left p-4 rounded-xl border transition-colors ${isSelected ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold dark:bg-indigo-900/30 dark:text-indigo-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700'}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {q.type === 'written' && (
              <div className="mt-4">
                {answers[q.id]?.imageUrl ? (
                  <div className="relative border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <img src={answers[q.id].imageUrl} alt="Uploaded Answer" className="w-full h-64 object-cover" />
                    <div className="absolute top-3 right-3 bg-emerald-500 rounded-full px-3 py-1 flex flex-row items-center gap-1 shadow-md">
                      <CheckCircle size={16} color="white" />
                      <span className="text-white text-xs font-bold">Uploaded</span>
                    </div>
                    <label className="absolute bottom-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white text-sm font-bold py-2 px-4 rounded-lg cursor-pointer transition-colors">
                      Retake Photo
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleFileChange(q.id, e)} 
                      />
                    </label>
                  </div>
                ) : (
                  <label className={`flex flex-col items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 border-2 border-dashed border-indigo-200 dark:border-indigo-800/50 rounded-xl p-10 cursor-pointer transition-colors ${uploadingQId === q.id ? 'opacity-70 pointer-events-none' : 'hover:bg-indigo-100 dark:hover:bg-indigo-900/40'}`}>
                    {uploadingQId === q.id ? (
                      <>
                        <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400 mb-2" size={32} />
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">Uploading image...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={32} className="text-indigo-600 dark:text-indigo-400 mb-3" />
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold text-lg text-center">Upload Answer Sheet</span>
                        <span className="text-indigo-400 dark:text-indigo-500/70 text-sm mt-1 text-center">Click to browse or take a clear photo of your handwritten answer</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleFileChange(q.id, e)} 
                      disabled={uploadingQId === q.id}
                    />
                  </label>
                )}
              </div>
            )}
          </div>
        ))}

        <button 
          onClick={handleSubmit}
          disabled={submitting}
          className={`w-full py-4 mt-6 rounded-xl text-white font-black text-xl transition-all ${submitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-1'}`}
        >
          {submitting ? 'Submitting Test...' : 'Final Submit'}
        </button>
      </div>
    </div>
  );
}
