

import React, { useState, useEffect, useMemo } from 'react';
import { User, Student, Term, SchoolClass, Mark, ExamSession, Subject, StudentPerformanceDatapoint, UserRole } from '../types';
import { PageWrapper } from './Layout';
import { ReportDisplay } from './ReportDisplay';
import { generateStudentReport, getStudentPerformanceHistory } from '../utils/examLogic';
import { UserCircleIcon, UsersIcon } from './common/IconComponents';

interface DashboardPageProps {
    currentUser: User | null;
    users: User[];
    students: Student[];
    currentTermId: string | null;
    terms: Term[];
    classes: SchoolClass[];
    activeSubjects: Subject[];
    marks: Mark[];
    examSessions: ExamSession[];
    actualSchoolName: string;
    schoolAddress: string;
    subjects: Subject[]; // All subjects
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
    currentUser, users, students, currentTermId, terms, classes, activeSubjects, marks, examSessions, actualSchoolName, schoolAddress, subjects
}) => {
    
    const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | null>(null);
    const [selectedClassTab, setSelectedClassTab] = useState<string>(classes[0]?.id || '');
    const activeTerm = useMemo(() => terms.find(t => t.id === currentTermId), [terms, currentTermId]);
    
    useEffect(() => {
      const studentsInTab = students.filter(s => s.classId === selectedClassTab);
      setSelectedStudentForReport(studentsInTab[0] || null);
    }, [selectedClassTab, students]);


    if (!currentUser) return <PageWrapper title="Dashboard"><p>Loading user data...</p></PageWrapper>;
    if (!currentTermId) return <PageWrapper title="Dashboard"><p className="dark:text-slate-300">Please select a term from the header to view dashboard content.</p></PageWrapper>;


    const viewStudentReport = (studentId: string) => {
        const student = students.find(s => s.id === studentId);
        setSelectedStudentForReport(student || null);
    };
    
    const studentReport = useMemo(() => {
      if (selectedStudentForReport && activeTerm) {
        return generateStudentReport(selectedStudentForReport, activeTerm, classes, activeSubjects, marks, examSessions, students, users, subjects);
      }
      return null;
    }, [selectedStudentForReport, activeTerm, classes, activeSubjects, marks, examSessions, students, users, subjects]);

    const performanceHistory = useMemo(() => {
        if (selectedStudentForReport) {
            return getStudentPerformanceHistory(selectedStudentForReport.id, students, terms, classes, activeSubjects, marks, examSessions, users, subjects);
        }
        return [];
    }, [selectedStudentForReport, students, terms, classes, activeSubjects, marks, examSessions, users, subjects]);
    
    const parentChild = useMemo(() => currentUser.role === UserRole.PARENT && currentUser.studentId ? students.find(s => s.id === currentUser.studentId) : null, [currentUser, students]);

    const parentReport = useMemo(() => {
        if (parentChild && activeTerm) {
            return generateStudentReport(parentChild, activeTerm, classes, activeSubjects, marks, examSessions, students, users, subjects);
        }
        return null;
    }, [parentChild, activeTerm, classes, activeSubjects, marks, examSessions, students, users, subjects]);

    const parentPerformanceHistory = useMemo(() => {
        if (parentChild) {
            return getStudentPerformanceHistory(parentChild.id, students, terms, classes, activeSubjects, marks, examSessions, users, subjects);
        }
        return [];
    }, [parentChild, students, terms, classes, activeSubjects, marks, examSessions, users, subjects]);
    
    const studentsForCurrentTab = useMemo(() => students.filter(s => s.classId === selectedClassTab), [students, selectedClassTab]);


    return (
      <PageWrapper title={`Dashboard - ${activeTerm?.name || ''} ${activeTerm?.year || ''}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow col-span-1 md:col-span-1 lg:col-span-1">
            <div className="flex items-center mb-3">
              {currentUser.profileImageUrl ? (
                <img src={currentUser.profileImageUrl} alt={currentUser.name} className="w-12 h-12 rounded-full mr-3 object-cover"/>
              ) : (
                <UserCircleIcon className="w-12 h-12 text-gray-400 dark:text-slate-500 mr-3"/>
              )}
              <div>
                <h3 className="text-lg font-semibold text-primary-700 dark:text-primary-400">Welcome, {currentUser.name}!</h3>
                <p className="text-gray-600 dark:text-slate-300 text-sm">Role: {currentUser.role}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">Current Term: <strong className="text-gray-800 dark:text-slate-200">{activeTerm?.name} {activeTerm?.year}</strong></p>
          </div>

          {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.TEACHER) && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow col-span-1 md:col-span-1 lg:col-span-2">
              <h3 className="text-lg font-semibold text-primary-700 dark:text-primary-400 mb-3 flex items-center"><UsersIcon className="w-5 h-5 mr-2" /> Student Overview</h3>
              <div className="border-b border-gray-200 dark:border-slate-700 mb-2">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                  {classes.map(c => (
                     <button
                      key={c.id}
                      onClick={() => setSelectedClassTab(c.id)}
                      className={`${
                        c.id === selectedClassTab
                          ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'
                      } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
                    >
                      {c.name}
                    </button>
                  ))}
                </nav>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {studentsForCurrentTab.length > 0 ? (
                  <ul className="divide-y divide-gray-200 dark:divide-slate-700">
                    {studentsForCurrentTab.map(s => (
                      <li key={s.id} className="py-3 flex justify-between items-center">
                         <div className="flex items-center">
                           {s.profileImageUrl ? (
                              <img src={s.profileImageUrl} alt={s.name} className="w-8 h-8 rounded-full mr-3 object-cover"/>
                           ) : (
                              <UserCircleIcon className="w-8 h-8 text-gray-300 dark:text-slate-600 mr-3"/>
                           )}
                           <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{s.name} <span className="text-xs text-gray-500 dark:text-slate-400">(Adm: {s.admissionNumber})</span></p>
                            <p className="text-xs text-gray-600 dark:text-slate-400">{classes.find(c => c.id === s.classId)?.name} - Stream {s.stream}</p>
                           </div>
                        </div>
                        <button 
                            onClick={() => viewStudentReport(s.id)}
                            className="text-xs bg-primary-500 hover:bg-primary-600 text-white font-semibold py-1 px-3 rounded-full transition-colors no-print"
                        >
                            View Report
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-gray-500 dark:text-slate-400 p-4 text-center">No students found in this class.</p>}
              </div>
            </div>
          )}
          
          {currentUser.role === UserRole.PARENT && parentChild && activeTerm && (
             <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-6 relative"> 
                <h3 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-4 screen-only">Your Child's Report ({activeTerm.name} {activeTerm.year})</h3>
                <ReportDisplay report={parentReport} performanceHistory={parentPerformanceHistory} actualSchoolName={actualSchoolName} schoolAddress={schoolAddress} userRole={currentUser.role} />
            </div>
          )}
        </div>
        {selectedStudentForReport && (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.TEACHER) && activeTerm && (
            <div className="mt-8 relative"> 
                 <h3 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-4 screen-only">Report for {selectedStudentForReport.name} ({activeTerm.name} {activeTerm.year})</h3>
                 <ReportDisplay report={studentReport} performanceHistory={performanceHistory} actualSchoolName={actualSchoolName} schoolAddress={schoolAddress} userRole={currentUser.role} />
            </div>
        )}
         {!activeTerm && <p className="text-center text-gray-600 dark:text-slate-300 mt-8">Please select a term from the header to view detailed information.</p>}
      </PageWrapper>
    );
  };
