const AILMENT_BADGE_META = {
    burn: { label: '燒', className: 'bg-[#ff5252] text-white' },
    paralysis: { label: '麻', className: 'bg-[#ffca28] text-black' },
    poison: { label: '毒', className: 'bg-[#9c27b0] text-white' },
    confusion: { label: '混', className: 'bg-[#7e57c2] text-white' },
    'leech-seed': { label: '吸', className: 'bg-[#4db6ac] text-white' },
    trap: { label: '縛', className: 'bg-[#26a69a] text-white' },
    freeze: { label: '凍', className: 'bg-[#80deea] text-black' },
    sleep: { label: '眠', className: 'bg-[#90a4ae] text-white' },
    lifesteal: { label: '血', className: 'bg-[#e91e63] text-white' },
    accuracy: { label: '準', className: 'bg-[#2196f3] text-white' },
    priority: { label: '先', className: 'bg-[#ff9800] text-white' }
};

const COMPOSITE_BADGE_STYLE = {
    backgroundImage: 'linear-gradient(135deg, #ff5252 0%, #ffca28 24%, #66bb6a 48%, #42a5f5 72%, #ab47bc 100%)',
    color: '#fff',
    boxShadow: '0 0 0 1px rgba(0,0,0,0.18), 1px 1px 0 rgba(17,17,17,0.35)'
};

export const getAilmentLabel = (ailment) => AILMENT_BADGE_META[ailment]?.label || '狀';

export const getAilmentClassName = (ailment) => AILMENT_BADGE_META[ailment]?.className || 'bg-[#4db6ac] text-white';

export const buildAilmentBadges = ({
    primaryAilment,
    enchantData = {},
    threshold = 4,
    baseClassName = ''
}) => {
    const ailmentsToShow = [];

    if (primaryAilment && primaryAilment !== 'none') {
        ailmentsToShow.push(primaryAilment);
    }

    Object.keys(enchantData).forEach((key) => {
        if ((enchantData[key] || 0) > 0 && !ailmentsToShow.includes(key)) {
            ailmentsToShow.push(key);
        }
    });

    if (ailmentsToShow.length >= threshold) {
        return [{
            key: 'composite',
            label: '複合',
            title: ailmentsToShow.map(getAilmentLabel).join(' / '),
            className: `${baseClassName} border border-black/20 text-white font-black`.trim(),
            style: COMPOSITE_BADGE_STYLE
        }];
    }

    return ailmentsToShow.map((ailment) => {
        const meta = AILMENT_BADGE_META[ailment] || { label: getAilmentLabel(ailment), className: 'bg-[#4db6ac] text-white' };
        return {
            key: ailment,
            label: meta.label,
            title: getAilmentLabel(ailment),
            className: `${baseClassName} ${meta.className}`.trim()
        };
    });
};
