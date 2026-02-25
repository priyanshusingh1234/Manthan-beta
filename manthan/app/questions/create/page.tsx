import CreateQuestionForm from '@/components/CreateQuestionForm';

export const metadata = {
  title: 'Create question — Dheeyudha',
};

export default function CreateQuestionPage() {
  return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold">Create question</h1>
        <p className="text-sm text-slate-500 mt-1">Only verified teachers can create questions.</p>
      </div>

      <CreateQuestionForm />
    </main>
  );
}
