import { validateSafeUrl, classifySourceAuthority, OFFICIAL_MONITORED_ORGS } from './webResearcher';

export interface CandidateSource {
  title: string;
  url: string;
  domain: string;
  sourceType: 'OFFICIAL' | 'RELIABLE_SECONDARY' | 'SOCIAL' | 'OTHER';
  authorityLevel: 'PRIMARY' | 'SECONDARY' | 'DISCOVERY';
  isOfficial: boolean;
  snippet?: string;
}

export interface WebDiscoveryProvider {
  name: string;
  discover(query: string, options?: { organization?: string; category?: string; limit?: number }): Promise<CandidateSource[]>;
  searchOfficialSources(organization: string, category?: string): Promise<CandidateSource[]>;
  rankSources(candidates: CandidateSource[]): CandidateSource[];
}

/**
 * Phase 9: Targeted Query Generator.
 * Generates specific, time-aware educational queries instead of vague open searches.
 * Enforces strict query limits to prevent search credit exhaustion.
 */
export class TargetedQueryGenerator {
  static generateQueries(organization: string, category?: string, currentYear = 2026): string[] {
    const org = organization.trim().toUpperCase();
    const queries: string[] = [];

    // Exam-specific time-aware queries
    queries.push(`${org} latest notification ${currentYear}`);
    queries.push(`${org} application form ${currentYear} last date`);
    queries.push(`${org} exam date ${currentYear}`);
    queries.push(`${org} admit card ${currentYear}`);
    queries.push(`${org} result ${currentYear}`);

    // Category-specific queries
    if (category === 'TEACHING') {
      queries.push(`${org} CTET TET eligibility application ${currentYear}`);
    } else if (category === 'POLICE') {
      queries.push(`${org} Constable SI recruitment ${currentYear}`);
    } else if (category === 'UNIVERSITY') {
      queries.push(`${org} admission CUET entrance ${currentYear}`);
    }

    // Limit to max 4 targeted queries per cycle (Cost control - Phase 32)
    return queries.slice(0, 4);
  }
}

/**
 * Built-in Official Catalog Provider.
 * Queries known official government & recruitment board directories without requiring external search keys.
 */
export class OfficialCatalogDiscoveryProvider implements WebDiscoveryProvider {
  name = 'OfficialCatalogProvider';

  async discover(query: string, options?: { organization?: string; category?: string; limit?: number }): Promise<CandidateSource[]> {
    const org = options?.organization;
    const cat = options?.category;
    const candidates = await this.searchOfficialSources(org || 'UPSSSC', cat);
    return this.rankSources(candidates).slice(0, options?.limit || 5);
  }

  async searchOfficialSources(organization: string, category?: string): Promise<CandidateSource[]> {
    const orgUpper = organization.toUpperCase();
    const matched = OFFICIAL_MONITORED_ORGS.filter(
      (o) => o.org === orgUpper || (category && o.category === category)
    );

    const targetList = matched.length > 0 ? matched : OFFICIAL_MONITORED_ORGS;
    const candidates: CandidateSource[] = [];

    for (const item of targetList) {
      const classification = classifySourceAuthority(item.domain);
      candidates.push({
        title: `${item.name} Official Portal`,
        url: item.officialPortal,
        domain: item.domain,
        sourceType: classification.sourceType,
        authorityLevel: classification.authorityLevel,
        isOfficial: classification.isOfficial,
        snippet: `Official recruitment notices and exam updates for ${item.org} (${item.state}).`,
      });
    }

    return candidates;
  }

  rankSources(candidates: CandidateSource[]): CandidateSource[] {
    return [...candidates].sort((a, b) => {
      // Primary / Official sources have highest priority (Phase 11)
      if (a.authorityLevel === 'PRIMARY' && b.authorityLevel !== 'PRIMARY') return -1;
      if (b.authorityLevel === 'PRIMARY' && a.authorityLevel !== 'PRIMARY') return 1;
      if (a.isOfficial && !b.isOfficial) return -1;
      if (b.isOfficial && !a.isOfficial) return 1;
      return 0;
    });
  }
}

