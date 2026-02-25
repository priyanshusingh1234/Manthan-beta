import TeacherApplyForm from '@/components/TeacherApplyForm';

export const metadata = {
  title: 'Register as teacher — Dheeyudha',
};

export default function TeacherApplyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 lg:px-8 bg-slate-50">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold">Register as a teacher</h1>
          <p className="text-sm text-slate-500 mt-2">Tell us about your subject expertise and school — we'll review and contact you.</p>
        </div>
        <TeacherApplyForm />
      </div>
    </div>
  );
}
