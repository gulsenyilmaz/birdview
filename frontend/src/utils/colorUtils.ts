// src/utils/colorUtils.ts

export const colorPalette: string[] = [
  "#4e79a7",
  "#f28e2c",
  "#e15759",
  "#76b7b2",
  "#59a14f",
  "#edc949",
  "#af7aa1",
  "#ff9da7",
  "#9c755f",
  "#bab0ab",
  "#8cd17d",
  "#b6992d",
  "#d37295",
  "#5b5f97",
  "#009fb7",
];

export const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit int
  }
  return Math.abs(hash);
};

export const getColorForLabelString = (label: string): string => {
  const index = hashString(label) % colorPalette.length;
  return colorPalette[index];
};


export const getColorForLabel= (
  label: string,
  opacity: number = 180
): [number, number, number, number] => {
  const hex = getColorForLabelString(label).replace("#", "");
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b, opacity];
};



const genderColorMap: Record<string, [number, number, number]> = {
  "female": [255, 157, 167],             // pastel pink
  "male": [78, 121, 167],                // pastel blue
  "gender non-conforming": [50, 50, 60],
  "transgender woman": [231, 76, 60],
  default: [150, 150, 150]
};

export const getColorForGender = (
  gender: string,
  opacity: number = 255
): [number, number, number, number] => {
  const rgb = genderColorMap[gender.toLowerCase()] || genderColorMap.default;
  return [...rgb, opacity];
};


export const getColorForGenderString = (
  gender: string,
  opacity: number = 1
): string => {
  const rgb = genderColorMap[gender.toLowerCase()] || genderColorMap.default;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`;
};


export const getColorForAge = (
  age: number,
  opacity: number = 180
): [number, number, number, number] => {
  const clampedAge = Math.min(Math.max(age, 0), 90);
  const t = clampedAge / 90;

  // Başlangıç: rgb(80, 170, 140)
  // Bitiş: rgba(170, 170, 170, 0.94)
  const r = Math.round(80 + t * (170 - 80));   // 80 → 160
  const g = Math.round(170 + t * (170 - 170)); // 170 → 190
  const b = Math.round(140 + t * (170 - 140)); // 140 → 170

  return [r, g, b, opacity];
};

export const getColorForAgeString = (
  age: number,
  opacity: number = 1
): string => {
  const [r, g, b] = getColorForAge(age, 255).slice(0, 3);
  return `rgba(${r},${g},${b},${opacity})`;
};




 export const getColorForRelationType = ( 
  type:string,
  opacity: number = 250

 ): [number, number, number, number] => {
   
    
   switch (type) {
    case 'birth_place':
      return [39, 174, 96, opacity];       // ✔ Yeşil rgb(39, 174, 96)
    case 'death_place':
      return [240, 57, 43, opacity];       // ✔ Kırmızı (#C0392B)
    case 'educated_at':
      return [138, 43, 226, opacity];      // ✔ Mor (#9B59B6)
    case 'residence':
      return [52, 152, 219, opacity];      // ✔ Mavi (#3498DB)
    case 'work_location':
      return [243, 156, 18, opacity];       // ✔ Turuncu (#F39C12)
    case 'has_works_in':
      return [64, 150, 150, opacity];      // ✔ Turkuaz → [ (#40E0D0)
    case 'buried_at':
      return [50, 50, 50, opacity];      // ✔ gray → [ (#40E0D0)
    case 'father':
    return [70, 130, 180, opacity];   // 👨 Baba → mavi (steelblue)

    case 'mother':
      return [231, 76, 60, opacity];    // 👩 Anne → kırmızı/pembe

    case 'spouse':
      return [155, 89, 182, opacity];   // 💍 Eş → mor

    case 'child':
      return [46, 204, 113, opacity];   // 👶 Çocuk → yeşil

    case 'sibling':
      return [241, 196, 15, opacity];   // 👥 Kardeş → sarı

    case 'significant person':
      return [230, 126, 34, opacity];   // ⭐ önemli kişi → turuncu

    case 'influenced':
      return [52, 152, 219, opacity];   // ➡ etkiledi → mavi

    case 'influenced by':
      return [41, 128, 195, opacity];   // ⬅ etkilendi → koyu mavi

    case 'student':
      return [26, 188, 156, opacity];   // 🎓 öğrenci → turkuaz

    case 'student of':
      return [22, 50, 133, opacity];   // 🎓 hocası → koyu turkuaz

    case 'collaborator':
      return [127, 140, 141, opacity];  // 🤝 işbirliği → gri

    case 'unmarried partner':
    case 'madigudisi':
      return [255, 105, 180, opacity];

    default:
      return [75, 75, 75, opacity];     // fallback
    }
    

  }


  export const getColorForRelationTypeString = (type:string
    ): string => {

      const [r, g, b] = getColorForRelationType(type).slice(0, 3);
      return `rgba(${r},${g},${b})`;

      };
  
  export const getStatusColorForMilitaryEvents = (status?: string) => {
          switch (status) {
            case "ongoing":
              return "#d02d2dff"; // soft coral
            case "upcoming":
              return "#1892bbff"; // sky blue
            case "ended":
              return "#84878eff"; // cool gray
            default:
              return "#b37c29ff"; // warm apricot
          }
        };


  export const getLayerColor = (layerName?: string) => {
          switch (layerName?.toLowerCase()) {
            case "relations":
              return "#44608e"; // soft coral
            case "professional":
              return "#eec12f"; // soft coral
            case "humans":
              return "#a4558f"; // soft coral
            case "wars":
              return "#59a14f"; // sky blue
            case "disasters":
              return "#e74c3c"; // red
           
            default:
              return "#f58e2fff"; // warm apricot
          }
        };

  