const LOCAL_FALLBACK_COVERS = [
  "images/article1.jpg",
  "images/article2.jpg",
  "images/article3.jpg",
  "images/article4.jpg",
  "images/article5.jpg",
  "images/carousel1.jpg",
  "images/carousel2.jpg",
  "images/carousel3.jpg",
];

const LEGACY_EMPTY_COVERS = new Set([
  "/images/article-default.jpg",
  "images/article-default.jpg",
  "/images/article-default.png",
  "images/article-default.png",
]);

const ABSOLUTE_URL_PATTERN = /^(https?:)?\/\//i;

function getBaseUrl() {
  const baseUrl = import.meta.env.BASE_URL || "/";
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

function toPublicUrl(path) {
  const normalizedPath = String(path || "").replace(/^\/+/, "");
  return `${getBaseUrl()}${normalizedPath}`;
}

function hashSeed(seed) {
  const text = String(seed || "");
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function pickFallbackCover(seed) {
  const fallbackIndex = hashSeed(seed) % LOCAL_FALLBACK_COVERS.length;
  return toPublicUrl(LOCAL_FALLBACK_COVERS[fallbackIndex]);
}

export function resolveArticleCover(cover, seed = "") {
  const normalizedCover = typeof cover === "string" ? cover.trim() : "";
  if (!normalizedCover || LEGACY_EMPTY_COVERS.has(normalizedCover)) {
    return pickFallbackCover(seed);
  }

  if (
    ABSOLUTE_URL_PATTERN.test(normalizedCover) ||
    normalizedCover.startsWith("data:")
  ) {
    return normalizedCover;
  }

  return toPublicUrl(normalizedCover);
}
