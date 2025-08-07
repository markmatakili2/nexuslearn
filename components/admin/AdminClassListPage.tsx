import React, { useState, useMemo, useEffect } from 'react';
import { PageWrapper } from '../Layout';
import { PrintIcon } from '../common/IconComponents';
import { SchoolClass, Student, Gender } from '../../types';

interface AdminClassListPageProps {
  classes: SchoolClass[];
  students: Student[];
  actualSchoolName: string;
}

export const AdminClassListPage: React.FC<AdminClassListPageProps> = ({ classes, students, actualSchoolName }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedStream, setSelectedStream] = useState<string>('all');

  const handlePrint = () => window.print();

  const classStreams = useMemo(() => selectedClassId
    ? ['all', ...Array.from(new Set(students.filter(s => s.classId === selectedClassId).map(s => s.stream).filter(Boolean)))]
    : ['all'], [students, selectedClassId]);

  useEffect(() => {
    // Reset stream when class changes
    setSelectedStream('all');
  }, [selectedClassId]);

  const filteredStudents = useMemo(() => students.filter(s =>
    s.classId === selectedClassId && (selectedStream === 'all' || s.stream === selectedStream)
  ).sort((a, b) => a.admissionNumber.localeCompare(b.admissionNumber, undefined, { numeric: true })), [students, selectedClassId, selectedStream]);

  const genderCounts = useMemo(() => {
    return filteredStudents.reduce((acc, student) => {
      if (student.gender === Gender.MALE) {
        acc.boys++;
      } else if (student.gender === Gender.FEMALE) {
        acc.girls++;
      }
      return acc;
    }, { boys: 0, girls: 0 });
  }, [filteredStudents]);

  const selectedClassName = classes.find(c => c.id === selectedClassId)?.name || '';
  const printableTitle = `${actualSchoolName} - Class List - ${selectedClassName} ${selectedStream !== 'all' ? selectedStream : 'All Streams'}`;
  
  return (
    <PageWrapper title="Class Lists" isPrintable={true} titleControls={
      <button
        onClick={handlePrint}
        disabled={filteredStudents.length === 0}
        className="bg-secondary-500 hover:bg-secondary-600 text-white font-bold py-2 px-4 rounded inline-flex items-center disabled:opacity-50"
      >
        <PrintIcon className="w-5 h-5 mr-2" /> Print Class List
      </button>
    }>
      <div className="print-only print-header-text">{printableTitle}</div>

      <div className="mb-6 flex flex-wrap items-end gap-4 no-print">
        <div>
          <label htmlFor="classSelect" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Select Class</label>
          <select
            id="classSelect"
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
          >
            <option value="">-- Select Class --</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="streamSelect" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Select Stream</label>
          <select
            id="streamSelect"
            value={selectedStream}
            onChange={e => setSelectedStream(e.target.value)}
            disabled={!selectedClassId || classStreams.length <= 1}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm disabled:bg-gray-100 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:disabled:bg-slate-700/50"
          >
            {classStreams.map(s => <option key={s} value={s}>{s === 'all' ? 'All Streams' : s}</option>)}
          </select>
        </div>
      </div>

      {selectedClassId && filteredStudents.length > 0 && (
        <>
          <div className="mb-4 p-4 bg-primary-50 dark:bg-slate-700/50 rounded-lg flex flex-wrap justify-around items-center text-center">
            <div>
              <p className="text-sm font-medium text-primary-700 dark:text-primary-300">Total Students</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{filteredStudents.length}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-primary-700 dark:text-primary-300">Boys</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{genderCounts.boys}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-primary-700 dark:text-primary-300">Girls</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{genderCounts.girls}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 border dark:border-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Admission No.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Gender</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {filteredStudents.map((student, index) => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-300">{student.admissionNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-200">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-300">{student.gender}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selectedClassId && filteredStudents.length === 0 && (
        <p className="text-center py-8 text-gray-500 dark:text-slate-400">No students found for the selected class and stream.</p>
      )}

      {!selectedClassId && (
        <p className="text-center py-8 text-gray-500 dark:text-slate-400">Please select a class to view the list.</p>
      )}
    </PageWrapper>
  );
};