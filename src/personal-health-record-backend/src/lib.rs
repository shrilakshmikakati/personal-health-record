// backend/src/lib.rs
use candid::{CandidType, Principal};
use ic_cdk::api::time;
use ic_cdk_macros::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap};

type Memory = VirtualMemory<DefaultMemoryImpl>;

// Data structures
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct HealthRecord {
    pub id: String,
    pub patient_id: Principal,
    pub title: String,
    pub description: String,
    pub record_type: String, // "diagnosis", "prescription", "lab_result", etc.
    pub date_created: u64,
    pub date_of_record: String,
    pub provider_name: String,
    pub encrypted_data: String, // Encrypted medical data
    pub is_shared: bool,
    pub shared_with: Vec<Principal>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct User {
    pub id: Principal,
    pub name: String,
    pub email: String,
    pub user_type: String, // "patient" or "provider"
    pub date_registered: u64,
    pub is_verified: bool,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct AccessRequest {
    pub id: String,
    pub patient_id: Principal,
    pub provider_id: Principal,
    pub record_id: String,
    pub message: String,
    pub status: String, // "pending", "approved", "denied"
    pub date_requested: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: String,
}

// Global state management
thread_local! {
    static MEMORY_MANAGER: MemoryManager<DefaultMemoryImpl> = MemoryManager::init(DefaultMemoryImpl::default());
    
    static USERS: StableBTreeMap<Principal, User, Memory> = StableBTreeMap::init(
        MEMORY_MANAGER.with(|m| m.get(MemoryId::new(0)))
    );
    
    static RECORDS: StableBTreeMap<String, HealthRecord, Memory> = StableBTreeMap::init(
        MEMORY_MANAGER.with(|m| m.get(MemoryId::new(1)))
    );
    
    static ACCESS_REQUESTS: StableBTreeMap<String, AccessRequest, Memory> = StableBTreeMap::init(
        MEMORY_MANAGER.with(|m| m.get(MemoryId::new(2)))
    );
}

// Utility functions
fn generate_id() -> String {
    let timestamp = time();
    let caller = ic_cdk::caller();
    format!("{}_{}", timestamp, caller.to_text())
}

// User management
#[update]
fn register_user(name: String, email: String, user_type: String) -> ApiResponse<User> {
    let caller = ic_cdk::caller();
    
    // Check if user already exists
    let existing_user = USERS.with(|users| users.get(&caller));
    if existing_user.is_some() {
        return ApiResponse {
            success: false,
            data: None,
            message: "User already registered".to_string(),
        };
    }
    
    let user = User {
        id: caller,
        name,
        email,
        user_type,
        date_registered: time(),
        is_verified: true, // Auto-verify for simplicity
    };
    
    USERS.with(|users| users.insert(caller, user.clone()));
    
    ApiResponse {
        success: true,
        data: Some(user),
        message: "User registered successfully".to_string(),
    }
}

#[query]
fn get_user_profile() -> ApiResponse<User> {
    let caller = ic_cdk::caller();
    
    match USERS.with(|users| users.get(&caller)) {
        Some(user) => ApiResponse {
            success: true,
            data: Some(user),
            message: "User profile retrieved".to_string(),
        },
        None => ApiResponse {
            success: false,
            data: None,
            message: "User not found".to_string(),
        },
    }
}

// Health record management
#[update]
fn add_health_record(
    title: String,
    description: String,
    record_type: String,
    date_of_record: String,
    provider_name: String,
    encrypted_data: String,
) -> ApiResponse<HealthRecord> {
    let caller = ic_cdk::caller();
    
    // Verify user exists
    let user = USERS.with(|users| users.get(&caller));
    if user.is_none() {
        return ApiResponse {
            success: false,
            data: None,
            message: "User not registered".to_string(),
        };
    }
    
    let record_id = generate_id();
    let record = HealthRecord {
        id: record_id.clone(),
        patient_id: caller,
        title,
        description,
        record_type,
        date_created: time(),
        date_of_record,
        provider_name,
        encrypted_data,
        is_shared: false,
        shared_with: Vec::new(),
    };
    
    RECORDS.with(|records| records.insert(record_id, record.clone()));
    
    ApiResponse {
        success: true,
        data: Some(record),
        message: "Health record added successfully".to_string(),
    }
}

#[query]
fn get_my_health_records() -> ApiResponse<Vec<HealthRecord>> {
    let caller = ic_cdk::caller();
    
    let mut user_records = Vec::new();
    
    RECORDS.with(|records| {
        for (_, record) in records.iter() {
            if record.patient_id == caller {
                user_records.push(record);
            }
        }
    });
    
    ApiResponse {
        success: true,
        data: Some(user_records),
        message: "Health records retrieved".to_string(),
    }
}

#[query]
fn get_health_record(record_id: String) -> ApiResponse<HealthRecord> {
    let caller = ic_cdk::caller();
    
    match RECORDS.with(|records| records.get(&record_id)) {
        Some(record) => {
            // Check if caller has permission to view
            if record.patient_id == caller || record.shared_with.contains(&caller) {
                ApiResponse {
                    success: true,
                    data: Some(record),
                    message: "Health record retrieved".to_string(),
                }
            } else {
                ApiResponse {
                    success: false,
                    data: None,
                    message: "Access denied".to_string(),
                }
            }
        }
        None => ApiResponse {
            success: false,
            data: None,
            message: "Record not found".to_string(),
        },
    }
}

// Access control
#[update]
fn share_record_with_provider(record_id: String, provider_id: Principal) -> ApiResponse<String> {
    let caller = ic_cdk::caller();
    
    match RECORDS.with(|records| records.get(&record_id)) {
        Some(mut record) => {
            if record.patient_id != caller {
                return ApiResponse {
                    success: false,
                    data: None,
                    message: "Access denied - not your record".to_string(),
                };
            }
            
            if !record.shared_with.contains(&provider_id) {
                record.shared_with.push(provider_id);
                record.is_shared = true;
                
                RECORDS.with(|records| records.insert(record_id.clone(), record));
                
                ApiResponse {
                    success: true,
                    data: Some("Record shared successfully".to_string()),
                    message: "Record shared with provider".to_string(),
                }
            } else {
                ApiResponse {
                    success: false,
                    data: None,
                    message: "Record already shared with this provider".to_string(),
                }
            }
        }
        None => ApiResponse {
            success: false,
            data: None,
            message: "Record not found".to_string(),
        },
    }
}

#[update]
fn revoke_access(record_id: String, provider_id: Principal) -> ApiResponse<String> {
    let caller = ic_cdk::caller();
    
    match RECORDS.with(|records| records.get(&record_id)) {
        Some(mut record) => {
            if record.patient_id != caller {
                return ApiResponse {
                    success: false,
                    data: None,
                    message: "Access denied - not your record".to_string(),
                };
            }
            
            record.shared_with.retain(|&id| id != provider_id);
            record.is_shared = !record.shared_with.is_empty();
            
            RECORDS.with(|records| records.insert(record_id.clone(), record));
            
            ApiResponse {
                success: true,
                data: Some("Access revoked successfully".to_string()),
                message: "Provider access revoked".to_string(),
            }
        }
        None => ApiResponse {
            success: false,
            data: None,
            message: "Record not found".to_string(),
        },
    }
}

// Provider functions
#[query]
fn get_accessible_records() -> ApiResponse<Vec<HealthRecord>> {
    let caller = ic_cdk::caller();
    let mut accessible_records = Vec::new();
    
    RECORDS.with(|records| {
        for (_, record) in records.iter() {
            if record.shared_with.contains(&caller) {
                accessible_records.push(record);
            }
        }
    });
    
    ApiResponse {
        success: true,
        data: Some(accessible_records),
        message: "Accessible records retrieved".to_string(),
    }
}

// Statistics and utility
#[query]
fn get_platform_stats() -> ApiResponse<HashMap<String, u64>> {
    let mut stats = HashMap::new();
    
    let user_count = USERS.with(|users| users.len());
    let record_count = RECORDS.with(|records| records.len());
    
    stats.insert("total_users".to_string(), user_count);
    stats.insert("total_records".to_string(), record_count);
    
    ApiResponse {
        success: true,
        data: Some(stats),
        message: "Platform statistics retrieved".to_string(),
    }
}

// Export candid interface
ic_cdk::export_candid!();