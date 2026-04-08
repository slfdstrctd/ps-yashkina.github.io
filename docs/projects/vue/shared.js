export const STORAGE_KEYS = {
  CHECKLIST: "valuesChecklistCheckedState",
  RANKING_UNLOCKED: "valuesChecklistRankingUnlocked",
  SELECTED_FOR_RANKING: "selectedValuesForRanking",
};

export const LIMITS = {
  MIN_FOR_RANKING: 5,
  MAX_CHECKED: 12,
  ITEMS_PER_PAGE: 9,
};

export const THEME_PRESETS = [
  { id: "default", background: "#ffffff", text: "#000000", label: "Белый фон и чёрный текст" },
  { id: "t1", background: "#dce2f0", text: "#50586c", label: "Фон DCE2F0, текст 50586C" },
  { id: "t2", background: "#f9ebde", text: "#815854", label: "Фон F9EBDE, текст 815854" },
  { id: "t3", background: "#adefd1", text: "#00203f", label: "Фон ADEFD1, текст 00203F" },
  { id: "t4", background: "#fad0c9", text: "#6e6e6d", label: "Фон FAD0C9, текст 6E6E6D" },
  { id: "t5", background: "#ffdfb9", text: "#a4193d", label: "Фон FFDFB9, текст A4193D" },
  { id: "t6", background: "#fcf6f5", text: "#7b9acc", label: "Фон FCF6F5, текст 7B9ACC" },
];

export function capitalizeFirstLetter(text) {
  const t = String(text || "").trim();
  if (!t) return t;
  return `${t.charAt(0).toUpperCase()}${t.slice(1)}`;
}

export function normalizeHex(hex, fallback = "#ffffff") {
  let h = String(hex || fallback).trim().replace(/^#/, "").toLowerCase();
  if (h.length === 3) h = h.split("").map((x) => x + x).join("");
  if (!/^[0-9a-f]{6}$/.test(h)) return fallback;
  return `#${h}`;
}

export function normalizeStoredItems(input) {
  return (Array.isArray(input) ? input : []).map((item, index) => {
    if (typeof item === "string") {
      return { id: `${index}:${item}`, name: item, description: "" };
    }
    const name = item?.name ?? `Value ${index + 1}`;
    const description = item?.description ?? "";
    const id = item?.id ?? `${index}:${name}`;
    return { id, name, description };
  });
}