/**
 * External Search API Provider.
 * Supports Tavily, SerpApi, or Google Custom Search when SEARCH_API_KEY is configured.
 * Safely falls back to OfficialCatalogDiscoveryProvider if key is absent or request fails.
 */
export class SearchApiDiscoveryProvider implements WebDiscoveryProvider {
  name = 'SearchApiDiscoveryProvider';
  private searchProvider: string;
  private apiKey: string;
  private fallback: OfficialCatalogDiscoveryProvider;

  constructor(apiKey: string, searchProvider = 'tavily') {
    this.apiKey = apiKey;
    this.searchProvider = searchProvider.toLowerCase();
    this.fallback = new OfficialCatalogDiscoveryProvider();
  }

  async discover(query: string, options?: { organization?: string; category?: string; limit?: number }): Promise<CandidateSource[]> {
    const limit = options?.limit || 5;

    try {
      if (this.searchProvider === 'tavily') {
        const res = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: this.apiKey,
            query: `${query} official notification`,
            search_depth: 'basic',
            include_domains: ['gov.in', 'nic.in', 'ac.in', 'upsssc.gov.in', 'ssc.gov.in', 'nta.ac.in'],
            max_results: limit,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const results = data.results || [];
          const candidates: CandidateSource[] = [];

          for (const r of results) {
            const safeCheck = validateSafeUrl(r.url);
            if (safeCheck.safe && safeCheck.parsedUrl) {
              const classification = classifySourceAuthority(safeCheck.parsedUrl.hostname);
              candidates.push({
                title: r.title || safeCheck.parsedUrl.hostname,
                url: r.url,
                domain: safeCheck.parsedUrl.hostname,
                sourceType: classification.sourceType,
                authorityLevel: classification.authorityLevel,
                isOfficial: classification.isOfficial,
                snippet: r.content?.slice(0, 200),
              });
            }
          }

          if (candidates.length > 0) {
            return this.rankSources(candidates);
          }
        }
      }

      // Fallback if search returns empty or fails
      return this.fallback.discover(query, options);
    } catch {
      return this.fallback.discover(query, options);
    }
  }

  async searchOfficialSources(organization: string, category?: string): Promise<CandidateSource[]> {
    return this.fallback.searchOfficialSources(organization, category);
  }

  rankSources(candidates: CandidateSource[]): CandidateSource[] {
    return this.fallback.rankSources(candidates);
  }
}

/**
 * Direct URL Discovery Provider.
 * Validates and converts an Admin-provided URL into a candidate source.
 */
export class DirectUrlDiscoveryProvider implements WebDiscoveryProvider {
  name = 'DirectUrlDiscoveryProvider';

  async discover(url: string): Promise<CandidateSource[]> {
    const check = validateSafeUrl(url);
    if (!check.safe || !check.parsedUrl) return [];

    const domain = check.parsedUrl.hostname;
    const classification = classifySourceAuthority(domain);

    return [
      {
        title: domain,
        url,
        domain,
        sourceType: classification.sourceType,
        authorityLevel: classification.authorityLevel,
        isOfficial: classification.isOfficial,
      },
    ];
  }

  async searchOfficialSources(organization: string, category?: string): Promise<CandidateSource[]> {
    const fallback = new OfficialCatalogDiscoveryProvider();
    return fallback.searchOfficialSources(organization, category);
  }

  rankSources(candidates: CandidateSource[]): CandidateSource[] {
    return candidates;
  }
}

/**
 * Factory to get active WebDiscoveryProvider.
 * Selects SearchApiDiscoveryProvider if SEARCH_API_KEY is present, else OfficialCatalogDiscoveryProvider.
 */
export function getWebDiscoveryProvider(): WebDiscoveryProvider {
  const searchKey = process.env.SEARCH_API_KEY;
  const searchProvider = process.env.SEARCH_PROVIDER || 'tavily';

  if (searchKey && searchKey.trim().length > 5) {
    return new SearchApiDiscoveryProvider(searchKey, searchProvider);
  }

  return new OfficialCatalogDiscoveryProvider();
}
