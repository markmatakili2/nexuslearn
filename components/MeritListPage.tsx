
import React, { useState, useMemo } from 'react';
import { PageWrapper } from './Layout';
import { PrintIcon, ChevronUpIcon, ChevronDownIcon } from './common/IconComponents';
import { Student, Term, SchoolClass, Subject, Mark, ExamSession, PerformanceChangeEntry, User, UserRole } from '../types';
import { generateMeritList, generatePerformanceChanges } from '../utils/examLogic';

interface MeritListPageProps {
  students: Student[]; 
  terms: Term[]; 
  currentTermId: string | null;
  classes: SchoolClass[];
  activeSubjects: Subject[];
  marks: Mark[];
  examSessions: ExamSession[];
  users: User[];
  actualSchoolName: string;
  selectedComparisonTermId: string | null;
  onComparisonTermChange: (termId: string | null) => void;
  subjects: Subject[]; // All subjects
  currentUser: User | null;
}

type SortKey = 'change' | 'name' | 'adm';

export const MeritListPage: React.FC<MeritListPageProps> = ({
  students, terms, currentTermId, classes, activeSubjects, marks, examSessions, users, actualSchoolName,
  selectedComparisonTermId, onComparisonTermChange, subjects, currentUser
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [improvedSortKey, setImprovedSortKey] = useState<SortKey>('change');
  const [droppedSortKey, setDroppedSortKey] = useState<SortKey>('change');
  
  const termToDisplay = useMemo(() => terms.find(t => t.id === currentTermId), [terms, currentTermId]);
  const comparisonTerm = useMemo(() => terms.find(t => t.id === selectedComparisonTermId), [terms, selectedComparisonTermId]);

  const handlePrint = () => {
    window.print();
  };

  const meritListData = useMemo(() => {
    if (!termToDisplay) return [];
    return generateMeritList(students, termToDisplay, classes, activeSubjects, marks, examSessions, users, subjects, selectedClassId || undefined);
  }, [students, termToDisplay, classes, activeSubjects, marks, examSessions, users, subjects, selectedClassId]);

  const performanceChanges = useMemo(() => {
    if (comparisonTerm && termToDisplay) {
      return generatePerformanceChanges(termToDisplay, comparisonTerm, students, classes, activeSubjects, marks, examSessions, users, subjects, selectedClassId);
    }
    return [];
  }, [comparisonTerm, termToDisplay, students, classes, activeSubjects, marks, examSessions, users, subjects, selectedClassId]);

  const improvedStudents = useMemo(() => {
    const filtered = performanceChanges.filter(p => p.meanPointsChange > 0);
    switch (improvedSortKey) {
        case 'name':
            return filtered.sort((a, b) => a.student.name.localeCompare(b.student.name));
        case 'adm':
            return filtered.sort((a, b) => a.student.admissionNumber.localeCompare(b.student.admissionNumber, undefined, { numeric: true }));
        case 'change':
        default:
            return filtered.sort((a, b) => b.meanPointsChange - a.meanPointsChange);
    }
  }, [performanceChanges, improvedSortKey]);

  const droppedStudents = useMemo(() => {
    const filtered = performanceChanges.filter(p => p.meanPointsChange < 0);
     switch (droppedSortKey) {
        case 'name':
            return filtered.sort((a, b) => a.student.name.localeCompare(b.student.name));
        case 'adm':
            return filtered.sort((a, b) => a.student.admissionNumber.localeCompare(b.student.admissionNumber, undefined, { numeric: true }));
        case 'change':
        default:
            return filtered.sort((a, b) => a.meanPointsChange - b.meanPointsChange);
    }
  }, [performanceChanges, droppedSortKey]);

  const printButton = currentUser?.role === UserRole.ADMIN ? (
    <button 
        onClick={handlePrint}
        className="bg-secondary-500 hover:bg-secondary-600 text-white font-bold py-2 px-4 rounded inline-flex items-center"
        aria-label="Print Merit List"
    >
        <PrintIcon className="w-5 h-5 mr-2"/>
        Print Merit List
    </button>
  ) : null;
  
  if (!termToDisplay) {
    return <PageWrapper title="Merit Lists"><p>Please select a term to view merit lists.</p></PageWrapper>;
  }
  
  const selectedClassName = selectedClassId ? classes.find(c => c.id === selectedClassId)?.name : 'All Classes';
  const pageTitle = `Merit List (${selectedClassName})`;
  const printableTitle = `${actualSchoolName} - Merit List - ${termToDisplay.name} ${termToDisplay.year} (${selectedClassName})`;
  
  const availableComparisonTerms = terms.filter(t => {
    if (!termToDisplay) return false;
    return (t.year < termToDisplay.year) || (t.year === termToDisplay.year && parseInt(t.name.split(' ')[1]) < parseInt(termToDisplay.name.split(' ')[1]));
  }).sort((a,b) => {
    if(a.year !== b.year) return b.year - a.year;
    return parseInt(b.name.split(' ')[1]) - parseInt(a.name.split(' ')[1]);
  });


  return (
    <PageWrapper title={pageTitle} titleControls={meritListData.length > 0 ? printButton : undefined} isPrintable={true}>
      <div className="print-only print-header-text">{printableTitle}</div>
      <div className="mb-6 no-print space-y-4 md:space-y-0 md:flex md:justify-between md:items-center">
        <div>
            <label htmlFor="classFilterMerit" className="mr-2 text-sm font-medium text-gray-700 dark:text-slate-300">Filter by Class:</label>
            <select 
            id="classFilterMerit"
            value={selectedClassId} 
            onChange={e => setSelectedClassId(e.target.value)}
            className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600"
            >
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
        </div>
        <div>
            <label htmlFor="comparisonTermSelect" className="mr-2 text-sm font-medium text-gray-700 dark:text-slate-300">Compare with Term:</label>
            <select
            id="comparisonTermSelect"
            value={selectedComparisonTermId || ''}
            onChange={e => onComparisonTermChange(e.target.value || null)}
            className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600"
            >
            <option value="">-- Select Previous Term --</option>
            {availableComparisonTerms.map(t => <option key={t.id} value={t.id}>{t.name} - {t.year}</option>)}
            </select>
        </div>
      </div>

      {meritListData.length === 0 && <p className="text-center py-8 text-gray-500 dark:text-slate-400">No student data available for the current selection to generate a merit list.</p>}
      
      {meritListData.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-3">Merit List ({selectedClassName})</h3>
             <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 border dark:border-slate-600">
                  <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Rank</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Student Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Adm No.</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Total Marks</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Mean Points</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Grade</th>
                  </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-600">
                  {meritListData.map(report => (
                      <tr key={report.student.id}>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-slate-200">{report?.rank ?? '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-800 dark:text-slate-300">{report?.student?.name ?? '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-slate-400">{report?.student?.admissionNumber ?? '-'}</td>
                          <td className="px-4 py-3 text-sm text-center text-gray-800 dark:text-slate-300">
                              {report?.totalWeightedMarks !== null ? Math.round(report.totalWeightedMarks) : '-'} / {report?.maxTotalMarks}
                          </td>
                          <td className="px-4 py-3 text-sm text-center font-semibold text-gray-900 dark:text-slate-200">{report?.meanTermPoints?.toFixed(3) ?? '-'}</td>
                          <td className="px-4 py-3 text-sm text-center font-bold text-primary-700 dark:text-primary-400">{report?.overallTermGrade ?? '-'}</td>
                      </tr>
                  ))}
                  </tbody>
              </table>
            </div>
          </div>
      )}

      {selectedComparisonTermId && comparisonTerm && (
        <div className="mt-10 screen-only">
            <h3 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-3">Performance Changes ({selectedClassName} vs. {comparisonTerm.name} {comparisonTerm.year})</h3>
             {performanceChanges.length === 0 && <p className="text-sm text-gray-500 dark:text-slate-400">No students found with data for both selected terms to compare.</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {improvedStudents.length > 0 && (
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-lg font-semibold text-blue-600 dark:text-blue-400 flex items-center">
                            <ChevronUpIcon className="w-5 h-5 mr-1"/> Most Improved Students
                        </h4>
                        <div className="flex items-center">
                            <label htmlFor="sort-improved" className="text-xs mr-2 dark:text-slate-300">Sort by:</label>
                            <select id="sort-improved" value={improvedSortKey} onChange={e => setImprovedSortKey(e.target.value as SortKey)} className="p-1 text-xs border-gray-300 rounded-md dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 focus:ring-primary-500 focus:border-primary-500">
                                <option value="change">Improvement</option>
                                <option value="name">Name (A-Z)</option>
                                <option value="adm">Admission No.</option>
                            </select>
                        </div>
                    </div>
                    <ul className="divide-y divide-gray-200 dark:divide-slate-700 border dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 shadow">
                    {improvedStudents.map(entry => (
                        <li key={entry.student.id} className="p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex justify-between items-center">
                            <div className="flex-grow pr-4">
                                <strong className="font-semibold text-gray-800 dark:text-slate-200 text-sm">{entry.student.name}</strong>
                                <p className="text-xs text-gray-500 dark:text-slate-400">Adm: {entry.student.admissionNumber}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <div className="text-base font-bold text-green-600 dark:text-green-400">
                                    +{entry.meanPointsChange.toFixed(2)}
                                    <span className="text-sm font-medium"> pts</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    {entry.previousReport.meanTermPoints?.toFixed(2)} &rarr; {entry.currentReport.meanTermPoints?.toFixed(2)}
                                </p>
                            </div>
                        </li>
                    ))}
                    </ul>
                </div>
                )}
                {droppedStudents.length > 0 && (
                <div>
                     <div className="flex justify-between items-center mb-2">
                        <h4 className="text-lg font-semibold text-orange-600 dark:text-orange-400 flex items-center">
                            <ChevronDownIcon className="w-5 h-5 mr-1"/> Students with Drop in Performance
                        </h4>
                        <div className="flex items-center">
                            <label htmlFor="sort-dropped" className="text-xs mr-2 dark:text-slate-300">Sort by:</label>
                            <select id="sort-dropped" value={droppedSortKey} onChange={e => setDroppedSortKey(e.target.value as SortKey)} className="p-1 text-xs border-gray-300 rounded-md dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 focus:ring-primary-500 focus:border-primary-500">
                                <option value="change">Drop amount</option>
                                <option value="name">Name (A-Z)</option>
                                <option value="adm">Admission No.</option>
                            </select>
                        </div>
                    </div>
                    <ul className="divide-y divide-gray-200 dark:divide-slate-700 border dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 shadow">
                    {droppedStudents.map(entry => (
                         <li key={entry.student.id} className="p-3 hover:bg-orange-50 dark:hover:bg-orange-900/20 flex justify-between items-center">
                            <div className="flex-grow pr-4">
                                <strong className="font-semibold text-gray-800 dark:text-slate-200 text-sm">{entry.student.name}</strong>
                                <p className="text-xs text-gray-500 dark:text-slate-400">Adm: {entry.student.admissionNumber}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <div className="text-base font-bold text-red-600 dark:text-red-400">
                                    {entry.meanPointsChange.toFixed(2)}
                                    <span className="text-sm font-medium"> pts</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    {entry.previousReport.meanTermPoints?.toFixed(2)} &rarr; {entry.currentReport.meanTermPoints?.toFixed(2)}
                                </p>
                            </div>
                        </li>
                    ))}
                    </ul>
                </div>
                )}
            </div>
        </div>
      )}

    </PageWrapper>
  );
};
