import React, { useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { PageWrapper } from './Layout';
import { CameraIcon, PencilIcon } from './common/IconComponents';
import { UserProfileFormData, User } from '../types';

interface ProfilePageProps {
    currentUser: User | null;
    onProfileUpdate: (data: UserProfileFormData) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ currentUser, onProfileUpdate }) => {
    const [formData, setFormData] = useState<UserProfileFormData>({ name: currentUser?.name, password: '' });
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentUser?.profileImageUrl || null);
    const [signaturePreviewUrl, setSignaturePreviewUrl] = useState<string | null>(currentUser?.signatureImageUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const signatureFileInputRef = useRef<HTMLInputElement>(null);

    if (!currentUser) return <Navigate to="/login" />;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData(prev => ({ ...prev, profileImageFile: file }));
            setPreviewUrl(URL.createObjectURL(file));
        }
    };
    
    const handleSignatureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData(prev => ({ ...prev, signatureImageFile: file }));
            setSignaturePreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onProfileUpdate(formData);
    };

    return (
        <PageWrapper title="My Profile">
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="text-center">
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Profile Picture</label>
                        <div className="relative inline-block">
                            <img src={previewUrl || `https://ui-avatars.com/api/?name=${currentUser.name.replace(' ','+')}&background=random&color=fff`} alt="Profile" className="w-32 h-32 rounded-full object-cover shadow-lg mx-auto" />
                            <label htmlFor="profileImageFile" className="absolute bottom-0 right-0 bg-primary-600 p-2 rounded-full text-white cursor-pointer hover:bg-primary-700 shadow-md transition-transform transform hover:scale-110"><CameraIcon className="w-5 h-5"/></label>
                            <input type="file" id="profileImageFile" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                        </div>
                    </div>
                     <div className="text-center">
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Signature</label>
                        <div className="relative inline-block w-48 h-24 bg-gray-50 dark:bg-slate-700 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg flex items-center justify-center p-1 mx-auto">
                           {signaturePreviewUrl ? (
                                <img src={signaturePreviewUrl} alt="Signature Preview" className="max-w-full max-h-full object-contain" />
                            ) : (
                                <span className="text-sm text-gray-500 dark:text-slate-400">Upload Signature</span>
                            )}
                            <label htmlFor="signatureImageFile" className="absolute -bottom-2 -right-2 bg-primary-600 p-1.5 rounded-full text-white cursor-pointer hover:bg-primary-700 shadow-md transition-transform transform hover:scale-110"><PencilIcon className="w-4 h-4"/></label>
                            <input type="file" id="signatureImageFile" ref={signatureFileInputRef} onChange={handleSignatureFileChange} className="hidden" accept="image/png, image/jpeg" />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">Upload a clear photo of your signature.</p>
                    </div>
                </div>

                <div className="space-y-6 pt-6 border-t dark:border-slate-700">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Full Name</label>
                        <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">New Password (leave blank to keep current)</label>
                        <input type="password" name="password" value={formData.password || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"/>
                    </div>
                    <div className="text-right">
                        <button type="submit" className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all">Update Profile</button>
                    </div>
                </div>
            </form>
        </PageWrapper>
    );
};