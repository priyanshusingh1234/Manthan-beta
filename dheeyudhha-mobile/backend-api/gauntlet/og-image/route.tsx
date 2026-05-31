import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const chapter   = searchParams.get('chapter')  || 'History';
    const level     = parseInt(searchParams.get('level')   || '1');
    const total     = parseInt(searchParams.get('total')   || '10');
    const username  = searchParams.get('username') || 'A Dheeyudha student';
    const pct       = Math.min(100, Math.round(((level - 1) / total) * 100));

    // Dynamic color based on progress
    let accent  = '#6366f1';
    let bg      = '#0a0f2e';
    let sub     = '#818cf8';
    let badge   = '⚔️';

    if (pct >= 100) { accent = '#22c55e'; bg = '#021c10'; sub = '#4ade80'; badge = '👑'; }
    else if (level >= total) { accent = '#ef4444'; bg = '#1c0204'; sub = '#f87171'; badge = '💀'; }
    else if (pct >= 60) { accent = '#f59e0b'; bg = '#1c0a00'; sub = '#fbbf24'; badge = '🔥'; }

    // Progress arc angle
    const angle = Math.round(pct * 3.6);

    return new ImageResponse(
        (
            <View
                style={{
                    width: '1200px', height: '630px',
                    background: bg,
                    display: 'flex', flexDirection: 'column',
                    padding: '60px', position: 'relative', overflow: 'hidden',
                    fontFamily: 'sans-serif',
                }}
            >
                {/* Background glow orbs */}
                <View style={{
                    position: 'absolute', top: '-100px', right: '-100px',
                    width: '480px', height: '480px', borderRadius: '50%',
                    background: accent, opacity: 0.18, filter: 'blur(100px)',
                }} />
                <View style={{
                    position: 'absolute', bottom: '-80px', left: '-80px',
                    width: '300px', height: '300px', borderRadius: '50%',
                    background: accent, opacity: 0.1, filter: 'blur(80px)',
                }} />

                {/* Header */}
                <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
                    <View style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <View style={{
                            width: '50px', height: '50px', borderRadius: '14px',
                            background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: '24px', fontWeight: 900,
                        }}>D</View>
                        <Text style={{ color: sub, fontSize: '20px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                            Dheeyudha
                        </Text>
                    </View>
                    <Text style={{ color: sub, fontSize: '16px', fontWeight: 600, opacity: 0.7 }}>Chapter Gauntlet</Text>
                </View>

                {/* Main */}
                <View style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '60px' }}>
                    {/* Left */}
                    <View style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <View style={{ fontSize: '22px', color: sub, fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                            {username}
                        </View>
                        <View style={{ fontSize: '64px', fontWeight: 900, color: '#f1f5f9', lineHeight: 1 }}>
                            {badge} {pct >= 100 ? 'Mastered!' : level >= total ? 'Boss Fight!' : `Level ${level}`}
                        </View>
                        <View style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            background: `${accent}25`, borderRadius: '999px',
                            padding: '10px 22px', width: 'fit-content',
                        }}>
                            <Text style={{ color: sub, fontSize: '20px', fontWeight: 700 }}>📚 {chapter}</Text>
                        </View>
                        <View style={{ color: '#94a3b8', fontSize: '20px', fontWeight: 500, marginTop: '8px' }}>
                            {pct >= 100 ? 'All levels completed with mastery!' : `${level - 1} of ${total} levels completed`}
                        </View>
                    </View>

                    {/* Right: progress ring */}
                    <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
                        <View style={{
                            width: '180px', height: '180px', borderRadius: '50%',
                            background: `conic-gradient(${accent} ${angle}deg, #1e293b 0deg)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <View style={{
                                width: '144px', height: '144px', borderRadius: '50%',
                                background: bg,
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Text style={{ color: '#f1f5f9', fontSize: '42px', fontWeight: 900, lineHeight: 1 }}>{pct}%</Text>
                                <Text style={{ color: sub, fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', marginTop: '4px' }}>COMPLETE</Text>
                            </View>
                        </View>

                        <View style={{ display: 'flex', gap: '14px' }}>
                            {[
                                { label: 'Levels Done', val: `${Math.max(0, level - 1)}` },
                                { label: 'Total', val: `${total}` },
                            ].map(({ label, val }) => (
                                <View key={label} style={{
                                    background: `${accent}20`, borderRadius: '14px', padding: '14px 18px',
                                    textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px',
                                }}>
                                    <Text style={{ color: '#f1f5f9', fontSize: '26px', fontWeight: 900 }}>{val}</Text>
                                    <Text style={{ color: sub, fontSize: '11px', fontWeight: 600, opacity: 0.8, textTransform: 'uppercase' }}>{label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={{
                    borderTop: `1px solid ${accent}30`, paddingTop: '20px', marginTop: '24px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <Text style={{ color: sub, fontSize: '14px', opacity: 0.6 }}>#Dheeyudha  #ChapterGauntlet  #StudyGoals</Text>
                    <Text style={{ color: sub, fontSize: '14px', fontWeight: 700, opacity: 0.7 }}>dheeyudha.vercel.app</Text>
                </View>
            </View>
        ),
        { width: 1200, height: 630 }
    );
}
