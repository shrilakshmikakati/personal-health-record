use candid::Principal;
use std::collections::HashMap;
use ic_cdk::api::time;
use crate::types::*;

type HealthRecords = HashMap<String, HealthRecord>;
type UserRecords = HashMap<Principal, Vec<String>>;
type Patients = HashMap<Principal, Patient>;
type Providers = HashMap<Principal, HealthcareProvider>;
type ShareRequests = HashMap<String, ShareRequest>;

// Storage
thread_local! {
    static HEALTH_RECORDS: std::cell::RefCell<HealthRecords> = std::cell::RefCell::new(HashMap::new());
    static USER_RECORDS: std::cell::RefCell<UserRecords> = std::cell::RefCell::new(HashMap::new());
    static PATIENTS: std::cell::RefCell<Patients> = std::cell::RefCell::new(HashMap::new());
    static PROVIDERS: std::cell::RefCell<Providers> = std::cell::RefCell::new(HashMap::new());
    static SHARE_REQUESTS: std::cell::RefCell<ShareRequests> = std::cell::RefCell::new(HashMap::new());
}

// ========== HEALTH RECORDS ==========

pub fn create_health_record(caller: Principal, request: CreateRecordRequest) -> Result<HealthRecord, String> {
    let record_id = generate_record_id();
    let current_time = time();
    
    let record = HealthRecord {
        id: record_id.clone(),
        patient_id: caller,
        title: request.title,
        description: request.description,
        record_type: request.record_type,
        date_created: current_time,
        date_updated: current_time,
        data: request.data,
        shared_with: Vec::new(),
        is_public: false,
    };

    HEALTH_RECORDS.with(|records| {
        let mut map = records.borrow_mut();
        if map.contains_key(&record_id) {
            return Err("Record already exists".to_string());
        }
        map.insert(record_id.clone(), record.clone());
        Ok(())
    })?;

    USER_RECORDS.with(|user_map| {
        let mut user_map = user_map.borrow_mut();
        user_map.entry(caller).or_default().push(record_id);
    });

    Ok(record)
}

pub fn get_health_record(record_id: &String) -> Result<HealthRecord, String> {
    HEALTH_RECORDS.with(|records| {
        records
            .borrow()
            .get(record_id)
            .cloned()
            .ok_or("Record not found".to_string())
    })
}

pub fn update_health_record(record_id: &String, caller: Principal, request: UpdateRecordRequest) -> Result<HealthRecord, String> {
    HEALTH_RECORDS.with(|records| {
        let mut map = records.borrow_mut();
        if let Some(existing) = map.get_mut(record_id) {
            if existing.patient_id != caller {
                return Err("Unauthorized".to_string());
            }
            
            // Update fields if provided
            if let Some(title) = request.title {
                existing.title = title;
            }
            if let Some(description) = request.description {
                existing.description = description;
            }
            if let Some(data) = request.data {
                existing.data = data;
            }
            existing.date_updated = time();
            
            Ok(existing.clone())
        } else {
            Err("Record not found".to_string())
        }
    })
}

pub fn delete_health_record(record_id: &String, caller: Principal) -> Result<(), String> {
    let record = get_health_record(record_id)?;
    
    if record.patient_id != caller {
        return Err("Unauthorized".to_string());
    }

    HEALTH_RECORDS.with(|records| {
        records.borrow_mut().remove(record_id);
    });

    USER_RECORDS.with(|users| {
        let mut map = users.borrow_mut();
        if let Some(vec) = map.get_mut(&record.patient_id) {
            vec.retain(|id| id != record_id);
        }
    });

    Ok(())
}

pub fn can_access_record(record_id: &String, caller: Principal) -> bool {
    match get_health_record(record_id) {
        Ok(record) => record.patient_id == caller || record.shared_with.contains(&caller),
        Err(_) => false,
    }
}

pub fn get_caller_records(caller: Principal) -> Vec<HealthRecord> {
    get_user_records(caller)
}

pub fn get_user_records(patient_id: Principal) -> Vec<HealthRecord> {
    USER_RECORDS.with(|users| {
        let ids = users.borrow().get(&patient_id).cloned().unwrap_or_default();
        HEALTH_RECORDS.with(|records| {
            let map = records.borrow();
            ids.iter()
                .filter_map(|id| map.get(id))
                .cloned()
                .collect()
        })
    })
}

