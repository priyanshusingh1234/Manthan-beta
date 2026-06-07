import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Modal, ActivityIndicator, Alert, useColorScheme } from 'react-native';
import { ShoppingBag, Star, ChevronLeft, Sparkles, X, CheckCircle2, Eye, Snowflake } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';

interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: string;
  imageUrl?: string;
}

const getBannerSource = (bannerUrl: string | null) => {
  if (!bannerUrl) return null;
  if (bannerUrl.includes('cyberpunk')) return require('../../assets/images/banners/cyberpunk.png');
  if (bannerUrl.includes('library')) return require('../../assets/images/banners/library.png');
  if (bannerUrl.includes('galactic')) return require('../../assets/images/banners/galactic.png');
  if (bannerUrl.startsWith('http')) return { uri: bannerUrl };
  return null;
};

const STORE_ITEMS: StoreItem[] = [
  {
    id: 'streak_freeze',
    name: 'Streak Freeze',
    description: 'Forgot to practice? This automatically protects your streak from breaking for one missed day.',
    type: 'utility',
    price: 200,
  },
  {
    id: 'avatar_glow',
    name: 'Mystic Avatar Glow',
    description: 'Adds a glowing, pulsing aura around your avatar on all profiles.',
    type: 'cosmetic',
    price: 100,
  },
  {
    id: 'banner_cyberpunk',
    name: 'Cyberpunk City Banner',
    description: 'A neon-lit futuristic city background for your public profile.',
    type: 'banner',
    price: 99,
    imageUrl: '/banners/cyberpunk.png'
  },
  {
    id: 'banner_library',
    name: 'Ancient Library Banner',
    description: 'A mystical ancient library background for the true scholar.',
    type: 'banner',
    price: 99,
    imageUrl: '/banners/library.png'
  },
  {
    id: 'banner_galactic',
    name: 'Galactic Arena Banner',
    description: 'A deep space nebula background for your public profile.',
    type: 'banner',
    price: 99,
    imageUrl: '/banners/galactic.png'
  }
];

