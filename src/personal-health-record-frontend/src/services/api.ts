import { Actor, HttpAgent } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';
// Corrected import path based on the provided file structure
import { idlFactory } from './home/shrilakshmi/personal-health-record/src/personal-health-record-backend/personal-health-record-backend.did'; // Corrected path
import { CreateHealthRecordRequest, UpdateHealthRecordRequest, HealthRecord, ShareRequest } from '../types';

// Define the canister ID - you'll need to replace this with your actual canister ID
const canisterId = "your-canister-id-here"; // Replace with actual canister ID

// Define the service interface based on your IDL factory
interface _SERVICE {
  create_health_record: (request: CreateHealthRecordRequest) => Promise<{ Ok: HealthRecord } | { Err: string }>;
  get_my_records: () => Promise<HealthRecord[]>;
  get_record: (recordId: string) => Promise<{ Ok: HealthRecord } | { Err: string }>;
  update_health_record: (recordId: string, request: UpdateHealthRecordRequest) => Promise<{ Ok: HealthRecord } | { Err: string }>;
  share_record_with_doctor: (recordId: string, doctorId: string) => Promise<{ Ok: null } | { Err: string }>;
  revoke_access: (recordId: string, doctorId: string) => Promise<{ Ok: null } | { Err: string }>;
  get_shared_records: () => Promise<HealthRecord[]>;
  delete_record: (recordId: string) => Promise<{ Ok: null } | { Err: string }>;
  get_my_share_requests: () => Promise<ShareRequest[]>;
  get_canister_info: () => Promise<{
    total_records: bigint;
    canister_id: Principal;
    total_users: bigint;
  }>;
}

// API Response wrapper type
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Create the agent and actor
let agent: HttpAgent;
let actor: _SERVICE;

// Initialize the agent and actor
export const initializeAgent = async () => {
  // Create agent
  agent = new HttpAgent({
    host: process.env.DFX_NETWORK === 'ic' ? 'https://ic0.app' : 'http://localhost:4943',
  });

  // Fetch root key for certificate validation during development
  if (process.env.DFX_NETWORK !== 'ic') {
    try {
      await agent.fetchRootKey();
    } catch (err) {
      console.warn('Unable to fetch root key. Check to ensure that your local replica is running');
      console.error(err);
    }
  }

  // Create actor
  actor = Actor.createActor(idlFactory, {
    agent,
    canisterId,
  }) as _SERVICE;
};

// Initialize with auth client identity
export const initializeWithAuth = async (authClient: AuthClient) => {
  const identity = authClient.getIdentity();
  
  agent = new HttpAgent({
    identity,
    host: process.env.DFX_NETWORK === 'ic' ? 'https://ic0.app' : 'http://localhost:4943',
  });

  // Fetch root key for certificate validation during development
  if (process.env.DFX_NETWORK !== 'ic') {
    try {
      await agent.fetchRootKey();
    } catch (err) {
      console.warn('Unable to fetch root key. Check to ensure that your local replica is running');
      console.error(err);
    }
  }

  actor = Actor.createActor(idlFactory, {
    agent,
    canisterId,
  }) as _SERVICE;
};

// Health Records API functions
export const createHealthRecord = async (request: CreateHealthRecordRequest): Promise<ApiResponse<HealthRecord>> => {
  try {
    if (!actor) {
      throw new Error('Agent not initialized. Call initializeAgent first.');
    }

    const result = await actor.create_health_record(request);
    
    if ('Err' in result) {
      return { success: false, error: result.Err };
    }
    
    return { success: true, data: result.Ok };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const getMyRecords = async (): Promise<ApiResponse<HealthRecord[]>> => {
  try {
    if (!actor) {
      throw new Error('Agent not initialized. Call initializeAgent first.');
    }

    const records = await actor.get_my_records();
    return { success: true, data: records };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const getRecord = async (recordId: string): Promise<ApiResponse<HealthRecord>> => {
  try {
    if (!actor) {
      throw new Error('Agent not initialized. Call initializeAgent first.');
    }

    const result = await actor.get_record(recordId);
    
    if ('Err' in result) {
      return { success: false, error: result.Err };
    }
    
    return { success: true, data: result.Ok };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const updateRecord = async ( // Renamed from updateHealthRecord for consistency with call site
  recordId: string,
  request: UpdateHealthRecordRequest
): Promise<ApiResponse<HealthRecord>> => {
  try {
    if (!actor) {
      throw new Error('Agent not initialized. Call initializeAgent first.');
    }

    const result = await actor.update_health_record(recordId, request);
    
    if ('Err' in result) {
      return { success: false, error: result.Err };
    }
    
    return { success: true, data: result.Ok };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const shareRecordWithDoctor = async (recordId: string, doctorId: string): Promise<ApiResponse<void>> => {
  try {
    if (!actor) {
      throw new Error('Agent not initialized. Call initializeAgent first.');
    }

    const result = await actor.share_record_with_doctor(recordId, doctorId);
    
    if ('Err' in result) {
      return { success: false, error: result.Err };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const revokeAccess = async (recordId: string, doctorId: string): Promise<ApiResponse<void>> => {
  try {
    if (!actor) {
      throw new Error('Agent not initialized. Call initializeAgent first.');
    }

    const result = await actor.revoke_access(recordId, doctorId);
    
    if ('Err' in result) {
      return { success: false, error: result.Err };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const getSharedRecords = async (): Promise<ApiResponse<HealthRecord[]>> => {
  try {
    if (!actor) {
      throw new Error('Agent not initialized. Call initializeAgent first.');
    }

    const records = await actor.get_shared_records();
    return { success: true, data: records };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const deleteRecord = async (recordId: string): Promise<ApiResponse<void>> => {
  try {
    if (!actor) {
      throw new Error('Agent not initialized. Call initializeAgent first.');
    }

    const result = await actor.delete_record(recordId);
    
    if ('Err' in result) {
      return { success: false, error: result.Err };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const getMyShareRequests = async (): Promise<ApiResponse<ShareRequest[]>> => {
  try {
    if (!actor) {
      throw new Error('Agent not initialized. Call initializeAgent first.');
    }

    const requests = await actor.get_my_share_requests();
    return { success: true, data: requests };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const getCanisterInfo = async () => {
  try {
    if (!actor) {
      throw new Error('Agent not initialized. Call initializeAgent first.');
    }

    return await actor.get_canister_info();
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Utility functions
export const formatPrincipal = (principal: Principal): string => {
  return principal.toString();
};

export const parsePrincipal = (principalString: string): Principal => {
  return Principal.fromText(principalString);
};

// Error handling utility
export const handleApiError = (error: any): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

// Service object that matches what your Dashboard component expects
export const healthRecordService = {
  getMyRecords,
  getMyShareRequests,
  createHealthRecord,
  getRecord,
  updateRecord, // Export updateRecord here
  shareRecordWithDoctor,
  revokeAccess,
  getSharedRecords,
  deleteRecord,
  getCanisterInfo,
};

// Initialize agent on module load
initializeAgent().catch(console.error);
