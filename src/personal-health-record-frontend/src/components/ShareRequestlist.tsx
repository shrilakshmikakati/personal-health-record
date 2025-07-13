import React from 'react';
import { ShareRequest } from '../types'; // Ensure this path is correct

interface ShareRequestsListProps {
  shareRequests: ShareRequest[];
  onRequestsUpdated: () => void; // Callback to refresh requests after action
}

const ShareRequestsList: React.FC<ShareRequestsListProps> = ({ shareRequests, onRequestsUpdated }) => {
  // Placeholder for handling accept/reject logic.
  // You would typically call an API service here (e.g., healthRecordService.acceptShareRequest)
  const handleAcceptRequest = (requestId: string) => {
    alert(`Accepting request: ${requestId}. (Implement API call)`);
    // After successful API call: onRequestsUpdated();
  };

  const handleRejectRequest = (requestId: string) => {
    alert(`Rejecting request: ${requestId}. (Implement API call)`);
    // After successful API call: onRequestsUpdated();
  };

  if (shareRequests.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 text-lg">No pending share requests</div>
        <p className="text-gray-400 mt-2">All quiet on the sharing front!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Share Requests</h3>
      {shareRequests.map((request) => (
        <div 
          key={request.id.toString()} 
          className="bg-white rounded-lg shadow-md p-4 flex flex-col md:flex-row justify-between items-start md:items-center border border-gray-200"
        >
          <div className="flex-1 mb-3 md:mb-0">
            <p className="font-semibold text-gray-900 text-base mb-1">
              Request from: <span className="font-mono text-blue-700 break-all">{request.requester_id.toString()}</span> {/* Corrected to requester_id */}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              For Record ID: <span className="font-mono break-all">{request.record_id.toString()}</span>
            </p>
            <p className="text-sm text-gray-600">
              Status: <span className="font-medium text-orange-600">{request.status}</span>
            </p>
          </div>
          <div className="flex space-x-2 self-end md:self-auto">
            <button
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
              onClick={() => handleAcceptRequest(request.id.toString())}
            >
              Accept
            </button>
            <button
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              onClick={() => handleRejectRequest(request.id.toString())}
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ShareRequestsList;