pub fn get_shared_records_for_provider(provider: Principal) -> Vec<HealthRecord> {
    HEALTH_RECORDS.with(|records| {
        records
            .borrow()
            .values()
            .filter(|r| r.shared_with.contains(&provider))
            .cloned()
            .collect()
    })
}

// ========== PATIENTS ==========

pub fn create_patient(patient: Patient) -> Result<Patient, String> {
    let id = patient.id;
    PATIENTS.with(|p| {
        let mut map = p.borrow_mut();
        if map.contains_key(&id) {
            return Err("Patient already exists".to_string());
        }
        map.insert(id, patient.clone());
        Ok(patient)
    })
}

pub fn get_patient(id: Principal) -> Option<Patient> {
    PATIENTS.with(|p| p.borrow().get(&id).cloned())
}

pub fn update_patient(id: Principal, updated: Patient) -> Result<Patient, String> {
    PATIENTS.with(|p| {
        let mut map = p.borrow_mut();
        if !map.contains_key(&id) {
            return Err("Patient not found".to_string());
        }
        map.insert(id, updated.clone());
        Ok(updated)
    })
}

// ========== PROVIDERS ==========

pub fn create_healthcare_provider(provider: HealthcareProvider) -> Result<HealthcareProvider, String> {
    let id = provider.id;
    PROVIDERS.with(|p| {
        let mut map = p.borrow_mut();
        if map.contains_key(&id) {
            return Err("Provider already exists".to_string());
        }
        map.insert(id, provider.clone());
        Ok(provider)
    })
}

pub fn get_healthcare_provider(id: Principal) -> Option<HealthcareProvider> {
    PROVIDERS.with(|p| p.borrow().get(&id).cloned())
}

pub fn get_all_healthcare_providers() -> Vec<HealthcareProvider> {
    PROVIDERS.with(|p| p.borrow().values().cloned().collect())
}

// ========== SHARE REQUESTS ==========

pub fn create_share_request(
    patient_id: Principal,
    provider_id: Principal,
    record_ids: Vec<String>,
    message: String,
) -> Result<ShareRequest, String> {
    let request_id = format!("req-{}", time());
    let current_time = time();
    let expires_at = current_time + (7 * 24 * 60 * 60 * 1_000_000_000); // 7 days in nanoseconds

    let request = ShareRequest {
        id: request_id.clone(),
        patient_id,
        provider_id,
        record_ids,
        requested_at: current_time,
        expires_at,
        status: ShareStatus::Pending,
        message,
    };

    SHARE_REQUESTS.with(|reqs| {
        reqs.borrow_mut().insert(request_id.clone(), request.clone());
    });

    Ok(request)
}

pub fn approve_share_request(request_id: &String, caller: Principal) -> Result<ShareRequest, String> {
    SHARE_REQUESTS.with(|reqs| {
        let mut map = reqs.borrow_mut();
        if let Some(req) = map.get_mut(request_id) {
            if req.patient_id != caller {
                return Err("Unauthorized".to_string());
            }
            
            if req.status != ShareStatus::Pending {
                return Err("Request is not pending".to_string());
            }
            
            if time() > req.expires_at {
                req.status = ShareStatus::Expired;
                return Err("Request has expired".to_string());
            }
            
            req.status = ShareStatus::Approved;
            
            // Update the health records to share with provider
            HEALTH_RECORDS.with(|recs| {
                let mut records = recs.borrow_mut();
                for record_id in &req.record_ids {
                    if let Some(record) = records.get_mut(record_id) {
                        if record.patient_id == caller && !record.shared_with.contains(&req.provider_id) {
                            record.shared_with.push(req.provider_id);
                        }
                    }
                }
            });
            
            Ok(req.clone())
        } else {
            Err("Request not found".to_string())
        }
    })
}

pub fn get_share_requests_for_patient(patient_id: Principal) -> Vec<ShareRequest> {
    SHARE_REQUESTS.with(|reqs| {
        reqs.borrow()
            .values()
            .filter(|r| r.patient_id == patient_id)
            .cloned()
            .collect()
    })
}

// ========== STATS ==========

pub fn get_total_records_count() -> u64 {
    HEALTH_RECORDS.with(|r| r.borrow().len() as u64)
}

pub fn get_total_patients_count() -> u64 {
    PATIENTS.with(|r| r.borrow().len() as u64)
}

pub fn get_total_providers_count() -> u64 {
    PROVIDERS.with(|r| r.borrow().len() as u64)
}

// ========== HELPERS ==========

pub fn generate_record_id() -> String {
    format!("rec-{}", time())
}

