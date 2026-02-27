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
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Create question</h2>
      {message && <div className="mb-4 text-sm text-slate-600">{message}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Title <span className="text-red-500">*</span></label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2" />
          {errors.title && <div className="text-xs text-red-600 mt-1">{errors.title}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Subject <span className="text-red-500">*</span></label>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 block w-72 rounded-lg border border-slate-200 px-3 py-2">
            <option value="">Select subject</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Science">Science</option>
            <option value="English">English</option>
            <option value="SST">SST</option>
          </select>
          {errors.subject && <div className="text-xs text-red-600 mt-1">{errors.subject}</div>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {subject !== 'English' && (
            <div>
              <label className="block text-sm font-medium text-slate-700">Class / Grade <span className="text-red-500">*</span></label>
              <select value={classGrade} onChange={(e) => setClassGrade(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2">
                <option value="">Select class</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10</option>
                <option value="11">11</option>
                <option value="12">12</option>
              </select>
              {errors.classGrade && <div className="text-xs text-red-600 mt-1">{errors.classGrade}</div>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700">Points <span className="text-red-500">*</span></label>
            <input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} min={1} max={25} className="mt-1 block w-32 rounded-lg border border-slate-200 px-3 py-2" />
            <div className="text-xs text-slate-400 mt-1">Maximum 25 points</div>
            {errors.points && <div className="text-xs text-red-600 mt-1">{errors.points}</div>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Given time (minutes) <span className="text-red-500">*</span></label>
            <input type="number" value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} min={1} className="mt-1 block w-32 rounded-lg border border-slate-200 px-3 py-2" />
            {errors.timeLimit && <div className="text-xs text-red-600 mt-1">{errors.timeLimit}</div>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Difficulty (optional)</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className="mt-1 block w-40 rounded-lg border border-slate-200 px-3 py-2">
            <option value="">(none)</option>
            <option value="easy">Easy</option>
            <option value="moderate">Moderate</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Options (optional)</label>
          <p className="text-xs text-slate-400">If you add options, provide at least two. Leave empty for open-ended questions.</p>
          <div className="mt-2 space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="correct" checked={correctOption === i} onChange={() => setCorrectOption(i)} className="form-radio text-amber-500" />
                </label>
                <input value={opt} onChange={(e) => handleOptionChange(i, e.target.value)} className="flex-1 rounded-lg border border-slate-200 px-3 py-2" placeholder={`Option ${i + 1}`} />
                <button type="button" onClick={() => handleRemoveOption(i)} className="px-2 py-1 rounded bg-red-50 text-red-600 text-sm">Remove</button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button type="button" onClick={handleAddOption} disabled={options.length >= 6} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm hover:bg-slate-200">
              Add option
            </button>
            <div className="text-xs text-slate-400">Up to 6 options</div>
          </div>
          {errors.options && <div className="text-xs text-red-600 mt-1">{errors.options}</div>}
        </div>

        {/* Model Answer Upload — required for > 15 point questions */}
        {points > 15 && (
          <div className="p-4 rounded-xl border-2 border-violet-200 bg-violet-50/50 space-y-2">
            <label className="block text-sm font-bold text-violet-800">
              📝 Model Answer <span className="text-red-500">*</span>
              <span className="ml-2 text-xs font-normal text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">Required for {'>'}15 pt questions</span>
            </label>
            <p className="text-xs text-violet-700">Upload your handwritten or typed solution. Students will compare their answer against this. Max 10MB (JPG, PNG, PDF).</p>
            <div className="flex items-center gap-3">
              <input type="file" accept="image/*,.pdf" onChange={handleModelAnswerChange} className="text-sm" />
              {modelAnswerUploading && <span className="text-xs text-violet-600 animate-pulse">Uploading model answer…</span>}
              {modelAnswerSaved && <span className="text-xs text-emerald-600 font-semibold">✓ Model answer saved</span>}
            </div>
            {errors.modelAnswer && <div className="text-xs text-red-600">{errors.modelAnswer}</div>}
            {modelAnswerPreview && (
              <img src={modelAnswerPreview} alt="Model answer preview" className="mt-2 w-40 h-28 object-cover rounded-lg border-2 border-violet-200" />
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700">Image (optional)</label>
          <p className="text-xs text-slate-400">Optional illustration — max 8MB.</p>
          <div className="mt-2 flex items-center gap-3">
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {imageUploading && <div className="text-sm text-slate-500">Uploading…</div>}
          </div>
          {errors.image && <div className="text-xs text-red-600 mt-1">{errors.image}</div>}
          {imagePreview && (
            <div className="mt-3 flex items-start gap-3">
              <img src={imagePreview} alt="preview" className="w-32 h-20 object-cover rounded-md border" />
              <div className="flex-1">
                <div className="text-sm text-slate-600">Preview</div>
                <div className="mt-2 flex items-center gap-2">
                  <button type="button" onClick={removeImage} className="px-2 py-1 rounded bg-red-50 text-red-600 text-sm">Remove image</button>
                </div>
                {imagePath && (
                  <div className="mt-2 text-xs text-slate-400">Stored path: <code className="bg-gray-100 px-1 rounded">{imagePath}</code></div>
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Question body</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2" />
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600">Create question</button>
          <button type="button" onClick={() => resetForm()} className="text-sm text-slate-500">Reset</button>
        </div>
      </form>
    </div>
  );
}
