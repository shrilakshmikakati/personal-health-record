use candid::{CandidType, Deserialize, Principal};
use serde::Serialize;
use std::collections::HashMap;

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct HealthRecord {
    pub id: String,
    pub patient_id: Principal,
    pub title: String,
    pub description: String,
    pub record_type: RecordType,
    pub date_created: u64,
    pub date_updated: u64,
    pub data: RecordData,
    pub shared_with: Vec<Principal>, // Healthcare providers who can access this record
    pub is_public: bool,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub enum RecordType {
    MedicalHistory,
    Prescription,
    LabResult,
    Vaccination,
    Allergy,
    Surgery,
    Consultation,
    Other,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct RecordData {
    pub medical_data: HashMap<String, String>,
    pub attachments: Vec<String>, // URLs or file hashes
    pub vital_signs: Option<VitalSigns>,
    pub medications: Vec<Medication>,
    pub notes: String,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct VitalSigns {
    pub blood_pressure: Option<String>,
    pub heart_rate: Option<u32>,
    pub temperature: Option<f32>,
    pub weight: Option<f32>,
    pub height: Option<f32>,
    pub oxygen_saturation: Option<u32>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct Medication {
    pub name: String,
    pub dosage: String,
    pub frequency: String,
    pub start_date: u64,
    pub end_date: Option<u64>,
    pub prescribed_by: String,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct Patient {
    pub id: Principal,
    pub name: String,
    pub email: String,
    pub date_of_birth: u64,
    pub gender: String,
    pub phone: String,
    pub address: String,
    pub emergency_contact: EmergencyContact,
    pub created_at: u64,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct EmergencyContact {
    pub name: String,
    pub relationship: String,
    pub phone: String,
    pub email: String,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct HealthcareProvider {
    pub id: Principal,
    pub name: String,
    pub specialty: String,
    pub license_number: String,
    pub hospital_affiliation: String,
    pub email: String,
    pub phone: String,
    pub verified: bool,
    pub created_at: u64,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct ShareRequest {
    pub id: String,
    pub patient_id: Principal,
    pub provider_id: Principal,
    pub record_ids: Vec<String>,
    pub requested_at: u64,
    pub expires_at: u64,
    pub status: ShareStatus,
    pub message: String,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub enum ShareStatus {
    Pending,
    Approved,
    Rejected,
    Expired,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct CreateRecordRequest {
    pub title: String,
    pub description: String,
    pub record_type: RecordType,
    pub data: RecordData,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct UpdateRecordRequest {
    pub id: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub data: Option<RecordData>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

// Helper functions for creating responses
impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        ApiResponse {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn error(message: String) -> Self {
        ApiResponse {
            success: false,
            data: None,
            error: Some(message),
        }
    }
}