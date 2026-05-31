import CoopStatusClient from "./CoopStatusClient";

export const dynamic = "force-dynamic";

export default async function CoopPage({ params }: { params: { id: string } }) {
    return (
        <View className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 py-10 px-4 flex flex-col items-center">
            <View className="w-full max-w-2xl">
                <CoopStatusClient challengeId={params.id} />
            </View>
        </View>
    );
}
