import { Principal } from '@dfinity/principal';

// Record types matching your IDL
export type RecordType = 
  | 'MedicalHistory'
  | 'Prescription'
  | 'Vaccination'
  | 'Surgery'
  | 'Appointment'
  | 'LabResult'
  | 'Insurance'
  | 'Medication'
  | 'Allergy'
  | 'Other';

// Health Record type
export interface HealthRecord {
  id: string;
  title: string;
  description: string;
  patient_id: Principal;
  date_updated: bigint;
  record_type: RecordType;
  date_created: bigint;
  shared_with: Principal[];
  metadata: [string, string][];
  is_shared: boolean;
}

// Request types for creating and updating records
export interface CreateHealthRecordRequest {
  title: string;
  description: string;
  record_type: RecordType;
  metadata?: [string, string][];
}

export interface UpdateHealthRecordRequest {
  title?: string;
  description?: string;
  record_type?: RecordType;
  metadata?: [string, string][];
}

// Patient type
export interface Patient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_birth?: Date;
  principal_id: Principal;
}

// Share request type
export interface ShareRequest {
  id: string;
  record_id: string;
  requester_id: Principal;
  patient_id: Principal;
  status: 'Pending' | 'Approved' | 'Rejected';
  requested_at: bigint;
  responded_at?: bigint;
  message?: string;
}

// Canister info type
export interface CanisterInfo {
  total_records: bigint;
  canister_id: Principal;
  total_users: bigint;
}