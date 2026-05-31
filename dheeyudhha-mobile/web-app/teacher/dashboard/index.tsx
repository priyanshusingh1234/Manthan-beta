import TeacherApplicationsList from '@/components/TeacherApplicationsList';

export const metadata = {
  title: 'Teacher applications — Dheeyudha',
};

export default function TeacherDashboardPage() {
  return (
    <View className="min-h-screen p-8 bg-slate-50">
      <View className="max-w-5xl mx-auto">
        <View className="flex items-center justify-between mb-6 flex-row">
          <View>
            <Text className="text-2xl font-extrabold">Teacher requests</Text>
            <Text className="text-sm text-slate-500">Approve or reject incoming teacher applications.</Text>
          </View>
        </View>

        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <TeacherApplicationsList />
        </View>
      </View>
    </View>
  );
}
