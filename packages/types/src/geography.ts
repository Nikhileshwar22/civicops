// ============================================================
// Geography Types (Zone / Circle / Ward)
// ============================================================

export interface Zone {
  id: string;
  name: string;
  code: string;
  tenantId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Circle {
  id: string;
  name: string;
  code: string;
  zoneId: string;
  tenantId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Ward {
  id: string;
  name: string;
  number: number;
  circleId: string;
  zoneId: string;
  tenantId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ZoneWithCircles extends Zone {
  circles: CircleWithWards[];
}

export interface CircleWithWards extends Circle {
  wards: Ward[];
}

export interface CreateZoneRequest {
  name: string;
  code: string;
}

export interface CreateCircleRequest {
  name: string;
  code: string;
  zoneId: string;
}

export interface CreateWardRequest {
  name: string;
  number: number;
  circleId: string;
}
