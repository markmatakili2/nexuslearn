

import React, { useState, useMemo } from 'react';
import { PageWrapper } from '../Layout';
import { BellIcon, XMarkIcon } from '../common/IconComponents';
import { User, UserRole, Mark, Student, ExamSession, Term, SchoolClass, Subject } from '../../types';

interface IncompleteSubmission {
    teacher: User;
    details: {
        className: string;
        subjectName: string;
        missingCount: number;
    }[];
}

const SMSModal: React.FC<{
    teacher: User;
    schoolName: string;
    defaultMessage: string;
    onClose: () => void;
}> = ({ teacher, schoolName, defaultMessage, onClose }) => {
    const [phoneNumber, setPhoneNumber] = useState(teacher.phoneNumber || '');

    const handleSendSMS = () => {
        if (!phoneNumber) {
            alert("Phone number cannot be empty.");
            return;
        }
        const message = `
        --- SIMULATED SMS ---
        To: ${phoneNumber}
        From: ${schoolName}
        Message: ${defaultMessage}
        ---------------------
        `;
        console.log(message);
        alert(`Simulated SMS sent successfully to ${teacher.name} at ${phoneNumber}. Check the console for details.`);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 no-print">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold dark:text-slate-100">Send SMS Reminder</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="sms-recipient" className="block text-sm font-medium text-gray-700 dark:text-slate-300">To: {teacher.name}</label>
                        <input 
                            type="tel"
                            id="sms-recipient"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600"
                            placeholder="Enter phone number to test"
                        />
                    </div>
                    <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-slate-300">From (Sender ID):</span>
                        <span className="ml-2 text-gray-900 dark:text-slate-100">{schoolName}</span>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Message:</label>
                        <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm h-40 bg-gray-50 text-gray-800 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 overflow-y-auto whitespace-pre-wrap">
                            {defaultMessage}
                        </div>
                    </div>
                    <div className="pt-5 flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">Cancel</button>
                        <button type="button" onClick={handleSendSMS} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">Send SMS</button>
                    </div>
                </div>
            </div>
        </div>
    );
};


interface AdminNotificationsPageProps {
  users: User[];
  students: Student[];
  marks: Mark[];
  examSessions: ExamSession[];
  terms: Term[];
  classes: SchoolClass[];
  activeSubjects: Subject[];
  currentTermId: string | null;
  actualSchoolName: string;
}

