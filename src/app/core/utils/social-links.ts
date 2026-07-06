export interface SocialLink {
  name: string;
  url: string;
  icon: string;
}

interface SocialPattern {
  pattern: RegExp;
  name: string;
  icon: string;
}

const SOCIAL_PATTERNS: SocialPattern[] = [
  { pattern: /facebook\.com/i, name: 'Facebook', icon: 'facebook.svg' },
  { pattern: /instagram\.com/i, name: 'Instagram', icon: 'instagram.svg' },
  { pattern: /wa\.me|whatsapp\.com/i, name: 'WhatsApp', icon: 'whatsapp.svg' },
  { pattern: /twitter\.com|x\.com/i, name: 'Twitter', icon: 'twitter.svg' },
  { pattern: /youtube\.com|youtu\.be/i, name: 'YouTube', icon: 'youtube.svg' },
  { pattern: /linkedin\.com/i, name: 'LinkedIn', icon: 'linkedin.svg' },
];

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function buildSocialLinks(site: string | null | undefined): SocialLink[] {
  if (!site?.trim()) {
    return [];
  }

  const url = normalizeUrl(site);
  const matched = SOCIAL_PATTERNS.find((item) => item.pattern.test(url));

  if (matched) {
    return [{ name: matched.name, url, icon: matched.icon }];
  }

  return [{ name: 'Site', url, icon: 'site.svg' }];
}
