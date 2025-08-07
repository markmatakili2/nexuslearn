import React, { useState, useMemo } from 'react';
import { PageWrapper } from '../Layout';
import { PrintIcon } from '../common/IconComponents';
import { SchoolClass, Term, Student, Subject, Mark, ExamSession, User } from '../../types';
import { generateClassTermBroadsheet } from '../../utils/examLogic';

interface AdminClassBroadsheetPageProps {
  classes: SchoolClass[];
  terms: Term[];
  students: Student[];
  subjects: Subject[];
  activeSubjects: Subject[];
  marks: Mark[];
  examSessions: ExamSession[];
  users: User[];
  currentTermId: string | null;
  actualSchoolName: string;
}

export const AdminClassBroadsheetPage: React.FC<AdminClassBroadsheetPageProps> = ({
  classes, terms, students, subjects, activeSubjects, marks, examSessions, users, currentTermId, actualSchoolName
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  
  const activeTerm = useMemo(() => terms.find(t => t.id === currentTermId), [terms, currentTermId]);

  const handlePrint = () => window.print();

  const broadsheetData = useMemo(() => {
    if (activeTerm && selectedClassId) {
      return generateClassTermBroadsheet(selectedClassId, activeTerm, students, classes, activeSubjects, marks, examSessions, users, subjects);
    }
    return [];
  }, [activeTerm, selectedClassId, students, classes, activeSubjects, marks, examSessions, users, subjects]);
  
  const getScoreDisplay = (score: number | null): string | number => {
    if (score === null) return '-';
    if (score === -1) return 'X';
    if (score === -2) return 'Y';
    return Math.round(score);
  };

  const selectedClassName = classes.find(c => c.id === selectedClassId)?.name || '';
  const printableTitle = `${actualSchoolName} - Class Broadsheet - ${selectedClassName} - ${activeTerm?.name || ''} ${activeTerm?.year || ''}`;

  return (
    <PageWrapper title="Class Broadsheet" isPrintable={true}>
       <div className="print-only print-header-text">{printableTitle}</div>
      <div className="mb-6 flex flex-wrap justify-between items-center gap-4 no-print">
        <div>
          <label htmlFor="classSelectBroadsheet" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Select Class</label>
          <select
            id="classSelectBroadsheet"
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
          >
            <option value="">-- Select Class --</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button
          onClick={handlePrint}
          disabled={!broadsheetData.length}
          className="bg-secondary-500 hover:bg-secondary-600 text-white font-bold py-2 px-4 rounded inline-flex items-center disabled:opacity-50"
        >
          <PrintIcon className="w-5 h-5 mr-2" /> Print Broadsheet
        </button>
      </div>

      {!activeTerm && <p className="text-center text-gray-500 dark:text-slate-400 py-8">Please select a term from the header to view broadsheets.</p>}
      {activeTerm && !selectedClassId && <p className="text-center text-gray-500 dark:text-slate-400 py-8">Please select a class to generate the broadsheet.</p>}

      {activeTerm && selectedClassId && broadsheetData.length === 0 && (
        <p className="text-center text-gray-500 dark:text-slate-400 py-8">No exam data found for the selected class and term to generate a broadsheet.</p>
      )}

      {broadsheetData.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300 dark:divide-slate-700 border dark:border-slate-700 text-xs">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th scope="col" className="sticky left-0 bg-gray-50 dark:bg-slate-700 px-2 py-2 text-left font-medium text-gray-600 dark:text-slate-300 uppercase">Rank</th>
                <th scope="col" className="sticky left-8 bg-gray-50 dark:bg-slate-700 px-2 py-2 text-left font-medium text-gray-600 dark:text-slate-300 uppercase z-10">Adm No.</th>
                <th scope="col" className="sticky left-24 bg-gray-50 dark:bg-slate-700 px-2 py-2 text-left font-medium text-gray-600 dark:text-slate-300 uppercase z-10">Student Name</th>
                {activeSubjects.map(sub => (
                  <th key={sub.id} scope="col" className="px-2 py-2 text-center font-medium text-gray-600 dark:text-slate-300 uppercase">{sub.id}</th>
                ))}
                <th scope="col" className="px-2 py-2 text-center font-medium text-gray-600 dark:text-slate-300 uppercase">Total</th>
                <th scope="col" className="px-2 py-2 text-center font-medium text-gray-600 dark:text-slate-300 uppercase">Mean Score</th>
                <th scope="col" className="px-2 py-2 text-center font-medium text-gray-600 dark:text-slate-300 uppercase">Mean Points</th>
                <th scope="col" className="px-2 py-2 text-center font-medium text-gray-600 dark:text-slate-300 uppercase">Grade</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {broadsheetData.map(entry => (
                <tr key={entry.studentId} className="dark:hover:bg-slate-700/50">
                  <td className="sticky left-0 bg-white dark:bg-inherit px-2 py-2 font-semibold text-gray-900 dark:text-slate-200">{entry.rank}</td>
                  <td className="sticky left-8 bg-white dark:bg-inherit px-2 py-2 text-gray-700 dark:text-slate-300 z-10">{entry.admissionNumber}</td>
                  <td className="sticky left-24 bg-white dark:bg-inherit px-2 py-2 font-medium text-gray-900 dark:text-slate-200 whitespace-nowrap z-10">{entry.studentName}</td>
                  {activeSubjects.map(sub => (
                    <td key={sub.id} className="px-2 py-2 text-center font-bold text-gray-700 dark:text-slate-300">
                      {getScoreDisplay(entry.subjectScores[sub.id])}
                    </td>
                  ))}
                  <td className="px-2 py-2 text-center font-semibold text-gray-800 dark:text-slate-200">{entry.totalWeightedMarks !== null ? Math.round(entry.totalWeightedMarks) : '-'}</td>
                  <td className="px-2 py-2 text-center font-semibold text-gray-800 dark:text-slate-200">{entry.meanWeightedScore !== null ? entry.meanWeightedScore.toFixed(2) : '-'}</td>
                  <td className="px-2 py-2 text-center font-semibold text-gray-800 dark:text-slate-200">{entry.meanTermPoints !== null ? entry.meanTermPoints.toFixed(3) : '-'}</td>
                  <td className="px-2 py-2 text-center font-bold text-lg text-primary-700 dark:text-primary-400">{entry.overallTermGrade || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageWrapper>
  );
};