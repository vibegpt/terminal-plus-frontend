export const emotionToVibeMap = {
  anxious: "Comfort",
  tired: "Refuel",
  bored: "Quick",
  excited: "Explore",
  focused: "Work",
  curious: "Shop",
  relaxed: "Chill",
  stressed: "Comfort",
  hungry: "Refuel",
  energetic: "Explore",
  calm: "Chill",
  busy: "Quick",
  creative: "Explore",
  social: "Shop",
  introspective: "Work"
};

export function getVibeFromEmotion(emotion: string): string {
  return emotionToVibeMap[emotion.toLowerCase() as keyof typeof emotionToVibeMap] || "Comfort";
} 