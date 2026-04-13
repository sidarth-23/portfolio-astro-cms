const DRIVE_FILE_ID_PATTERNS = [
  /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/uc\?[^#]*[?&]id=([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/uc\?export=download&id=([a-zA-Z0-9_-]+)/,
];

const DOCS_FILE_ID_PATTERN = /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/;

const extractDriveFileId = (url: string): string | null => {
  for (const pattern of DRIVE_FILE_ID_PATTERNS) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
};

const extractDocsFileId = (url: string): string | null => {
  const match = url.match(DOCS_FILE_ID_PATTERN);
  return match?.[1] ?? null;
};

export const resolveResumeUrl = (rawUrl: string): string => {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return "";
  }

  const docsId = extractDocsFileId(trimmed);
  if (docsId) {
    return `https://docs.google.com/document/d/${docsId}/export?format=pdf`;
  }

  const fileId = extractDriveFileId(trimmed);
  if (fileId) {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  return trimmed;
};
