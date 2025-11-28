import { ThemeItem, ThemeCategory } from '../types';
import { NEO_COLORS, MOCK_PREFIXES, MOCK_SUFFIXES, MOCK_TAGS } from '../constants';

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Generate 1000+ Mock Themes
export const generateThemes = (count: number = 1000): ThemeItem[] => {
  const themes: ThemeItem[] = [];
  const categories = Object.values(ThemeCategory).filter(c => c !== ThemeCategory.ALL);

  for (let i = 0; i < count; i++) {
    const prefix = getRandomItem(MOCK_PREFIXES);
    const suffix = getRandomItem(MOCK_SUFFIXES);
    const category = getRandomItem(categories);
    const color = getRandomItem(NEO_COLORS);
    
    // Select 2-3 random tags
    const numTags = getRandomInt(2, 3);
    const itemTags: string[] = [];
    for(let t=0; t<numTags; t++) {
        const tag = getRandomItem(MOCK_TAGS);
        if(!itemTags.includes(tag)) itemTags.push(tag);
    }

    // Deterministic random image based on index to ensure hydration consistency if needed, 
    // but here mainly for variety. We use picsum.
    // Using simple IDs for picsum to get consistent images.
    const imageId = getRandomInt(1, 900);

    themes.push({
      id: `theme-${i}`,
      name: `${prefix}${suffix} ${getRandomInt(1, 9)}.${getRandomInt(0, 9)}`,
      category: category,
      imageUrl: `https://picsum.photos/id/${imageId}/600/400`, // Using specific IDs for consistency
      author: `@${prefix.toLowerCase()}_dev`,
      price: getRandomInt(0, 100) > 20 ? getRandomInt(19, 99) : 0, // Some free, some paid
      tags: itemTags,
      accentColor: color,
      downloads: getRandomInt(100, 50000),
    });
  }
  return themes;
};

// Initial generation
export const ALL_THEMES = generateThemes(1200);