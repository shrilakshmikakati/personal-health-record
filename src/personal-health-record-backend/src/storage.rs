use candid::Principal;
use ic_cdk::api::time;
use std::collections::HashMap;
use std::cell::RefCell;
use uuid::Uuid;

use crate::types::*;

// Thread-local storage
thread_local! {
    static HEALTH_RECORDS: RefCell<HashMap<String, HealthRecord>> = RefCell::new(HashMap::new());
    static PATIENTS: RefCell<HashMap<Principal, Patient>> = RefCell::new(HashMap::new());
    static HEALTHCARE_PROVIDERS: RefCell<HashMap<Principal, HealthcareProvider>> = RefCell::new(HashMap::new());
    static SHARE_REQUESTS: RefCell<HashMap<String, ShareRequest>> = RefCell::new(HashMap::new());
    static PATIENT_RECORDS: RefCell<HashMap<Principal, Vec<String>>> = RefCell::new(HashMap::new());
}

// Health Record Functions
pub fn create_health_record(
    patient_id: Principal,
    request: CreateRecordRequest,
) -> Result<HealthRecord, String> {
    let record_id = Uuid::new_v4().to_string();
    let now = time();

    let record = HealthRecord {
        id: record_id.clone(),
        patient_id,
        title: request.title,
        description: request.description,
        record_type: request.record_type,
        date_created: now,
        date_updated: now,
        data: request.data,
        shared_with: Vec::new(),
        is_public: false,
    };

    HEALTH_RECORDS.with(|records| {
        records.borrow_mut().insert(record_id.clone(), record.clone());
    });

    PATIENT_RECORDS.with(|patient_records| {
        let mut records = patient_records.borrow_mut();
        records.entry(patient_id).or_insert_with(Vec::new).push(record_id);
    });

    Ok(record)
}

pub fn get_health_record(record_id: &str) -> Option<HealthRecord> {
    HEALTH_RECORDS.with(|records| {
        records.borrow().get(record_id).cloned()
    })
}

pub fn update_health_record(
    record_id: &str,
    patient_id: Principal,
    request: UpdateRecordRequest,
) -> Result<HealthRecord, String> {
    HEALTH_RECORDS.with(|records| {
        let mut records = records.borrow_mut();
        
        if let Some(record) = records.get_mut(record_id) {
            // Verify ownership
            if record.patient_id != patient_id {
                return Err("Unauthorized: You can only update your own records".to_string());
            }

            // Update fields
            if let Some(title) = request.title {
                record.title = title;
            }
            if let Some(description) = request.description {
                record.description = description;
            }
            if let Some(data) = request.data {
                record.data = data;
            }
            
            record.date_updated = time();
            
            Ok(record.clone())
        } else {
            Err("Record not found".to_string())
        }
    })
}

pub fn delete_health_record(record_id: &str, patient_id: Principal) -> Result<(), String> {
    HEALTH_RECORDS.with(|records| {
        let mut records = records.borrow_mut();
        
        if let Some(record) = records.get(record_id) {
            // Verify ownership
            if record.patient_id != patient_id {
                return Err("Unauthorized: You can only delete your own records".to_string());
            }
            
            records.remove(record_id);
            
            // Remove from patient records
            PATIENT_RECORDS.with(|patient_records| {
                let mut patient_records = patient_records.borrow_mut();
                if let Some(record_list) = patient_records.get_mut(&patient_id) {
                    record_list.retain(|id| id != record_id);
                }
            });
            
            Ok(())
        } else {
            Err("Record not found".to_string())
        }
    })
}

pub fn get_patient_records(patient_id: Principal) -> Vec<HealthRecord> {
    PATIENT_RECORDS.with(|patient_records| {
        let patient_records = patient_records.borrow();
        if let Some(record_ids) = patient_records.get(&patient_id) {
            HEALTH_RECORDS.with(|records| {
                let records = records.borrow();
                record_ids
                    .iter()
                    .filter_map(|id| records.get(id).cloned())
                    .collect()
            })
        } else {
            Vec::new()
        }
    })
}

// Patient Functions
pub fn create_patient(patient: Patient) -> Result<Patient, String> {
    PATIENTS.with(|patients| {
        let mut patients = patients.borrow_mut();
        
        if patients.contains_key(&patient.id) {
            return Err("Patient already exists".to_string());
        }
        
        patients.insert(patient.id, patient.clone());
        Ok(patient)
    })
}

pub fn get_patient(patient_id: Principal) -> Option<Patient> {
    PATIENTS.with(|patients| {
        patients.borrow().get(&patient_id).cloned()
    })
}

