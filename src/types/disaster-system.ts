export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'ENCODER' | 'VIEWER';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  agencyDivision: string;
  contactNumber: string;
  isActive: boolean;
  createdAt: string;
}

export type IncidentCategory = 'NATURAL' | 'MAN_MADE' | 'HYDRO_MET' | 'SEISMIC';
export type IncidentSeverity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type VerificationStatus = 'DRAFT' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';

export interface IncidentReport {
  id?: string;
  incidentNumber: string;
  category: IncidentCategory;
  subType: string;
  severity: IncidentSeverity;
  status: VerificationStatus;
  reportedAt: string;
  location: {
    address: string;
    barangay: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  impact: {
    affectedFamilies: number;
    affectedIndividuals: number;
    displacedInsideEvac: number;
    displacedOutsideEvac: number;
    casualties: {
      dead: number;
      injured: number;
      missing: number;
    };
    infrastructureDamageEstimatedPHP: number;
  };
  narrative: string;
  mediaAttachments: {
    url: string;
    storagePath: string;
    fileType: 'image' | 'video';
    uploadedBy: string;
  }[];
  encodedBy: {
    uid: string;
    name: string;
  };
  reviewedBy?: {
    uid: string;
    name: string;
    reviewDate: string;
    rejectionReason?: string;
  };
  fingerprint?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface SITREP {
  id?: string;
  sitrepNumber: number;
  incidentId: string;
  incidentNumber: string;
  reportingPeriodStart: string;
  reportingPeriodEnd: string;
  currentSituationOverview: string;
  actionsTaken: string[];
  resourceDeploymentsSummary: {
    personnelDeployed: number;
    vehiclesDeployed: number;
    equipmentInField: string[];
  };
  criticalNeeds: string[];
  verifiedBySupervisor: boolean;
  publishedAt?: string;
  createdAt: any;
}

export interface ResourceInventory {
  id?: string;
  name: string;
  category: 'VEHICLE' | 'MEDICAL' | 'HEAVY_EQUIPMENT' | 'SEARCH_AND_RESCUE' | 'RELIEF_GOODS';
  totalStock: number;
  deployedQuantity: number;
  availableQuantity: number;
  unit: string;
  assignedStation: string;
  condition: 'OPERATIONAL' | 'NEEDS_MAINTENANCE' | 'DEPLETED';
  lastUpdated: any;
}

export interface EarlyWarningAlert {
  id?: string;
  source: 'PAGASA' | 'PHIVOLCS' | 'INTERNAL_EOC';
  externalAlertId?: string;
  title: string;
  description: string;
  alertLevel: 'ADVISORY' | 'WATCH' | 'WARNING' | 'EMERGENCY';
  affectedBarangays: string[];
  issuedAt: string;
  expiresAt: string;
  isActive: boolean;
  metadata?: Record<string, any>;
}
