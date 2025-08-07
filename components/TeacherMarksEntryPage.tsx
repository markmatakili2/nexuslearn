import React from 'react';
import { PageWrapper } from './Layout';
import { MarksInput } from './MarksInput';
import { User, Student, SchoolClass, Term, ExamSession, Mark, Subject, UserRole } from '../types';

interface TeacherMarksEntryPageProps {
  currentUser: User | null;
  currentTermId: string | null;
  students: Student[];
  classes: SchoolClass[];
  terms: Term[];
  examSessions: ExamSession[];
  marks: Mark[];
  isLoading: boolean;
  activeSubjects: Subject[];
  onMarksSubmit: (updatedMarks: Mark[], examSessionId: string) => void;
}

export const TeacherMarksEntryPage: React.FC<TeacherMarksEntryPageProps> = ({
  currentUser, currentTermId, students, classes, terms, examSessions, marks, isLoading, activeSubjects, onMarksSubmit
}) => {
    
    if (!currentUser) {
        return <PageWrapper title="Error"><p>User not found. Redirecting...</p></PageWrapper>;
    }
    
    return (
        <PageWrapper title="Enter Student Marks">
        {!currentTermId ? <p className="text-center text-gray-600 dark:text-slate-300">Please select a term from the header to begin marks entry.</p> :
        <MarksInput 
            students={students}
            subjects={activeSubjects}
            classes={classes}
            terms={terms}
            examSessions={examSessions}
            initialMarks={marks}
            onMarksSubmit={onMarksSubmit}
            isLoading={isLoading}
            currentTermId={currentTermId}
            currentUserRole={currentUser.role}
        />
        }
        </PageWrapper>
    );
};