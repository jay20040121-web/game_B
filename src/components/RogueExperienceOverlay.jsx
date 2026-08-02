import React from 'react';
import { DitheredSprite } from './SpriteRenderer';

export default function RogueExperienceOverlay({ gains }) {
    return <div className='absolute inset-0 z-10 p-3 bg-gradient-to-b from-[#132238] to-[#281537] flex flex-col justify-center gap-2 overflow-hidden'>
        <h2 className='text-center text-[13px] font-black'>隊伍獲得經驗值</h2>
        <p className='text-center text-[9px] opacity-75'>本場經驗平均分給所有隊伍成員</p>
        <div className='overflow-y-auto space-y-1'>{gains.map((gain, index) => <div key={gain.id + '-exp-' + index} className='flex items-center gap-2 p-2 border border-white/20 bg-white/5'>
            <DitheredSprite id={gain.id} scale={0.5} />
            <span className='flex-1 text-[10px] font-black'>{gain.name}</span>
            <span className='text-right text-[9px] text-cyan-200'>+{gain.gained} EXP<br />Lv.{gain.level}{gain.leveledUp ? ' 升級！' : ''}</span>
        </div>)}</div>
        <div className='text-center text-[9px] opacity-70'>[A/B/C] 前往選擇獎勵</div>
    </div>;
}
