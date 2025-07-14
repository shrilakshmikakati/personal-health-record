use candid::Principal;
use ic_cdk_macros::*;
use std::collections::HashMap;

mod types;
mod storage;

use types::*;

// Health Record Management
#[update]
fn create_health_record(request: CreateRecordRequest) -> ApiResponse<HealthRecord> {
    let caller = ic_cdk::caller();
    
    match storage::create_health_record(caller, request) {
        Ok(record) => ApiResponse::success(record),
        Err(e) => ApiResponse::error(e),
    }
}

#[update]
fn update_health_record(record_id: String, request: UpdateRecordRequest) -> ApiResponse<HealthRecord> {
    let caller = ic_cdk::caller();
    
    match storage::update_health_record(&record_id, caller, request) {
        Ok(record) => ApiResponse::success(record),
        Err(e) => ApiResponse::error(e),
    }
}

#[update]
fn delete_health_record(record_id: String) -> ApiResponse<String> {
    let caller = ic_cdk::caller();
    
    match storage::delete_health_record(&record_id, caller) {
        Ok(_) => ApiResponse::success("Record deleted successfully".to_string()),
        Err(e) => ApiResponse::error(e),
    }
}

#[query]
fn get_health_record(record_id: String) -> ApiResponse<HealthRecord> {
    let caller = ic_cdk::caller();
    
    if !storage::can_access_record(&record_id, caller) {
        return ApiResponse::error("Unauthorized access".to_string());
    }
    
    match storage::get_health_record(&record_id) {
        Ok(record) => ApiResponse::success(record),
        Err(e) => ApiResponse::error(e),
    }
}

#[query]
fn get_my_records() -> ApiResponse<Vec<HealthRecord>> {
    let caller = ic_cdk::caller();
    let records = storage::get_caller_records(caller);
    ApiResponse::success(records)
}

// Patient Management
#[update]
fn register_patient(patient: Patient) -> ApiResponse<Patient> {
    match storage::create_patient(patient) {
        Ok(patient) => ApiResponse::success(patient),
        Err(e) => ApiResponse::error(e),
    }
}

#[query]
fn get_patient_profile() -> ApiResponse<Patient> {
    let caller = ic_cdk::caller();
    
    match storage::get_patient(caller) {
        Some(patient) => ApiResponse::success(patient),
        None => ApiResponse::error("Patient not found".to_string()),
    }
}

#[update]
fn update_patient_profile(patient: Patient) -> ApiResponse<Patient> {
    let caller = ic_cdk::caller();
    
    match storage::update_patient(caller, patient) {
        Ok(patient) => ApiResponse::success(patient),
        Err(e) => ApiResponse::error(e),
    }
}

// Healthcare Provider Management
#[update]
fn register_healthcare_provider(provider: HealthcareProvider) -> ApiResponse<HealthcareProvider> {
    match storage::create_healthcare_provider(provider) {
        Ok(provider) => ApiResponse::success(provider),
        Err(e) => ApiResponse::error(e),
    }
}

#[query]
fn get_healthcare_provider_profile() -> ApiResponse<HealthcareProvider> {
    let caller = ic_cdk::caller();
    
    match storage::get_healthcare_provider(caller) {
        Some(provider) => ApiResponse::success(provider),
        None => ApiResponse::error("Healthcare provider not found".to_string()),
    }
}

#[query]
fn get_all_healthcare_providers() -> ApiResponse<Vec<HealthcareProvider>> {
    let providers = storage::get_all_healthcare_providers();
    ApiResponse::success(providers)
}

// Sharing and Permissions
#[update]
fn create_share_request(
    provider_id: Principal,
    record_ids: Vec<String>,
    message: String,
) -> ApiResponse<ShareRequest> {
    let caller = ic_cdk::caller();
    
    match storage::create_share_request(caller, provider_id, record_ids, message) {
        Ok(request) => ApiResponse::success(request),
        Err(e) => ApiResponse::error(e),
    }
}

#[update]
fn approve_share_request(request_id: String) -> ApiResponse<ShareRequest> {
    let caller = ic_cdk::caller();
    
    match storage::approve_share_request(&request_id, caller) {
        Ok(request) => ApiResponse::success(request),
        Err(e) => ApiResponse::error(e),
    }
}

#[query]
fn get_my_share_requests() -> ApiResponse<Vec<ShareRequest>> {
    let caller = ic_cdk::caller();
    let requests = storage::get_share_requests_for_patient(caller);
    ApiResponse::success(requests)
}

#[query]
fn get_shared_records() -> ApiResponse<Vec<HealthRecord>> {
    let caller = ic_cdk::caller();
    let records = storage::get_shared_records_for_provider(caller);
    ApiResponse::success(records)
}

// System functions
#[query]
fn get_system_stats() -> ApiResponse<HashMap<String, u64>> {
    let caller = ic_cdk::caller();
    
    // Only allow system stats for registered users
    if storage::get_patient(caller).is_none() && storage::get_healthcare_provider(caller).is_none() {
        return ApiResponse::error("Unauthorized".to_string());
    }
    
    let mut stats = HashMap::new();
    stats.insert("total_records".to_string(), storage::get_total_records_count());
    stats.insert("total_patients".to_string(), storage::get_total_patients_count());
    stats.insert("total_providers".to_string(), storage::get_total_providers_count());
    
    ApiResponse::success(stats)
}

ic_cdk::export_candid!();

// Export Candid interface

#[query(name = "__get_candid_interface_tmp_hack")]
fn export_candid() -> String {
    __export_service()
}