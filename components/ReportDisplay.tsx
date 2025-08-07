

import React from 'react';
import { StudentReport, StudentPerformanceDatapoint, UserRole } from '../types';
import { MOCK_SCHOOL_NAME_DISPLAY } from '../constants'; // Only need App brand name now
import { AcademicCapIcon, DocumentTextIcon, PrintIcon } from './common/IconComponents';

interface StudentPerformanceTrendProps {
  performanceHistory: StudentPerformanceDatapoint[];
}

const StudentPerformanceTrendTable: React.FC<StudentPerformanceTrendProps> = ({ performanceHistory }) => {
  return (
    <div className="mt-6">
      <h4 className="text-md font-semibold text-gray-800 mb-2">Performance Trend (Table)</h4>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Term</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Year</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Mean Score</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Mean Points</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Overall Grade</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {performanceHistory.map(data => (
              <tr key={data.termId}>
                <td className="px-3 py-2 whitespace-nowrap text-gray-900">{data.termName}</td>
                <td className="px-3 py-2 whitespace-nowrap text-center text-gray-900">{data.year}</td>
                <td className="px-3 py-2 whitespace-nowrap text-center text-gray-900">{data.meanWeightedScore !== null ? Math.round(data.meanWeightedScore) : '-'}</td>
                <td className="px-3 py-2 whitespace-nowrap text-center text-gray-900">{data.meanTermPoints?.toFixed(2) ?? '-'}</td>
                <td className="px-3 py-2 whitespace-nowrap text-center font-semibold text-gray-900">{data.overallTermGrade ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PerformanceBarGraph: React.FC<StudentPerformanceTrendProps> = ({ performanceHistory }) => {
  const maxPoints = 12; // Max possible mean points for scaling
  const barWidth = 50;
  const spacing = 20;
  const chartHeight = 150; // SVG height
  const bottomPadding = 20; // For labels
  const leftPadding = 30; // For Y-axis labels

  return (
    <div className="mt-6 bar-graph-container performance-bar-graph-print">
      <h4 className="text-md font-semibold text-gray-800 mb-3">Performance Trend (Graph - Mean Points)</h4>
      <svg 
        width={(barWidth + spacing) * performanceHistory.length + leftPadding} 
        height={chartHeight + bottomPadding}
        aria-label="Student Performance Trend Graph"
        role="img"
        className="bar-graph"
      >
        <title>Student Performance Trend Graph</title>
        {/* Y-axis lines and labels */}
        {[0, 4, 8, 12].map(point => (
            <g key={`y-axis-${point}`}>
                <line 
                    x1={leftPadding - 5} y1={chartHeight - (point / maxPoints) * chartHeight}
                    x2={(barWidth + spacing) * performanceHistory.length + leftPadding - spacing} y2={chartHeight - (point / maxPoints) * chartHeight}
                    stroke="#e0e0e0" strokeDasharray="2,2"
                />
                <text 
                    x={leftPadding - 10} y={chartHeight - (point / maxPoints) * chartHeight + 4} 
                    textAnchor="end" fontSize="10" fill="#333">
                    {point}
                </text>
            </g>
        ))}
        
        {performanceHistory.map((data, index) => {
          const points = data.meanTermPoints || 0;
          const barHeight = (points / maxPoints) * chartHeight;
          const x = leftPadding + index * (barWidth + spacing);
          const y = chartHeight - barHeight;

          return (
            <g key={data.termId}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight > 0 ? barHeight : 0} // Ensure height is not negative
                fill={points >= 7 ? "#3b82f6" : (points >= 4 ? "#fbbf24" : "#ef4444")} // Blue, Amber, Red
                rx="3" ry="3"
              >
                <title>{`${data.termName} ${data.year}: ${points.toFixed(2)} pts (${data.overallTermGrade})`}</title>
              </rect>
              <text
                x={x + barWidth / 2}
                y={y - 5 > 10 ? y - 5 : 10} // Position score above bar, or at top if bar is too high
                textAnchor="middle"
                fontSize="10"
                fill="#333"
              >
                {points.toFixed(1)}
              </text>
              <text
                x={x + barWidth / 2}
                y={chartHeight + 15}
                textAnchor="middle"
                fontSize="10"
                fill="#333"
              >
                {data.termName.replace('Term ', 'T')}{String(data.year).slice(-2)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

interface ReportDisplayProps {
  report: StudentReport | null;
  performanceHistory?: StudentPerformanceDatapoint[];
  actualSchoolName: string;
  schoolAddress: string;
  userRole?: UserRole;
}

export const ReportDisplay: React.FC<ReportDisplayProps> = ({ report, performanceHistory, actualSchoolName, schoolAddress, userRole }) => {

  const handlePrint = () => {
    window.print();
  };

  if (!report) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No report data available for the selected student and term.</p>
        </div>
    );
  }

  const { 
    student, classInfo, term, subjectTermResults, 
    totalWeightedMarks, maxTotalMarks, meanWeightedScore, meanTermPoints, overallTermGrade,
    principalComment, classTeacherComment,
    rank, totalStudentsInClass,
    classTeacherName, classTeacherSignatureUrl, principalName, principalSignatureUrl,
    currentFeesBalance, nextTermFees,
    closingDate, openingDate
  } = report;
  
  const getScoreDisplay = (score: number | null): string | number => {
    if (score === null) return '-';
    if (score === -1) return 'X';
    if (score === -2) return 'Y';
    return Math.round(score);
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl max-w-4xl mx-auto my-8 border-2 border-primary-600 printable-area report-page report-display-container">
      <div className="print-only print-header-text">
          {actualSchoolName}<br/>
          <span style={{fontSize: '12px', fontWeight: 'normal'}}>{schoolAddress}</span><br/><br/>
          Student Report Card ({term.name} - {term.year})
      </div>
      {userRole === UserRole.ADMIN && (
        <button 
          onClick={handlePrint}
          className="no-print absolute top-4 right-4 bg-secondary-500 hover:bg-secondary-600 text-white font-bold py-2 px-4 rounded inline-flex items-center"
          aria-label="Print Report"
        >
          <PrintIcon className="w-5 h-5 mr-2"/>
          Print Report
        </button>
      )}
      
      {/* Header section including student image */}
      <header className="report-header-main mb-8 pb-4 border-b-2 border-primary-200">
        <div className="profile-image-container-print">
          {student.profileImageUrl && (
            <img 
              src={student.profileImageUrl} 
              alt={`${student.name}'s profile`} 
              className="profile-image-print"
            />
          )}
        </div>
        <div className="text-center screen-only">
          <AcademicCapIcon className="w-16 h-16 text-primary-600 mx-auto mb-2" />
        </div>
        <h1 className="text-3xl font-bold text-primary-700 text-center screen-only">{actualSchoolName}</h1>
        <p className="text-md text-gray-500 dark:text-slate-400 text-center screen-only">{schoolAddress}</p>
        <p className="text-xl text-gray-600 text-center screen-only mt-1">Student Report Card</p>
        
        {student.profileImageUrl && (
            <div className="mt-4 flex justify-center screen-only">
                 <img 
                    src={student.profileImageUrl} 
                    alt={`${student.name}'s profile`} 
                    className="profile-image-report shadow-md"
                />
            </div>
        )}
      </header>


      {/* Student & Term Details */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-primary-50 rounded-lg border border-primary-100 text-sm">
        <div>
          <p className="text-xs font-semibold text-primary-700 uppercase tracking-wider">Student Name</p>
          <p className="text-gray-900 font-medium">{student.name}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-primary-700 uppercase tracking-wider">Admission No.</p>
          <p className="text-gray-900 font-medium">{student.admissionNumber}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-primary-700 uppercase tracking-wider">Class</p>
          <p className="text-gray-900 font-medium">{classInfo.name} {student.stream}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-primary-700 uppercase tracking-wider">Term</p>
          <p className="text-gray-900 font-medium">{term.name} - {term.year}</p>
        </div>
      </section>

      {/* Marks Table */}
      <section className="overflow-x-auto mb-6">
        <table className="min-w-full divide-y divide-gray-300 border border-gray-300">
          <thead className="bg-primary-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider">Subject</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-primary-700 uppercase tracking-wider">Score</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-primary-700 uppercase tracking-wider">Grade</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-primary-700 uppercase tracking-wider">Points</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider">Remarks</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-primary-700 uppercase tracking-wider">Teacher</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {subjectTermResults.map((sr, index) => (
              <tr key={sr.subjectId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">
                  {sr.subjectName}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-center font-bold">{getScoreDisplay(sr.weightedScore)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-center font-semibold">{sr.termGrade}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-center">{sr.termPoints}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{sr.termRemarks}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-center font-medium">{sr.teacherInitials}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Summary */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-4 bg-primary-50 rounded-lg border border-primary-200">
        <div className="text-center md:text-left">
          <div className="text-xs text-primary-700 font-medium">Total Marks</div>
          <div className="text-xl font-bold text-primary-600">{totalWeightedMarks !== null ? Math.round(totalWeightedMarks) : '-'} / {maxTotalMarks}</div>
        </div>
        <div className="text-center md:text-left">
          <div className="text-xs text-primary-700 font-medium">Mean Score / Pts</div>
          <div className="text-xl font-bold text-primary-600">
            {meanWeightedScore !== null ? `${meanWeightedScore.toFixed(2)}%` : '-'} / {meanTermPoints !== null ? meanTermPoints.toFixed(2) : '-'}
          </div>
        </div>
        <div className="text-center md:text-left">
          <div className="text-xs text-primary-700 font-medium">Overall Grade</div>
          <div className="text-2xl font-extrabold text-primary-700">{overallTermGrade || '-'}</div>
        </div>
         <div className="text-center md:text-left">
          <div className="text-xs text-primary-700 font-medium">Class Rank</div>
          <div className="text-2xl font-extrabold text-primary-700">
            {rank ? `${rank}` : '-'}<span className="text-lg font-medium text-gray-500">{totalStudentsInClass ? ` / ${totalStudentsInClass}` : ''}</span>
          </div>
        </div>
      </section>

      {/* Fees Information */}
      <section className="mb-8 p-4 bg-secondary-50 rounded-lg border border-secondary-200">
        <h4 className="text-md font-semibold text-secondary-800 mb-3">Fees Information</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
                <p className="text-xs font-semibold text-secondary-700 uppercase tracking-wider">Current Fees Balance</p>
                <p className="text-gray-900 font-bold text-lg">Ksh {currentFeesBalance.toLocaleString()}</p>
            </div>
            <div>
                <p className="text-xs font-semibold text-secondary-700 uppercase tracking-wider">Next Term Fees</p>
                <p className="text-gray-900 font-bold text-lg">Ksh {nextTermFees.toLocaleString()}</p>
            </div>
        </div>
      </section>
      
      {/* Important Dates */}
      <section className="mb-8 p-4 bg-secondary-50 rounded-lg border border-secondary-200">
        <h4 className="text-md font-semibold text-secondary-800 mb-3">Important Dates</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
                <p className="text-xs font-semibold text-secondary-700 uppercase tracking-wider">Term Closing Date</p>
                <p className="text-gray-900 font-bold text-lg">{closingDate ? new Date(closingDate + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not Set'}</p>
            </div>
            <div>
                <p className="text-xs font-semibold text-secondary-700 uppercase tracking-wider">Next Term Opening Date</p>
                <p className="text-gray-900 font-bold text-lg">{openingDate ? new Date(openingDate + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not Set'}</p>
            </div>
        </div>
      </section>


      {/* Comments */}
      <section className="space-y-4 text-sm mb-8">
        <div>
          <h4 className="font-semibold text-gray-700">Class Teacher's Comment:</h4>
          <p className="text-gray-600 italic border p-2 rounded-md bg-gray-50 min-h-[50px]">{classTeacherComment}</p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-700">Principal's Comment:</h4>
          <p className="text-gray-600 italic border p-2 rounded-md bg-gray-50 min-h-[50px]">{principalComment}</p>
        </div>
      </section>
      
      {performanceHistory && performanceHistory.length > 0 ? (
        <section>
          <PerformanceBarGraph performanceHistory={performanceHistory} />
          <StudentPerformanceTrendTable performanceHistory={performanceHistory} />
        </section>
      ) : (
        <section className="mt-6">
          <div className="p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-800 rounded-r-lg">
            <p className="font-bold">Performance Trend Not Available</p>
            <p className="text-sm">A performance trend will be shown here once this student has exam results from at least one term. The current report is for this term only.</p>
          </div>
        </section>
      )}

      {/* Signature Section */}
      <section className="signature-section signature-section-print text-sm text-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="signature-block">
             {classTeacherSignatureUrl ? (
                <img src={classTeacherSignatureUrl} alt="Class Teacher's Signature" className="h-12 max-w-[250px] object-contain ml-5 mb-2" />
            ) : (
                <div className="h-14"></div>
            )}
            <p>Class Teacher's Signature: <span className="signature-line"></span></p>
            <p className="mt-2">Name: <span className="font-semibold">{classTeacherName || '..............................'}</span></p>
            <p className="mt-2">Date: <span className="signature-line"></span></p>
          </div>
          <div className="signature-block">
            {principalSignatureUrl ? (
                <img src={principalSignatureUrl} alt="Principal's Signature" className="h-12 max-w-[250px] object-contain ml-5 mb-2" />
            ) : (
                <div className="h-14"></div>
            )}
            <p>Principal's Signature: <span className="signature-line"></span></p>
            <p className="mt-2">Name: <span className="font-semibold">{principalName || '..............................'}</span></p>
            <p className="mt-2">Date: <span className="signature-line"></span></p>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="mt-10 pt-4 border-t-2 border-primary-200 text-center text-xs text-gray-500">
        <p className="screen-only">Report Generated On: {new Date().toLocaleDateString()}</p>
        <p>&copy; {new Date().getFullYear()} {actualSchoolName}. <span className="screen-only">Report System by {MOCK_SCHOOL_NAME_DISPLAY}.</span></p>
      </footer>
    </div>
  );
};
