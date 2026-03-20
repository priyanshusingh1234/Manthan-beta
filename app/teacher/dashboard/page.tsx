import TeacherApplicationsList from '@/components/TeacherApplicationsList';

export const metadata = {
  title: 'Teacher applications — Dheeyudha',
};

export default function TeacherDashboardPage() {
  return (
    <div className="min-h-screen p-8 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold">Teacher requests</h1>
            <p className="text-sm text-slate-500">Approve or reject incoming teacher applications.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <TeacherApplicationsList />
        </div>
      </div>
    </div>
  );
}
