export const idlFactory = ({ IDL }) => {
  const RecordType = IDL.Variant({
    'Vaccination' : IDL.Null,
    'Surgery' : IDL.Null,
    'Allergy' : IDL.Null,
    'MedicalHistory' : IDL.Null,
    'LabResult' : IDL.Null,
    'Consultation' : IDL.Null,
    'Other' : IDL.Null,
    'Prescription' : IDL.Null,
  });
  const Medication = IDL.Record({
    'dosage' : IDL.Text,
    'name' : IDL.Text,
    'end_date' : IDL.Opt(IDL.Nat64),
    'start_date' : IDL.Nat64,
    'prescribed_by' : IDL.Text,
    'frequency' : IDL.Text,
  });
  const VitalSigns = IDL.Record({
    'weight' : IDL.Opt(IDL.Float32),
    'height' : IDL.Opt(IDL.Float32),
    'blood_pressure' : IDL.Opt(IDL.Text),
    'temperature' : IDL.Opt(IDL.Float32),
    'oxygen_saturation' : IDL.Opt(IDL.Nat32),
    'heart_rate' : IDL.Opt(IDL.Nat32),
  });
  const RecordData = IDL.Record({
    'medical_data' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    'medications' : IDL.Vec(Medication),
    'vital_signs' : IDL.Opt(VitalSigns),
    'notes' : IDL.Text,
    'attachments' : IDL.Vec(IDL.Text),
  });
  const HealthRecord = IDL.Record({
    'id' : IDL.Text,
    'is_public' : IDL.Bool,
    'patient_id' : IDL.Principal,
    'title' : IDL.Text,
    'record_type' : RecordType,
    'date_created' : IDL.Nat64,
    'data' : RecordData,
    'description' : IDL.Text,
    'date_updated' : IDL.Nat64,
    'shared_with' : IDL.Vec(IDL.Principal),
  });
  const ShareStatus = IDL.Variant({
    'Approved' : IDL.Null,
    'Rejected' : IDL.Null,
    'Expired' : IDL.Null,
    'Pending' : IDL.Null,
  });
  const ShareRequest = IDL.Record({
    'id' : IDL.Text,
    'status' : ShareStatus,
    'patient_id' : IDL.Principal,
    'provider_id' : IDL.Principal,
    'record_ids' : IDL.Vec(IDL.Text),
    'requested_at' : IDL.Nat64,
    'message' : IDL.Text,
    'expires_at' : IDL.Nat64,
  });
  const HealthcareProvider = IDL.Record({
    'id' : IDL.Principal,
    'license_number' : IDL.Text,
    'verified' : IDL.Bool,
    'name' : IDL.Text,
    'created_at' : IDL.Nat64,
    'email' : IDL.Text,
    'specialty' : IDL.Text,
    'phone' : IDL.Text,
    'hospital_affiliation' : IDL.Text,
  });
  const EmergencyContact = IDL.Record({
    'relationship' : IDL.Text,
    'name' : IDL.Text,
    'email' : IDL.Text,
    'phone' : IDL.Text,
  });
  const Patient = IDL.Record({
    'id' : IDL.Principal,
    'name' : IDL.Text,
    'created_at' : IDL.Nat64,
    'email' : IDL.Text,
    'address' : IDL.Text,
    'gender' : IDL.Text,
    'emergency_contact' : EmergencyContact,
    'date_of_birth' : IDL.Nat64,
    'phone' : IDL.Text,
  });
  const ApiResponse = IDL.Variant({
    'error' : IDL.Record({
      'data' : IDL.Opt(
        IDL.Variant({
          'VecHealthRecord' : IDL.Vec(HealthRecord),
          'Stats' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat64)),
          'ShareRequest' : ShareRequest,
          'HealthRecord' : HealthRecord,
          'String' : IDL.Text,
          'HealthcareProvider' : HealthcareProvider,
          'Patient' : Patient,
          'VecHealthcareProvider' : IDL.Vec(HealthcareProvider),
          'VecShareRequest' : IDL.Vec(ShareRequest),
        })
      ),
      'error' : IDL.Opt(IDL.Text),
      'success' : IDL.Bool,
    }),
    'success' : IDL.Record({
      'data' : IDL.Opt(
        IDL.Variant({
          'VecHealthRecord' : IDL.Vec(HealthRecord),
          'Stats' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat64)),
          'ShareRequest' : ShareRequest,
          'HealthRecord' : HealthRecord,
          'String' : IDL.Text,
          'HealthcareProvider' : HealthcareProvider,
          'Patient' : Patient,
          'VecHealthcareProvider' : IDL.Vec(HealthcareProvider),
          'VecShareRequest' : IDL.Vec(ShareRequest),
        })
      ),
      'error' : IDL.Opt(IDL.Text),
      'success' : IDL.Bool,
    }),
  });
  const CreateRecordRequest = IDL.Record({
    'title' : IDL.Text,
    'record_type' : RecordType,
    'data' : RecordData,
    'description' : IDL.Text,
  });
  const UpdateRecordRequest = IDL.Record({
    'title' : IDL.Opt(IDL.Text),
    'data' : IDL.Opt(RecordData),
    'description' : IDL.Opt(IDL.Text),
  });
  return IDL.Service({
    'approve_share_request' : IDL.Func([IDL.Text], [ApiResponse], []),
    'create_health_record' : IDL.Func([CreateRecordRequest], [ApiResponse], []),
    'create_share_request' : IDL.Func(
        [IDL.Principal, IDL.Vec(IDL.Text), IDL.Text],
        [ApiResponse],
        [],
      ),
    'delete_health_record' : IDL.Func([IDL.Text], [ApiResponse], []),
    'get_all_healthcare_providers' : IDL.Func([], [ApiResponse], ['query']),
    'get_health_record' : IDL.Func([IDL.Text], [ApiResponse], ['query']),
    'get_healthcare_provider_profile' : IDL.Func([], [ApiResponse], ['query']),
    'get_my_records' : IDL.Func([], [ApiResponse], ['query']),
    'get_my_share_requests' : IDL.Func([], [ApiResponse], ['query']),
    'get_patient_profile' : IDL.Func([], [ApiResponse], ['query']),
    'get_shared_records' : IDL.Func([], [ApiResponse], ['query']),
    'get_system_stats' : IDL.Func([], [ApiResponse], ['query']),
    'register_healthcare_provider' : IDL.Func(
        [HealthcareProvider],
        [ApiResponse],
        [],
      ),
    'register_patient' : IDL.Func([Patient], [ApiResponse], []),
    'update_health_record' : IDL.Func(
        [IDL.Text, UpdateRecordRequest],
        [ApiResponse],
        [],
      ),
    'update_patient_profile' : IDL.Func([Patient], [ApiResponse], []),
  });
};
export const init = ({ IDL }) => { return []; };