pub fn update_patient(patient_id: Principal, updated_patient: Patient) -> Result<Patient, String> {
    PATIENTS.with(|patients| {
        let mut patients = patients.borrow_mut();
        
        if patients.contains_key(&patient_id) {
            patients.insert(patient_id, updated_patient.clone());
            Ok(updated_patient)
        } else {
            Err("Patient not found".to_string())
        }
    })
}

// Healthcare Provider Functions
pub fn create_healthcare_provider(provider: HealthcareProvider) -> Result<HealthcareProvider, String> {
    HEALTHCARE_PROVIDERS.with(|providers| {
        let mut providers = providers.borrow_mut();
        
        if providers.contains_key(&provider.id) {
            return Err("Healthcare provider already exists".to_string());
        }
        
        providers.insert(provider.id, provider.clone());
        Ok(provider)
    })
}

pub fn get_healthcare_provider(provider_id: Principal) -> Option<HealthcareProvider> {
    HEALTHCARE_PROVIDERS.with(|providers| {
        providers.borrow().get(&provider_id).cloned()
    })
}

pub fn get_all_healthcare_providers() -> Vec<HealthcareProvider> {
    HEALTHCARE_PROVIDERS.with(|providers| {
        providers.borrow().values().cloned().collect()
    })
}

// Share Functions
pub fn create_share_request(
    patient_id: Principal,
    provider_id: Principal,
    record_ids: Vec<String>,
    message: String,
) -> Result<ShareRequest, String> {
    let request_id = Uuid::new_v4().to_string();
    let now = time();
    let expires_at = now + (30 * 24 * 60 * 60 * 1_000_000_000); // 30 days in nanoseconds

    let share_request = ShareRequest {
        id: request_id.clone(),
        patient_id,
        provider_id,
        record_ids,
        requested_at: now,
        expires_at,
        status: ShareStatus::Pending,
        message,
    };

    SHARE_REQUESTS.with(|requests| {
        requests.borrow_mut().insert(request_id.clone(), share_request.clone());
    });

    Ok(share_request)
}

pub fn approve_share_request(request_id: &str, patient_id: Principal) -> Result<ShareRequest, String> {
    SHARE_REQUESTS.with(|requests| {
        let mut requests = requests.borrow_mut();
        
        if let Some(request) = requests.get_mut(request_id) {
            if request.patient_id != patient_id {
                return Err("Unauthorized: You can only approve your own share requests".to_string());
            }
            
            if request.status != ShareStatus::Pending {
                return Err("Request is no longer pending".to_string());
            }
            
            if time() > request.expires_at {
                request.status = ShareStatus::Expired;
                return Err("Request has expired".to_string());
            }
            
            request.status = ShareStatus::Approved;
            
            // Grant access to records
            HEALTH_RECORDS.with(|health_records| {
                let mut health_records = health_records.borrow_mut();
                for record_id in &request.record_ids {
                    if let Some(record) = health_records.get_mut(record_id) {
                        if record.patient_id == patient_id {
                            record.shared_with.push(request.provider_id);
                        }
                    }
                }
            });
            
            Ok(request.clone())
        } else {
            Err("Share request not found".to_string())
        }
    })
}

pub fn get_share_requests_for_patient(patient_id: Principal) -> Vec<ShareRequest> {
    SHARE_REQUESTS.with(|requests| {
        requests
            .borrow()
            .values()
            .filter(|request| request.patient_id == patient_id)
            .cloned()
            .collect()
    })
}

pub fn get_shared_records_for_provider(provider_id: Principal) -> Vec<HealthRecord> {
    HEALTH_RECORDS.with(|records| {
        records
            .borrow()
            .values()
            .filter(|record| record.shared_with.contains(&provider_id))
            .cloned()
            .collect()
    })
}

// Utility Functions
pub fn get_caller_records(caller: Principal) -> Vec<HealthRecord> {
    // Check if caller is a patient
    if PATIENTS.with(|patients| patients.borrow().contains_key(&caller)) {
        return get_patient_records(caller);
    }
    
    // Check if caller is a healthcare provider
    if HEALTHCARE_PROVIDERS.with(|providers| providers.borrow().contains_key(&caller)) {
        return get_shared_records_for_provider(caller);
    }
    
    Vec::new()
}

pub fn can_access_record(record_id: &str, caller: Principal) -> bool {
    HEALTH_RECORDS.with(|records| {
        if let Some(record) = records.borrow().get(record_id) {
            record.patient_id == caller || record.shared_with.contains(&caller)
        } else {
            false
        }
    })
}