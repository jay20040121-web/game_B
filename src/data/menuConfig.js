export const createMenuItems = (base, icons) => [
    { id: 'status', sprite: icons.status, label: '狀態(可觀看寵物成長資訊)', img: `${base}assets/BG/M1.png` },
    { id: 'interact', sprite: icons.feed, label: '互動(餵食或撫摸寵物)', img: `${base}assets/BG/M2.png` },
    { id: 'talk', sprite: icons.heart, label: '談心(根據喜好改變寵物特性)', img: `${base}assets/BG/M3.png` },
    { id: 'tournament', sprite: icons.train, label: '聯盟大會(參加錦標賽)', img: `${base}assets/BG/M4.png` },
    { id: 'adventure', sprite: icons.focus, label: '冒險(帶寵物野外探險與捕捉)', img: `${base}assets/BG/M5.png` },
    { id: 'connect', sprite: icons.mail, label: '連線(與陌生寵物對抗、交流)', img: `${base}assets/BG/M6.png` },
    { id: 'pedia', sprite: icons.footprint, label: '圖鑑(查看已收集的像素怪獸)', img: `${base}assets/BG/M7.png` },
    { id: 'info', sprite: icons.info, label: '背包(裝著戰利品與寵物的回憶)', img: `${base}assets/BG/M8.png` },
];
