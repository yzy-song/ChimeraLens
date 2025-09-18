export interface Template {
  id: string;
  name: string;
  style: string;
  imageUrl: string;
}

export const TEMPLATES_DATA: Template[] = [
  // --- 赛博朋克风格 (Cyberpunk) ---
  {
    id: 'cyberpunk-001',
    name: '机械义体黑客',
    style: '赛博朋克',
    imageUrl:
      'https://res.cloudinary.com/deaxv6w30/image/upload/v1758207264/Gemini_Generated_Image_yslyeayslyeaysly_yopnmr.png',
  },
  {
    id: 'cyberpunk-002',
    name: '霓虹都市魅影',
    style: '赛博朋克',
    imageUrl:
      'https://res.cloudinary.com/deaxv6w30/image/upload/v1758207263/Gemini_Generated_Image_fledi1fledi1fled_qcftm8.png', // 待填充
  },

  // --- 幻想骑士风 (Fantasy Knight) ---
  {
    id: 'fantasy-001',
    name: '银甲圣殿骑士',
    style: '幻想骑士',
    imageUrl:
      'https://res.cloudinary.com/deaxv6w30/image/upload/v1758207266/Gemini_Generated_Image_6u2ns36u2ns36u2n_tzeq2g.png', // 待填充
  },
  {
    id: 'fantasy-002',
    name: '精灵森林射手',
    style: '幻想骑士',
    imageUrl:
      'https://res.cloudinary.com/deaxv6w30/image/upload/v1758208564/Gemini_Generated_Image_py2uuxpy2uuxpy2u_fp2vdd.png', // 待填充
  },

  // --- 黑白电影侦探风 (Film Noir) ---
  {
    id: 'film-noir-001',
    name: '迷雾都市侦探',
    style: '黑白电影',
    imageUrl:
      'https://res.cloudinary.com/deaxv6w30/image/upload/v1758208565/Gemini_Generated_Image_ya3bzkya3bzkya3b_d1bkyh.png', // 待填充
  },

  // --- 科幻宇航员风 (Sci-Fi Astronaut) ---
  {
    id: 'sci-fi-001',
    name: '星云探索者',
    style: '科幻宇航员',
    imageUrl:
      'https://res.cloudinary.com/deaxv6w30/image/upload/v1758208592/Gemini_Generated_Image_79wtq679wtq679wt_zz6vxh.png', // 待填充
  },

  // --- 水彩画风 (Watercolor) ---
  {
    id: 'watercolor-001',
    name: '春日水彩少女',
    style: '水彩画',
    imageUrl:
      'https://res.cloudinary.com/deaxv6w30/image/upload/v1758208565/Gemini_Generated_Image_thhxythhxythhxyt_tjgxse.png', // 待填充
  },
  {
    id: 'iod-portrait-001',
    name: '油画肖像',
    style: '复古油画',
    imageUrl:
      'https://res.cloudinary.com/deaxv6w30/image/upload/v1758207263/Gemini_Generated_Image_ns6z8lns6z8lns6z_ooph5v.png', // 待填充
  },
];
