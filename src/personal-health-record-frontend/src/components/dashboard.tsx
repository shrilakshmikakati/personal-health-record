import React, { useState, useEffect } from 'react';
import { User, FileText, Share2, Heart, Activity, Calendar, Plus } from 'lucide-react';
import { HealthRecord, Patient, ShareRequest } from '../types'; // Ensure all types are correctly imported
import { healthRecordService } from '../services/api'; // Ensure this path is correct
import RecordList from './RecordList';
import AddRecord from './AddRecord';
import ShareRecordModal from './ShareRecord'; // Renamed import for clarity
import ShareRequestsList from './ShareRequestlist'; // Import the new component for share requests

interface DashboardProps {
  patient: Patient | null;
}

const Dashboard: React.FC<DashboardProps> = ({ patient }) => {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [shareRequests, setShareRequests] = useState<ShareRequest[]>([]);
  // 'records': shows the list of health records
  // 'add': shows the form to add/edit a record
  // 'shareRequests': shows the list of pending share requests
  const [activeTab, setActiveTab] = useState<'records' | 'add' | 'shareRequests'>('records'); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State to hold the record currently being shared (for the ShareRecordModal)
  const [recordToShare, setRecordToShare] = useState<HealthRecord | null>(null); 
  // State to hold the record currently being edited (for the AddRecord modal)
  const [recordToEdit, setRecordToEdit] = useState<HealthRecord | null>(null); 

  // useEffect to load dashboard data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []); // Empty dependency array means this runs once on mount

  // Function to fetch all necessary dashboard data (records and share requests)
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      const [recordsResponse, shareRequestsResponse] = await Promise.all([
        healthRecordService.getMyRecords(),
        healthRecordService.getMyShareRequests()
      ]);

      if (recordsResponse.success && recordsResponse.data) {
        setRecords(recordsResponse.data);
      } else {
        console.error('Failed to fetch records:', recordsResponse.error);
        setError(recordsResponse.error || 'Failed to load health records.');
      }
      
      if (shareRequestsResponse.success && shareRequestsResponse.data) {
        setShareRequests(shareRequestsResponse.data);
      } else {
        console.error('Failed to fetch share requests:', shareRequestsResponse.error);
        setError(prev => prev ? `${prev}\n${shareRequestsResponse.error}` : shareRequestsResponse.error || 'Failed to load share requests.');
      }
    } catch (err) {
      setError('Failed to load dashboard data due to a network or server error.');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Callback after a record is added or updated
  const handleRecordAdded = () => {
    loadDashboardData(); // Reload all data to ensure fresh state
    setActiveTab('records'); // Switch back to records tab
    setRecordToEdit(null); // Clear any editing state
  };

  // Callback after a record is updated (specifically for RecordList to update its internal state)
  const handleRecordUpdated = (updatedRecord: HealthRecord) => {
    // Update the specific record in the local state without a full reload for responsiveness
    setRecords(records.map(r => r.id === updatedRecord.id ? updatedRecord : r));
    setRecordToEdit(null); // Clear edit state
    loadDashboardData(); // Also trigger a full reload to ensure shared_with arrays are fresh
  };

  // Callback after a record is deleted
  const handleRecordDeleted = () => {
    loadDashboardData(); // Reload all data
  };

  // Handler for editing a record: sets the record to be edited and switches to 'add' tab
  const handleRecordEdit = (record: HealthRecord) => {
    setRecordToEdit(record);
    setActiveTab('add'); // 'add' tab will now act as 'edit' form
  };

  // Handler for sharing a record: sets the record to be shared and opens the ShareRecordModal
  const handleRecordShare = (record: HealthRecord) => {
    setRecordToShare(record);
  };

  // Helper function to get the appropriate icon for a record type
  const getRecordTypeIcon = (type: string) => {
    switch (type) {
      case 'MedicalHistory': return <FileText className="w-5 h-5 text-blue-600" />;
      case 'Prescription': return <Heart className="w-5 h-5 text-red-600" />;
      case 'LabResult': return <Activity className="w-5 h-5 text-purple-600" />;
      case 'Vaccination': return <Activity className="w-5 h-5 text-green-600" />;
      case 'Surgery': return <FileText className="w-5 h-5 text-orange-600" />;
      case 'Allergy': return <Heart className="w-5 h-5 text-pink-600" />;
      case 'Medication': return <Heart className="w-5 h-5 text-teal-600" />;
      case 'Appointment': return <Calendar className="w-5 h-5 text-indigo-600" />;
      case 'Insurance': return <FileText className="w-5 h-5 text-gray-600" />;
      case 'Other': return <FileText className="w-5 h-5 text-yellow-600" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  // Gets the 3 most recent records for the "Recent Activity" section
  const getRecentRecords = () => {
    return records
      .sort((a, b) => Number(b.date_created) - Number(a.date_created))
      .slice(0, 3);
  };

  // Filters for pending share requests
  const getPendingShareRequests = () => {
    return shareRequests.filter(req => req.status === 'Pending');
  };

  // Handler for the "Add Record" button in the header
  const handleAddRecordClick = () => {
    setRecordToEdit(null); // Ensure we're adding a new record, not editing
    setActiveTab('add');
  };

  // Display loading spinner while data is being fetched
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Loading dashboard data...</p>
      </div>
    );
  }

  // Display error message if data loading failed
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 max-w-xl mx-auto mt-8">
        <h3 className="font-semibold mb-2">Error Loading Data:</h3>
        <p className="whitespace-pre-wrap">{error}</p>
        <button 
          onClick={loadDashboardData} 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 font-inter"> {/* Added font-inter for consistent font */}
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 rounded-full p-3">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {patient?.name || 'Patient'}!
              </h1>
              <p className="text-gray-600">
                Manage your health records securely on the blockchain.
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleAddRecordClick}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add Record</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        {/* Total Records Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{records.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        {/* Shared Records Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Shared Records</p>
              <p className="text-2xl font-bold text-gray-900">
                {records.filter(r => r.shared_with && r.shared_with.length > 0).length}
              </p>
            </div>
            <Share2 className="w-8 h-8 text-green-600" />
          </div>
        </div>

        {/* Pending Requests Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Requests</p>
              <p className="text-2xl font-bold text-gray-900">
                {getPendingShareRequests().length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        {/* This Month Records Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Records This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {records.filter(r => {
                  const recordDate = new Date(Number(r.date_created) / 1_000_000);
                  const now = new Date();
                  return recordDate.getMonth() === now.getMonth() &&
                              recordDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <Activity className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6 border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
            <button
              onClick={() => { setActiveTab('records'); setRecordToEdit(null); }} // Clear edit state when switching tabs
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'records'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } transition-colors`}
            >
              My Records
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'add'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } transition-colors`}
            >
              Add Record
            </button>
            <button
              onClick={() => { setActiveTab('shareRequests'); setRecordToEdit(null); }} // Clear edit state when switching tabs
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'shareRequests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } transition-colors`}
            >
              Share & Requests
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {activeTab === 'records' && (
            <RecordList
              records={records}
              onRecordDeleted={handleRecordDeleted}
              onRecordUpdated={handleRecordUpdated}
              onRecordEdit={handleRecordEdit}
              onRecordShare={handleRecordShare}
            />
          )}
          
          {activeTab === 'add' && (
            <AddRecord 
              onRecordAdded={handleRecordAdded}
              onClose={() => { setActiveTab('records'); setRecordToEdit(null); }} // Close and go back to records tab
              recordToEdit={recordToEdit} // Pass the record to edit
            />
          )}
          
          {activeTab === 'shareRequests' && (
            <ShareRequestsList 
              shareRequests={shareRequests}
              onRequestsUpdated={loadDashboardData}
            />
          )}
        </div>
      </div>

      {/* Share Record Modal (conditionally rendered) */}
      {recordToShare && (
        <ShareRecordModal
          record={recordToShare}
          onClose={() => setRecordToShare(null)} // Close the modal
          onRecordUpdated={loadDashboardData} // Reload data after sharing/revoking
        />
      )}

      {/* Recent Activity Section (only visible on 'records' tab and if there are recent records) */}
      {activeTab === 'records' && getRecentRecords().length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6 border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Records</h3>
          <div className="space-y-4">
            {getRecentRecords().map(record => {
              const recordTypeKey = Object.keys(record.record_type)[0];
              return (
                <div key={record.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-shrink-0 p-2 bg-gray-100 rounded-full">
                    {getRecordTypeIcon(recordTypeKey)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{record.title}</h4>
                    <p className="text-sm text-gray-600 truncate">{record.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Created: {new Date(Number(record.date_created) / 1_000_000).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      record.shared_with && record.shared_with.length > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {record.shared_with && record.shared_with.length > 0 ? 'Shared' : 'Private'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
