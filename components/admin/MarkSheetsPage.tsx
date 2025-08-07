

import React, { useState, useMemo, useEffect } from 'react';
import { PageWrapper } from '../Layout';
import { PrintIcon } from '../common/IconComponents';
import { SchoolClass, Student, Subject, Term, ExamSession, Mark, TermCalculationMode } from '../../types';

interface AdminMarkSheetsPageProps {
  classes: SchoolClass[];
  students: Student[];
  activeSubjects: Subject[];
  terms: Term[];
  examSessions: ExamSession[];
  currentTermId: string | null;
  actualSchoolName: string;
  marks: Mark[];
}

export const AdminMarkSheetsPage: React.FC<AdminMarkSheetsPageProps> = ({
  classes, students, activeSubjects, terms, examSessions, currentTermId, actualSchoolName, marks
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedStream, setSelectedStream] = useState<string>('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  const activeTerm = useMemo(() => terms.find(t => t.id === currentTermId), [terms, currentTermId]);
  const termExamSessions = useMemo(() => activeTerm ? examSessions.filter(es => es.termId === activeTerm.id) : [], [examSessions, activeTerm]);
  
  useEffect(() => {
    if (selectedClassId && activeSubjects.length > 0) {
      setSelectedSubjectId(activeSubjects[0].id);
    } else {
      setSelectedSubjectId('');
    }
  }, [selectedClassId, activeSubjects]);

  const handlePrint = () => window.print();
  
  const classStreams = useMemo(() => selectedClassId 
    ? ['all', ...Array.from(new Set(students.filter(s => s.classId === selectedClassId).map(s => s.stream).filter(Boolean)))]
    : ['all'], [students, selectedClassId]);

  const filteredStudents = useMemo(() => students.filter(s => 
    s.classId === selectedClassId && (selectedStream === 'all' || s.stream === selectedStream)
  ).sort((a,b) => a.admissionNumber.localeCompare(b.admissionNumber, undefined, { numeric: true })), [students, selectedClassId, selectedStream]);
  
  const selectedClassName = classes.find(c => c.id === selectedClassId)?.name || '';
  const selectedSubjectName = activeSubjects.find(s => s.id === selectedSubjectId)?.name || '';
  const printableTitle = `Mark Sheet - ${selectedClassName} ${selectedStream !== 'all' ? selectedStream : ''} - ${selectedSubjectName}`;

  const isReadyToPrint = filteredStudents.length > 0 && selectedSubjectId && termExamSessions.length > 0;
  
  const getScoreDisplay = (score: number | null | undefined): string => {
    if (score === null || score === undefined) return '';
    if (score === -1) return 'X';
    if (score === -2) return 'Y';
    return String(Math.round(score));
  };


  return (
    <PageWrapper title="Mark Sheets" isPrintable={true} >
      {/* Header for printed page */}
      {isReadyToPrint && (
        <div className="print-only mb-4">
            <h2 className="text-xl font-bold text-center">{actualSchoolName}</h2>
            <h3 className="text-lg text-center">{printableTitle}</h3>
            <h4 className="text-md text-center">{activeTerm?.name} - {activeTerm?.year}</h4>
            <div className="flex justify-between mt-4 text-sm">
                <p>Teacher's Name: ......................................................</p>
                <p>Signature: .................................</p>
            </div>
        </div>
      )}

      {/* Controls for screen view */}
      <div className="mb-6 flex flex-wrap justify-between items-center gap-4 no-print">
        <div className="flex items-end gap-4 flex-wrap">
            <div>
              <label htmlFor="classSelectMarkSheet" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Select Class</label>
              <select
                id="classSelectMarkSheet"
                value={selectedClassId}
                onChange={e => {
                    setSelectedClassId(e.target.value);
                    setSelectedStream('all');
                }}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
              >
                <option value="">-- Select Class --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="streamSelectMarkSheet" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Select Stream</label>
              <select
                id="streamSelectMarkSheet"
                value={selectedStream}
                onChange={e => setSelectedStream(e.target.value)}
                disabled={!selectedClassId || classStreams.length <= 1}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm disabled:bg-gray-100 dark:disabled:bg-slate-700/50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
              >
                {classStreams.map(s => <option key={s} value={s}>{s === 'all' ? 'All Streams' : s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="subjectSelectMarkSheet" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Select Subject</label>
              <select
                id="subjectSelectMarkSheet"
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                disabled={!selectedClassId}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm disabled:bg-gray-100 dark:disabled:bg-slate-700/50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
              >
                <option value="">-- Select Subject --</option>
                {activeSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
        </div>
        <button
          onClick={handlePrint}
          disabled={!isReadyToPrint}
          className="bg-secondary-500 hover:bg-secondary-600 text-white font-bold py-2 px-4 rounded inline-flex items-center disabled:opacity-50"
        >
          <PrintIcon className="w-5 h-5 mr-2" /> Print Mark Sheet
        </button>
      </div>

      {!activeTerm && <p className="text-center text-gray-500 dark:text-slate-400 py-8">Please select a term from the header to generate a mark sheet.</p>}
      {activeTerm && !selectedClassId && <p className="text-center text-gray-500 dark:text-slate-400 py-8">Please select a class.</p>}
      {activeTerm && selectedClassId && !selectedSubjectId && <p className="text-center text-gray-500 dark:text-slate-400 py-8">Please select a subject to generate a mark sheet.</p>}
      
      {activeTerm && selectedClassId && selectedSubjectId && termExamSessions.length === 0 && (
          <p className="text-center text-gray-500 dark:text-slate-400 py-8">No exam sessions (e.g., CAT, EndTerm) are configured for the current term.</p>
      )}

      {isReadyToPrint ? (
        <div className="overflow-x-auto mark-sheet-page">
          <table className="min-w-full border-collapse border border-gray-400 dark:border-slate-600 mark-sheet-table">
            <thead className="bg-gray-100 dark:bg-slate-700">
              <tr className="bg-gray-100 dark:bg-slate-700">
                <th className="border p-2 w-16 text-left font-semibold text-gray-700 dark:text-slate-300">Adm No.</th>
                <th className="border p-2 student-name-col text-left font-semibold text-gray-700 dark:text-slate-300">Student Name</th>
                {termExamSessions.map(session => (
                  <th key={session.id} className="border p-2 font-semibold text-gray-700 dark:text-slate-300">
                    {session.name} ({session.weight}%)
                  </th>
                ))}
                 <th className="border p-2 font-semibold text-gray-700 dark:text-slate-300">Total Score (100%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-600">
              {filteredStudents.map(student => {
                let totalScore: number | null = null;
                const componentScores = termExamSessions.map(session => {
                  const mark = marks.find(m => m.studentId === student.id && m.subjectId === selectedSubjectId && m.examSessionId === session.id);
                  return { score: mark?.score ?? null, weight: session.weight };
                });

                const allScores = componentScores.map(cs => cs.score).filter((s): s is number => s !== null);

                if (allScores.length > 0) {
                    const hasValidNumericScores = allScores.some(s => s >= 0);
                    if (!hasValidNumericScores) { // All are special codes
                        totalScore = allScores.includes(-2) ? -2 : -1;
                    } else {
                        const validNumericScores = componentScores.filter(cs => cs.score !== null && cs.score >= 0);
                        if (activeTerm?.calculationMode === TermCalculationMode.SIMPLE_AVERAGE) {
                            const sum = validNumericScores.reduce((acc, cs) => acc + cs.score!, 0);
                            totalScore = sum / validNumericScores.length;
                        } else { // WEIGHTED_AVERAGE
                            const weightedSum = validNumericScores.reduce((acc, cs) => acc + (cs.score! * cs.weight), 0);
                            const totalWeight = validNumericScores.reduce((acc, cs) => acc + cs.weight, 0);
                            if (totalWeight > 0) {
                                totalScore = weightedSum / totalWeight;
                            }
                        }
                    }
                }
                
                return (
                  <tr key={student.id}>
                    <td className="border p-2 text-gray-800 dark:text-slate-200">{student.admissionNumber}</td>
                    <td className="border p-2 text-gray-800 dark:text-slate-200">{student.name}</td>
                    {componentScores.map((cs, i) => (
                      <td key={termExamSessions[i].id} className="border p-2 h-8 text-center font-bold text-gray-800 dark:text-slate-200">
                          {getScoreDisplay(cs.score)}
                      </td>
                    ))}
                    <td className="border p-2 h-8 text-center font-bold text-gray-900 dark:text-slate-100">
                      {getScoreDisplay(totalScore)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
         selectedClassId && selectedSubjectId && filteredStudents.length === 0 && (
            <p className="text-center text-gray-500 dark:text-slate-400 py-8">No students found for the selected class and stream.</p>
         )
      )}
    </PageWrapper>
  );
};
