const GOOGLE_FAVICON_HOSTS = new Set(["google.com", "www.google.com"]);

export function resolveProviderFaviconUrl(faviconUrl: string | null | undefined) {
  const normalizedUrl = faviconUrl?.trim();

  if (!normalizedUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(normalizedUrl);
    const hostname = parsedUrl.hostname.toLowerCase();
    const pathname = parsedUrl.pathname;

    if (GOOGLE_FAVICON_HOSTS.has(hostname) && pathname === "/s2/favicons") {
      return null;
    }

    if (hostname.endsWith(".gstatic.com") && pathname === "/faviconV2") {
      return null;
    }

    return normalizedUrl;
  } catch {
    return null;
  }
}