// Reusable Native Popup Modal
const NativePopup = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', isPurchasing = false, success = false }: any) => {
  const isDark = useColorScheme() === 'dark';
  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={!isPurchasing ? onCancel : undefined}>
      <View className="flex-1 bg-black/60 justify-center items-center p-6">
        <View className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-sm p-6 shadow-2xl items-center">
          {success ? (
            <View className="items-center py-4 w-full">
              <View className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full items-center justify-center mb-4">
                <CheckCircle2 size={32} color="#10b981" />
              </View>
              <Text className="text-xl font-black text-slate-900 dark:text-white mb-2 text-center">{title}</Text>
              <Text className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 text-center">{message}</Text>
              <TouchableOpacity
                onPress={onConfirm}
                className="w-full bg-slate-900 dark:bg-white py-4 rounded-2xl items-center active:scale-95"
              >
                <Text className="text-white dark:text-slate-900 font-bold text-[15px]">Awesome!</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="items-center w-full relative">
              {!isPurchasing && (
                <TouchableOpacity onPress={onCancel} className="absolute right-0 top-0 p-2 bg-slate-100 dark:bg-slate-800 rounded-full z-10">
                  <X size={16} color={isDark ? "#cbd5e1" : "#64748b"} />
                </TouchableOpacity>
              )}
              <Text className="text-xl font-black text-slate-900 dark:text-white mb-2 mt-4 text-center">{title}</Text>
              <Text className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 text-center px-4">{message}</Text>
              
              <View className="flex-row gap-3 w-full">
                <TouchableOpacity
                  onPress={onCancel}
                  disabled={isPurchasing}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 py-4 rounded-2xl items-center active:opacity-70"
                >
                  <Text className="text-slate-700 dark:text-slate-300 font-bold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onConfirm}
                  disabled={isPurchasing}
                  className={`flex-1 bg-indigo-600 py-4 rounded-2xl items-center flex-row justify-center gap-2 active:opacity-70 ${isPurchasing ? 'opacity-70' : ''}`}
                >
                  {isPurchasing ? (
                    <>
                      <ActivityIndicator color="white" size="small" />
                      <Text className="text-white font-bold">Processing...</Text>
                    </>
                  ) : (
                    <Text className="text-white font-bold">{confirmText}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

// Reusable Profile Preview Modal
const ProfilePreviewModal = ({ isOpen, onClose, item, userProfile }: any) => {
  if (!isOpen || !item || !userProfile) return null;
  const isGlow = item.id === 'avatar_glow';
  const isBanner = item.type === 'banner';
  const bannerUrl = isBanner ? item.imageUrl : userProfile.banner_url;

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/80 justify-center p-6">
        <TouchableOpacity onPress={onClose} className="absolute right-6 top-16 p-3 bg-white/20 rounded-full z-20">
          <X size={20} color="white" />
        </TouchableOpacity>
        
        <View className="w-full bg-slate-100 dark:bg-slate-950 rounded-[40px] overflow-hidden shadow-2xl relative">
          {/* Banner */}
          <View className="h-40 w-full bg-slate-800 relative">
            {bannerUrl ? (
              <Image source={getBannerSource(bannerUrl)} className="w-full h-full opacity-90" resizeMode="cover" />
            ) : (
              <View className="absolute inset-0 bg-indigo-500 opacity-90" />
            )}
          </View>
          
          {/* Header Card */}
          <View className="bg-white dark:bg-slate-900 rounded-t-[40px] -mt-10 p-6 items-center border-t border-slate-100 dark:border-slate-800 z-10">
            <View className="relative">
              <View 
                className={`w-24 h-24 rounded-full -mt-12 bg-slate-100 dark:bg-slate-800 border-4 ${isGlow ? 'border-indigo-400' : 'border-white dark:border-slate-900'} overflow-hidden justify-center items-center`}
                style={isGlow ? {
                  shadowColor: '#6366f1',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 15,
                  elevation: 10,
                } : { shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }}
              >
                {userProfile.avatar_url ? (
                  <Image source={{ uri: userProfile.avatar_url }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <Text className="text-3xl font-bold text-indigo-500 dark:text-indigo-400">
                    {String(userProfile.full_name?.[0] || 'S').toUpperCase()}
                  </Text>
                )}
              </View>
            </View>
            
            <View className="mt-3 items-center">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-2xl font-black text-slate-900 dark:text-white">
                  {userProfile.full_name || 'Student'}
                </Text>
                <CheckCircle2 size={20} color="#6366f1" />
              </View>
              <Text className="text-indigo-500 font-medium">@{userProfile.username || 'student'}</Text>
            </View>
            
            <View className="mt-6 flex-row items-center justify-center">
              <View className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl flex-row items-center gap-2">
                <Star size={16} color="#f59e0b" fill="#f59e0b" />
                <Text className="font-bold text-slate-600 dark:text-slate-300">
                  {userProfile.total_points?.toLocaleString() || 0} pts
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        <Text className="text-white/70 font-medium text-sm text-center mt-6">This is how your public profile will look to others.</Text>
      </View>
    </Modal>
  );
};

export default function StoreScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  
  const [points, setPoints] = useState<number>(0);
  const [cosmetics, setCosmetics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [previewItem, setPreviewItem] = useState<StoreItem | null>(null);
  const [streakFreezes, setStreakFreezes] = useState<number>(0);
  
  const [dialogState, setDialogState] = useState<{isOpen: boolean, item: StoreItem | null, isSuccess: boolean, message: string}>({
    isOpen: false,
    item: null,
    isSuccess: false,
    message: ''
  });

  useEffect(() => {
    const fetchPoints = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data } = await supabase.from('profiles').select('total_points, full_name, username, avatar_url').eq('id', session.user.id).single();
        if (data) {
          setPoints(data.total_points || 0);
          
          const { data: userData } = await supabase.auth.getUser();
          const meta = userData?.user?.user_metadata || {};
          
          setUserProfile({
            ...data,
            banner_url: meta.banner_url || null
          });
          
          if (meta.cosmetics) setCosmetics(meta.cosmetics);
          if (meta.streakFreezes) setStreakFreezes(Number(meta.streakFreezes) || 0);
        }
      }
      setLoading(false);
    };
    fetchPoints();
  }, []);

  const triggerBuyDialog = (item: StoreItem) => {
    if (cosmetics.includes(item.id)) return;
    if (points < item.price) {
      setDialogState({
        isOpen: true,
        item,
        isSuccess: false,
        message: "Not enough points! Keep battling to earn more."
      });
      return;
    }
    
    setDialogState({
      isOpen: true,
      item,
      isSuccess: false,
      message: `Do you want to unlock ${item.name} for ${item.price} points?`
    });
  };

  const executePurchase = async () => {
    const item = dialogState.item;
    if (!item) return;

    if (points < item.price) {
      setDialogState(prev => ({...prev, isOpen: false, item: null}));
      return;
    }

    setPurchasing(item.id);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
      
      const res = await fetch(`${apiUrl}/api/store/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ itemId: item.id, price: item.price })
      });

      const data = await res.json();
      if (data.success) {
        setPoints(data.newPoints);
        setCosmetics(data.cosmetics);
        if (data.streakFreezes !== undefined) setStreakFreezes(data.streakFreezes);
        
        setDialogState({
          isOpen: true,
          item,
          isSuccess: true,
          message: item.id === 'streak_freeze' ? "Successfully purchased! Your streak is now protected." : "Successfully purchased! You can view it in your profile."
        });
      } else {
        setDialogState({
          isOpen: true,
          item,
          isSuccess: false,
          message: data.error || 'Purchase failed.'
        });
      }
    } catch (e) {
      setDialogState({
        isOpen: true,
        item,
        isSuccess: false,
        message: 'Something went wrong. Please check your connection.'
      });
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <NativePopup 
        isOpen={dialogState.isOpen}
        title={dialogState.isSuccess ? 'Success!' : (points < (dialogState.item?.price||0) ? 'Not Enough Points' : 'Confirm Purchase')}
        message={dialogState.message}
        isPurchasing={!!purchasing}
        success={dialogState.isSuccess}
        confirmText={`Pay ${dialogState.item?.price||0} Pts`}
        onConfirm={dialogState.isSuccess || points < (dialogState.item?.price||0) ? () => setDialogState(prev => ({...prev, isOpen: false})) : executePurchase}
        onCancel={() => setDialogState(prev => ({...prev, isOpen: false}))}
      />

      <ProfilePreviewModal 
        isOpen={!!previewItem} 
        onClose={() => setPreviewItem(null)} 
        item={previewItem} 
        userProfile={userProfile} 
      />

      <View className="flex-row items-center justify-between px-6 py-4 pt-12 shrink-0">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm"
        >
          <ChevronLeft size={24} color={isDark ? "white" : "#1e293b"} />
        </TouchableOpacity>
        <View className="flex-row items-center gap-2">
          <Text className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Points Store</Text>
          <ShoppingBag size={20} color="#6366f1" />
        </View>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* Balance Card */}
        <View className="bg-indigo-600 rounded-[40px] p-8 shadow-sm mb-8 mt-2 items-center overflow-hidden">
          <View className="bg-black/20 px-4 py-1.5 rounded-full mb-3">
            <Text className="text-indigo-100 font-bold uppercase tracking-widest text-[11px]">Your Balance</Text>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="white" className="my-2" />
          ) : (
            <View className="flex-row items-center gap-2 mb-2">
              <Star size={40} color="#fcd34d" fill="#fcd34d" />
              <Text className="text-[56px] font-black text-white tracking-tighter">{points.toLocaleString()}</Text>
            </View>
          )}
          <Text className="text-indigo-100 text-sm font-medium mt-1">Ready to upgrade your profile?</Text>
        </View>

        {/* Categories Header */}
        <View className="flex-row items-center justify-between mb-5 ml-2">
          <View className="flex-row items-center gap-2">
            <Sparkles size={20} color="#6366f1" />
            <Text className="text-lg font-black text-slate-900 dark:text-white">Store Items</Text>
          </View>
          {streakFreezes > 0 && (
            <View className="px-3 py-1.5 bg-cyan-100 dark:bg-cyan-900/40 rounded-xl flex-row items-center gap-1.5">
              <Snowflake size={14} color={isDark ? "#67e8f9" : "#0891b2"} fill={isDark ? "#67e8f9" : "#0891b2"} />
              <Text className="text-cyan-700 dark:text-cyan-300 font-bold text-xs">{streakFreezes} Owned</Text>
            </View>
          )}
        </View>

        {/* Items List */}
        <View className="gap-5">
          {STORE_ITEMS.map(item => {
            const isEquipped = cosmetics.includes(item.id);
            const canAfford = points >= item.price;

            return (
              <View 
                key={item.id} 
                className={`bg-white dark:bg-slate-900 rounded-[32px] p-5 border-2 shadow-sm flex-row items-center gap-4 ${isEquipped ? 'border-emerald-500/50' : 'border-slate-100 dark:border-slate-800/80'}`}
              >
                {/* Image/Icon */}
                {item.type === 'banner' ? (
                  <View className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <Image source={getBannerSource(item.imageUrl || null)} className="w-full h-full" resizeMode="cover" />
                  </View>
                ) : item.type === 'utility' ? (
                  <View className="w-20 h-20 rounded-2xl bg-cyan-100 dark:bg-cyan-900/40 items-center justify-center">
                    <Snowflake size={40} color="#0891b2" fill="#0891b2" />
                  </View>
                ) : (
                  <View className="w-20 h-20 rounded-full border-4 border-indigo-400 items-center justify-center bg-slate-100 dark:bg-slate-800">
                    <Text className="text-3xl font-bold text-indigo-400">✨</Text>
                  </View>
                )}

                {/* Content */}
                <View className="flex-1">
                  <Text className="font-black text-slate-900 dark:text-white text-[17px] mb-1">{item.name}</Text>
                  <Text className="text-[12px] text-slate-500 dark:text-slate-400 font-medium leading-tight mb-3" numberOfLines={2}>
                    {item.description}
                  </Text>
                  
                  <View className="flex-row gap-2">
                    {item.type !== 'utility' && (
                      <TouchableOpacity
                        onPress={() => setPreviewItem(item)}
                        className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center border border-slate-200 dark:border-slate-700"
                      >
                        <Eye size={18} color={isDark ? "#cbd5e1" : "#475569"} />
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity
                      onPress={() => triggerBuyDialog(item)}
                      disabled={purchasing === item.id || isEquipped}
                      className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5 ${
                        isEquipped 
                          ? 'bg-emerald-50 dark:bg-emerald-900/20' 
                          : canAfford 
                            ? 'bg-slate-900 dark:bg-white' 
                            : 'bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      {isEquipped ? (
                        <>
                          <CheckCircle2 size={16} color={isDark ? "#34d399" : "#059669"} />
                          <Text className="font-black text-[13px] text-emerald-600 dark:text-emerald-400">Equipped</Text>
                        </>
                      ) : (
                        <>
                          <Star size={14} color={canAfford ? (isDark ? "#0f172a" : "white") : "#94a3b8"} fill={canAfford ? (isDark ? "#0f172a" : "white") : "#94a3b8"} />
                          <Text className={`font-black text-[13px] ${canAfford ? (isDark ? "text-slate-900" : "text-white") : "text-slate-400 dark:text-slate-500"}`}>
                            {item.price.toLocaleString()} Pts
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

      </ScrollView>
    </View>
  );
}
