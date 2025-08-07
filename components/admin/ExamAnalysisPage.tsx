
import React, { useState, useMemo } from 'react';
import { PageWrapper } from '../Layout';
import { PrintIcon } from '../common/IconComponents';
import { SchoolClass, Term, Student, Subject, Mark, ExamSession, ClassTermAnalysis, User, UserRole } from '../../types';
import { generateClassTermAnalysis, calculateSubjectGradeAndPoints, generateMeritList } from '../../utils/examLogic';

const GradeDistributionTable: React.FC<{distribution: {[key: string]: number} | null | undefined}> = ({distribution}) => {
    const grades = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E'];
    
    if (!distribution) {
        return <p className="text-sm text-center text-gray-500 dark:text-slate-400">Distribution data not available.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
                <thead>
                    <tr className="bg-gray-100 dark:bg-slate-600">
                        {grades.map(grade => (
                            <th key={grade} className="p-2 font-semibold text-gray-600 dark:text-slate-200 border border-gray-200 dark:border-slate-500 text-sm">{grade}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        {grades.map(grade => (
                            <td key={grade} className="p-2 border border-gray-300 dark:border-slate-500 text-gray-900 dark:text-slate-100 font-bold">{distribution?.[grade] || 0}</td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

interface AdminExamAnalysisPageProps {
  classes: SchoolClass[];
  terms: Term[];
  students: Student[];
  users: User[];
  subjects: Subject[];
  activeSubjects: Subject[];
  marks: Mark[];
  examSessions: ExamSession[];
  currentTermId: string | null;
  currentUser: User | null;
  actualSchoolName: string;
}

export const AdminExamAnalysisPage: React.FC<AdminExamAnalysisPageProps> = ({
  classes, terms, students, users, subjects, activeSubjects, marks, examSessions, currentTermId, currentUser, actualSchoolName
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('all'); // 'all' for whole school
  const [selectedStream, setSelectedStream] = useState<string>('all');
  
  const activeTerm = useMemo(() => terms.find(t => t.id === currentTermId), [terms, currentTermId]);

  const handlePrint = () => window.print();

  const classStreams = useMemo(() => selectedClassId !== 'all'
    ? ['all', ...Array.from(new Set(students.filter(s => s.classId === selectedClassId).map(s => s.stream).filter(Boolean)))]
    : ['all'], [students, selectedClassId]);

  const analysisData: ClassTermAnalysis | null = useMemo(() => {
    if (!activeTerm) return null;
    return generateClassTermAnalysis(
      selectedClassId === 'all' ? null : selectedClassId,
      selectedStream === 'all' ? null : selectedStream,
      activeTerm, students, classes, activeSubjects, marks, examSessions, subjects
    );
  }, [selectedClassId, selectedStream, activeTerm, students, classes, activeSubjects, marks, examSessions, subjects]);

  const overallMeritList = useMemo(() => {
    if (!activeTerm) return [];
    const studentsToRank = students.filter(s => selectedClassId === 'all' || s.classId === selectedClassId);
    return generateMeritList(studentsToRank, activeTerm, classes, activeSubjects, marks, examSessions, users, subjects);
  }, [selectedClassId, activeTerm, students, classes, activeSubjects, marks, examSessions, users, subjects]);
  
  const selectionName = analysisData ? (analysisData.classId === 'all' ? 'Overall School Performance' : `${analysisData.className} ${analysisData.stream ? analysisData.stream : ''}`) : 'Exam';
  const printableTitle = `${actualSchoolName} - Exam Analysis - ${selectionName} - ${activeTerm?.name || ''} ${activeTerm?.year || ''}`;

  return (
    <PageWrapper title="Exam Analysis" isPrintable={true} >
       <div className="print-only print-header-text">{printableTitle}</div>
        <div className="mb-6 flex flex-wrap justify-between items-center gap-4 no-print">
            <div className="flex items-end gap-4 flex-wrap">
                <div>
                  <label htmlFor="classSelectAnalysis" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Select Level</label>
                  <select
                    id="classSelectAnalysis"
                    value={selectedClassId}
                    onChange={e => {
                        setSelectedClassId(e.target.value);
                        setSelectedStream('all');
                    }}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                  >
                    <option value="all">Whole School</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                {selectedClassId !== 'all' && (
                 <div>
                  <label htmlFor="streamSelectAnalysis" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Select Stream</label>
                  <select
                    id="streamSelectAnalysis"
                    value={selectedStream}
                    onChange={e => setSelectedStream(e.target.value)}
                    disabled={classStreams.length <= 1}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm disabled:bg-gray-100 dark:disabled:bg-slate-700/50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                  >
                    {classStreams.map(s => <option key={s} value={s}>{s === 'all' ? 'All Streams' : s}</option>)}
                  </select>
                </div>
                )}
            </div>
            {currentUser?.role === UserRole.ADMIN && (
              <button
                onClick={handlePrint}
                disabled={!analysisData}
                className="bg-secondary-500 hover:bg-secondary-600 text-white font-bold py-2 px-4 rounded inline-flex items-center disabled:opacity-50"
              >
                <PrintIcon className="w-5 h-5 mr-2" /> Print Analysis
              </button>
            )}
        </div>

        {!activeTerm && <p className="text-center text-gray-500 dark:text-slate-400 py-8">Please select a term to view analysis.</p>}
        {activeTerm && !analysisData && <p className="text-center text-gray-500 dark:text-slate-400 py-8">No exam data found for the selected level and term to generate an analysis.</p>}
        
        {analysisData && (
            <div className="space-y-8 exam-analysis-page">
                <div className="p-4 border dark:border-slate-700 rounded-lg">
                    <h3 className="text-xl font-bold text-primary-700 dark:text-primary-300 mb-4">{selectionName} Analysis</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center analysis-summary-grid">
                        <div className="p-4 bg-primary-50 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-sm font-semibold text-primary-800 dark:text-primary-300">Mean Points</div>
                            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">{analysisData.overallMeanPoints?.toFixed(3) ?? 'N/A'}</div>
                        </div>
                        <div className="p-4 bg-primary-50 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-sm font-semibold text-primary-800 dark:text-primary-300">Mean Grade</div>
                            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">{analysisData.overallMeanGrade || 'N/A'}</div>
                        </div>
                        <div className="p-4 bg-primary-50 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-sm font-semibold text-primary-800 dark:text-primary-300">Total Students</div>
                            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">{analysisData.totalStudents}</div>
                        </div>
                         <div className="p-4 bg-primary-50 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-sm font-semibold text-primary-800 dark:text-primary-300">Entry</div>
                            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">{ (analysisData.totalStudents / (students.filter(s => selectedClassId === 'all' || s.classId === selectedClassId).length || 1) * 100).toFixed(1)}%</div>
                        </div>
                    </div>
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <h4 className="font-semibold text-gray-700 dark:text-slate-200 text-center mb-2">Overall Grade Distribution</h4>
                        <GradeDistributionTable distribution={analysisData.gradeDistribution} />
                    </div>
                </div>

                <div className="p-4 border dark:border-slate-700 rounded-lg">
                    <h3 className="text-xl font-bold text-primary-700 dark:text-primary-300 mb-4">Overall Top 10 Students</h3>
                    {overallMeritList.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 border dark:border-slate-600">
                                <thead className="bg-gray-50 dark:bg-slate-700">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Rank</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Name</th>
                                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Points</th>
                                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Grade</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-600">
                                {overallMeritList.slice(0, 10).map(report => (
                                    <tr key={report.student.id}>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-200">{report.rank}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-slate-300">{report.student.name}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-semibold text-gray-800 dark:text-slate-200">{report.meanTermPoints?.toFixed(3)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-bold text-primary-700 dark:text-primary-400">{report.overallTermGrade}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                      <p className="text-center text-sm text-gray-500 dark:text-slate-400 py-4">No ranked students to display for this selection.</p>
                    )}
                </div>

                <div className="p-4 border dark:border-slate-700 rounded-lg">
                    <h3 className="text-xl font-bold text-primary-700 dark:text-primary-300 mb-4">Subject Performance Analysis</h3>
                    <div className="space-y-6">
                        {analysisData.subjectAnalyses.map(subjectAnalysis => (
                            <div key={subjectAnalysis.subjectId} className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                <h4 className="text-lg font-bold text-gray-800 dark:text-slate-100">{subjectAnalysis.subjectName}</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-3 text-center">
                                    <div>
                                        <div className="text-xs text-gray-600 dark:text-slate-300">Mean Score</div>
                                        <div className="font-bold text-xl text-gray-800 dark:text-slate-100">{subjectAnalysis.meanScore?.toFixed(2) ?? 'N/A'}%</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-600 dark:text-slate-300">Mean Grade</div>
                                        <div className="font-bold text-xl text-gray-800 dark:text-slate-100">{calculateSubjectGradeAndPoints(subjectAnalysis.meanScore).grade}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-600 dark:text-slate-300">Student Count</div>
                                        <div className="font-bold text-xl text-gray-800 dark:text-slate-100">{subjectAnalysis.studentCount}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-600 dark:text-slate-300">Entry</div>
                                        <div className="font-bold text-xl text-gray-800 dark:text-slate-100">{((subjectAnalysis.studentCount / analysisData.totalStudents) * 100).toFixed(1)}%</div>
                                    </div>
                                </div>
                                <h5 className="font-semibold text-gray-700 dark:text-slate-200 text-center text-sm mt-4 mb-2">Grade Distribution</h5>
                                <GradeDistributionTable distribution={subjectAnalysis.gradeDistribution} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
    </PageWrapper>
  );
};
