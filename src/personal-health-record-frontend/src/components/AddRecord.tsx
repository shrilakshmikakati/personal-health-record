import React, { useState, useEffect } from 'react';
import { CreateHealthRecordRequest, HealthRecord, RecordType } from '../types'; // Import RecordType from types
import { createHealthRecord, updateRecord } from '../services/api'; // Assuming updateRecord service exists

// The RecordType interface is now imported from '../types' and not redefined here.

interface AddRecordProps {
  onRecordAdded: () => void; // Callback for when a record is successfully added/updated
  onClose: () => void; // Callback to close the modal/form
  recordToEdit?: HealthRecord | null; // Optional prop: if provided, the form is for editing
}

const AddRecord: React.FC<AddRecordProps> = ({ onRecordAdded, onClose, recordToEdit }) => {
  // State to manage form data, initialized with recordToEdit data if available
  const [formData, setFormData] = useState<CreateHealthRecordRequest>({
    title: recordToEdit?.title || '',
    description: recordToEdit?.description || '',
    // Initialize record_type based on recordToEdit or default to 'MedicalHistory' string
    record_type: recordToEdit?.record_type || 'MedicalHistory',
    metadata: recordToEdit?.metadata || []
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // List of available record types for the dropdown (using the imported RecordType union)
  const recordTypes: RecordType[] = [
    'MedicalHistory',
    'Prescription',
    'LabResult',
    'Vaccination',
    'Surgery',
    'Allergy',
    'Medication',
    'Appointment',
    'Insurance',
    'Other'
  ];

  // Effect to update form data when recordToEdit prop changes (e.g., when editing a different record)
  useEffect(() => {
    if (recordToEdit) {
      setFormData({
        title: recordToEdit.title,
        description: recordToEdit.description,
        record_type: recordToEdit.record_type, // Directly use the string literal
        metadata: recordToEdit.metadata || []
      });
    } else {
      // Reset form for new record creation
      setFormData({
        title: '',
        description: '',
        record_type: 'MedicalHistory', // Default to string literal
        metadata: []
      });
    }
  }, [recordToEdit]);

  // Handles changes in text inputs and select (title, description, record_type)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    
    if (name === 'record_type') {
      // For record_type, directly assign the string value
      setFormData(prev => ({ ...prev, record_type: value as RecordType }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handles changes in metadata key or value fields
  const handleMetadataChange = (index: number, field: 'key' | 'value', value: string): void => {
    const newMetadata = [...(formData.metadata || [])];
    // Ensure the array element exists before trying to access its sub-elements
    if (!newMetadata[index]) {
      newMetadata[index] = ['', '']; // Initialize if it's a new row
    }
    newMetadata[index][field === 'key' ? 0 : 1] = value;
    setFormData(prev => ({ ...prev, metadata: newMetadata }));
  };

  // Adds a new empty metadata field row
  const addMetadataField = (): void => {
    setFormData(prev => ({
      ...prev,
      metadata: [...(prev.metadata || []), ['', '']] // Add a new empty [key, value] pair
    }));
  };

  // Removes a metadata field row by index
  const removeMetadataField = (index: number): void => {
    const newMetadata = (formData.metadata || []).filter((_metadata: [string, string], i: number) => i !== index);
    setFormData(prev => ({ ...prev, metadata: newMetadata }));
  };

  // Handles form submission (either creating or updating a record)
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Filter out metadata fields where both key and value are empty
      const filteredMetadata = (formData.metadata || []).filter(
        ([key, value]: [string, string]) => key.trim() !== '' || value.trim() !== ''
      );

      const requestData: CreateHealthRecordRequest = {
        ...formData,
        metadata: filteredMetadata.length > 0 ? filteredMetadata : []
      };

      let response;
      if (recordToEdit) {
        // If recordToEdit exists, call the updateRecord service
        // Ensure updateRecord expects a HealthRecord ID and the request data
        response = await updateRecord(recordToEdit.id, requestData);
      } else {
        // Otherwise, call the createHealthRecord service
        response = await createHealthRecord(requestData);
      }
      
      if (response.success) {
        onRecordAdded(); // Notify parent that record was added/updated
        onClose(); // Close the modal
      } else {
        setError(response.error || `Failed to ${recordToEdit ? 'update' : 'create'} record`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${recordToEdit ? 'update' : 'create'} record`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {recordToEdit ? 'Edit Health Record' : 'Add Health Record'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter record title"
              />
            </div>

            <div>
              <label htmlFor="record_type" className="block text-sm font-medium text-gray-700 mb-1">
                Record Type *
              </label>
              <select
                id="record_type"
                name="record_type"
                value={formData.record_type} // Directly use formData.record_type (string literal)
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {recordTypes.map((type: RecordType) => (
                  <option key={type} value={type}>
                    {type.replace(/([A-Z])/g, ' $1').trim()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter detailed description"
              ></textarea>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Additional Information
                </label>
                <button
                  type="button"
                  onClick={addMetadataField}
                  className="text-blue-500 hover:text-blue-700 text-sm"
                >
                  + Add Field
                </button>
              </div>
              
              {(formData.metadata || []).map((meta: [string, string], index: number) => (
                <div key={index} className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={meta[0]}
                    onChange={(e) => handleMetadataChange(index, 'key', e.target.value)}
                    placeholder="Key"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={meta[1]}
                    onChange={(e) => handleMetadataChange(index, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeMetadataField(index)}
                    className="text-red-500 hover:text-red-700 px-2"
                    aria-label="Remove metadata field"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : (recordToEdit ? 'Update Record' : 'Create Record')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddRecord;
