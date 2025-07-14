import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type ApiResponse = {
    'error' : {
      'data' : [] | [
        { 'VecHealthRecord' : Array<HealthRecord> } |
          { 'Stats' : Array<[string, bigint]> } |
          { 'ShareRequest' : ShareRequest } |
          { 'HealthRecord' : HealthRecord } |
          { 'String' : string } |
          { 'HealthcareProvider' : HealthcareProvider } |
          { 'Patient' : Patient } |
          { 'VecHealthcareProvider' : Array<HealthcareProvider> } |
          { 'VecShareRequest' : Array<ShareRequest> }
      ],
      'error' : [] | [string],
      'success' : boolean,
    }
  } |
  {
    'success' : {
      'data' : [] | [
        { 'VecHealthRecord' : Array<HealthRecord> } |
          { 'Stats' : Array<[string, bigint]> } |
          { 'ShareRequest' : ShareRequest } |
          { 'HealthRecord' : HealthRecord } |
          { 'String' : string } |
          { 'HealthcareProvider' : HealthcareProvider } |
          { 'Patient' : Patient } |
          { 'VecHealthcareProvider' : Array<HealthcareProvider> } |
          { 'VecShareRequest' : Array<ShareRequest> }
      ],
      'error' : [] | [string],
      'success' : boolean,
    }
  };
export interface CreateRecordRequest {
  'title' : string,
  'record_type' : RecordType,
  'data' : RecordData,
  'description' : string,
}
export interface EmergencyContact {
  'relationship' : string,
  'name' : string,
  'email' : string,
  'phone' : string,
}
export interface HealthRecord {
  'id' : string,
  'is_public' : boolean,
  'patient_id' : Principal,
  'title' : string,
  'record_type' : RecordType,
  'date_created' : bigint,
  'data' : RecordData,
  'description' : string,
  'date_updated' : bigint,
  'shared_with' : Array<Principal>,
}
export interface HealthcareProvider {
  'id' : Principal,
  'license_number' : string,
  'verified' : boolean,
  'name' : string,
  'created_at' : bigint,
  'email' : string,
  'specialty' : string,
  'phone' : string,
  'hospital_affiliation' : string,
}
export interface Medication {
  'dosage' : string,
  'name' : string,
  'end_date' : [] | [bigint],
  'start_date' : bigint,
  'prescribed_by' : string,
  'frequency' : string,
}
export interface Patient {
  'id' : Principal,
  'name' : string,
  'created_at' : bigint,
  'email' : string,
  'address' : string,
  'gender' : string,
  'emergency_contact' : EmergencyContact,
  'date_of_birth' : bigint,
  'phone' : string,
}
export interface RecordData {
  'medical_data' : Array<[string, string]>,
  'medications' : Array<Medication>,
  'vital_signs' : [] | [VitalSigns],
  'notes' : string,
  'attachments' : Array<string>,
}
export type RecordType = { 'Vaccination' : null } |
  { 'Surgery' : null } |
  { 'Allergy' : null } |
  { 'MedicalHistory' : null } |
  { 'LabResult' : null } |
  { 'Consultation' : null } |
  { 'Other' : null } |
  { 'Prescription' : null };
export interface ShareRequest {
  'id' : string,
  'status' : ShareStatus,
  'patient_id' : Principal,
  'provider_id' : Principal,
  'record_ids' : Array<string>,
  'requested_at' : bigint,
  'message' : string,
  'expires_at' : bigint,
}
export type ShareStatus = { 'Approved' : null } |
  { 'Rejected' : null } |
  { 'Expired' : null } |
  { 'Pending' : null };
export interface UpdateRecordRequest {
  'title' : [] | [string],
  'data' : [] | [RecordData],
  'description' : [] | [string],
}
export interface VitalSigns {
  'weight' : [] | [number],
  'height' : [] | [number],
  'blood_pressure' : [] | [string],
  'temperature' : [] | [number],
  'oxygen_saturation' : [] | [number],
  'heart_rate' : [] | [number],
}
export interface _SERVICE {
  'approve_share_request' : ActorMethod<[string], ApiResponse>,
  'create_health_record' : ActorMethod<[CreateRecordRequest], ApiResponse>,
  'create_share_request' : ActorMethod<
    [Principal, Array<string>, string],
    ApiResponse
  >,
  'delete_health_record' : ActorMethod<[string], ApiResponse>,
  'get_all_healthcare_providers' : ActorMethod<[], ApiResponse>,
  'get_health_record' : ActorMethod<[string], ApiResponse>,
  'get_healthcare_provider_profile' : ActorMethod<[], ApiResponse>,
  'get_my_records' : ActorMethod<[], ApiResponse>,
  'get_my_share_requests' : ActorMethod<[], ApiResponse>,
  'get_patient_profile' : ActorMethod<[], ApiResponse>,
  'get_shared_records' : ActorMethod<[], ApiResponse>,
  'get_system_stats' : ActorMethod<[], ApiResponse>,
  'register_healthcare_provider' : ActorMethod<
    [HealthcareProvider],
    ApiResponse
  >,
  'register_patient' : ActorMethod<[Patient], ApiResponse>,
  'update_health_record' : ActorMethod<
    [string, UpdateRecordRequest],
    ApiResponse
  >,
  'update_patient_profile' : ActorMethod<[Patient], ApiResponse>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: ({ IDL }: { IDL: IDL }) => IDL.Type[];
