

import React, { useState, useEffect, useRef } from 'react';
import { PageWrapper } from '../Layout';
import { PlusIcon, PencilIcon, TrashIcon, CameraIcon, XMarkIcon, KeyIcon } from '../common/IconComponents';
import { User, TeacherFormData, UserRole, SchoolClass, Subject } from '../../types';

type Assignments = Record<string, string[]>; // classId -> subjectId[]

const TeacherFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: TeacherFormData & {profileImageFile?: File | null, classSubjectAssignments?: {classId: string, subjectIds: string[]}[], signatureImageFile?: File | null}) => void;
    teacherData?: User | null;
    users: User[];
    schoolDomain: string;
    classes: SchoolClass[];
    activeSubjects: Subject[];
}> = ({ isOpen, onClose, onSave, teacherData: initialTeacherData, users, schoolDomain, classes, activeSubjects }) => {
    const [formData, setFormData] = useState<TeacherFormData & {profileImageFile?: File | null, signatureImageFile?: File | null}>({ name: '', username: '', password_param: '', teacherId: '', role: UserRole.TEACHER, phoneNumber: '' });
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [signaturePreviewUrl, setSignaturePreviewUrl] = useState<string | null>(null);
    const [assignments, setAssignments] = useState<Assignments>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    const signatureFileInputRef = useRef<HTMLInputElement>(null);
    const isEditing = !!initialTeacherData;

    useEffect(() => {
        if (initialTeacherData) {
            setFormData({
                id: initialTeacherData.id,
                name: initialTeacherData.name,
                username: initialTeacherData.username,
                teacherId: initialTeacherData.teacherId || '',
                role: initialTeacherData.role,
                phoneNumber: initialTeacherData.phoneNumber || '',
                password_param: '',
                profileImageFile: null,
                signatureImageFile: null
            });
            setPreviewUrl(initialTeacherData.profileImageUrl || null);
            setSignaturePreviewUrl(initialTeacherData.signatureImageUrl || null);
            
            const initialAssignments = (initialTeacherData.classSubjectAssignments || []).reduce((acc, curr) => {
                acc[curr.classId] = curr.subjectIds;
                return acc;
            }, {} as Assignments);
            setAssignments(initialAssignments);
        } else {
            setFormData({ name: '', username: '', password_param: '', teacherId: '', role: UserRole.TEACHER, phoneNumber: '', profileImageFile: null, signatureImageFile: null });
            setPreviewUrl(null);
            setSignaturePreviewUrl(null);
            setAssignments({});
        }
    }, [initialTeacherData, isOpen]);
    
    const handleAssignmentChange = (classId: string, subjectId: string) => {
        setAssignments(prev => {
            const currentSubjects = prev[classId] || [];
            const newSubjects = currentSubjects.includes(subjectId)
                ? currentSubjects.filter(id => id !== subjectId)
                : [...currentSubjects, subjectId];
            
            const newAssignments = { ...prev };
            if (newSubjects.length > 0) {
                newAssignments[classId] = newSubjects;
            } else {
                delete newAssignments[classId]; // Clean up if no subjects for a class
            }
            return newAssignments;
        });
    };


    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value as UserRole }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) { alert("Image file size should not exceed 2MB."); if(fileInputRef.current) fileInputRef.current.value = ""; return; }
            setFormData(prev => ({ ...prev, profileImageFile: file }));
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSignatureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 1 * 1024 * 1024) { alert("Image file size should not exceed 1MB."); if(signatureFileInputRef.current) signatureFileInputRef.current.value = ""; return; }
            setFormData(prev => ({ ...prev, signatureImageFile: file }));
            setSignaturePreviewUrl(URL.createObjectURL(file));
        }
    };
    
    const handleRemoveImage = () => {
        setFormData(prev => ({ ...prev, profileImageFile: null, profileImageUrl: undefined }));
        setPreviewUrl(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleRemoveSignatureImage = () => {
        setFormData(prev => ({ ...prev, signatureImageFile: null, signatureImageUrl: undefined }));
        setSignaturePreviewUrl(null);
        if(signatureFileInputRef.current) signatureFileInputRef.current.value = "";
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.username) { alert("Name and Username are required."); return; }
        if (!isEditing && !formData.password_param) { alert("Password is required for new teachers."); return; }
        if (!formData.username.toLowerCase().endsWith(`@${schoolDomain}`)) { alert(`Teacher username must end with @${schoolDomain}`); return; }
        const usernameConflict = users.find(u => u.username.toLowerCase() === formData.username.toLowerCase() && u.id !== formData.id);
        if (usernameConflict) { alert(`Username ${formData.username} is already in use.`); return; }
        
        const classSubjectAssignments = Object.entries(assignments).map(([classId, subjectIds]) => ({
            classId,
            subjectIds,
        }));

        onSave({ ...formData, classSubjectAssignments });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 no-print">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold dark:text-slate-100">{isEditing ? 'Edit User' : 'Add New User'}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"><XMarkIcon className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Profile Photo</label>
                            <div className="mt-1 flex items-center space-x-4">
                                {previewUrl ? <img src={previewUrl} alt="Preview" className="w-20 h-24 object-cover rounded border dark:border-slate-600"/> : <div className="w-20 h-24 bg-gray-100 dark:bg-slate-700 rounded border dark:border-slate-600 flex items-center justify-center text-gray-400 dark:text-slate-500"><CameraIcon className="w-10 h-10"/></div>}
                                <div>
                                    <input type="file" name="profileImageFile" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-slate-700 dark:file:text-primary-300 dark:hover:file:bg-slate-600"/>
                                    {previewUrl && <button type="button" onClick={handleRemoveImage} className="mt-2 text-xs text-red-500">Remove</button>}
                                </div>
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Signature</label>
                            <div className="mt-1 flex items-center space-x-4">
                                {signaturePreviewUrl ? <img src={signaturePreviewUrl} alt="Signature Preview" className="w-32 h-20 object-contain rounded border bg-white dark:bg-slate-200 p-1"/> : <div className="w-32 h-20 bg-gray-100 dark:bg-slate-700 rounded border dark:border-slate-600 flex items-center justify-center text-gray-400 dark:text-slate-500"><PencilIcon className="w-10 h-10"/></div>}
                                <div>
                                    <input type="file" name="signatureImageFile" accept="image/png, image/jpeg" onChange={handleSignatureFileChange} ref={signatureFileInputRef} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-slate-700 dark:file:text-primary-300 dark:hover:file:bg-slate-600"/>
                                    {signaturePreviewUrl && <button type="button" onClick={handleRemoveSignatureImage} className="mt-2 text-xs text-red-500">Remove</button>}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t dark:border-slate-700">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Full Name *</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Username *</label>
                            <input type="text" name="username" value={formData.username} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" placeholder={`teacher.name@${schoolDomain}`}/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Teacher ID (Optional)</label>
                            <input type="text" name="teacherId" value={formData.teacherId} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Phone Number</label>
                            <input type="tel" name="phoneNumber" value={formData.phoneNumber || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" placeholder="+2547..."/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">{isEditing ? 'New Password (Optional)' : 'Password *'}</label>
                            <input type="password" name="password_param" value={formData.password_param || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Role *</label>
                            <select name="role" value={formData.role} onChange={handleChange} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200">
                                <option value={UserRole.TEACHER}>Teacher</option>
                                <option value={UserRole.ADMIN}>Admin</option>
                            </select>
                        </div>
                    </div>
                     <div className="space-y-3 pt-4 border-t dark:border-slate-700">
                      <h4 className="text-md font-medium text-gray-800 dark:text-slate-200">Class & Subject Assignments</h4>
                      {classes.map(cls => (
                        <div key={cls.id} className="p-3 border rounded-md bg-gray-50 dark:bg-slate-700/50 dark:border-slate-700">
                          <p className="font-semibold text-gray-700 dark:text-slate-300">{cls.name}</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 mt-2">
                            {activeSubjects.map(sub => (
                              <div key={sub.id} className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`assign-${cls.id}-${sub.id}`}
                                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:bg-slate-600 dark:border-slate-500"
                                  checked={assignments[cls.id]?.includes(sub.id) || false}
                                  onChange={() => handleAssignmentChange(cls.id, sub.id)}
                                />
                                <label htmlFor={`assign-${cls.id}-${sub.id}`} className="ml-2 text-sm text-gray-600 dark:text-slate-300">{sub.name}</label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-5 flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm">Save User</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


interface AdminTeachersPageProps {
    users: User[];
    schoolNameDomain: string;
    onTeacherSave: (data: TeacherFormData & {profileImageFile?: File | null, classSubjectAssignments?: {classId: string, subjectIds: string[]}[], signatureImageFile?: File | null}) => void;
    onTeacherDelete: (teacherId: string) => void;
    onPasswordReset: (teacher: User) => void;
    classes: SchoolClass[];
    activeSubjects: Subject[];
}

export const AdminTeachersPage: React.FC<AdminTeachersPageProps> = ({ users, schoolNameDomain, onTeacherSave, onTeacherDelete, onPasswordReset, classes, activeSubjects }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<User | null>(null);

    const handleOpenModal = (teacher: User | null = null) => {
        setEditingTeacher(teacher);
        setIsModalOpen(true);
    };

    const teachers = users.filter(u => (u.role === UserRole.TEACHER || u.role === UserRole.ADMIN) && u.username !== 'superadmin');

    return (
        <PageWrapper title="Manage Teachers & Admins" titleControls={<button onClick={() => handleOpenModal()} className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md"><PlusIcon className="w-5 h-5 mr-2" />Add User</button>}>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Username</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Role</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                        {teachers.map(teacher => (
                            <tr key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-slate-200">{teacher.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-slate-300">{teacher.username}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-slate-300">{teacher.phoneNumber || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        teacher.role === UserRole.ADMIN ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                                    }`}>
                                        {teacher.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    <button onClick={() => onPasswordReset(teacher)} className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 mr-3" aria-label={`Reset password for ${teacher.name}`}><KeyIcon /></button>
                                    <button onClick={() => handleOpenModal(teacher)} className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3" aria-label={`Edit ${teacher.name}`}><PencilIcon /></button>
                                    <button onClick={() => onTeacherDelete(teacher.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300" aria-label={`Delete ${teacher.name}`}><TrashIcon /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <TeacherFormModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={onTeacherSave} 
                teacherData={editingTeacher} 
                users={users} 
                schoolDomain={schoolNameDomain}
                classes={classes}
                activeSubjects={activeSubjects}
            />
        </PageWrapper>
    );
};
