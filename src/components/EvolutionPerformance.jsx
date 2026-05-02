import React, { useEffect, useState } from 'react';
import { DitheredSprite } from './SpriteRenderer';
import { MONSTER_NAMES } from '../monsterData';

/**
 * EvolutionPerformance Component
 * A full-screen overlay that plays a dramatic evolution animation.
 */
export default function EvolutionPerformance({ fromId, toId, onFinish }) {
    const [phase, setPhase] = useState('intro'); // intro, transition, revealed, outro
    const fromName = MONSTER_NAMES[String(fromId)] || '???';
    const toName = MONSTER_NAMES[String(toId)] || '???';

    useEffect(() => {
        // Timeline of the performance
        const timer1 = setTimeout(() => setPhase('transition'), 1000);
        const timer2 = setTimeout(() => setPhase('revealed'), 3000);
        const timer3 = setTimeout(() => setPhase('outro'), 5500);
        const timer4 = setTimeout(() => onFinish(), 6500);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            clearTimeout(timer4);
        };
    }, [onFinish]);

    return (
        <div className={`evolution-performance-overlay ${phase}`}>
            <style>{`
                .evolution-performance-overlay {
                    position: absolute;
                    inset: 0;
                    z-index: 20000;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(143,160,126,1) 100%);
                    transition: opacity 0.5s ease-in-out;
                    overflow: hidden;
                }

                .evolution-performance-overlay.intro { opacity: 0; }
                .evolution-performance-overlay.transition { opacity: 1; }
                .evolution-performance-overlay.revealed { background: radial-gradient(circle, #fff 0%, #ffca28 100%); }
                .evolution-performance-overlay.outro { opacity: 0; }

                .evo-title {
                    font-size: 24px;
                    font-weight: 900;
                    color: #1a1a1a;
                    margin-bottom: 20px;
                    text-shadow: 2px 2px 0 rgba(255,255,255,0.5);
                    letter-spacing: 4px;
                    animation: slide-down 0.5s ease-out forwards;
                }

                .sprite-container {
                    position: relative;
                    width: 120px;
                    height: 120px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .sprite-from {
                    position: absolute;
                    transition: all 2s ease-in-out;
                    filter: brightness(1);
                }

                .transition .sprite-from,
                .revealed .sprite-from,
                .outro .sprite-from {
                    filter: brightness(10) blur(2px);
                    transform: scale(1.5);
                    opacity: 0;
                }

                .sprite-to {
                    position: absolute;
                    opacity: 0;
                    transform: scale(0.5);
                    transition: all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                .revealed .sprite-to,
                .outro .sprite-to {
                    opacity: 1;
                    transform: scale(2.5);
                }

                .evo-name-reveal {
                    margin-top: 40px;
                    font-size: 18px;
                    font-weight: bold;
                    color: #1a1a1a;
                    opacity: 0;
                    transform: translateY(20px);
                    transition: all 0.5s ease-out;
                    text-align: center;
                }

                .revealed .evo-name-reveal,
                .outro .evo-name-reveal {
                    opacity: 1;
                    transform: translateY(0);
                }

                .particle-field {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                }

                .particle {
                    position: absolute;
                    background: #fff;
                    border-radius: 50%;
                    animation: float 3s infinite ease-in-out;
                }

                @keyframes slide-down {
                    from { transform: translateY(-50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                @keyframes float {
                    0% { transform: translateY(0) scale(1); opacity: 0; }
                    50% { opacity: 0.8; }
                    100% { transform: translateY(-100px) scale(0); opacity: 0; }
                }

                .flash-bang {
                    position: absolute;
                    inset: 0;
                    background: white;
                    opacity: 0;
                    z-index: 10000;
                    pointer-events: none;
                }

                .transition .flash-bang {
                    animation: flash-anim 0.5s ease-out 1.8s forwards;
                }

                @keyframes flash-anim {
                    0% { opacity: 0; }
                    50% { opacity: 1; }
                    100% { opacity: 0; }
                }
            `}</style>

            <div className="evo-title">EVOLUTION</div>

            <div className="sprite-container">
                <div className="sprite-from">
                    <DitheredSprite id={fromId} scale={2} pure={true} />
                </div>
                <div className="sprite-to">
                    <DitheredSprite id={toId} scale={1} pure={true} />
                </div>
            </div>

            <div className="flash-bang" />

            <div className="evo-name-reveal">
                <div style={{ fontSize: '12px', opacity: 0.6 }}>{fromName} ➜</div>
                <div style={{ fontSize: '24px', color: '#d32f2f' }}>{toName}</div>
            </div>

            <div className="particle-field">
                {[...Array(20)].map((_, i) => (
                    <div 
                        key={i} 
                        className="particle" 
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            width: `${Math.random() * 6 + 2}px`,
                            height: `${Math.random() * 6 + 2}px`,
                            animationDelay: `${Math.random() * 2}s`,
                            backgroundColor: i % 2 === 0 ? '#fff' : '#ffca28'
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
