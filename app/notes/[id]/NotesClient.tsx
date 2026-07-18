'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ArrowLeft, ChevronLeft, ChevronRight, Pen, Eraser, MousePointer2, ZoomIn, ZoomOut, Save, Share2, Loader2, Undo } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import getStroke from 'perfect-freehand';
import Header from '@/components/Header';
import DesktopSidebar from '@/components/DesktopSidebar';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

type Stroke = {
    points: number[][];
    color: string;
    width: number;
};

export default function NotesClient({ post }: { post: any }) {
    const router = useRouter();
    const [session, setSession] = useState<any>(null);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.2);
    const [mode, setMode] = useState<'read' | 'draw' | 'erase'>('read');
    const [color, setColor] = useState('#f43f5e'); // rose-500
    const [strokeWidth, setStrokeWidth] = useState(3);
    
    // Annotations state: pageNum -> Stroke[]
    const [annotations, setAnnotations] = useState<Record<number, Stroke[]>>({});
    const [currentStroke, setCurrentStroke] = useState<number[][]>([]);
    
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fetch initial annotations
    useEffect(() => {
        const fetchSessionAndData = async () => {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            setSession(currentSession);
            if (!currentSession) {
                setIsLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/notes/annotations?postId=${post.id}`, {
                    headers: { Authorization: `Bearer ${currentSession.access_token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.annotations) setAnnotations(data.annotations);
                    if (data.last_read_page) setPageNumber(data.last_read_page);
                }
            } catch (err) {
                console.error("Failed to fetch annotations", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSessionAndData();
    }, [post.id]);

    // Save annotations automatically
    const saveAnnotations = useCallback(async () => {
        if (!session) return;
        setIsSaving(true);
        try {
            await fetch('/api/notes/annotations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    postId: post.id,
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
    }, [session, post.id, annotations, pageNumber]);

    // Debounced save
    useEffect(() => {
        if (isLoading || !session) return;
        const timer = setTimeout(() => {
            saveAnnotations();
        }, 3000);
        return () => clearTimeout(timer);
    }, [annotations, pageNumber, saveAnnotations, isLoading, session]);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
    }

    // Drawing Logic
    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (mode === 'read') return;
        e.target.setPointerCapture(e.pointerId);
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (mode === 'draw') {
            setCurrentStroke([[x, y, e.pressure || 0.5]]);
        } else if (mode === 'erase') {
            eraseAt(x, y);
        }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (mode === 'read') return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (mode === 'draw' && e.buttons === 1) {
            setCurrentStroke(prev => [...prev, [x, y, e.pressure || 0.5]]);
        } else if (mode === 'erase' && e.buttons === 1) {
            eraseAt(x, y);
        }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (mode === 'draw' && currentStroke.length > 0) {
            setAnnotations(prev => {
                const pageAnnos = prev[pageNumber] || [];
                return {
                    ...prev,
                    [pageNumber]: [...pageAnnos, { points: currentStroke, color, width: strokeWidth }]
                };
            });
            setCurrentStroke([]);
        }
    };

    const eraseAt = (x: number, y: number) => {
        setAnnotations(prev => {
            const pageAnnos = prev[pageNumber] || [];
            // Simple bounding box hit detection
            const filtered = pageAnnos.filter(stroke => {
                return !stroke.points.some(pt => {
                    const dx = pt[0] - x;
                    const dy = pt[1] - y;
                    return Math.sqrt(dx*dx + dy*dy) < 20; // 20px erase radius
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

    // Render SVG paths for perfect-freehand
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

    return (
        <div className="flex h-screen overflow-hidden bg-slate-900 text-slate-100">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block w-72 shrink-0 border-r border-slate-800 bg-slate-950">
                <DesktopSidebar />
            </div>

            <div className="flex-1 flex flex-col min-w-0 h-full relative">
                {/* Mobile Topbar */}
                <div className="lg:hidden shrink-0 border-b border-slate-800 bg-slate-950">
                    <Header />
                </div>

                {/* Toolbar */}
                <div className="shrink-0 h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-20 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="font-bold text-sm truncate max-w-[200px] sm:max-w-md">{post.author?.name}'s Note</h1>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                {isSaving ? (
                                    <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Saving...</span>
                                ) : lastSaved ? (
                                    <span className="flex items-center gap-1"><Save className="w-3 h-3" /> Saved {lastSaved.toLocaleTimeString()}</span>
                                ) : (
                                    <span>Sync enabled</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* Tools */}
                        <div className="flex bg-slate-800 p-1 rounded-xl">
                            <button
                                onClick={() => setMode('read')}
                                className={`p-2 rounded-lg transition-colors ${mode === 'read' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                title="Read Mode"
                            >
                                <MousePointer2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setMode('draw')}
                                className={`p-2 rounded-lg transition-colors ${mode === 'draw' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                title="Draw"
                            >
                                <Pen className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setMode('erase')}
                                className={`p-2 rounded-lg transition-colors ${mode === 'erase' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                title="Erase"
                            >
                                <Eraser className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="w-px h-6 bg-slate-800 mx-1"></div>

                        <button onClick={undo} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title="Undo">
                            <Undo className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-2 ml-2">
                            <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"><ZoomOut className="w-4 h-4" /></button>
                            <span className="text-xs font-mono w-10 text-center">{Math.round(scale * 100)}%</span>
                            <button onClick={() => setScale(s => Math.min(3, s + 0.2))} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"><ZoomIn className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>

                {/* Sub-toolbar for colors (if drawing) */}
                <div className={`shrink-0 overflow-hidden transition-all duration-300 ${mode === 'draw' ? 'h-12 border-b border-slate-800' : 'h-0'}`}>
                    <div className="h-12 flex items-center px-6 gap-4 bg-slate-900/50">
                        {['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#000000', '#ffffff'].map(c => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c ? 'scale-125 border-white shadow-md' : 'border-transparent scale-100'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>

                {/* PDF Viewer */}
                <div className="flex-1 overflow-auto bg-slate-950 relative" ref={containerRef}>
                    <div className="min-h-full flex items-center justify-center p-4 sm:p-8">
                        {isLoading ? (
                            <div className="flex flex-col items-center text-slate-500">
                                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                                <p className="font-bold tracking-widest uppercase text-sm">Loading Annotations...</p>
                            </div>
                        ) : (
                            <div className="relative shadow-2xl transition-transform duration-200 origin-top" style={{ transform: `scale(${scale})` }}>
                                <Document
                                    file={post.document_url}
                                    onLoadSuccess={onDocumentLoadSuccess}
                                    loading={
                                        <div className="w-[600px] h-[800px] bg-slate-900 animate-pulse flex items-center justify-center text-slate-500">
                                            Loading PDF...
                                        </div>
                                    }
                                >
                                    <Page 
                                        pageNumber={pageNumber} 
                                        renderTextLayer={mode === 'read'}
                                        renderAnnotationLayer={false}
                                        className="bg-white"
                                    />
                                </Document>

                                {/* Drawing Overlay */}
                                <div className="absolute inset-0 z-10 overflow-hidden touch-none">
                                    <svg className="w-full h-full pointer-events-none">
                                        {activeStrokes.map((stroke, i) => (
                                            <path
                                                key={i}
                                                d={getSvgPathFromStroke(stroke.points, { size: stroke.width, thinning: 0.5, smoothing: 0.5, streamline: 0.5 })}
                                                fill={stroke.color}
                                            />
                                        ))}
                                        {currentStroke.length > 0 && (
                                            <path
                                                d={getSvgPathFromStroke(currentStroke, { size: strokeWidth, thinning: 0.5, smoothing: 0.5, streamline: 0.5 })}
                                                fill={color}
                                            />
                                        )}
                                    </svg>
                                    <canvas
                                        ref={canvasRef}
                                        className={`absolute inset-0 w-full h-full ${mode !== 'read' ? 'cursor-crosshair' : 'pointer-events-none'}`}
                                        onPointerDown={handlePointerDown}
                                        onPointerMove={handlePointerMove}
                                        onPointerUp={handlePointerUp}
                                        onPointerCancel={handlePointerUp}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pagination Footer */}
                <div className="shrink-0 h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-6 z-20">
                    <button
                        disabled={pageNumber <= 1}
                        onClick={() => setPageNumber(p => p - 1)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <span className="font-bold text-sm tracking-widest">
                        PAGE {pageNumber} OF {numPages || '--'}
                    </span>
                    <button
                        disabled={!numPages || pageNumber >= numPages}
                        onClick={() => setPageNumber(p => p + 1)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
}
