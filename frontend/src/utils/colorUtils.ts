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
  female: [255, 157, 167],             // pastel pink
  male: [78, 121, 167],                // pastel blue
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
  const clampedAge = Math.min(Math.max(age, 0), 100);
  const t = clampedAge / 100;

  // Başlangıç: rgb(100, 200, 100)
  // Bitiş: rgb(240, 220, 130)
  const r = Math.round(100 + t * (240 - 100)); // 100 → 240
  const g = Math.round(200 + t * (220 - 200)); // 200 → 220
  const b = Math.round(100 + t * (130 - 100)); // 100 → 130

  return [r, g, b, opacity];
};

export const getColorForAgeString = (
  age: number,
  opacity: number = 1
): string => {
  const [r, g, b] = getColorForAge(age, 255).slice(0, 3);
  return `rgba(${r},${g},${b},${opacity})`;
};




 export const getColorForRelationType = ( type:string

 ): [number, number, number, number] => {
   
    
   switch (type) {
    case 'birth_place':
      return [39, 174, 96, 180];       // ✔ Yeşil (#27AE60)
    case 'death_place':
      return [240, 57, 43, 180];       // ✔ Kırmızı (#C0392B)
    case 'educated_at':
      return [138, 43, 226, 180];      // ✔ Mor (#9B59B6)
    case 'residence':
      return [52, 152, 219, 180];      // ✔ Mavi (#3498DB)
    case 'work_location':
      return [243, 156, 18, 180];       // ✔ Turuncu (#F39C12)
    case 'has_works_in':
      return [64, 150, 150, 180];      // ✔ Turkuaz → [ (#40E0D0)
    default:
      return [75, 75, 75, 180];     // Gri (bilinmeyen)
  }
    

  }


  export const getColorForRelationTypeString = (type:string
    ): string => {

      const [r, g, b] = getColorForRelationType(type).slice(0, 3);
      return `rgba(${r},${g},${b})`;

      };

  