
import React, { useState, useEffect, useRef } from 'react';
import { PageWrapper } from '../Layout';
import { AcademicCapIcon, CameraIcon, TrashIcon, XMarkIcon } from '../common/IconComponents';
import { Subject } from '../../types';

interface AdminSchoolSettingsPageProps {
    currentBadgeUrl: string | null | undefined;
    onUpdateBadge: (newBadgeUrl: string | null) => void;
    isLoading: boolean;
    allSubjects: Subject[];
    activeSubjectIds: string[];
    onUpdateActiveSubjects: (newActiveIds: string[]) => void;
    actualSchoolName: string;
    schoolAddress: string;
    schoolNameDomain: string;
    onUpdateSchoolDetails: (details: { name: string; domain: string; address: string }) => void;
}

// Helper function to convert image file to base64
const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const AdminSchoolSettingsPage: React.FC<AdminSchoolSettingsPageProps> = ({ 
    currentBadgeUrl, onUpdateBadge, isLoading: appIsLoading,
    allSubjects, activeSubjectIds, onUpdateActiveSubjects,
    actualSchoolName, schoolAddress, schoolNameDomain, onUpdateSchoolDetails
}) => {
    // Badge state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Subjects state
    const [editableActiveIds, setEditableActiveIds] = useState<Set<string>>(new Set(activeSubjectIds));

    // School details state
    const [schoolName, setSchoolName] = useState(actualSchoolName);
    const [address, setAddress] = useState(schoolAddress);
    const [domain, setDomain] = useState(schoolNameDomain);

    useEffect(() => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, [currentBadgeUrl]);
    
    useEffect(() => {
        setEditableActiveIds(new Set(activeSubjectIds));
    }, [activeSubjectIds]);

    useEffect(() => {
        setSchoolName(actualSchoolName);
        setDomain(schoolNameDomain);
        setAddress(schoolAddress);
    }, [actualSchoolName, schoolNameDomain, schoolAddress]);


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const file = event.target.files?.[0];
        if (file) {
            if (!['image/png', 'image/jpeg', 'image/svg+xml', 'image/gif'].includes(file.type)) {
                setError('Invalid file type. Please upload a PNG, JPG, GIF, or SVG image.');
                setSelectedFile(null);
                setPreviewUrl(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                return;
            }
            if (file.size > 1 * 1024 * 1024) { // 1MB limit
                setError('File is too large. Maximum size is 1MB.');
                setSelectedFile(null);
                setPreviewUrl(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                return;
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setSelectedFile(null);
            setPreviewUrl(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select an image file to upload.');
            return;
        }
        setIsUploading(true);
        setError(null);
        try {
            const base64String = await imageToBase64(selectedFile);
            onUpdateBadge(base64String);
        } catch (err) {
            console.error("Error uploading badge:", err);
            setError('Failed to upload badge. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveBadge = () => {
        if (window.confirm('Are you sure you want to remove the custom school badge and revert to the default?')) {
            setIsUploading(true);
            setError(null);
            try {
                onUpdateBadge(null);
            } catch(err) {
                 console.error("Error removing badge:", err);
                 setError('Failed to remove badge. Please try again.');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleSubjectToggle = (subjectId: string) => {
        setEditableActiveIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(subjectId)) {
                newSet.delete(subjectId);
            } else {
                newSet.add(subjectId);
            }
            return newSet;
        });
    };

    const handleSubjectSave = () => {
        onUpdateActiveSubjects(Array.from(editableActiveIds));
    };
    
    const handleSchoolDetailsSave = () => {
        if (!schoolName.trim() || !domain.trim() || !address.trim()) {
            alert("School Name, Domain, and Address cannot be empty.");
            return;
        }
        onUpdateSchoolDetails({ name: schoolName, domain, address });
    };


    return (
        <PageWrapper title="School Settings">
            <div className="max-w-2xl mx-auto space-y-8">
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-4">School Details</h3>
                    <div className="space-y-4">
                         <div>
                            <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Official School Name</label>
                            <input
                                type="text"
                                id="schoolName"
                                value={schoolName}
                                onChange={e => setSchoolName(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                                disabled={appIsLoading}
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">This name will appear on all report cards and official documents.</p>
                        </div>
                         <div>
                            <label htmlFor="schoolAddress" className="block text-sm font-medium text-gray-700 dark:text-slate-300">School Address</label>
                            <input
                                type="text"
                                id="schoolAddress"
                                value={address}
                                onChange={e => setAddress(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                                placeholder="e.g., P.O. Box 12345, Nairobi"
                                disabled={appIsLoading}
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">This address will appear on report cards.</p>
                        </div>
                         <div>
                            <label htmlFor="schoolDomain" className="block text-sm font-medium text-gray-700 dark:text-slate-300">School Email Domain</label>
                            <input
                                type="text"
                                id="schoolDomain"
                                value={domain}
                                onChange={e => setDomain(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                                placeholder="e.g., myschool.ac.ke"
                                disabled={appIsLoading}
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Used for creating user accounts (e.g., username@&lt;domain&gt;).</p>
                        </div>
                        <div className="pt-2 text-right">
                             <button
                                onClick={handleSchoolDetailsSave}
                                disabled={appIsLoading}
                                className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                            >
                                Save School Details
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-4">School Badge Customization</h3>
                    
                    <div className="mb-6">
                        <p className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Current School Badge:</p>
                        <div className="w-24 h-24 p-2 border border-gray-300 dark:border-slate-600 rounded-md flex items-center justify-center bg-gray-50 dark:bg-slate-700">
                            {currentBadgeUrl ? (
                                <img src={currentBadgeUrl} alt="Current School Badge" className="max-w-full max-h-full object-contain" />
                            ) : (
                                <AcademicCapIcon className="w-16 h-16 text-gray-400 dark:text-slate-500" />
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="badgeUpload" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                Upload New Badge (PNG, JPG, GIF, SVG - Max 1MB)
                            </label>
                            <input
                                type="file"
                                id="badgeUpload"
                                accept="image/png, image/jpeg, image/gif, image/svg+xml"
                                onChange={handleFileChange}
                                ref={fileInputRef}
                                className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-primary-50 file:text-primary-700
                                hover:file:bg-primary-100
                                dark:text-slate-400
                                dark:file:bg-slate-700 dark:file:text-primary-300
                                dark:hover:file:bg-slate-600"
                                aria-describedby="file_input_help"
                                disabled={isUploading || appIsLoading}
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400" id="file_input_help">
                                The badge will appear in the header next to the school name.
                            </p>
                        </div>

                        {previewUrl && selectedFile && (
                            <div className="mt-4">
                                <p className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">New Badge Preview:</p>
                                <div className="w-24 h-24 p-2 border border-blue-300 rounded-md flex items-center justify-center bg-blue-50 dark:bg-slate-700 dark:border-blue-500 relative">
                                    <img src={previewUrl} alt="New Badge Preview" className="max-w-full max-h-full object-contain" />
                                    <button
                                        onClick={() => {
                                            setSelectedFile(null);
                                            setPreviewUrl(null);
                                            if (fileInputRef.current) fileInputRef.current.value = "";
                                            setError(null);
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                                        aria-label="Clear preview"
                                        title="Clear preview"
                                        disabled={isUploading || appIsLoading}
                                    >
                                        <XMarkIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {error && <p className="text-sm text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900/20 p-3 rounded-md">{error}</p>}

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4">
                            <button
                                onClick={handleUpload}
                                disabled={!selectedFile || isUploading || appIsLoading}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                            >
                                <CameraIcon className="w-5 h-5 mr-2" />
                                {isUploading ? 'Uploading...' : 'Upload and Save Badge'}
                            </button>

                            {currentBadgeUrl && (
                                <button
                                    onClick={handleRemoveBadge}
                                    disabled={isUploading || appIsLoading}
                                    className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 dark:bg-red-900/20 dark:text-red-300 dark:border-red-500/50 dark:hover:bg-red-900/40"
                                >
                                    <TrashIcon className="w-5 h-5 mr-2" />
                                    {isUploading ? 'Removing...' : 'Remove Custom Badge'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-4">Configure Offered Subjects</h3>
                    <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">Select all subjects that are offered and examined in the school. These will appear in reports, marks entry forms, and analysis pages.</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t dark:border-slate-700 pt-4">
                        {allSubjects.map(subject => (
                            <div key={subject.id} className="flex items-center">
                                <input
                                    type="checkbox"
                                    id={`subject-checkbox-${subject.id}`}
                                    checked={editableActiveIds.has(subject.id)}
                                    onChange={() => handleSubjectToggle(subject.id)}
                                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:bg-slate-600 dark:border-slate-500"
                                    disabled={appIsLoading}
                                />
                                <label htmlFor={`subject-checkbox-${subject.id}`} className="ml-3 block text-sm font-medium text-gray-700 dark:text-slate-300">
                                    {subject.name}
                                </label>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 text-right">
                        <button
                            onClick={handleSubjectSave}
                            disabled={appIsLoading}
                            className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                        >
                            Save Subject Configuration
                        </button>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};
