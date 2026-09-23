/**
 * Utility functions to parse, sanitize, and convert media URLs (Google Drive, Playbook, YouTube, Vimeo, Dropbox, Unsplash, etc.)
 * so they load and display reliably in standard <img> and <video>/<iframe> elements without breaking.
 */

export interface GoogleDriveInfo {
  isDrive: boolean;
  fileId: string | null;
  directImageUrl: string | null;
  videoEmbedUrl: string | null;
  thumbnailUrl: string | null;
}

export interface PlaybookInfo {
  isPlaybook: boolean;
  token: string | null;
  assetId: string | null;
  embedUrl: string | null;
  directUrl: string | null;
  thumbnailUrl: string | null;
}

export const FALLBACK_IMAGE_URL =
  'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1200&q=80';

export const FALLBACK_FAVORITA_URL =
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80';

/**
 * Extracts Google Drive File ID from various link formats:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * - https://drive.google.com/file/d/FILE_ID/preview
 * - https://lh3.googleusercontent.com/d/FILE_ID
 */
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();

  // Pattern 1: /file/d/{id}
  const fileDPattern = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i;
  const matchFileD = trimmed.match(fileDPattern);
  if (matchFileD && matchFileD[1]) {
    return matchFileD[1];
  }

  // Pattern 2: id={id} in query params (open?id= or uc?id= or thumbnail?id=)
  const idQueryPattern = /drive\.google\.com\/(?:open|uc|thumbnail).*?[?&]id=([a-zA-Z0-9_-]+)/i;
  const matchIdQuery = trimmed.match(idQueryPattern);
  if (matchIdQuery && matchIdQuery[1]) {
    return matchIdQuery[1];
  }

  // Pattern 3: googleusercontent.com/d/{id}
  const userContentPattern = /googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i;
  const matchUserContent = trimmed.match(userContentPattern);
  if (matchUserContent && matchUserContent[1]) {
    return matchUserContent[1];
  }

  // Pattern 4: /d/{id}
  const generalDPattern = /drive\.google\.com\/.*?\/d\/([a-zA-Z0-9_-]+)/i;
  const matchGeneralD = trimmed.match(generalDPattern);
  if (matchGeneralD && matchGeneralD[1]) {
    return matchGeneralD[1];
  }

  return null;
}

/**
 * Checks if a URL is from Google Drive and returns formatted links.
 */
export function parseGoogleDriveUrl(url: string): GoogleDriveInfo {
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) {
    return {
      isDrive: false,
      fileId: null,
      directImageUrl: null,
      videoEmbedUrl: null,
      thumbnailUrl: null,
    };
  }

  // Google's direct CDN endpoint for images from Drive
  const directImageUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
  const videoEmbedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
  const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;

  return {
    isDrive: true,
    fileId,
    directImageUrl,
    videoEmbedUrl,
    thumbnailUrl,
  };
}

/**
 * Parses and formats Playbook (playbook.com) URLs:
 * - https://www.playbook.com/s/workspace/board/asset_id
 * - https://playbook.com/s/workspace/board/asset_id
 * - https://www.playbook.com/e/TOKEN
 * - https://app.playbook.com/embed/TOKEN
 * - https://assets.playbook.com/path
 */