export const AdminNotificationsPage: React.FC<AdminNotificationsPageProps> = (props) => {
    const { users, students, marks, examSessions, terms, classes, activeSubjects, currentTermId, actualSchoolName } = props;
    const [selectedTeacherForSms, setSelectedTeacherForSms] = useState<User | null>(null);
    const [smsMessage, setSmsMessage] = useState('');

    const activeTerm = useMemo(() => terms.find(t => t.id === currentTermId), [terms, currentTermId]);
    
    const incompleteSubmissions = useMemo((): IncompleteSubmission[] => {
        if (!activeTerm) return [];

        const termExamSessions = examSessions.filter(es => es.termId === activeTerm.id);
        if (termExamSessions.length === 0) return [];
        
        const teachers = users.filter(u => u.role === UserRole.TEACHER);
        const results: IncompleteSubmission[] = [];

        teachers.forEach(teacher => {
            const incompleteDetails: IncompleteSubmission['details'] = [];
            const assignments = teacher.classSubjectAssignments || [];

            assignments.forEach(assignment => {
                const classStudents = students.filter(s => s.classId === assignment.classId);
                const className = classes.find(c => c.id === assignment.classId)?.name || 'Unknown Class';

                assignment.subjectIds.forEach(subjectId => {
                    let missingCount = 0;
                    const subjectName = activeSubjects.find(s => s.id === subjectId)?.name || 'Unknown Subject';

                    classStudents.forEach(student => {
                        termExamSessions.forEach(session => {
                            const markExists = marks.some(m => 
                                m.studentId === student.id &&
                                m.subjectId === subjectId &&
                                m.examSessionId === session.id &&
                                m.score !== null
                            );
                            if (!markExists) {
                                missingCount++;
                            }
                        });
                    });

                    if (missingCount > 0) {
                        incompleteDetails.push({
                            className,
                            subjectName,
                            missingCount
                        });
                    }
                });
            });

            if (incompleteDetails.length > 0) {
                results.push({
                    teacher,
                    details: incompleteDetails,
                });
            }
        });

        return results;
    }, [activeTerm, users, students, marks, examSessions, classes, activeSubjects]);
    
    const handlePrepareSms = (teacher: User, details: IncompleteSubmission['details']) => {
        if (!teacher.phoneNumber) {
            alert(`Cannot send SMS: Phone number for ${teacher.name} is not set.`);
            return;
        }

        const subjectList = details.map(d => `${d.subjectName} (${d.className})`).join(', ');
        const message = `Dear ${teacher.name.split(' ')[0]}, this is a reminder from ${actualSchoolName}. Please submit the pending marks for the following subjects for ${activeTerm?.name} ${activeTerm?.year}: ${subjectList}. Thank you.`;
        
        setSmsMessage(message);
        setSelectedTeacherForSms(teacher);
    };


  return (
    <PageWrapper title="Submission Notifications">
      <div className="bg-blue-50 dark:bg-slate-700/30 border-l-4 border-blue-500 text-blue-800 dark:text-blue-300 p-4 rounded-r-lg mb-6" role="alert">
        <div className="flex">
          <div className="py-1"><BellIcon className="w-6 h-6 mr-4"/></div>
          <div>
            <p className="font-bold">Marks Submission Status</p>
            <p className="text-sm">
              This page automatically detects teachers who have not submitted all marks for their assigned subjects in the current term.
              You can send them a simulated SMS reminder.
            </p>
          </div>
        </div>
      </div>

      {!activeTerm && <p className="text-center text-gray-500 dark:text-slate-400 py-8">Please select a term from the header to view submission status.</p>}
      
      {activeTerm && incompleteSubmissions.length === 0 && (
          <p className="text-center text-green-600 dark:text-green-400 font-semibold py-8 bg-green-50 dark:bg-green-900/20 rounded-lg">
              Great news! All teachers have submitted their marks for the current term.
          </p>
      )}

      {activeTerm && incompleteSubmissions.length > 0 && (
        <div className="space-y-4">
            {incompleteSubmissions.map(({ teacher, details }) => (
                <div key={teacher.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border dark:border-slate-700">
                    <div className="flex flex-wrap justify-between items-center gap-2">
                        <div>
                            <h3 className="font-bold text-lg text-primary-700 dark:text-primary-400">{teacher.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-slate-400">{teacher.phoneNumber || 'No phone number'}</p>
                        </div>
                        <button
                            onClick={() => handlePrepareSms(teacher, details)}
                            disabled={!teacher.phoneNumber}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded inline-flex items-center disabled:opacity-50 disabled:bg-gray-400"
                        >
                            Send SMS Reminder
                        </button>
                    </div>
                    <div className="mt-3 pt-3 border-t dark:border-slate-700">
                        <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">Incomplete Submissions:</p>
                        <ul className="list-disc list-inside mt-1 text-sm text-gray-600 dark:text-slate-400">
                            {details.map((d, index) => (
                                <li key={index}>
                                    <strong>{d.subjectName}</strong> in {d.className} ({d.missingCount} missing entries)
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ))}
        </div>
      )}

      {selectedTeacherForSms && (
          <SMSModal 
            teacher={selectedTeacherForSms}
            schoolName={actualSchoolName}
            defaultMessage={smsMessage}
            onClose={() => setSelectedTeacherForSms(null)}
          />
      )}
    </PageWrapper>
  );
};
