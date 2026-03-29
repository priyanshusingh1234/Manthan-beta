"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { compressImage } from '@/utils/compressImage';

type Difficulty = 'easy' | 'moderate' | 'hard' | '';

export default function CreateQuestionForm() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [subject, setSubject] = useState('');
  const [classGrade, setClassGrade] = useState('');
  const [points, setPoints] = useState<number>(5);
  const [timeLimit, setTimeLimit] = useState<number>(10); // minutes
  const [difficulty, setDifficulty] = useState<Difficulty>('');
  const [options, setOptions] = useState<string[]>([]);
  const [correctOption, setCorrectOption] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Image upload states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  // Model answer states (for questions > 15 points)
  const [modelAnswerFile, setModelAnswerFile] = useState<File | null>(null);
  const [modelAnswerPreview, setModelAnswerPreview] = useState<string | null>(null);
  const [modelAnswerUploading, setModelAnswerUploading] = useState(false);
  const [modelAnswerSaved, setModelAnswerSaved] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted) return;
      setUser(user || null);
      setLoading(false);
    });
    return () => {
      mounted = false;
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, []);

  if (loading) return <div className="text-sm text-slate-500">Checking permissions…</div>;
  if (!user || !user.user_metadata?.isTeacher) return <div className="text-sm text-red-600">Not authorized — teachers only.</div>;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required.';
    if (!subject.trim()) e.subject = 'Subject is required.';
    if (subject !== 'English' && !classGrade.trim()) e.classGrade = 'Class is required.';
    if (!Number.isFinite(points) || points < 1 || points > 25) e.points = 'Points must be between 1 and 25.';
    if (points > 15 && !modelAnswerFile && !modelAnswerSaved) e.modelAnswer = 'A model answer is required for questions worth more than 15 points.';
    if (!Number.isFinite(timeLimit) || timeLimit <= 0) e.timeLimit = 'Given time must be greater than 0.';
    const filledOptions = options.filter((o) => o.trim() !== '');
    if (filledOptions.length > 0 && filledOptions.length < 2) e.options = 'Provide at least two options or remove them.';
    if (filledOptions.length > 0) {
      if (correctOption === null || !Number.isInteger(correctOption) || correctOption < 0 || correctOption >= filledOptions.length) {
        e.correctOption = 'Select the correct option.';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddOption = () => {
    if (options.length >= 6) return;
    setOptions((s) => [...s, '']);
  };
  const handleRemoveOption = (idx: number) => {
    setOptions((s) => s.filter((_, i) => i !== idx));
    // adjust selected correct option
    setCorrectOption((cur) => {
      if (cur === null) return null;
      if (idx === cur) return null; // removed the correct one
      if (idx < cur) return cur - 1; // shift down
      return cur;
    });
  };
  const handleOptionChange = (idx: number, value: string) => {
    setOptions((s) => s.map((v, i) => (i === idx ? value : v)));
  };

  const resetForm = async (keepImage = false) => {
    setTitle('');
    setBody('');
    setSubject('');
    setClassGrade('');
    setPoints(5);
    setTimeLimit(10);
    setDifficulty('');
    setOptions([]);
    setCorrectOption(null);
    setErrors({});

    // remove preview and uploaded image (best-effort)
    if (imagePreview) {
      try { URL.revokeObjectURL(imagePreview); } catch { }
    }
    if (imagePath && !keepImage) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await fetch('/api/questions/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
          body: JSON.stringify({ path: imagePath }),
        });
      } catch { /* ignore */ }
    }
    setImageFile(null);
    setImagePreview(null);
    setImagePath(null);
    setImageUploading(false);

    // Reset model answer
    if (modelAnswerPreview) {
      try { URL.revokeObjectURL(modelAnswerPreview); } catch { }
    }
    setModelAnswerFile(null);
    setModelAnswerPreview(null);
    setModelAnswerUploading(false);
    setModelAnswerSaved(false);
  };

  const handleModelAnswerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      setErrors((s) => ({ ...s, modelAnswer: 'Model answer must be ≤ 10MB' }));
      return;
    }
    setErrors((s) => ({ ...s, modelAnswer: '' }));
    setModelAnswerFile(f);
    const tmpUrl = URL.createObjectURL(f);
    setModelAnswerPreview(tmpUrl);
  };

  const uploadImage = async (file: File) => {
    if (!file) return null;
    setImageUploading(true);
    try {
      const compressed = await compressImage(file, "banner"); // Using banner preset for general question images
      const form = new FormData();
      form.append('file', compressed, compressed.name);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/questions/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Upload failed');

      // server returns signed URL for private bucket (or null) + stored path
      setImagePath(body.path || null);

      if (body.url) {
        setImagePreview(body.url);
        return { path: body.path, publicUrl: body.url };
      }

      // Fallback for public bucket: construct/get public URL client-side
      if (body.path) {
        try {
          const { data: publicData } = supabase.storage.from('question-images').getPublicUrl(body.path);
          if (publicData?.publicUrl) {
            setImagePreview(publicData.publicUrl);
            return { path: body.path, publicUrl: publicData.publicUrl };
          }
        } catch (err) {
          console.warn('Failed to get public URL from client SDK', err);
        }
      }

      // nothing available
      setImagePreview(null);
      return { path: body.path, publicUrl: null };
    } catch (err) {
      console.warn('Image upload failed', err);
      setMessage('Image upload failed (image will be ignored).');
      return null;
    } finally {
      setImageUploading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      setErrors((s) => ({ ...s, image: 'Image must be <= 8MB' }));
      return;
    }
    setErrors((s) => ({ ...s, image: '' }));
    setImageFile(f);
    const tmpUrl = URL.createObjectURL(f);
    setImagePreview(tmpUrl);

    // upload immediately (best-effort)
    await uploadImage(f);
  };

  const removeImage = async () => {
    if (imagePreview) {
      try { URL.revokeObjectURL(imagePreview); } catch { }
    }

    if (imagePath) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        await fetch('/api/questions/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ path: imagePath }),
        });
      } catch (err) {
        console.warn('Failed to remove image from storage', err);
      }
    }

    setImageFile(null);
    setImagePreview(null);
    setImagePath(null);
    setImageUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!validate()) {
      setMessage('Please fix validation errors.');
      return;
    }

    // ensure image uploaded if user picked one but upload not finished
    if (imageFile && !imagePath) {
      await uploadImage(imageFile);
    }

    setMessage('Saving…');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const payload = {
        title: title.trim(),
        body: body.trim(),
        subject: subject.trim(),
        classGrade: classGrade.trim(),
        points,
        timeLimit,
        difficulty: difficulty || null,
        options: options.filter((o) => o.trim() !== ''),
        correctOption: correctOption !== null ? correctOption : null,
        imageUrl: null, // Do not save signed URL (imagePreview) as it expires. Rely on imagePath.
        imagePath: imagePath || null,
      };

      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const bodyRes = await res.json();
      if (!res.ok) throw new Error(bodyRes?.error || 'Save failed');

      setMessage('Question saved');

      // Upload model answer if provided (for > 15 point questions)
      // Note: questions API returns { success, data: { id } }, not { id }
      const createdQuestionId = bodyRes?.data?.id || bodyRes?.id;
      if (points > 15 && modelAnswerFile && createdQuestionId) {
        setMessage('Uploading model answer…');
        setModelAnswerUploading(true);
        try {
          const { data: { session: s2 } } = await supabase.auth.getSession();
          const t2 = s2?.access_token;
          const form = new FormData();
          let fileToUpload = modelAnswerFile;
          // Only attempt to compress if it is an image (not application/pdf)
          if (modelAnswerFile.type.startsWith('image/')) {
            fileToUpload = await compressImage(modelAnswerFile, "answer");
          }
          form.append('file', fileToUpload, fileToUpload.name);
          form.append('questionId', createdQuestionId);
          const solRes = await fetch('/api/teacher-solution', {
            method: 'POST',
            headers: t2 ? { Authorization: `Bearer ${t2}` } : {},
            body: form,
          });
          if (solRes.ok) {
            setModelAnswerSaved(true);
            setMessage('Question and model answer saved!');
          } else {
            setMessage('Question saved, but model answer upload failed.');
          }
        } catch {
          setMessage('Question saved, but model answer upload failed.');
        } finally {
          setModelAnswerUploading(false);
        }
      }

      resetForm(true);
    } catch (err: any) {
      setMessage(err?.message || 'Save failed');
      console.error(err);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 border border-slate-100 dark:border-slate-800">
      <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Create question</h2>
      {message && <div className="mb-4 text-sm text-slate-600 dark:text-slate-400 font-medium">{message}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Title <span className="text-red-500">*</span></label>
          <input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all" 
            placeholder="Enter question title..."
          />
          {errors.title && <div className="text-xs text-red-600 mt-1.5 font-medium">{errors.title}</div>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Subject <span className="text-red-500">*</span></label>
          <select 
            value={subject} 
            onChange={(e) => setSubject(e.target.value)} 
            className="block w-full sm:w-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
          >
            <option value="">Select subject</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Science">Science</option>
            <option value="English">English</option>
            <option value="English Literature">English Literature</option>
            <option value="SST">SST</option>
          </select>
          {errors.subject && <div className="text-xs text-red-600 mt-1.5 font-medium">{errors.subject}</div>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {subject !== 'English' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Class / Grade <span className="text-red-500">*</span></label>
              <select 
                value={classGrade} 
                onChange={(e) => setClassGrade(e.target.value)} 
                className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
              >
                <option value="">Select class</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10</option>
                <option value="11">11</option>
                <option value="12">12</option>
              </select>
              {errors.classGrade && <div className="text-xs text-red-600 mt-1.5 font-medium">{errors.classGrade}</div>}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Points <span className="text-red-500">*</span></label>
            <input 
              type="number" 
              value={points} 
              onChange={(e) => setPoints(Number(e.target.value))} 
              min={1} 
              max={25} 
              className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all" 
            />
            <div className="text-[10px] text-slate-400 mt-1.5 font-medium uppercase tracking-wider">Maximum 25 points</div>
            {errors.points && <div className="text-xs text-red-600 mt-1 font-medium">{errors.points}</div>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Given time (mins) <span className="text-red-500">*</span></label>
            <input 
              type="number" 
              value={timeLimit} 
              onChange={(e) => setTimeLimit(Number(e.target.value))} 
              min={1} 
              className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all" 
            />
            {errors.timeLimit && <div className="text-xs text-red-600 mt-1.5 font-medium">{errors.timeLimit}</div>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Difficulty (optional)</label>
          <select 
            value={difficulty} 
            onChange={(e) => setDifficulty(e.target.value as Difficulty)} 
            className="block w-40 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
          >
            <option value="">(none)</option>
            <option value="easy">Easy</option>
            <option value="moderate">Moderate</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div className="pt-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Options (optional)</label>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-3 font-medium">If you add options, provide at least two. Leave empty for open-ended questions.</p>
          <div className="space-y-3">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-200">
                <label className="inline-flex items-center group cursor-pointer">
                  <input 
                    type="radio" 
                    name="correct" 
                    checked={correctOption === i} 
                    onChange={() => setCorrectOption(i)} 
                    className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 text-amber-500 focus:ring-amber-500 bg-white dark:bg-slate-800" 
                  />
                </label>
                <input 
                  value={opt} 
                  onChange={(e) => handleOptionChange(i, e.target.value)} 
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all" 
                  placeholder={`Option ${i + 1}`} 
                />
                <button 
                  type="button" 
                  onClick={() => handleRemoveOption(i)} 
                  className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button 
              type="button" 
              onClick={handleAddOption} 
              disabled={options.length >= 6} 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Add option
            </button>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Up to 6 options</div>
          </div>
          {errors.options && <div className="text-xs text-red-600 mt-2 font-medium">{errors.options}</div>}
        </div>

        {/* Model Answer Upload — required for > 15 point questions */}
        {points > 15 && (
          <div className="p-5 rounded-2xl border-2 border-violet-100 dark:border-violet-900/30 bg-violet-50/30 dark:bg-violet-900/10 space-y-3">
            <label className="block text-sm font-bold text-violet-800 dark:text-violet-400">
              📝 Model Answer <span className="text-red-500">*</span>
              <span className="ml-3 text-[10px] items-center text-violet-600 dark:text-violet-500 bg-violet-100 dark:bg-violet-900/40 px-2.5 py-1 rounded-full uppercase tracking-widest font-black">Required</span>
            </label>
            <p className="text-xs text-violet-700/70 dark:text-violet-400/60 font-medium leading-relaxed">Upload your handwritten or typed solution. Students will compare their answer against this. Max 10MB (JPG, PNG, PDF).</p>
            <div className="flex flex-wrap items-center gap-4">
              <input type="file" accept="image/*,.pdf" capture="environment" onChange={handleModelAnswerChange} className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-violet-100 file:text-violet-700 hover:file:bg-violet-200 transition-all cursor-pointer" />
              {modelAnswerUploading && <span className="text-xs text-violet-600 dark:text-violet-400 animate-pulse font-bold">Uploading...</span>}
              {modelAnswerSaved && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-black flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                Saved
              </span>}
            </div>
            {errors.modelAnswer && <div className="text-xs text-red-600 font-medium">{errors.modelAnswer}</div>}
            {modelAnswerPreview && (
              <div className="mt-2 relative w-44 h-32 group">
                <img src={modelAnswerPreview} alt="Model answer preview" className="w-full h-full object-cover rounded-xl border-2 border-violet-200 dark:border-violet-800 shadow-sm" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                    <span className="text-white text-[10px] font-bold">PREVIEW</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Illustration Image (optional)</label>
          <div className="mt-1 flex flex-col gap-3">
             <div className="flex items-center gap-3">
                <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-300 hover:file:bg-slate-200 transition-all cursor-pointer" />
                {imageUploading && <div className="text-xs text-slate-500 animate-pulse font-bold">Uploading…</div>}
             </div>
             {errors.image && <div className="text-xs text-red-600 font-medium">{errors.image}</div>}
          </div>
          {imagePreview && (
            <div className="mt-4 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-wrap items-start gap-4">
              <img src={imagePreview} alt="preview" className="w-40 h-28 object-cover rounded-xl border dark:border-slate-700 shadow-sm" />
              <div className="flex-1 min-w-[200px]">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Image Preview</div>
                <button 
                  type="button" 
                  onClick={removeImage} 
                  className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                >
                  Remove image
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Question body <span className="text-red-500">*</span></label>
          <textarea 
            value={body} 
            onChange={(e) => setBody(e.target.value)} 
            rows={5} 
            className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all resize-none" 
            placeholder="Write the full question description here..."
          />
        </div>

        <div className="flex items-center gap-4 pt-4">
          <button 
            type="submit" 
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-amber-500 text-white font-black hover:bg-amber-600 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            Create question
          </button>
          <button 
            type="button" 
            onClick={() => resetForm()} 
            className="text-sm font-bold text-slate-400 hover:text-red-500 transition-colors"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
