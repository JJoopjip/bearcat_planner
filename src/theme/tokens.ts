// Fixed Pantone spec — do not adjust these without an explicit ask.
export const colors = {
  pink: "#EA96B4", // Pantone 2333 C — body
  pinkPale: "#F8CEDE", // Pantone 2331 U — belly, snout, fills, tracks
  pinkDeep: "#EA768E", // Pantone 701 C — ears, pads, primary action
  ink: "#5A285A", // Pantone 2627 C — eyes, all text
  line: "#230F23", // Pantone Neutral Black C — outlines
  blush: "#F08080", // Pantone 7416 C — cheeks, warm accent

  bg: "#FFF4F8",
  card: "#FFFFFF",
  cream: "#FFF8F3",
  lilac: "#C9B6E4",
  mint: "#A8DCC6",
  butter: "#F9E1A8",
  inkSoft: "#A184A1",
  path: "#F6DCE7",
  pixel: "#F7E6EE",
} as const;

// low -> high, self-reported mood check-in
export const moodPoses = ["sad", "confused", "happy", "thumbsup", "love"] as const;
export const moodColors = ["#CBD8EC", "#D9CDEA", "#F6E3B8", "#F9C2D6", "#F295B8"] as const;

export const radius = { card: 22, chip: 99 };

export const spendCategories = ["Food", "Transit", "Home", "Fun", "Health", "Other"] as const;
// Income splits into these two, since income is uneven (spec, "As it happens" money entry).
export const incomeCategories = ["Shift income", "Other income"] as const;

export const scenes = [
  { id: "blossom", name: "Blossom", cost: 30 },
  { id: "garden", name: "Garden", cost: 60 },
  { id: "night", name: "Night sky", cost: 120 },
  { id: "cafe", name: "Cafe corner", cost: 250 },
] as const;
