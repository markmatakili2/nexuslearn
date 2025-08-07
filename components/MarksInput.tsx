import React, { useState, useEffect } from 'react';
import { Student, Subject, Mark, SchoolClass, Term, ExamSession, UserRole } from '../types';
import { PencilIcon } from './common/IconComponents';

interface MarksInputProps {
  students: Student[];
  subjects: Subject[];
  classes: SchoolClass[];
  terms: Term[];
  examSessions: ExamSession[];
  initialMarks: Mark[];
  onMarksSubmit: (updatedMarks: Mark[], examSessionId: string) => void;
  isLoading: boolean;
  currentTermId: string | null; // To pre-select term if available
  currentUserRole: UserRole; // To control editing capabilities
}

export const MarksInput: React.FC<MarksInputProps> = ({
  students,
  subjects,
  classes,
  terms,
  examSessions,
  initialMarks,
  onMarksSubmit,
  isLoading,
  currentTermId,
  currentUserRole
}) => {
  const [selectedTerm, setSelectedTerm] = useState<string>(currentTermId || terms[0]?.id || '');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedExamSession, setSelectedExamSession] = useState<string>('');
  const [currentMarks, setCurrentMarks] = useState<{[key: string]: number | null}>({}); // studentId: score

  useEffect(() => {
    // When selections change, populate currentMarks for the UI from initialMarks
    if (selectedClass && selectedSubject && selectedExamSession) {
      const newScores: {[key: string]: number | null} = {};
      const relevantStudents = students.filter(s => s.classId === selectedClass);
      relevantStudents.forEach(student => {
        const mark = initialMarks.find(
          m => m.studentId === student.id && 
               m.subjectId === selectedSubject && 
               m.examSessionId === selectedExamSession
        );
        newScores[student.id] = mark ? mark.score : null;
      });
      setCurrentMarks(newScores);
    } else {
      setCurrentMarks({});
    }
  }, [selectedClass, selectedSubject, selectedExamSession, initialMarks, students]);
  
  useEffect(() => {
    if (currentTermId) setSelectedTerm(currentTermId);
  }, [currentTermId]);

  const handleMarkChange = (studentId: string, scoreStr: string) => {
    const upperScoreStr = scoreStr.trim().toUpperCase();
    if (upperScoreStr === 'X') {
        setCurrentMarks(prev => ({ ...prev, [studentId]: -1 }));
        return;
    }
    if (upperScoreStr === 'Y') {
        setCurrentMarks(prev => ({ ...prev, [studentId]: -2 }));
        return;
    }

    if (upperScoreStr === '') {
        setCurrentMarks(prev => ({ ...prev, [studentId]: null }));
        return;
    }
    
    const score = parseInt(scoreStr, 10);
    if (!isNaN(score) && score >= 0 && score <= 100) {
        setCurrentMarks(prev => ({ ...prev, [studentId]: score }));
    }
  };

  const handleSpecialMark = (studentId: string, value: number) => {
    setCurrentMarks(prev => ({...prev, [studentId]: value }));
  };

  const getDisplayValue = (score: number | null | undefined): string => {
      if (score === null || score === undefined) return '';
      if (score === -1) return 'X';
      if (score === -2) return 'Y';
      return String(score);
  };

  const handleSubmit = () => {
    if (!selectedExamSession || !selectedSubject) {
        alert("Please ensure Term, Class, Subject, and Exam Session are selected.");
        return;
    }
    const updatedMarksToSubmit: Mark[] = [];
    filteredStudents.forEach(student => {
      const score = currentMarks[student.id];
      if (score !== null && score !== undefined) { 
        updatedMarksToSubmit.push({
          studentId: student.id,
          subjectId: selectedSubject,
          examSessionId: selectedExamSession,
          score: score,
        });
      }
    });
    onMarksSubmit(updatedMarksToSubmit, selectedExamSession);
  };
  
  const filteredStudents = selectedClass ? students.filter(s => s.classId === selectedClass) : [];
  const availableExamSessions = selectedTerm ? examSessions.filter(es => es.termId === selectedTerm) : [];

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-4 flex items-center">
        <PencilIcon className="w-6 h-6 mr-2 text-primary-600 dark:text-primary-400" />
        Marks Entry
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label htmlFor="termSelect" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Select Term</label>
          <select
            id="termSelect"
            value={selectedTerm}
            onChange={(e) => {
              setSelectedTerm(e.target.value);
              setSelectedExamSession(''); // Reset exam session
            }}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600"
          >
            <option value="">-- Select Term --</option>
            {terms.map(t => <option key={t.id} value={t.id}>{t.name} - {t.year}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="examSessionSelect" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Select Exam Session</label>
          <select
            id="examSessionSelect"
            value={selectedExamSession}
            onChange={(e) => setSelectedExamSession(e.target.value)}
            disabled={!selectedTerm || availableExamSessions.length === 0}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm disabled:bg-gray-100 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:disabled:bg-slate-700/50"
          >
            <option value="">-- Select Exam Session --</option>
            {availableExamSessions.map(es => <option key={es.id} value={es.id}>{es.name} ({es.weight}%)</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="classSelect" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Select Class</label>
          <select
            id="classSelect"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            disabled={!selectedExamSession}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm disabled:bg-gray-100 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:disabled:bg-slate-700/50"
          >
            <option value="">-- Select Class --</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="subjectSelect" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Select Subject</label>
          <select
            id="subjectSelect"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            disabled={!selectedClass}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm disabled:bg-gray-100 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:disabled:bg-slate-700/50"
          >
            <option value="">-- Select Subject --</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {selectedClass && selectedSubject && selectedExamSession && (
        <>
          {filteredStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 border border-gray-200 dark:border-slate-700 rounded-md">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Admission No.</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Student Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Score</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                  {filteredStudents.map(student => {
                    const scoreValue = currentMarks[student.id];
                    const existingMarkForThisEntry = initialMarks.find(
                      m => m.studentId === student.id && 
                           m.subjectId === selectedSubject && 
                           m.examSessionId === selectedExamSession
                    );
                    const isMarkSubmitted = existingMarkForThisEntry && existingMarkForThisEntry.score !== null;
                    const isDisabledByRole = currentUserRole === UserRole.TEACHER && isMarkSubmitted;

                    return (
                      <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-200">{student.admissionNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-200">{student.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                          <div className="flex items-center space-x-1">
                            <input
                              type="text"
                              value={getDisplayValue(scoreValue)}
                              onChange={(e) => handleMarkChange(student.id, e.target.value)}
                              className="w-20 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:disabled:bg-slate-600"
                              placeholder="0-100"
                              aria-label={`Score for ${student.name}`}
                              disabled={isDisabledByRole}
                              title={isDisabledByRole ? "Marks already submitted and cannot be edited by teacher." : "Enter score (0-100), or use buttons for special cases"}
                              pattern="[0-9]*|X|Y|x|y"
                            />
                            <button type="button" onClick={() => handleSpecialMark(student.id, -1)} disabled={isDisabledByRole} title="Mark as Absent (X)"
                                    className="px-3 py-2 text-sm font-bold text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 disabled:opacity-50 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60">
                                X
                            </button>
                            <button type="button" onClick={() => handleSpecialMark(student.id, -2)} disabled={isDisabledByRole} title="Mark as Malpractice (Y)"
                                    className="px-3 py-2 text-sm font-bold text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200 disabled:opacity-50 dark:bg-yellow-900/40 dark:text-yellow-300 dark:hover:bg-yellow-900/60">
                                Y
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-slate-400 py-4">No students found for the selected class.</p>
          )}
          <div className="mt-6 text-right">
            <button
              onClick={handleSubmit}
              disabled={isLoading || !filteredStudents.length}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {isLoading ? 'Submitting...' : 'Submit Marks'}
            </button>
          </div>
        </>
      )}
       { !selectedTerm && <p className="text-center text-gray-500 dark:text-slate-400 py-4">Please select a Term to begin.</p>}
       { selectedTerm && !selectedExamSession && <p className="text-center text-gray-500 dark:text-slate-400 py-4">Please select an Exam Session.</p>}
       { selectedExamSession && !selectedClass && <p className="text-center text-gray-500 dark:text-slate-400 py-4">Please select a Class.</p>}
       { selectedClass && !selectedSubject && <p className="text-center text-gray-500 dark:text-slate-400 py-4">Please select a Subject to enter marks.</p>}
    </div>
  );
};
