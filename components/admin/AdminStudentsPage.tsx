

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PageWrapper } from '../Layout';
import { PlusIcon, PencilIcon, TrashIcon, CameraIcon, XMarkIcon } from '../common/IconComponents';
import { Student, StudentFormData, SchoolClass, Gender, Subject } from '../../types';

const StudentFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: StudentFormData) => void;
    studentData?: Student | null;
    classes: SchoolClass[];
    students: Student[]; 
    schoolDomain: string;
    activeSubjects: Subject[];
}> = ({ isOpen, onClose, onSave, studentData: initialStudentData, classes, students, schoolDomain, activeSubjects }) => {
    const [formData, setFormData] = useState<StudentFormData>({
        admissionNumber: '', name: '', classId: '', stream: '', parentUsername: '', profileImageFile: null, gender: Gender.MALE, currentFeesBalance: 0, nextTermFees: 0, subjects: []
    });
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);

    const canSelectSubjects = useMemo(() => {
        if (!formData.classId) return false;
        const className = classes.find(c => c.id === formData.classId)?.name || '';
        return className.includes('Form 2') || className.includes('Form 3') || className.includes('Form 4');
    }, [formData.classId, classes]);

    useEffect(() => {
        if (initialStudentData) {
            const studentToEdit = students.find(s => s.id === (initialStudentData as Student).id);
            setFormData({
                id: (initialStudentData as Student).id,
                admissionNumber: (initialStudentData as Student).admissionNumber,
                name: (initialStudentData as Student).name,
                classId: (initialStudentData as Student).classId,
                stream: (initialStudentData as Student).stream,
                parentUsername: (initialStudentData as Student).parentUsername,
                gender: (initialStudentData as Student).gender || Gender.MALE,
                currentFeesBalance: (initialStudentData as Student).currentFeesBalance || 0,
                nextTermFees: (initialStudentData as Student).nextTermFees || 0,
                subjects: (initialStudentData as Student).subjects || [],
                profileImageFile: null 
            });
            setPreviewUrl(studentToEdit?.profileImageUrl || null);
            setSelectedSubjects(new Set((initialStudentData as Student).subjects || []));
        } else {
            setFormData({ admissionNumber: '', name: '', classId: '', stream: '', parentUsername: '', gender: Gender.MALE, profileImageFile: null, currentFeesBalance: 0, nextTermFees: 0, subjects: [] });
            setPreviewUrl(null);
            setSelectedSubjects(new Set());
        }
    }, [initialStudentData, isOpen, students]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (e.target.type === 'number') {
            setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                alert("Image file size should not exceed 2MB.");
                if(fileInputRef.current) fileInputRef.current.value = ""; 
                return;
            }
            setFormData(prev => ({ ...prev, profileImageFile: file }));
            setPreviewUrl(URL.createObjectURL(file));
        }
    };
    
    const handleRemoveImage = () => {
        setFormData(prev => ({ ...prev, profileImageFile: null })); 
        setPreviewUrl(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubjectToggle = (subjectId: string) => {
        setSelectedSubjects(prev => {
            const newSet = new Set(prev);
            if (newSet.has(subjectId)) {
                newSet.delete(subjectId);
            } else {
                newSet.add(subjectId);
            }
            return newSet;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.admissionNumber || !formData.name || !formData.classId || !formData.parentUsername || !formData.gender) {
            alert("Please fill all required fields: Admission Number, Name, Class, Gender, and Parent Username.");
            return;
        }
        const admNumConflict = students.find(s => s.admissionNumber === formData.admissionNumber && s.id !== formData.id);
        if (admNumConflict) {
            alert(`Admission number ${formData.admissionNumber} is already in use by ${admNumConflict.name}.`);
            return;
        }
        if (!formData.parentUsername.toLowerCase().endsWith(`@${schoolDomain}`)) {
            alert(`Parent username must end with @${schoolDomain}`);
            return;
        }
        if (formData.parentUsername.toLowerCase().indexOf(' ') !== -1) {
            alert("Parent username cannot contain spaces.");
            return;
        }
        if (formData.currentFeesBalance < 0 || formData.nextTermFees < 0) {
            alert("Fee values cannot be negative.");
            return;
        }
        
        const finalData = { ...formData, subjects: Array.from(selectedSubjects) };
        onSave(finalData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 no-print">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold dark:text-slate-100">{formData.id ? 'Edit Student' : 'Add New Student'}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Student Photo</label>
                        <div className="mt-1 flex items-center space-x-4">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" className="w-20 h-24 object-cover rounded border dark:border-slate-600"/>
                            ) : (
                                <div className="w-20 h-24 bg-gray-100 dark:bg-slate-700 rounded border dark:border-slate-600 flex items-center justify-center text-gray-400 dark:text-slate-500">
                                    <CameraIcon className="w-10 h-10"/>
                                </div>
                            )}
                            <div>
                                <input type="file" name="profileImageFile" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-slate-700 dark:file:text-primary-300 dark:hover:file:bg-slate-600"/>
                                {previewUrl && <button type="button" onClick={handleRemoveImage} className="mt-2 text-xs text-red-500 hover:text-red-700">Remove Image</button>}
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Max 2MB. JPG, PNG, GIF, SVG.</p>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t dark:border-slate-700 pt-4">
                        <div>
                            <label htmlFor="admissionNumber" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Admission Number *</label>
                            <input type="text" name="admissionNumber" id="admissionNumber" value={formData.admissionNumber} onChange={handleChange} required 
                                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600"/>
                        </div>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Full Name *</label>
                            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required 
                                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600"/>
                        </div>
                        <div>
                            <label htmlFor="classId" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Class *</label>
                            <select name="classId" id="classId" value={formData.classId} onChange={handleChange} required
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600">
                                <option value="">Select a Class</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Gender *</label>
                            <select name="gender" id="gender" value={formData.gender} onChange={handleChange} required
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600">
                                <option value={Gender.MALE}>Male</option>
                                <option value={Gender.FEMALE}>Female</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="stream" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Stream</label>
                            <input type="text" name="stream" id="stream" value={formData.stream} onChange={handleChange}
                                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600"
                                   placeholder="e.g., North, East, Blue"/>
                        </div>
                        <div>
                            <label htmlFor="parentUsername" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Parent Username *</label>
                            <input type="text" name="parentUsername" id="parentUsername" value={formData.parentUsername} onChange={handleChange} required
                                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600"
                                   placeholder={`e.g., parent_name@${schoolDomain}`}/>
                            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Must end with @{schoolDomain}.</p>
                        </div>
                         <div>
                            <label htmlFor="currentFeesBalance" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Current Fees Balance *</label>
                            <input type="number" name="currentFeesBalance" id="currentFeesBalance" value={formData.currentFeesBalance} onChange={handleChange} required 
                                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600"/>
                        </div>
                        <div>
                            <label htmlFor="nextTermFees" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Next Term Fees *</label>
                            <input type="number" name="nextTermFees" id="nextTermFees" value={formData.nextTermFees} onChange={handleChange} required 
                                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600"/>
                        </div>
                    </div>
                     {canSelectSubjects && (
                        <div className="space-y-3 pt-4 border-t dark:border-slate-700">
                          <h4 className="text-md font-medium text-gray-800 dark:text-slate-200">Subject Selection</h4>
                           <p className="text-sm text-gray-500 dark:text-slate-400">Select the subjects this student is taking.</p>
                          <div className="p-3 border rounded-md bg-gray-50 dark:bg-slate-700/50 dark:border-slate-700">
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2 mt-2">
                                {activeSubjects.map(sub => (
                                  <div key={sub.id} className="flex items-center">
                                    <input
                                      type="checkbox"
                                      id={`subject-select-${sub.id}`}
                                      className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:bg-slate-600 dark:border-slate-500"
                                      checked={selectedSubjects.has(sub.id)}
                                      onChange={() => handleSubjectToggle(sub.id)}
                                    />
                                    <label htmlFor={`subject-select-${sub.id}`} className="ml-2 text-sm text-gray-600 dark:text-slate-300">{sub.name}</label>
                                  </div>
                                ))}
                              </div>
                          </div>
                        </div>
                      )}
                    <div className="pt-5 flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">Cancel</button>
                        <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">Save Student</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


interface AdminStudentsPageProps {
    students: Student[];
    classes: SchoolClass[];
    schoolNameDomain: string;
    onStudentSave: (data: StudentFormData) => void;
    onStudentDelete: (studentId: string) => void;
    activeSubjects: Subject[];
}

export const AdminStudentsPage: React.FC<AdminStudentsPageProps> = ({ students, classes, schoolNameDomain, onStudentSave, onStudentDelete, activeSubjects }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);

    const handleOpenModal = (student: Student | null = null) => {
        setEditingStudent(student);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingStudent(null);
    };

    const handleSave = (data: StudentFormData) => {
        onStudentSave(data);
        handleCloseModal();
    };

    const studentsWithClassInfo = useMemo(() => students
        .map(s => ({
            ...s,
            className: classes.find(c => c.id === s.classId)?.name || 'N/A'
        }))
        .sort((a, b) => a.name.localeCompare(b.name)), [students, classes]);

    return (
        <PageWrapper
            title="Manage Students"
            titleControls={
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add Student
                </button>
            }
        >
            <div className="mb-4 text-lg text-gray-600 dark:text-slate-300">
                Total Students: <span className="font-bold text-primary-700 dark:text-primary-400">{students.length}</span>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Adm No.</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Class</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Subjects</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                        {studentsWithClassInfo.map(student => (
                            <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-200">{student.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{student.admissionNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{student.className} {student.stream}</td>
                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                                    {(student.subjects && student.subjects.length > 0) ? student.subjects.length : 'All'}
                                 </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleOpenModal(student)} className="text-primary-600 hover:text-primary-900 mr-3" aria-label={`Edit ${student.name}`}><PencilIcon /></button>
                                    <button onClick={() => onStudentDelete(student.id)} className="text-red-600 hover:text-red-900" aria-label={`Delete ${student.name}`}><TrashIcon /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <StudentFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                studentData={editingStudent}
                classes={classes}
                students={students}
                schoolDomain={schoolNameDomain}
                activeSubjects={activeSubjects}
            />
        </PageWrapper>
    );
};
