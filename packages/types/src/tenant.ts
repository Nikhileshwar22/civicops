// ============================================================
// Tenant Types
// ============================================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logoUrl?: string;
  isActive: boolean;
  settings: TenantSettings;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSettings {
  timezone: string;
  locale: string;
  slaDefaults: SlaDefaults;
  features: TenantFeatures;
}

export interface SlaDefaults {
  low: number;      // hours
  medium: number;
  high: number;
  critical: number;
}

export interface TenantFeatures {
  aiEnabled: boolean;
  webhooksEnabled: boolean;
  ragEnabled: boolean;
  mapEnabled: boolean;
}

export interface CreateTenantRequest {
  name: string;
  slug: string;
  domain?: string;
  settings?: Partial<TenantSettings>;
}

export interface UpdateTenantRequest {
  name?: string;
  domain?: string;
  logoUrl?: string;
  isActive?: boolean;
  settings?: Partial<TenantSettings>;
}
