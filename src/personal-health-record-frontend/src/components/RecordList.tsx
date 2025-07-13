import React, { useState } from 'react';
import { HealthRecord } from '../types';
import { deleteRecord } from '../services/api.ts';

interface RecordListProps {
  records: HealthRecord[];
  onRecordDeleted: () => void;
  onRecordEdit: (record: HealthRecord) => void;
  onRecordShare: (record: HealthRecord) => void;
  onRecordUpdated: (updatedRecord: HealthRecord) => void;
}

const RecordList: React.FC<RecordListProps> = ({
  records,
  onRecordDeleted,
  onRecordEdit,
  onRecordShare,
  onRecordUpdated
}) => {
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<string | null>(null);

  const formatDate = (timestamp: bigint | number | string | undefined): string => {
    if (!timestamp) return 'N/A';
    const date = new Date(Number(timestamp) / 1000000); // Convert nanoseconds to milliseconds
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatRecordType = (recordType: any): string => {
    const type = Object.keys(recordType)[0];
    return type.replace(/([A-Z])/g, ' $1').trim();
  };

  const handleDelete = async (recordId: string): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }

    setDeletingRecord(recordId);
    try {
      await deleteRecord(recordId);
      onRecordDeleted();
    } catch (error) {
      console.error('Failed to delete record:', error);
      alert('Failed to delete record');
    } finally {
      setDeletingRecord(null);
    }
  };

  const toggleExpanded = (recordId: string): void => {
    setExpandedRecord(expandedRecord === recordId ? null : recordId);
  };

  if (records.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 text-lg">No health records found</div>
        <p className="text-gray-400 mt-2">Start by adding your first health record</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((record) => (
        <div
          key={record.id}
          className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
        >
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {record.title}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {formatRecordType(record.record_type)}
                  </span>
                  <span>Created: {formatDate(record.date_created)}</span>
                  {record.date_updated !== record.date_created && (
                    <span>Updated: {formatDate(record.date_updated)}</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {(record as any).is_shared && (
                  <span className="text-green-600 text-sm font-medium">
                    Shared
                  </span>
                )}
                <button
                  onClick={() => toggleExpanded(record.id)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {expandedRecord === record.id ? '▼' : '▶'}
                </button>
              </div>
            </div>

            {expandedRecord === record.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{record.description}</p>
                </div>

                {record.metadata && record.metadata.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Additional Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {record.metadata.map(([key, value]: [string, string], index: number) => (
                        <div key={index} className="bg-gray-50 p-2 rounded">
                          <span className="font-medium text-gray-600">{key}:</span>{' '}
                          <span className="text-gray-800">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(record as any).is_shared && (record as any).shared_with && (record as any).shared_with.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Shared With</h4>
                    <div className="space-y-1">
                      {(record as any).shared_with.map((principal: any, index: number) => (
                        <div key={index} className="text-sm text-gray-600 font-mono">
                          {principal.toString()}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    onClick={() => onRecordShare(record)}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Share
                  </button>
                  <button
                    onClick={() => onRecordEdit(record)}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(record.id)}
                    disabled={deletingRecord === record.id}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {deletingRecord === record.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecordList;