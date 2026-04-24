// src/utils/colorUtils.ts

// export const colorPalette: string[] = [
//   "#4e79a7",
//   "#f28e2c",
//   "#e15759",
//   "#76b7b2",
//   "#59a14f",
//   "#edc949",
//   "#af7aa1",
//   "#ff9da7",
//   "#9c755f",
//   "#bab0ab",
//   "#8cd17d",
//   "#b6992d",
//   "#d37295",
//   "#5b5f97",
//   "#009fb7",
// ];

// export const colorPalette: string[] = [
//   "#4DAEA8", // teal - Chile
//   "#E8845A", // orange - Argentina  
//   "#8B7EC8", // purple - Brazil
//   "#E86B9A", // pink - Bolivia
//   "#7DB87D", // green - Peru
//   "#C4A84F", // gold - Ecuador
//   "#7BB8C4", // light blue - Colombia
//   "#A8A8A8", // gray - Venezuela
//   "#5BAD8F", // sage teal - Dominican Republic
//   "#E8A06B", // light orange - Haiti
//   "#9B8FD4", // lavender - Cuba
//   "#E86BA0", // hot pink - Guatemala
//   "#8DC46B", // lime green - Mexico
//   "#D4B84A", // yellow gold - US
//   "#B0B0B0", // medium gray - Canada
//   "#5BB8B0", // turquoise - Sweden
// ];

export const colorPalette: string[] = [
  // Teal ailesi
  "#4DAEA8", "#2D8B85", "#7DCEC9", "#1A6E6A",
  
  // Mor ailesi
  "#8B7EC8", "#6355A4", "#B0A6E0", "#473D80",
  // Pembe ailesi
  "#E86B9A", "#C44070", "#F097BC", "#A02858",
  // Yeşil ailesi
  "#7DB87D", "#4D8F4D", "#A8D4A8", "#2D6B2D",
  // Sarı/Altın ailesi
  "#C4A84F", "#9E7E28", "#DFC878", "#7A5C10",
  // Mavi ailesi
  "#7BB8C4", "#4A8F9E", "#A8D4DE", "#2A6878",
  // Turuncu ailesi
  "#E8845A", "#C45E32", "#F0A882", "#9c4123",
  // Gri/Kahve ailesi
  "#A89880", "#7A6A58", "#C4B4A0", "#5A4A38",
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
  type: string,
  opacity: number = 200
): [number, number, number, number] => {
  switch (type) {
    // LOCATIONS
    case 'birth_place':
      return [29, 158, 117, opacity];    // teal-400 — #1D9E75

    case 'death_place':
      return [216, 90, 48, opacity];     // coral-400 — #D85A30

    case 'educated_at':
      return [127, 119, 221, opacity];   // purple-400 — #7F77DD

    case 'residence':
      return [55, 138, 221, opacity];    // blue-400 — #378ADD

    case 'work_location':
      return [186, 117, 23, opacity];    // amber-400 — #BA7517

    case 'has_works_in':
      return [93, 202, 165, opacity];    // teal-200 — #5DCAA5

    case 'buried_at':
      return [136, 135, 128, opacity];   // gray-400 — #888780

    // FAMILY
    case 'father':
      return [55, 138, 221, opacity];    // blue-400 — #378ADD

    case 'mother':
      return [212, 83, 126, opacity];    // pink-400 — #D4537E

    case 'spouse':
      return [175, 169, 236, opacity];   // purple-200 — #AFA9EC

    case 'child':
      return [99, 153, 34, opacity];     // green-400 — #639922

    case 'sibling':
      return [239, 159, 39, opacity];    // amber-200 — #EF9F27

    case 'significant person':
      return [216, 90, 48, opacity];     // coral-400 — #D85A30

    case 'unmarried partner':
    case 'madigudisi':
      return [237, 147, 123, opacity];   // coral-200 — #ED937B

    // PROFESSIONAL
    case 'influenced':
      return [133, 183, 235, opacity];   // blue-200 — #85B7EB

    case 'influenced by':
      return [24, 95, 165, opacity];     // blue-600 — #185FA5

    case 'student':
      return [93, 202, 165, opacity];    // teal-200 — #5DCAA5

    case 'student of':
      return [15, 110, 86, opacity];     // teal-600 — #0F6E56

    case 'collaborator':
      return [180, 178, 169, opacity];   // gray-200 — #B4B2A9

    default:
      return [136, 135, 128, opacity];   // gray-400 — #888780
  }
};


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


  // export const getLayerColor = (layerName?: string) => {
  //         switch (layerName?.toLowerCase()) {
  //           case "relations":
  //             return "#44608e"; // soft coral
  //           case "professional":
  //             return "#eec12f"; // soft coral
  //           case "humans":
  //             return "#a4558f"; // soft coral
  //           case "wars":
  //             return "#59a14f"; // sky blue
  //           case "disasters":
  //             return "#e74c3c"; // red
           
  //           default:
  //             return "#f58e2fff"; // warm apricot
  //         }
  //       };

  export const getLayerColor = (layerName?: string) => {
    switch (layerName?.toLowerCase()) {
      case "works":       return "#BA7517";
      case "relations":   return "#378ADD";
      case "professional":return "#378ADD";
      case "humans":      return "#6e639e";
      case "wars":        return "#5d895d";
      case "disasters":   return "#d02d2dff";
      case "movements":   return "#ef9b14";
      default:            return "#1D9E75";
    }
  };