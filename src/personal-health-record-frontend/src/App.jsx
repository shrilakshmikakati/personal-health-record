import React, { useState, useEffect } from 'react';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { IDL } from '@dfinity/candid';

// Simple encryption/decryption (for demo purposes)
const encryptData = (data) => {
  return btoa(data); // Base64 encoding
};

const decryptData = (encryptedData) => {
  try {
    return atob(encryptedData); // Base64 decoding
  } catch (error) {
    return 'Unable to decrypt data';
  }
};

// IDL Factory
const createIdlFactory = (idl) => {
  const { IDL } = idl;
  
  const User = IDL.Record({
    id: IDL.Principal,
    name: IDL.Text,
    email: IDL.Text,
    user_type: IDL.Text,
    date_registered: IDL.Nat64,
    is_verified: IDL.Bool,
  });
  
  const HealthRecord = IDL.Record({
    id: IDL.Text,
    patient_id: IDL.Principal,
    title: IDL.Text,
    description: IDL.Text,
    record_type: IDL.Text,
    date_created: IDL.Nat64,
    date_of_record: IDL.Text,
    provider_name: IDL.Text,
    encrypted_data: IDL.Text,
    is_shared: IDL.Bool,
    shared_with: IDL.Vec(IDL.Principal),
  });
  
  const ApiResponse = (T) => IDL.Record({
    success: IDL.Bool,
    data: IDL.Opt(T),
    message: IDL.Text,
  });
  
  return IDL.Service({
    register_user: IDL.Func([IDL.Text, IDL.Text, IDL.Text], [ApiResponse(User)], []),
    get_user_profile: IDL.Func([], [ApiResponse(User)], ['query']),
    add_health_record: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text], [ApiResponse(HealthRecord)], []),
    get_my_health_records: IDL.Func([], [ApiResponse(IDL.Vec(HealthRecord))], ['query']),
    share_record_with_provider: IDL.Func([IDL.Text, IDL.Principal], [ApiResponse(IDL.Text)], []),
  });
};

