import type {
  ComplianceMap,
  RegIntelData,
  Regulation,
} from "./types";

export const API_URL = "https://regintelx-backend.onrender.com";

function unwrapItems<T>(data: T[] | { items?: T[] }): T[] {
  return Array.isArray(data) ? data : data.items ?? [];
}

type SemanticSearchItem = {
  regulation_id: string;
  title: string;
  circular_number: string | null;
  published_date: string | null;
  effective_date: string | null;
  source_url: string;
  similarity?: number;
  evidence?: string | null;
};

export async function fetchRegIntelData(): Promise<RegIntelData> {
  const [
    sourcesResponse,
    regulationsResponse,
    mapsResponse,
    changesResponse,
  ] = await Promise.all([
    fetch(`${API_URL}/api/v1/sources`),
    fetch(`${API_URL}/api/v1/regulations`),
    fetch(`${API_URL}/api/v1/maps`),
    fetch(`${API_URL}/api/v1/changes`),
  ]);

  if (
    !sourcesResponse.ok ||
    !regulationsResponse.ok ||
    !mapsResponse.ok ||
    !changesResponse.ok
  ) {
    throw new Error("Failed to load API data");
  }

  const [sourcesData, regulationsData, mapsData, changesData] =
    await Promise.all([
      sourcesResponse.json(),
      regulationsResponse.json(),
      mapsResponse.json(),
      changesResponse.json(),
    ]);

  return {
    sources: unwrapItems(sourcesData),
    regulations: unwrapItems(regulationsData),
    maps: unwrapItems(mapsData),
    changes: unwrapItems(changesData),
  };
}

export async function fetchRegulation(id: string): Promise<Regulation> {
  const response = await fetch(`${API_URL}/api/v1/regulations/${id}`);

  if (!response.ok) {
    throw new Error("Regulation not found");
  }

  return response.json();
}

export async function searchRegulations(
  query: string,
  limit = 8
): Promise<Regulation[]> {
  const response = await fetch(
    `${API_URL}/api/v1/regulations/semantic-search?q=${encodeURIComponent(query)}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error("Semantic search failed");
  }

  const data = await response.json();

  return (data as SemanticSearchItem[]).map((item) => ({
    id: item.regulation_id,
    title: item.title,
    circular_number: item.circular_number,
    published_date: item.published_date,
    effective_date: item.effective_date,
    source_url: item.source_url,
    status: "active",
    summary: item.evidence,
    similarity: item.similarity,
    evidence: item.evidence,
  }));
}

export async function updateComplianceMapStatus(
  mapId: string,
  status: string
): Promise<ComplianceMap> {
  const response = await fetch(
    `${API_URL}/api/v1/maps/${mapId}/status?status=${encodeURIComponent(status)}`,
    {
      method: "PATCH",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update status");
  }

  return response.json();
}
