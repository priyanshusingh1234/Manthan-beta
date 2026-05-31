import TeacherApplyForm from '@/components/TeacherApplyForm';

export const metadata = {
  title: 'Register as teacher — Dheeyudha',
};

export default function TeacherApplyPage() {
  return (
    <View className="min-h-screen flex items-center justify-center py-12 px-4 lg:px-8 bg-slate-50 flex-row">
      <View className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-8">
        <View className="mb-6">
          <Text className="text-2xl font-extrabold">Register as a teacher</Text>
          <Text className="text-sm text-slate-500 mt-2">Tell us about your subject expertise and school — we'll review and contact you.</Text>
        </View>
        <TeacherApplyForm />
      </View>
    </View>
  );
}