// Main App Component
const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [healthRecords, setHealthRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [actor, setActor] = useState(null);

  // Initialize connection to backend
  useEffect(() => {
    const initializeActor = async () => {
      try {
        const agent = new HttpAgent({ 
          host: process.env.NODE_ENV === 'production' ? 'https://ic0.app' : 'http://localhost:4943'
        });
        
        if (process.env.NODE_ENV !== 'production') {
          await agent.fetchRootKey();
        }

        // You would need to replace this with actual canister ID
        const canisterId = process.env.CANISTER_ID_BACKEND || 'rdmx6-jaaaa-aaaaa-aaadq-cai';
        
        const backendActor = Actor.createActor(createIdlFactory, {
          agent,
          canisterId,
        });
        
        setActor(backendActor);
      } catch (err) {
        console.error('Failed to initialize actor:', err);
        setError('Failed to connect to backend');
      }
    };

    initializeActor();
  }, []);

  // Load user profile
  useEffect(() => {
    if (actor) {
      loadUserProfile();
    }
  }, [actor]);

  const loadUserProfile = async () => {
    if (!actor) return;
    
    try {
      const response = await actor.get_user_profile();
      if (response.success && response.data) {
        setCurrentUser(response.data);
        loadHealthRecords();
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
    }
  };

  const loadHealthRecords = async () => {
    if (!actor) return;
    
    setLoading(true);
    try {
      const response = await actor.get_my_health_records();
      if (response.success && response.data) {
        setHealthRecords(response.data);
      }
    } catch (err) {
      console.error('Failed to load health records:', err);
      setError('Failed to load health records');
    } finally {
      setLoading(false);
    }
  };

  // Registration Component
  const RegistrationForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      userType: 'patient'
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!actor) return;

      setLoading(true);
      try {
        const response = await actor.register_user(
          formData.name,
          formData.email,
          formData.userType
        );
        
        if (response.success && response.data) {
          setCurrentUser(response.data);
          setError('');
        } else {
          setError(response.message);
        }
      } catch (err) {
        console.error('Registration failed:', err);
        setError('Registration failed');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">
          Register for PHR Platform
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Type
            </label>
            <select
              value={formData.userType}
              onChange={(e) => setFormData({...formData, userType: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="patient">Patient</option>
              <option value="provider">Healthcare Provider</option>
            </select>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    );
  };

  // Add Health Record Component
  const AddHealthRecord = () => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      recordType: 'diagnosis',
      dateOfRecord: '',
      providerName: '',
      medicalData: ''
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!actor) return;

      setLoading(true);
      try {
        const encryptedData = encryptData(formData.medicalData);
        
        const response = await actor.add_health_record(
          formData.title,
          formData.description,
          formData.recordType,
          formData.dateOfRecord,
          formData.providerName,
          encryptedData
        );
        
        if (response.success) {
          setFormData({
            title: '',
            description: '',
            recordType: 'diagnosis',
            dateOfRecord: '',
            providerName: '',
            medicalData: ''
          });
          loadHealthRecords();
          setActiveTab('dashboard');
        } else {
          setError(response.message);
        }
      } catch (err) {
        console.error('Failed to add health record:', err);
        setError('Failed to add health record');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-blue-600">Add Health Record</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Record Type
              </label>
              <select
                value={formData.recordType}
                onChange={(e) => setFormData({...formData, recordType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="diagnosis">Diagnosis</option>
                <option value="prescription">Prescription</option>
                <option value="lab_result">Lab Result</option>
                <option value="imaging">Imaging</option>
                <option value="procedure">Procedure</option>
                <option value="vaccination">Vaccination</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Record
              </label>
              <input
                type="date"
                value={formData.dateOfRecord}
                onChange={(e) => setFormData({...formData, dateOfRecord: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Healthcare Provider
              </label>
              <input
                type="text"
                value={formData.providerName}
                onChange={(e) => setFormData({...formData, providerName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              rows={3}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medical Data (Encrypted)
            </label>
            <textarea
              value={formData.medicalData}
              onChange={(e) => setFormData({...formData, medicalData: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Enter detailed medical information..."
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Adding Record...' : 'Add Health Record'}
          </button>
        </form>
      </div>
    );
  };

  // Health Records List Component
  const HealthRecordsList = () => {
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [providerPrincipal, setProviderPrincipal] = useState('');

    const handleShare = async (recordId) => {
      if (!actor || !providerPrincipal) return;

      setLoading(true);
      try {
        const principal = Principal.fromText(providerPrincipal);
        const response = await actor.share_record_with_provider(recordId, principal);
        
        if (response.success) {
          setShareModalOpen(false);
          setProviderPrincipal('');
          loadHealthRecords();
        } else {
          setError(response.message);
        }
      } catch (err) {
        console.error('Failed to share record:', err);
        setError('Failed to share record');
      } finally {
        setLoading(false);
      }
    };

    const formatDate = (timestamp) => {
      return new Date(Number(timestamp) / 1000000).toLocaleDateString();
    };

    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-blue-600">My Health Records</h2>
          <button
            onClick={() => setActiveTab('add')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add New Record
          </button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading health records...</p>
          </div>
        )}

        {!loading && healthRecords.length === 0 && (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No health records found.</p>
            <button
              onClick={() => setActiveTab('add')}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Add Your First Record
            </button>
          </div>
        )}

        <div className="grid gap-4">
          {healthRecords.map((record) => (
            <div key={record.id} className="bg-white p-6 rounded-lg shadow-md border">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{record.title}</h3>
                  <p className="text-sm text-gray-600">
                    {record.record_type} • {record.date_of_record} • {record.provider_name}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedRecord(record)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRecord(record);
                      setShareModalOpen(true);
                    }}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  >
                    Share
                  </button>
                </div>
              </div>
              
              <p className="text-gray-700 mb-3">{record.description}</p>
              
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Created: {formatDate(record.date_created)}</span>
                <span>
                  {record.is_shared ? (
                    <span className="text-green-600">Shared with {record.shared_with.length} provider(s)</span>
                  ) : (
                    <span className="text-gray-400">Not shared</span>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Record Details Modal */}
        {selectedRecord && !shareModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">{selectedRecord.title}</h3>
              <div className="space-y-3">
                <div>
                  <strong>Type:</strong> {selectedRecord.record_type}
                </div>
                <div>
                  <strong>Date:</strong> {selectedRecord.date_of_record}
                </div>
                <div>
                  <strong>Provider:</strong> {selectedRecord.provider_name}
                </div>
                <div>
                  <strong>Description:</strong> {selectedRecord.description}
                </div>
                <div>
                  <strong>Medical Data:</strong>
                  <pre className="bg-gray-100 p-3 rounded mt-2 text-sm">
                    {decryptData(selectedRecord.encrypted_data)}
                  </pre>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="mt-4 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {shareModalOpen && selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">Share Record</h3>
              <p className="text-gray-600 mb-4">
                Share &quot;{selectedRecord.title}&quot; with a healthcare provider
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Healthcare Provider Principal ID
                  </label>
                  <input
                    type="text"
                    value={providerPrincipal}
                    onChange={(e) => setProviderPrincipal(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter provider's principal ID"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleShare(selectedRecord.id)}
                    disabled={loading || !providerPrincipal}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Sharing...' : 'Share Record'}
                  </button>
                  <button
                    onClick={() => {
                      setShareModalOpen(false);
                      setProviderPrincipal('');
                      setSelectedRecord(null);
                    }}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Main Dashboard Component
  const Dashboard = () => {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">
            Welcome, {currentUser?.name}!
          </h1>
          <p className="text-gray-600">
            Manage your health records securely on the blockchain
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Total Records</h3>
            <p className="text-3xl font-bold text-blue-600">{healthRecords.length}</p>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Shared Records</h3>
            <p className="text-3xl font-bold text-green-600">
              {healthRecords.filter(r => r.is_shared).length}
            </p>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">User Type</h3>
            <p className="text-lg font-bold text-purple-600 capitalize">{currentUser?.user_type}</p>
          </div>
        </div>

        <HealthRecordsList />
      </div>
    );
  };

  // Navigation Component
  const Navigation = () => {
    return (
      <nav className="bg-white shadow-lg mb-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-blue-600">PHR Platform</h1>
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    activeTab === 'dashboard' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('add')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    activeTab === 'add' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Add Record
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {currentUser?.email}
              </span>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {currentUser?.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  };

  // Error Display Component
  const ErrorDisplay = () => {
    if (!error) return null;

    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
        <div className="flex">
          <div className="text-red-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={() => setError('')}
              className="text-red-600 hover:text-red-800 text-sm underline mt-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <ErrorDisplay />
        
        {!currentUser ? (
          <div className="flex items-center justify-center min-h-screen">
            <RegistrationForm />
          </div>
        ) : (
          <>
            <Navigation />
            <main>
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'add' && <AddHealthRecord />}
            </main>
          </>
        )}
      </div>
    </div>
  );
};

export default App;