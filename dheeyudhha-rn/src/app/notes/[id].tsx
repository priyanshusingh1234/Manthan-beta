import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Dimensions, PanResponder, Alert, StatusBar, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, PenTool, Eraser, MousePointer2, ChevronLeft, ChevronRight, Undo } from 'lucide-react-native';
import Pdf from 'react-native-pdf';
import Svg, { Path } from 'react-native-svg';
import getStroke from 'perfect-freehand';
import { supabase } from '@/lib/supabaseClient';
import { useColorScheme } from 'nativewind';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Stroke = {
  points: number[][];
  color: string;
  width: number;
};

export default function NotesScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const [post, setPost] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [mode, setMode] = useState<'read' | 'draw' | 'erase'>('read');
  const [color, setColor] = useState('#f43f5e'); // rose-500
  const [strokeWidth, setStrokeWidth] = useState(3);
  
  const [annotations, setAnnotations] = useState<Record<number, Stroke[]>>({});
  const [currentStroke, setCurrentStroke] = useState<number[][]>([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      try {
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
        
        // Fetch post details via API to get correctly joined author data
        const postRes = await fetch(`${API_URL}/api/posts/${id}`, {
          headers: currentSession ? { Authorization: `Bearer ${currentSession.access_token}` } : {}
        });
        
        if (!postRes.ok) throw new Error("Post not found");
        const postData = await postRes.json();
        
        setPost(postData);

        if (!currentSession) {
          setIsLoading(false);
          return;
        }

        const res = await fetch(`${API_URL}/api/notes/annotations?postId=${id}`, {
          headers: { Authorization: `Bearer ${currentSession.access_token}` }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.annotations) setAnnotations(data.annotations);
          if (data.last_read_page) setPageNumber(data.last_read_page);
        }
      } catch (err: any) {
        console.error("Failed to fetch data", err);
        setError(err.message || "Failed to load note.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const saveAnnotations = useCallback(async () => {
    if (!session || !id) return;
    setIsSaving(true);
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
      await fetch(`${API_URL}/api/notes/annotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          postId: id,
          annotations,
          last_read_page: pageNumber
        })
      });
      setLastSaved(new Date());
    } catch (err) {
      console.error("Failed to save", err);
    } finally {
      setIsSaving(false);
    }
  }, [session, id, annotations, pageNumber]);

  useEffect(() => {
    if (isLoading || !session) return;
    const timer = setTimeout(() => {
      saveAnnotations();
    }, 3000);
    return () => clearTimeout(timer);
  }, [annotations, pageNumber, saveAnnotations, isLoading, session]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => mode !== 'read',
      onMoveShouldSetPanResponder: () => mode !== 'read',
      onPanResponderGrant: (e, gestureState) => {
        if (mode === 'draw') {
          setCurrentStroke([[gestureState.x0, gestureState.y0 - insets.top, 0.5]]); 
        } else if (mode === 'erase') {
          eraseAt(gestureState.x0, gestureState.y0 - insets.top);
        }
      },
      onPanResponderMove: (e, gestureState) => {
        const x = gestureState.moveX;
        const y = gestureState.moveY - insets.top; 
        if (mode === 'draw') {
          setCurrentStroke(prev => [...prev, [x, y, 0.5]]);
        } else if (mode === 'erase') {
          eraseAt(x, y);
        }
      },
      onPanResponderRelease: () => {
        if (mode === 'draw') {
          setCurrentStroke(prev => {
            if (prev.length > 0) {
              setAnnotations(currentAnn => {
                const pageAnnos = currentAnn[pageNumber] || [];
                return {
                  ...currentAnn,
                  [pageNumber]: [...pageAnnos, { points: prev, color, width: strokeWidth }]
                };
              });
            }
            return [];
          });
        }
      },
    })
  ).current;

  const eraseAt = (x: number, y: number) => {
    setAnnotations(prev => {
      const pageAnnos = prev[pageNumber] || [];
      const filtered = pageAnnos.filter(stroke => {
        return !stroke.points.some(pt => {
          const dx = pt[0] - x;
          const dy = pt[1] - y;
          return Math.sqrt(dx*dx + dy*dy) < 25; 
        });
      });
      return { ...prev, [pageNumber]: filtered };
    });
  };

  const undo = () => {
    setAnnotations(prev => {
      const pageAnnos = prev[pageNumber] || [];
      if (pageAnnos.length === 0) return prev;
      return {
        ...prev,
        [pageNumber]: pageAnnos.slice(0, -1)
      };
    });
  };

  const getSvgPathFromStroke = (stroke: number[][], options: any) => {
    if (!stroke.length) return "";
    const d = getStroke(stroke, options);
    if (!d || !d.length) return "";
    const d0 = d[0];
    const pathData = d.slice(1).reduce(
      (acc, [x0, y0], i, arr) => {
        const [x1, y1] = arr[(i + 1) % arr.length];
        acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
        return acc;
      },
      ["M", d0[0], d0[1], "Q"]
    );
    pathData.push("Z");
    return pathData.join(" ");
  };

  const activeStrokes = annotations[pageNumber] || [];
  const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#000000', '#ffffff'];

  if (error) {
    return (
      <View className="flex-1 bg-white dark:bg-[#09090b] items-center justify-center px-6">
        <Text className="mt-6 text-rose-500 font-bold tracking-wider text-sm text-center">{error}</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-6 px-6 py-3 bg-slate-100 dark:bg-slate-800 rounded-full shadow-sm">
          <Text className="text-slate-900 dark:text-white font-semibold text-xs uppercase tracking-[0.2em]">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading || !post) {
    return (
      <View className="flex-1 bg-white dark:bg-[#09090b] items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="mt-6 text-slate-400 font-bold tracking-[0.2em] uppercase text-xs">Loading Note</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#f8fafc] dark:bg-[#09090b]">
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <View className="absolute inset-0 z-0 pt-20">
        <Pdf
          trustAllCerts={false}
          source={{ uri: post.document_url || post.documentUrl, cache: true }}
          onLoadComplete={(numberOfPages) => setNumPages(numberOfPages)}
          onPageChanged={(page) => setPageNumber(page)}
          onError={(error) => {
            console.error("PDF Load Error:", error);
            Alert.alert("PDF Error", `Failed to load document: ${error}`);
          }}
          page={pageNumber}
          scale={scale}
          minScale={0.5}
          maxScale={3.0}
          singlePage={true}
          enablePaging={mode === 'read'}
          style={{
            flex: 1,
            width: SCREEN_WIDTH,
            backgroundColor: 'transparent'
          }}
        />

        {/* Drawing Overlay inside the exact container */}
        <View 
          className="absolute inset-0" 
          pointerEvents={mode === 'read' ? 'none' : 'auto'}
          {...panResponder.panHandlers}
        >
          <Svg style={{ width: '100%', height: '100%' }}>
            {activeStrokes.map((stroke, i) => (
              <Path
                key={i}
                d={getSvgPathFromStroke(stroke.points, { size: stroke.width, thinning: 0.5, smoothing: 0.5, streamline: 0.5 })}
                fill={stroke.color}
              />
            ))}
            {currentStroke.length > 0 && (
              <Path
                d={getSvgPathFromStroke(currentStroke, { size: strokeWidth, thinning: 0.5, smoothing: 0.5, streamline: 0.5 })}
                fill={color}
              />
            )}
          </Svg>
        </View>
      </View>

      {/* Floating Header */}
      <View 
        className="absolute top-0 left-0 right-0 z-20 flex-row items-center px-4 pb-4 bg-white/95 dark:bg-[#09090b]/95 border-b border-slate-200/50 dark:border-white/5"
        style={{ paddingTop: Math.max(insets.top, 20) }}
      >
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-10 h-10 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10"
        >
          <ArrowLeft size={20} color={isDark ? "#fff" : "#0f172a"} />
        </TouchableOpacity>

        <View className="flex-1 ml-4 justify-center">
          <Text className="font-black text-[16px] text-slate-900 dark:text-white tracking-tight" numberOfLines={1}>
            {post.author?.name || 'Scholar'}'s Note
          </Text>
          <View className="flex-row items-center mt-0.5">
            {isSaving ? (
              <Text className="text-[11px] text-indigo-500 font-bold uppercase tracking-wider">Saving...</Text>
            ) : (
              <Text className="text-[11px] text-emerald-500 font-bold uppercase tracking-wider">Saved & Synced</Text>
            )}
          </View>
        </View>

        {/* Floating Tools Control */}
        <View className="flex-row items-center bg-slate-100 dark:bg-white/5 rounded-2xl p-1.5 ml-2 border border-slate-200/50 dark:border-white/10">
          <TouchableOpacity 
            onPress={() => setMode('read')}
            className={`p-2 rounded-xl ${mode === 'read' ? 'bg-white dark:bg-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-none' : ''}`}
          >
            <MousePointer2 size={18} color={mode === 'read' ? (isDark ? '#fff' : '#0f172a') : (isDark ? '#94a3b8' : '#64748b')} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setMode('draw')}
            className={`p-2 rounded-xl mx-1 ${mode === 'draw' ? 'bg-white dark:bg-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-none' : ''}`}
          >
            <PenTool size={18} color={mode === 'draw' ? (isDark ? '#fff' : '#0f172a') : (isDark ? '#94a3b8' : '#64748b')} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setMode('erase')}
            className={`p-2 rounded-xl ${mode === 'erase' ? 'bg-white dark:bg-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-none' : ''}`}
          >
            <Eraser size={18} color={mode === 'erase' ? (isDark ? '#fff' : '#0f172a') : (isDark ? '#94a3b8' : '#64748b')} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={undo} className="w-10 h-10 ml-3 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5">
          <Undo size={18} color={isDark ? "#94a3b8" : "#64748b"} />
        </TouchableOpacity>
      </View>

      {/* Floating Color Palette (Only when drawing) */}
      {mode === 'draw' && (
        <View className="absolute top-[105px] left-1/2 -translate-x-1/2 z-20 flex-row items-center bg-white/95 dark:bg-[#18181b]/95 p-2 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-slate-200/50 dark:border-white/10">
          {colors.map(c => (
            <TouchableOpacity 
              key={c}
              onPress={() => setColor(c)}
              className="p-1"
            >
              <View 
                className={`w-7 h-7 rounded-full border-2 items-center justify-center ${color === c ? 'border-slate-300 dark:border-slate-600 scale-110' : 'border-transparent scale-100'}`}
              >
                <View style={{ backgroundColor: c }} className="w-6 h-6 rounded-full shadow-sm" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Floating Premium Pagination Pill */}
      <View 
        className="absolute left-1/2 -translate-x-1/2 z-20 flex-row items-center bg-white/90 dark:bg-[#18181b]/90 rounded-full p-2 shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-200/50 dark:border-white/10"
        style={{ bottom: Math.max(insets.bottom, 24) }}
      >
        <TouchableOpacity 
          disabled={pageNumber <= 1}
          onPress={() => setPageNumber(p => p - 1)}
          className={`w-10 h-10 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 mr-4 ${pageNumber <= 1 ? 'opacity-30' : ''}`}
        >
          <ChevronLeft size={20} color={isDark ? "#fff" : "#0f172a"} />
        </TouchableOpacity>
        
        <Text className="font-black text-xs tracking-[0.2em] text-slate-700 dark:text-white uppercase">
          {pageNumber} / {numPages || '-'}
        </Text>
        
        <TouchableOpacity 
          disabled={!numPages || pageNumber >= numPages}
          onPress={() => setPageNumber(p => p + 1)}
          className={`w-10 h-10 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 ml-4 ${!numPages || pageNumber >= numPages ? 'opacity-30' : ''}`}
        >
          <ChevronRight size={20} color={isDark ? "#fff" : "#0f172a"} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
