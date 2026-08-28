export type Source = {
  id: string;
  name: string;
  authority: string;
  base_url: string;
  source_type: string;
  is_active: boolean;
};

export type Regulation = {
  id: string;
  title: string;
  circular_number: string | null;
  published_date: string | null;
  effective_date: string | null;
  source_url: string;
  status: string;
  summary?: string | null;
  similarity?: number;
  evidence?: string | null;
};

export type ComplianceMap = {
  id: string;
  regulation_id: string;
  change_id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  due_date: string | null;
  risk_score: number;
  required_evidence: string;
  created_at: string;
  updated_at: string;
};

export type RegulationChange = {
  id: string;
  regulation_id: string;
  previous_version_id: string | null;
  new_version_id: string;
  change_type: string;
  change_summary: string;
  impact_level: string;
  affected_domains: string[];
  ai_confidence: number | null;
  created_at: string;
};

export type RegIntelData = {
  sources: Source[];
  regulations: Regulation[];
  maps: ComplianceMap[];
  changes: RegulationChange[];
};
