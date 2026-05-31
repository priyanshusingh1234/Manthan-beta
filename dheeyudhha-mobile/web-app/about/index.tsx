import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
import { Check } from 'lucide-react-native';
export default function AboutPage() {
  return (
    <View className="min-h-screen bg-white text-gray-900">
      <View className="mx-auto mt-6 max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <View className="max-w-4xl mx-auto animate-fadeIn">
          {/* Page heading */}
          <Text className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-6">
            About Dheeyudha
          </Text>

          {/* Description section */}
          <View className="space-y-6 rounded-2xl shadow-2xl ring-1 ring-black/5 bg-white p-8 animate-slideUp">
            <View>
              <Text className="text-lg text-gray-700 leading-relaxed">
                Dheeyudha is an innovative educational platform that transforms learning into an exciting
                competitive experience. We bring students from different schools together in knowledge
                battles, creating a vibrant community of learners who challenge each other to grow and excel.
              </Text>
            </View>

            <View>
              <Text className="text-gray-600 leading-relaxed">
                Our mission is to make education engaging and fun while fostering healthy competition
                and collaboration. Through Dheeyudha, students don&apos;t just learn—they compete, conquer
                challenges, and celebrate victories together.
              </Text>
            </View>

            {/* Features list */}
            <View className="mt-8">
              <Text className="text-2xl font-bold text-gray-900 mb-4">
                Key Features
              </Text>
              <View className="space-y-4">
                <View className="flex flex-row items-start gap-3">
                  <View className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mt-0.5 flex-row">
                    <Check className="w-5 h-5 text-gray-500" />
                  </View>
                  <View>
                    <Text className="font-semibold text-gray-900">Inter-School Competitions</Text>
                    <Text className="text-gray-600 text-sm">
                      Compete with students from various schools in real-time knowledge battles
                    </Text>
                  </View>
                </View>
                <View className="flex flex-row items-start gap-3">
                  <View className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mt-0.5 flex-row">
                    <Check className="w-5 h-5 text-gray-500" />
                  </View>
                  <View>
                    <Text className="font-semibold text-gray-900">Live Leaderboards</Text>
                    <Text className="text-gray-600 text-sm">
                      Track your progress and see how you rank against peers in real-time
                    </Text>
                  </View>
                </View>
                <View className="flex flex-row items-start gap-3">
                  <View className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mt-0.5 flex-row">
                    <Check className="w-5 h-5 text-gray-500" />
                  </View>
                  <View>
                    <Text className="font-semibold text-gray-900">Diverse Subjects</Text>
                    <Text className="text-gray-600 text-sm">
                      Challenge yourself across multiple subjects and discover your strengths
                    </Text>
                  </View>
                </View>
                <View className="flex flex-row items-start gap-3">
                  <View className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mt-0.5 flex-row">
                    <Check className="w-5 h-5 text-gray-500" />
                  </View>
                  <View>
                    <Text className="font-semibold text-gray-900">Achievement System</Text>
                    <Text className="text-gray-600 text-sm">
                      Earn badges, trophies, and recognition for your accomplishments
                    </Text>
                  </View>
                </View>
                <View className="flex flex-row items-start gap-3">
                  <View className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mt-0.5 flex-row">
                    <Check className="w-5 h-5 text-gray-500" />
                  </View>
                  <View>
                    <Text className="font-semibold text-gray-900">Community Learning</Text>
                    <Text className="text-gray-600 text-sm">
                      Connect with like-minded students and grow together in a supportive environment
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Call to action */}
            <View className="mt-10 pt-8 border-t border-gray-200">
              <Text className="text-center text-gray-700 text-lg">
                Join thousands of students already competing on Dheeyudha!
              </Text>
              <View className="mt-4 flex justify-center flex-row">
                <View className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex-row">
                  Get Started Today
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
