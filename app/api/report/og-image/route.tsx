import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const COLORS: Record<string, { bg: string; accent: string; text: string; sub: string }> = {
    purple: { bg: '#0f0a1e', accent: '#9333ea', text: '#f3e8ff', sub: '#c084fc' },
    green:  { bg: '#021c10', accent: '#16a34a', text: '#d1fae5', sub: '#4ade80' },
    blue:   { bg: '#0a0f2e', accent: '#4f46e5', text: '#e0e7ff', sub: '#818cf8' },
    orange: { bg: '#1c0c00', accent: '#ea580c', text: '#fff7ed', sub: '#fb923c' },
    red:    { bg: '#1c0204', accent: '#dc2626', text: '#fee2e2', sub: '#f87171' },
    slate:  { bg: '#0f172a', accent: '#6366f1', text: '#f1f5f9', sub: '#94a3b8' },
};

const EMOJI: Record<string, string> = {
    Excellent: '🔥', 'Very Good': '⚡', Good: '💪', 'Not Bad': '🚀', Poor: '💡',
};

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const rating   = searchParams.get('rating')  || 'Good';
    const score    = searchParams.get('score')   || '0';
    const accuracy = searchParams.get('accuracy')|| '0';
    const days     = searchParams.get('days')    || '0';
    const correct  = searchParams.get('correct') || '0';
    const total    = searchParams.get('total')   || '0';
    const subject  = searchParams.get('subject') || '';
    const color    = searchParams.get('color')   || 'blue';

    const c = COLORS[color] ?? COLORS.blue;
    const emoji = EMOJI[rating] ?? '📊';

    return new ImageResponse(
        (
            <div
                style={{
                    width: '1200px', height: '630px',
                    background: c.bg,
                    display: 'flex', flexDirection: 'column',
                    padding: '60px', position: 'relative', overflow: 'hidden',
                    fontFamily: 'sans-serif',
                }}
            >
                {/* Background glow */}
                <div style={{
                    position: 'absolute', top: '-120px', right: '-120px',
                    width: '500px', height: '500px', borderRadius: '50%',
                    background: c.accent, opacity: 0.18, filter: 'blur(100px)',
                }} />
                <div style={{
                    position: 'absolute', bottom: '-80px', left: '-80px',
                    width: '350px', height: '350px', borderRadius: '50%',
                    background: c.accent, opacity: 0.1, filter: 'blur(80px)',
                }} />

                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '48px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '14px',
                            background: c.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: '22px', fontWeight: 900,
                        }}>D</div>
                        <span style={{ color: c.sub, fontSize: '18px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                            Dheeyudha
                        </span>
                    </div>
                    <span style={{ color: c.sub, fontSize: '16px', fontWeight: 600, opacity: 0.7 }}>Weekly Report Card</span>
                </div>

                {/* Main content row */}
                <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '60px' }}>
                    {/* Left: Rating */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ fontSize: '72px', fontWeight: 900, color: c.text, lineHeight: 1 }}>
                            {emoji} {rating}
                        </div>
                        <div style={{ fontSize: '22px', color: c.sub, fontWeight: 500, opacity: 0.9 }}>
                            {correct} of {total} questions answered correctly
                        </div>
                        {subject && (
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '8px',
                                background: `${c.accent}30`, borderRadius: '999px',
                                padding: '8px 20px', width: 'fit-content', marginTop: '8px',
                            }}>
                                <span style={{ color: c.sub, fontSize: '18px', fontWeight: 700 }}>📚 {subject}</span>
                            </div>
                        )}
                    </div>

                    {/* Right: Score circle + stats */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
                        {/* Score ring mockup */}
                        <div style={{
                            width: '160px', height: '160px', borderRadius: '50%',
                            background: `conic-gradient(${c.accent} ${parseInt(score) * 3.6}deg, #1e293b 0deg)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            position: 'relative',
                        }}>
                            <div style={{
                                width: '128px', height: '128px', borderRadius: '50%',
                                background: c.bg,
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <span style={{ color: c.text, fontSize: '36px', fontWeight: 900, lineHeight: 1 }}>{score}</span>
                                <span style={{ color: c.sub, fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em' }}>/100</span>
                            </div>
                        </div>

                        {/* Mini stats */}
                        <div style={{ display: 'flex', gap: '16px' }}>
                            {[
                                { label: 'Accuracy', val: `${accuracy}%` },
                                { label: 'Active Days', val: days },
                            ].map(({ label, val }) => (
                                <div key={label} style={{
                                    background: `${c.accent}20`, borderRadius: '16px', padding: '16px 20px',
                                    textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px',
                                }}>
                                    <span style={{ color: c.text, fontSize: '24px', fontWeight: 900 }}>{val}</span>
                                    <span style={{ color: c.sub, fontSize: '12px', fontWeight: 600, opacity: 0.8, textTransform: 'uppercase' }}>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    borderTop: `1px solid ${c.accent}30`, paddingTop: '20px', marginTop: '24px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <span style={{ color: c.sub, fontSize: '14px', opacity: 0.6 }}>#Dheeyudha  #WeeklyReport  #StudyGoals</span>
                    <span style={{ color: c.sub, fontSize: '14px', fontWeight: 700, opacity: 0.6 }}>dheeyudha.app</span>
                </div>
            </div>
        ),
        { width: 1200, height: 630 }
    );
}
