import React, { useState } from 'react';
import { HealthRecord } from '../types/index.js'; // Ensure this path is correct
import { shareRecordWithDoctor, revokeAccess } from '../services/api.ts'; // Ensure this path is correct

interface ShareRecordProps {
  record: HealthRecord; // The specific record to share/manage sharing for
  onClose: () => void; // Callback to close the modal
  onRecordUpdated: () => void; // Callback to notify parent that the record's shared status might have changed
}

const ShareRecord: React.FC<ShareRecordProps> = ({ record, onClose, onRecordUpdated }) => {
  const [doctorId, setDoctorId] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [isRevoking, setIsRevoking] = useState<string | null>(null); // Stores the principal ID being revoked
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Handles sharing the record with a new doctor
  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId.trim()) {
      setError('Doctor ID is required');
      return;
    }

    setIsSharing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await shareRecordWithDoctor(record.id, doctorId.trim());
      if (response.success) {
        setSuccess('Record shared successfully!');
        setDoctorId(''); // Clear input field
        onRecordUpdated(); // Notify parent to refresh record data
      } else {
        setError(response.error || 'Failed to share record');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share record');
    } finally {
      setIsSharing(false);
    }
  };

  // Handles revoking access for a specific principal ID
  const handleRevokeAccess = async (principalId: string) => {
    // Custom confirmation dialog
    const confirmRevoke = window.confirm('Are you sure you want to revoke access for this doctor?');
    if (!confirmRevoke) {
      return;
    }

    setIsRevoking(principalId); // Set state to show loading for this specific revocation
    setError(null);
    setSuccess(null);

    try {
      const response = await revokeAccess(record.id, principalId);
      if (response.success) {
        setSuccess('Access revoked successfully!');
        onRecordUpdated(); // Notify parent to refresh record data
      } else {
        setError(response.error || 'Failed to revoke access');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke access');
    } finally {
      setIsRevoking(null); // Reset loading for this specific revocation
    }
  };

  // Formats the record type object into a readable string
  const formatRecordType = (recordType: any) => {
    const type = Object.keys(recordType)[0];
    return type.replace(/([A-Z])/g, ' $1').trim();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Share Health Record</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Record Information Display */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">{record.title}</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Type: {formatRecordType(record.record_type)}</p>
              <p>Created: {new Date(Number(record.date_created) / 1_000_000).toLocaleDateString()}</p>
              <p className="mt-2 text-gray-700 whitespace-pre-wrap">{record.description}</p>
            </div>
          </div>

          {/* Error and Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}

          {/* Share with New Doctor Form */}
          <div className="mb-6 border-b pb-6 border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Share with New Doctor</h4>
            <form onSubmit={handleShare} className="space-y-3">
              <div>
                <label htmlFor="doctorId" className="block text-sm font-medium text-gray-700 mb-1">
                  Doctor's Principal ID
                </label>
                <input
                  type="text"
                  id="doctorId"
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  placeholder="Enter doctor's principal ID (e.g., rdmx6-jaaaa-aaaah-qcaiq-cai)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-describedby="doctor-id-example"
                />
                <p id="doctor-id-example" className="text-xs text-gray-500 mt-1">
                  Example: rdmx6-jaaaa-aaaah-qcaiq-cai
                </p>
              </div>
              <button
                type="submit"
                disabled={isSharing}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                {isSharing ? 'Sharing...' : 'Share Record'}
              </button>
            </form>
          </div>

          {/* Currently Shared With List */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Currently Shared With</h4>
            {record.shared_with && record.shared_with.length === 0 ? (
              <p className="text-gray-500 text-sm">This record is not shared with anyone yet.</p>
            ) : (
              <div className="space-y-2">
                {record.shared_with?.map((principal, index) => (
                  <div
                    key={index} // Using index as key is okay here if list order is stable and items aren't reordered/filtered
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex-1 mb-2 sm:mb-0">
                      <p className="font-mono text-sm text-gray-800 break-all">
                        {principal.toString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRevokeAccess(principal.toString())}
                      disabled={isRevoking === principal.toString()}
                      className="ml-0 sm:ml-3 px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                    >
                      {isRevoking === principal.toString() ? 'Revoking...' : 'Revoke Access'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h5 className="font-medium text-blue-900 mb-2">How to Share Records</h5>
            <ul className="text-sm text-blue-800 space-y-1 list-disc pl-5">
              <li>Ask your doctor for their Principal ID.</li>
              <li>Enter the ID in the form above and click "Share Record".</li>
              <li>Your doctor will be able to view this record.</li>
              <li>You can revoke access at any time.</li>
            </ul>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareRecord;