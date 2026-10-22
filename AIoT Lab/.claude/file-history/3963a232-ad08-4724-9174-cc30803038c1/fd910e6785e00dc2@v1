/**
 * Subdomain and App Route Resolution Utility
 * Supports:
 * - Subdomain detection: hazard.pk-network.* or hazard.localhost
 * - Path detection: /hazard or /hazard-trigger
 * - Query parameter detection: ?app=hazard or ?subdomain=hazard or ?view=hazard
 */

export type AppSubdomain = 'pk' | 'hazard' | 'prompt' | 'hair' | 'facet';

export function resolveActiveSubdomain(): AppSubdomain {
  if (typeof window === 'undefined') return 'pk';

  // 1. Query param override (?app=hazard, ?app=prompt, ?app=hair, ?app=facet, ?subdomain=...)
  try {
    const params = new URLSearchParams(window.location.search);
    const queryApp = params.get('app') || params.get('subdomain') || params.get('view');
    if (queryApp === 'facet' || queryApp === 'ontology' || queryApp === 'hair-facet') {
      return 'facet';
    }
    if (queryApp === 'hazard' || queryApp === 'hazard-trigger') {
      return 'hazard';
    }
    if (queryApp === 'prompt' || queryApp === 'prompt-builder' || queryApp === 'studio') {
      return 'prompt';
    }
    if (queryApp === 'hair' || queryApp === 'hair-codex' || queryApp === 'codex' || queryApp === 'hair-atlas') {
      return 'hair';
    }
    if (queryApp === 'pk' || queryApp === 'network' || queryApp === 'data') {
      return 'pk';
    }
  } catch (e) {
    // Ignore query parsing errors
  }

  // 2. Path-based resolution (/hazard, /prompt, /hair, /facet)
  const pathname = window.location.pathname.toLowerCase();
  if (pathname.startsWith('/facet') || pathname.startsWith('/ontology')) {
    return 'facet';
  }
  if (pathname.startsWith('/hazard')) {
    return 'hazard';
  }
  if (pathname.startsWith('/prompt')) {
    return 'prompt';
  }
  if (pathname.startsWith('/hair')) {
    return 'hair';
  }

  // 3. Hostname-based resolution (hazard.*, prompt.*, hair.*, facet.*)
  const hostname = window.location.hostname.toLowerCase();
  if (hostname.startsWith('facet')) {
    return 'facet';
  }
  if (hostname.startsWith('hazard')) {
    return 'hazard';
  }
  if (hostname.startsWith('prompt')) {
    return 'prompt';
  }
  if (hostname.startsWith('hair')) {
    return 'hair';
  }

  // 4. Hash-based resolution (#/hazard, #/prompt, #/hair, #/facet)
  if (window.location.hash.toLowerCase().includes('facet')) {
    return 'facet';
  }
  if (window.location.hash.toLowerCase().includes('hazard')) {
    return 'hazard';
  }
  if (window.location.hash.toLowerCase().includes('prompt')) {
    return 'prompt';
  }
  if (window.location.hash.toLowerCase().includes('hair')) {
    return 'hair';
  }

  return 'pk';
}

export function navigateToSubdomain(target: AppSubdomain): void {
  if (typeof window === 'undefined') return;

  const currentUrl = new URL(window.location.href);
  if (target === 'facet') {
    currentUrl.searchParams.set('app', 'facet');
  } else if (target === 'hazard') {
    currentUrl.searchParams.set('app', 'hazard');
  } else if (target === 'prompt') {
    currentUrl.searchParams.set('app', 'prompt');
  } else if (target === 'hair') {
    currentUrl.searchParams.set('app', 'hair');
  } else {
    currentUrl.searchParams.delete('app');
    currentUrl.searchParams.delete('subdomain');
    currentUrl.searchParams.delete('view');
    if (
      currentUrl.pathname.startsWith('/hazard') ||
      currentUrl.pathname.startsWith('/prompt') ||
      currentUrl.pathname.startsWith('/hair') ||
      currentUrl.pathname.startsWith('/facet')
    ) {
      currentUrl.pathname = '/';
    }
  }
  window.history.pushState({}, '', currentUrl.toString());
}
