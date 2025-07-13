export const idlFactory = ({ IDL }) => {
  const RecordType = IDL.Variant({
    'Other' : IDL.Null,
    'Prescription' : IDL.Null,
    'Vaccination' : IDL.Null,
    'Surgery' : IDL.Null,
    'Appointment' : IDL.Null,
    'LabResult' : IDL.Null,
    'Insurance' : IDL.Null,
    'Medication' : IDL.Null,
    'Allergy' : IDL.Null,
    'MedicalHistory' : IDL.Null,
  });
  const CreateHealthRecordRequest = IDL.Record({
    'title' : IDL.Text,
    'description' : IDL.Text,
    'record_type' : RecordType,
    'metadata' : IDL.Opt(IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))),
  });
  const HealthRecord = IDL.Record({
    'id' : IDL.Text,
    'title' : IDL.Text,
    'description' : IDL.Text,
    'patient_id' : IDL.Principal,
    'date_updated' : IDL.Nat64,
    'record_type' : RecordType,
    'date_created' : IDL.Nat64,
    'shared_with' : IDL.Vec(IDL.Principal),
    'metadata' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    'is_shared' : IDL.Bool,
  });
  const Result = IDL.Variant({ 'Ok' : HealthRecord, 'Err' : IDL.Text });
  const Result_1 = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text });
  const CanisterInfo = IDL.Record({
    'total_records' : IDL.Nat64,
    'canister_id' : IDL.Principal,
    'total_users' : IDL.Nat64,
  });
  const UpdateHealthRecordRequest = IDL.Record({
    'title' : IDL.Opt(IDL.Text),
    'description' : IDL.Opt(IDL.Text),
    'record_type' : IDL.Opt(RecordType),
    'metadata' : IDL.Opt(IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))),
  });
  return IDL.Service({
    'create_health_record' : IDL.Func([CreateHealthRecordRequest], [Result], []),
    'delete_record' : IDL.Func([IDL.Text], [Result_1], []),
    'get_canister_info' : IDL.Func([], [CanisterInfo], ['query']),
    'get_my_records' : IDL.Func([], [IDL.Vec(HealthRecord)], ['query']),
    'get_record' : IDL.Func([IDL.Text], [Result], ['query']),
    'get_shared_records' : IDL.Func([], [IDL.Vec(HealthRecord)], ['query']),
    'revoke_access' : IDL.Func([IDL.Text, IDL.Text], [Result_1], []),
    'share_record_with_doctor' : IDL.Func([IDL.Text, IDL.Text], [Result_1], []),
    'update_health_record' : IDL.Func([IDL.Text, UpdateHealthRecordRequest], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };