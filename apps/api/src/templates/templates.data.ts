export interface Template {
  id: string;
  name: string;
  style: string;
  imageUrl: string;
  isPremium?: boolean;
}

export const TEMPLATES_DATA: Template[] = [
  // --- Cyberpunk Style ---
  {
    id: 'Knights',
    name: 'Knight',
    style: 'Knight',
    imageUrl:
      'https://res.cloudinary.com/deaxv6w30/image/upload/v1758208567/Gemini_Generated_Image_o0a6hco0a6hco0a6_ypq1cx.png',
    isPremium: true,
  },
  {
    id: 'cyberpunk-002',
    name: 'Neon City Shadow',
    style: 'Cyberpunk',
    imageUrl:
      'https://res.cloudinary.com/deaxv6w30/image/upload/v1758207263/Gemini_Generated_Image_fledi1fledi1fled_qcftm8.png',
  },

  // --- Marvel Heroes ---
  {
    id: 'marvel-captain-america',
    name: 'Captain America',
    style: 'Superhero',
    imageUrl:
      'https://res.cloudinary.com/deaxv6w30/image/upload/v1758833489/Gemini_Generated_Image_39w2y539w2y539w2_r5rhke.png',
  },
  {
    id: 'marvel-spiderman',
    name: 'Spider-Man',
    style: 'Superhero',
    imageUrl:
      'https://res.cloudinary.com/deaxv6w30/image/upload/v1758833446/Gemini_Generated_Image_ohihgsohihgsohih_ss2lwo.png',
  },
  {
    id: 'marvel-black-widow',
    name: 'Black Widow',
    style: 'Superhero',
    imageUrl:
      'https://res.cloudinary.com/deaxv6w30/image/upload/v1758833446/Gemini_Generated_Image_n1rtbpn1rtbpn1rt_hyaw8k.png',
  },
  {
    id: 'marvel-thor',
    name: 'Thor',
    style: 'Superhero',
    imageUrl:
      'https://res.cloudinary.com/deaxv6w30/image/upload/v1758833446/Gemini_Generated_Image_8dango8dango8dan_siqkfd.png',
  },
  // --- Fantasy Knight Style ---
  {
    id: 'fantasy-001',
    name: 'Silver Armor Temple Knight',
    style: 'Fantasy Knight',
    imageUrl:
      'https://res.cloudinary.com/deaxv6w30/image/upload/v1758207266/Gemini_Generated_Image_6u2ns36u2ns36u2n_tzeq2g.png',
  },
  {
    id: 'fantasy-002',
    name: 'Elven Forest Archer',
    style: 'Fantasy Knight',
    imageUrl:
      'https://res.cloudinary.com/deaxv6w30/image/upload/v1758208564/Gemini_Generated_Image_py2uuxpy2uuxpy2u_fp2vdd.png',
  },

  // --- Film Noir Detective Style ---
  {
    id: 'film-noir-001',
    name: 'Misty City Detective',
    style: 'Film Noir',
    imageUrl:
      'https://res.cloudinary.com/deaxv6w30/image/upload/v1758208565/Gemini_Generated_Image_ya3bzkya3bzkya3b_d1bkyh.png',
  },

  // --- Sci-Fi Astronaut Style ---
  {
    id: 'sci-fi-001',
    name: 'Nebula Explorer',
    style: 'Sci-Fi Astronaut',
    imageUrl:
      'https://res.cloudinary.com/deaxv6w30/image/upload/v1758208592/Gemini_Generated_Image_79wtq679wtq679wt_zz6vxh.png',
  },

  // --- Watercolor Style ---
  {
    id: 'watercolor-001',
    name: 'Spring Watercolor Girl',
    style: 'Watercolor',
    imageUrl:
      'https://res.cloudinary.com/deaxv6w30/image/upload/v1758208565/Gemini_Generated_Image_thhxythhxythhxyt_tjgxse.png',
  },
  {
    id: 'iod-portrait-001',
    name: 'Oil Painting Portrait',
    style: 'Vintage Oil Painting',
    imageUrl:
      'https://res.cloudinary.com/deaxv6w30/image/upload/v1758207263/Gemini_Generated_Image_ns6z8lns6z8lns6z_ooph5v.png',
  },
];