export function parsePlaybookUrl(url: string): PlaybookInfo {
  if (!url || typeof url !== 'string') {
    return {
      isPlaybook: false,
      token: null,
      assetId: null,
      embedUrl: null,
      directUrl: null,
      thumbnailUrl: null,
    };
  }

  const trimmed = url.trim();
  const isPlaybook = /playbook\.com/i.test(trimmed);

  if (!isPlaybook) {
    return {
      isPlaybook: false,
      token: null,
      assetId: null,
      embedUrl: null,
      directUrl: null,
      thumbnailUrl: null,
    };
  }

  // 1. Embed pattern: /e/{token} or /embed/{token}
  const embedMatch = trimmed.match(/playbook\.com\/(?:e|embed)\/([a-zA-Z0-9_-]+)/i);
  if (embedMatch && embedMatch[1]) {
    const token = embedMatch[1];
    const embedUrl = `https://www.playbook.com/e/${token}`;
    return {
      isPlaybook: true,
      token,
      assetId: null,
      embedUrl,
      directUrl: trimmed,
      thumbnailUrl: null,
    };
  }

  // 2. Share pattern: /s/{workspace}/{board}/{assetId} or /s/{workspace}/{token}
  const shareMatch = trimmed.match(/playbook\.com\/s\/([^/?#]+)(?:\/([^/?#]+))?(?:\/([^/?#]+))?/i);
  if (shareMatch) {
    const assetOrToken = shareMatch[3] || shareMatch[2] || shareMatch[1];
    // If it's a share link, it can be embedded directly in an iframe or accessed
    const embedUrl = trimmed.includes('/s/') ? trimmed : `https://www.playbook.com/e/${assetOrToken}`;
    return {
      isPlaybook: true,
      token: assetOrToken || null,
      assetId: shareMatch[3] || null,
      embedUrl,
      directUrl: trimmed,
      thumbnailUrl: null,
    };
  }

  // 3. Direct CDN asset or other playbook link
  return {
    isPlaybook: true,
    token: null,
    assetId: null,
    embedUrl: trimmed,
    directUrl: trimmed,
    thumbnailUrl: null,
  };
}

/**
 * Extracts YouTube Video ID from standard, short, and embed links.
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = trimmed.match(regExp);

  return match && match[2].length === 11 ? match[2] : null;
}

/**
 * Extracts Vimeo Video ID from vimeo links.
 */
export function extractVimeoVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();
  const match = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/);
  return match && match[3] ? match[3] : null;
}

/**
 * Transforms any raw media URL into the best working direct URL for images or videos.
 */
export function formatMediaUrl(url: string, type: 'photo' | 'video' = 'photo'): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // 1. Google Drive URLs
  const driveInfo = parseGoogleDriveUrl(trimmed);
  if (driveInfo.isDrive) {
    if (type === 'video') {
      return driveInfo.videoEmbedUrl || trimmed;
    }
    return driveInfo.directImageUrl || trimmed;
  }

  // 2. Playbook URLs
  const playbookInfo = parsePlaybookUrl(trimmed);
  if (playbookInfo.isPlaybook) {
    if (type === 'video') {
      return playbookInfo.embedUrl || trimmed;
    }
    return playbookInfo.directUrl || trimmed;
  }

  // 3. YouTube URLs
  const ytId = extractYouTubeVideoId(trimmed);
  if (ytId) {
    if (type === 'video') {
      return `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&controls=1&iv_load_policy=3&enablejsapi=1`;
    }
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }

  // 4. Vimeo URLs
  const vimeoId = extractVimeoVideoId(trimmed);
  if (vimeoId) {
    if (type === 'video') {
      return `https://player.vimeo.com/video/${vimeoId}?autoplay=1&title=0&byline=0&portrait=0`;
    }
  }

  // 5. Dropbox links (convert ?dl=0 to ?raw=1)
  if (trimmed.includes('dropbox.com')) {
    if (trimmed.includes('dl=0')) {
      return trimmed.replace('dl=0', 'raw=1');
    }
    if (!trimmed.includes('raw=1') && !trimmed.includes('dl=1')) {
      return trimmed.includes('?') ? `${trimmed}&raw=1` : `${trimmed}?raw=1`;
    }
  }

  return trimmed;
}

/**
 * Returns the best poster / thumbnail URL for a given media item.
 */
export function getMediaThumbnailUrl(mediaUrl: string, posterUrl?: string): string {
  if (posterUrl && posterUrl.trim()) {
    return formatMediaUrl(posterUrl.trim(), 'photo');
  }

  const driveInfo = parseGoogleDriveUrl(mediaUrl);
  if (driveInfo.isDrive) {
    return driveInfo.thumbnailUrl || driveInfo.directImageUrl || FALLBACK_IMAGE_URL;
  }

  const playbookInfo = parsePlaybookUrl(mediaUrl);
  if (playbookInfo.isPlaybook) {
    if (playbookInfo.thumbnailUrl) return playbookInfo.thumbnailUrl;
  }

  const ytId = extractYouTubeVideoId(mediaUrl);
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }

  return formatMediaUrl(mediaUrl, 'photo') || FALLBACK_IMAGE_URL;
}

/**
 * Checks if a video URL requires an iframe embed (Playbook, Google Drive, YouTube, Vimeo)
 * rather than a native HTML5 <video> element.
 */
export function isIframeVideo(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();

  if (parseGoogleDriveUrl(trimmed).isDrive) return true;
  if (parsePlaybookUrl(trimmed).isPlaybook) {
    // If it's a direct .mp4 file on playbook assets, we can use native video, otherwise iframe
    if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(trimmed)) {
      return false;
    }
    return true;
  }
  if (extractYouTubeVideoId(trimmed)) return true;
  if (extractVimeoVideoId(trimmed)) return true;
  if (trimmed.includes('player.vimeo.com') || trimmed.includes('youtube.com/embed') || trimmed.includes('playbook.com/e/')) return true;

  return false;
}

/**
 * Returns iframe embed URL for videos (Google Drive, Playbook, YouTube, Vimeo)
 */
export function getVideoEmbedUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  const driveInfo = parseGoogleDriveUrl(trimmed);
  if (driveInfo.isDrive && driveInfo.videoEmbedUrl) {
    return driveInfo.videoEmbedUrl;
  }

  const playbookInfo = parsePlaybookUrl(trimmed);
  if (playbookInfo.isPlaybook && playbookInfo.embedUrl) {
    return playbookInfo.embedUrl;
  }

  const ytId = extractYouTubeVideoId(trimmed);
  if (ytId) {
    return `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&controls=1&iv_load_policy=3&enablejsapi=1`;
  }

  const vimeoId = extractVimeoVideoId(trimmed);
  if (vimeoId) {
    return `https://player.vimeo.com/video/${vimeoId}?autoplay=1&title=0&byline=0&portrait=0`;
  }

  return trimmed;
}
