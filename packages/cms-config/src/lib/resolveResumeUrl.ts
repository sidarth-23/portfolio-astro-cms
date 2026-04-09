const DRIVE_FILE_ID_PATTERNS = [
  /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/uc\?[^#]*[?&]id=([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/uc\?export=download&id=([a-zA-Z0-9_-]+)/,
];

const extractDriveFileId = (url: string): string | null => {
  for (const pattern of DRIVE_FILE_ID_PATTERNS) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
};

export const resolveResumeUrl = (rawUrl: string): string => {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return "";
  }

  const fileId = extractDriveFileId(trimmed);
  if (fileId) {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  return trimmed;
};
