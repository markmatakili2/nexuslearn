
import { Mark, Student, Subject, SchoolClass, SubjectTermResult, StudentReport, GradePoint, Term, ExamSession, SubjectExamScore, StudentPerformanceDatapoint, ClassTermBroadsheetEntry, ClassTermAnalysis, PerformanceChangeEntry, User, UserRole, SubjectClassAnalysis, TermCalculationMode } from '../types';
import { UNIFIED_GRADING_SCALE } from '../constants';

const getInitials = (name: string): string => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
};

export const calculateSubjectGradeAndPoints = (score: number | null): GradePoint & { remarks: string } => {
  if (score === -1) { // Special code for 'Absent'
    return { grade: 'X', points: 0, remarks: 'Absent' };
  }
  if (score === -2) { // Special code for 'Malpractice'
    return { grade: 'Y', points: 0, remarks: 'Malpractice' };
  }

  if (score === null || isNaN(score) || score < 0 || score > 100) {
    return { grade: '-', points: 0, remarks: 'N/A' };
  }

  // The scale is sorted from highest to lowest 'min' score
  const gradingScale = UNIFIED_GRADING_SCALE;

  for (const scale of gradingScale) {
    if (score >= scale.min) { // First match wins, correctly handling floats
      let remarks = '';
      if (scale.points >= 10) remarks = 'Excellent';
      else if (scale.points >= 8) remarks = 'Very Good';
      else if (scale.points >= 7) remarks = 'Good';
      else if (scale.points >= 5) remarks = 'Fair';
      else remarks = 'Needs Improvement';
      return { grade: scale.grade, points: scale.points, remarks };
    }
  }
  
  // This fallback should not be reached if the scale includes a { min: 0, ... } entry
  return { grade: 'E', points: 1, remarks: 'Significant Improvement Needed' };
};


// A lighter summary object for internal calculations
interface StudentTermSummary {
  studentId: string;
  meanTermPoints: number | null;
  overallTermGrade: string | null;
  totalWeightedMarks: number | null;
  meanWeightedScore: number | null;
  subjectScores: { [subjectId: string]: number | null };
}

// A helper function to generate a summary to avoid full report recursion/recalculation
const generateStudentTermSummary = (
  student: Student,
  term: Term,
  allSubjects: Subject[],
  allMarks: Mark[],
  allExamSessions: ExamSession[],
  activeSubjects: Subject[],
): StudentTermSummary => {
  const termExamSessions = allExamSessions.filter(es => es.termId === term.id);
  const subjectScores: { [subjectId: string]: number | null } = {};
  
  const subjectsForThisStudent = (student.subjects && student.subjects.length > 0)
    ? allSubjects.filter(s => student.subjects!.includes(s.id))
    : activeSubjects;

  const subjectTermResults: Partial<SubjectTermResult>[] = subjectsForThisStudent.map(subject => {
      let unroundedScore: number | null = null;
      
      const componentScoresForSubject = termExamSessions.map(session => {
        const mark = allMarks.find(m => m.studentId === student.id && m.subjectId === subject.id && m.examSessionId === session.id);
        return mark ? mark.score : null;
      }).filter((s): s is number => s !== null);

      if (componentScoresForSubject.length > 0) {
        const hasValidNumericScores = componentScoresForSubject.some(s => s >= 0);
        if (!hasValidNumericScores) { // All scores are special codes like -1, -2
            unroundedScore = componentScoresForSubject.includes(-2) ? -2 : -1;
        } else {
            const scoresForCalc = componentScoresForSubject.filter(s => s >= 0);
            if (term.calculationMode === TermCalculationMode.SIMPLE_AVERAGE) {
                unroundedScore = scoresForCalc.reduce((a, b) => a + b, 0) / scoresForCalc.length;
            } else { // WEIGHTED_AVERAGE
                let weightedSumOfScores = 0;
                let sumOfWeightsForScoredComponents = 0;
                termExamSessions.forEach(session => {
                  const mark = allMarks.find(m => m.studentId === student.id && m.subjectId === subject.id && m.examSessionId === session.id);
                  const score = mark ? mark.score : null;
                  if (score !== null && score >= 0) {
                      weightedSumOfScores += (score * session.weight);
                      sumOfWeightsForScoredComponents += session.weight;
                  }
                });
                if (sumOfWeightsForScoredComponents > 0) {
                  unroundedScore = weightedSumOfScores / sumOfWeightsForScoredComponents;
                }
            }
        }
      }
      
      const finalReportedScore = unroundedScore !== null && unroundedScore >= 0 ? Math.round(unroundedScore) : unroundedScore;
      subjectScores[subject.id] = finalReportedScore;
      const termGradeDetails = calculateSubjectGradeAndPoints(finalReportedScore);

      return {
          subjectId: subject.id,
          weightedScore: finalReportedScore,
          termPoints: termGradeDetails.points
      };
  });
  
  const subjectsTaken = subjectTermResults.filter(sr => sr.weightedScore !== null);
  
  const totalWeightedMarks = subjectsTaken.reduce((sum, sr) => sum + (sr.weightedScore !== null && sr.weightedScore >= 0 ? sr.weightedScore : 0), 0);
  
  const maxTotalMarks = subjectsTaken.length * 100;
  
  const meanWeightedScore = totalWeightedMarks !== null && maxTotalMarks > 0 ? (totalWeightedMarks / maxTotalMarks) * 100 : null;
  
  const totalTermPoints = subjectsTaken.reduce((sum, sr) => sum + (sr.termPoints || 0), 0);
  const meanTermPoints = subjectsTaken.length > 0 ? totalTermPoints / subjectsTaken.length : null;
  const overallTermGrade = calculateSubjectGradeAndPoints(meanWeightedScore !== null ? Math.round(meanWeightedScore) : null).grade;

  return { studentId: student.id, meanTermPoints, overallTermGrade, totalWeightedMarks, meanWeightedScore, subjectScores };
};


export const generateStudentReport = (
  student: Student,
  term: Term,
  allClasses: SchoolClass[],
  activeSubjects: Subject[],
  allMarks: Mark[],
  allExamSessions: ExamSession[],
  allStudents: Student[],
  allUsers: User[],
  allSubjects: Subject[],
): StudentReport | null => {
  if (!student || !term) return null;

  const classInfo = allClasses.find(c => c.id === student.classId);
  if (!classInfo) return null;
  
  // Determine which subjects this student takes
  const subjectsForThisStudentReport = (student.subjects && student.subjects.length > 0)
    ? allSubjects.filter(s => student.subjects!.includes(s.id) && activeSubjects.some(as => as.id === s.id)) // Ensure student's subjects are active
    : activeSubjects; // Fallback to all active subjects for the school
  
  const termExamSessions = allExamSessions.filter(es => es.termId === term.id);
  
  const subjectTermResults: SubjectTermResult[] = subjectsForThisStudentReport.map(subject => {
    const componentScores: SubjectExamScore[] = [];
    
    const assignedTeacher = allUsers.find(u =>
        u.role === UserRole.TEACHER &&
        u.classSubjectAssignments?.some(assignment =>
            assignment.classId === student.classId &&
            assignment.subjectIds.includes(subject.id)
        )
    );
    const teacherInitials = assignedTeacher ? getInitials(assignedTeacher.name) : '-';

    termExamSessions.forEach(session => {
        const mark = allMarks.find(m => m.studentId === student.id && m.subjectId === subject.id && m.examSessionId === session.id);
        const score = mark ? mark.score : null;
        const gradeDetails = calculateSubjectGradeAndPoints(score);
        componentScores.push({
            examSessionId: session.id,
            examSessionName: session.name,
            score,
            ...gradeDetails
        });
    });

    let unroundedFinalScore: number | null = null;
    const allScoresForSubject = componentScores.map(cs => cs.score).filter((s): s is number => s !== null);

    if (allScoresForSubject.length > 0) {
        const hasValidNumericScores = allScoresForSubject.some(s => s >= 0);
        if (!hasValidNumericScores) { // All scores are special codes
            unroundedFinalScore = allScoresForSubject.includes(-2) ? -2 : -1;
        } else {
            if (term.calculationMode === TermCalculationMode.SIMPLE_AVERAGE) {
                const scoresForCalc = componentScores.map(cs => cs.score).filter((s): s is number => s !== null && s >= 0);
                if (scoresForCalc.length > 0) {
                    unroundedFinalScore = scoresForCalc.reduce((sum, current) => sum + current, 0) / scoresForCalc.length;
                }
            } else { // WEIGHTED_AVERAGE
                let weightedSumOfScores = 0;
                let sumOfWeightsForScoredComponents = 0;
                componentScores.forEach(cs => {
                  if (cs.score !== null && cs.score >= 0) {
                    const sessionWeight = termExamSessions.find(s => s.id === cs.examSessionId)?.weight || 0;
                    weightedSumOfScores += (cs.score * sessionWeight); 
                    sumOfWeightsForScoredComponents += sessionWeight;
                  }
                });

                if (sumOfWeightsForScoredComponents > 0) {
                    unroundedFinalScore = weightedSumOfScores / sumOfWeightsForScoredComponents;
                }
            }
        }
    }
    
    const finalReportedScore = unroundedFinalScore !== null && unroundedFinalScore >= 0 ? Math.round(unroundedFinalScore) : unroundedFinalScore;
    const termGradeDetails = calculateSubjectGradeAndPoints(finalReportedScore);

    return {
      subjectId: subject.id,
      subjectName: subject.name,
      weightedScore: finalReportedScore,
      termGrade: termGradeDetails.grade,
      termPoints: termGradeDetails.points,
      termRemarks: termGradeDetails.remarks,
      teacherInitials,
      componentScores,
    };
  });
  
  const maxTotalMarks = subjectTermResults.length * 100;

  const classStreamStudents = allStudents.filter(s => s.classId === student.classId && s.stream === student.stream);
  const classStreamSummaries = classStreamStudents.map(s => generateStudentTermSummary(s, term, allSubjects, allMarks, allExamSessions, activeSubjects)).filter(s => s.meanTermPoints !== null);
  
  const sortedClassStream = [...classStreamSummaries].sort((a, b) => {
    if (b.meanTermPoints! !== a.meanTermPoints!) {
      return b.meanTermPoints! - a.meanTermPoints!;
    }
    return (b.totalWeightedMarks || 0) - (a.totalWeightedMarks || 0);
  });

  let studentRankInClass: number | undefined;
  if(sortedClassStream.find(s => s.studentId === student.id)) {
      let rank = 1;
      for (let i = 0; i < sortedClassStream.length; i++) {
          if (i > 0 && (sortedClassStream[i].meanTermPoints! < sortedClassStream[i - 1].meanTermPoints! || sortedClassStream[i].totalWeightedMarks! < sortedClassStream[i - 1].totalWeightedMarks!)) {
              rank = i + 1;
          }
          if (sortedClassStream[i].studentId === student.id) {
              studentRankInClass = rank;
              break;
          }
      }
  }
  
  const validSubjectResults = subjectTermResults.filter(sr => sr.weightedScore !== null && sr.weightedScore >= 0);
  const totalWeightedMarks = validSubjectResults.reduce((sum, sr) => sum + sr.weightedScore!, 0);

  const meanWeightedScore = totalWeightedMarks !== null && maxTotalMarks > 0 ? (totalWeightedMarks / maxTotalMarks) * 100 : null;
  
  const totalTermPoints = subjectTermResults.reduce((sum, sr) => sum + sr.termPoints, 0);
  const meanTermPoints = subjectTermResults.length > 0 ? totalTermPoints / subjectTermResults.length : null;
  const overallTermGrade = calculateSubjectGradeAndPoints(meanWeightedScore !== null ? Math.round(meanWeightedScore) : null).grade;

  let principalComment = "Satisfactory progress. Keep up the effort.";
  let classTeacherComment = `${student.name.split(' ')[0]} has shown consistent effort. Focus on areas of improvement for even better results.`;

  if (meanTermPoints !== null) {
    if (meanTermPoints >= 10) {
      principalComment = "Excellent performance! Your hard work is commendable. Aim for the stars!";
      classTeacherComment = `Outstanding work, ${student.name.split(' ')[0]}! Your dedication is inspiring. Keep challenging yourself.`;
    } else if (meanTermPoints >= 7) {
      principalComment = "Very good progress. Continue to strive for excellence.";
      classTeacherComment = `Well done, ${student.name.split(' ')[0]}! You are making great strides. Maintain this momentum.`;
    } else if (meanTermPoints >= 5) {
      principalComment = "Good effort. With more focus, you can achieve even better.";
      classTeacherComment = `${student.name.split(' ')[0]} is showing good potential. Consistent revision will yield significant improvements.`;
    } else if (meanTermPoints > 0) {
      principalComment = "There's room for improvement. Let's work together to identify and address challenges.";
      classTeacherComment = `${student.name.split(' ')[0]}, let's focus on building stronger foundations in key areas. I'm here to help.`;
    } else {
       principalComment = "Significant effort is required. Please see the class teacher for guidance.";
       classTeacherComment = `${student.name.split(' ')[0]}, we need to discuss strategies for improvement. Please make time to see me.`;
    }
  }

  const classTeacher = allUsers.find(u => 
      u.role === UserRole.TEACHER && 
      u.classSubjectAssignments?.some(a => a.classId === student.classId)
  );

  const principal = allUsers.find(u => u.role === UserRole.ADMIN && u.name.toLowerCase().includes('principal'));

  return {
    student,
    classInfo,
    term,
    subjectTermResults,
    totalWeightedMarks,
    maxTotalMarks,
    meanWeightedScore,
    meanTermPoints,
    overallTermGrade,
    principalComment,
    classTeacherComment,
    rank: studentRankInClass,
    totalStudentsInClass: classStreamSummaries.length,
    classTeacherName: classTeacher?.name,
    classTeacherSignatureUrl: classTeacher?.signatureImageUrl,
    principalName: principal?.name,
    principalSignatureUrl: principal?.signatureImageUrl,
    currentFeesBalance: student.currentFeesBalance,
    nextTermFees: student.nextTermFees,
    closingDate: term.closingDate,
    openingDate: term.openingDate,
  };
};


export const getStudentPerformanceHistory = (
    studentId: string,
    allStudents: Student[],
    allTerms: Term[],
    allClasses: SchoolClass[],
    activeSubjects: Subject[],
    allMarks: Mark[],
    allExamSessions: ExamSession[],
    allUsers: User[],
    allSubjects: Subject[]
  ): StudentPerformanceDatapoint[] => {
    const student = allStudents.find(s => s.id === studentId);
    if (!student) return [];
  
    const history: StudentPerformanceDatapoint[] = [];
  
    allTerms.forEach(term => {
      const reportForTerm = generateStudentReport(student, term, allClasses, activeSubjects, allMarks, allExamSessions, allStudents, allUsers, allSubjects);
      if (reportForTerm && reportForTerm.meanTermPoints !== null) {
        history.push({
          termId: term.id,
          termName: term.name,
          year: reportForTerm.term.year,
          meanWeightedScore: reportForTerm.meanWeightedScore,
          meanTermPoints: reportForTerm.meanTermPoints,
          overallTermGrade: reportForTerm.overallTermGrade,
        });
      }
    });
  
    return history.sort((a, b) => { 
      if (a.year !== b.year) return a.year - b.year;
      return parseInt(a.termName.split(' ')[1]) - parseInt(b.termName.split(' ')[1]);
    });
};

export const generateMeritList = (
    allStudents: Student[],
    term: Term,
    allClasses: SchoolClass[],
    activeSubjects: Subject[],
    allMarks: Mark[],
    allExamSessions: ExamSession[],
    allUsers: User[],
    allSubjects: Subject[],
    classFilterId?: string
  ): StudentReport[] => {
    let studentsToProcess = allStudents;
    if (classFilterId) {
      studentsToProcess = allStudents.filter(s => s.classId === classFilterId);
    }
  
    const reportsUnranked = studentsToProcess
      .map(student => generateStudentReport(student, term, allClasses, activeSubjects, allMarks, allExamSessions, allStudents, allUsers, allSubjects))
      .filter(report => report !== null && report.meanTermPoints !== null) as StudentReport[];
  
    reportsUnranked.sort((a, b) => {
        if (b.meanTermPoints! !== a.meanTermPoints!) {
            return b.meanTermPoints! - a.meanTermPoints!;
        }
        if (b.totalWeightedMarks !== null && a.totalWeightedMarks !== null) {
            if (b.totalWeightedMarks !== a.totalWeightedMarks) {
                return b.totalWeightedMarks - a.totalWeightedMarks;
            }
        } else if (b.totalWeightedMarks !== null) { return 1; } 
          else if (a.totalWeightedMarks !== null) { return -1; }
        return a.student.name.localeCompare(b.student.name);
    });

    if (reportsUnranked.length === 0) {
      return [];
    }
  
    const rankedReports = reportsUnranked.map(r => ({...r}));
    if (rankedReports.length > 0) {
      rankedReports[0].rank = 1;
      for (let i = 1; i < rankedReports.length; i++) {
        const prevReport = rankedReports[i - 1];
        const currentReport = rankedReports[i];
        if (
          currentReport.meanTermPoints === prevReport.meanTermPoints &&
          currentReport.totalWeightedMarks === prevReport.totalWeightedMarks
        ) {
          currentReport.rank = prevReport.rank; 
        } else {
          currentReport.rank = i + 1; 
        }
      }
    }
    return rankedReports;
};

export const generateClassTermBroadsheet = (
  classId: string,
  term: Term,
  allStudents: Student[],
  allClasses: SchoolClass[],
  activeSubjects: Subject[],
  allMarks: Mark[],
  allExamSessions: ExamSession[],
  allUsers: User[],
  allSubjects: Subject[]
): ClassTermBroadsheetEntry[] => {
  const studentsInClass = allStudents.filter(s => s.classId === classId);
  if (!studentsInClass.length) return [];

  const broadsheetEntries = studentsInClass.map(student => {
    const report = generateStudentReport(student, term, allClasses, activeSubjects, allMarks, allExamSessions, allStudents, allUsers, allSubjects);
    const subjectScores: { [subjectId: string]: number | null } = {};
    activeSubjects.forEach(sub => {
      const subjectResult = report?.subjectTermResults.find(sr => sr.subjectId === sub.id);
      subjectScores[sub.id] = subjectResult?.weightedScore ?? null;
    });

    return {
      studentId: student.id,
      admissionNumber: student.admissionNumber,
      studentName: student.name,
      classId: student.classId,
      stream: student.stream,
      subjectScores,
      totalWeightedMarks: report?.totalWeightedMarks ?? null,
      meanWeightedScore: report?.meanWeightedScore ?? null,
      meanTermPoints: report?.meanTermPoints ?? null,
      overallTermGrade: report?.overallTermGrade ?? null,
      // The rank will be assigned below
    };
  }).filter((entry): entry is ClassTermBroadsheetEntry => entry.meanTermPoints !== null);


  broadsheetEntries.sort((a, b) => {
    if (b.meanTermPoints! !== a.meanTermPoints!) {
      return b.meanTermPoints! - a.meanTermPoints!;
    }
    if (b.totalWeightedMarks !== null && a.totalWeightedMarks !== null) {
      if (b.totalWeightedMarks !== a.totalWeightedMarks) {
          return b.totalWeightedMarks - a.totalWeightedMarks;
      }
    } else if (b.totalWeightedMarks !== null) { return 1; }
      else if (a.totalWeightedMarks !== null) { return -1; }
    return a.studentName.localeCompare(b.studentName);
  });

  const finalEntries: ClassTermBroadsheetEntry[] = broadsheetEntries.map(e => ({...e}));

  if (finalEntries.length > 0) {
    finalEntries[0].rank = 1;
    for (let i = 1; i < finalEntries.length; i++) {
        const prevEntry = finalEntries[i-1];
        const currentEntry = finalEntries[i];
        if (prevEntry.meanTermPoints === currentEntry.meanTermPoints && prevEntry.totalWeightedMarks === currentEntry.totalWeightedMarks) {
            currentEntry.rank = prevEntry.rank; 
        } else {
            currentEntry.rank = i + 1; 
        }
    }
  }
  return finalEntries;
};

export const generateClassTermAnalysis = (
  classId: string | null, // Changed to allow null for whole school
  stream: string | null, // null for all streams
  term: Term,
  allStudents: Student[],
  allClasses: SchoolClass[],
  activeSubjects: Subject[],
  allMarks: Mark[],
  allExamSessions: ExamSession[],
  allSubjects: Subject[]
): ClassTermAnalysis | null => {
    const schoolClass = classId ? allClasses.find(c => c.id === classId) : null;
    
    const relevantStudents = allStudents.filter(s => 
        (classId ? s.classId === classId : true) && 
        (stream ? s.stream === stream : true)
    );

    if (relevantStudents.length === 0) return null;

    const studentSummaries = relevantStudents
        .map(s => generateStudentTermSummary(s, term, allSubjects, allMarks, allExamSessions, activeSubjects))
        .filter(summary => summary.meanTermPoints !== null);

    if (studentSummaries.length === 0) return null;

    // Overall analysis for the group
    const totalPoints = studentSummaries.reduce((sum, s) => sum + s.meanTermPoints!, 0);
    const overallMeanPoints = totalPoints / studentSummaries.length;
    
    const totalMeanScores = studentSummaries.reduce((sum, s) => sum + (s.meanWeightedScore ?? 0), 0);
    const averageMeanScore = studentSummaries.length > 0 ? totalMeanScores / studentSummaries.length : null;
    const overallMeanGrade = calculateSubjectGradeAndPoints(averageMeanScore !== null ? Math.round(averageMeanScore) : null).grade;

    const initialGradeDistribution = UNIFIED_GRADING_SCALE.reduce((acc, scale) => {
        acc[scale.grade] = 0;
        return acc;
    }, {} as { [grade: string]: number });

    const overallGradeDistribution = studentSummaries.reduce((dist, s) => {
        const grade = s.overallTermGrade || 'N/A';
        if (dist.hasOwnProperty(grade)) {
            dist[grade]++;
        }
        return dist;
    }, { ...initialGradeDistribution });

    // Subject-by-subject analysis
    const subjectAnalyses: SubjectClassAnalysis[] = activeSubjects.map(subject => {
        const subjectScores = studentSummaries
            .map(summary => {
                const student = relevantStudents.find(s => s.id === summary.studentId)!;
                return {
                    studentId: summary.studentId,
                    studentName: student.name,
                    admissionNumber: student.admissionNumber,
                    score: summary.subjectScores[subject.id]
                };
            })
            .filter(s => s.score !== null && s.score !== undefined);

        if (subjectScores.length === 0) {
            return {
                subjectId: subject.id, subjectName: subject.name, meanScore: null,
                gradeDistribution: { ...initialGradeDistribution }, rankedStudents: [], studentCount: 0
            };
        }
        
        const validNumericScores = subjectScores.filter(s => s.score! >= 0);

        if (validNumericScores.length === 0) {
            return {
                subjectId: subject.id, subjectName: subject.name, meanScore: null,
                gradeDistribution: { ...initialGradeDistribution }, rankedStudents: [], studentCount: subjectScores.length
            };
        }


        const totalScore = validNumericScores.reduce((sum, s) => sum + s.score!, 0);
        const meanScore = totalScore / validNumericScores.length;

        const gradeDistribution = subjectScores.reduce((dist, s) => {
            const grade = calculateSubjectGradeAndPoints(s.score).grade;
            if (dist.hasOwnProperty(grade)) {
                dist[grade]++;
            }
            return dist;
        }, { ...initialGradeDistribution });

        // Rank students for this subject
        const sortedStudents = [...subjectScores].sort((a, b) => (b.score ?? -Infinity) - (a.score ?? -Infinity));
        const rankedStudents: SubjectClassAnalysis['rankedStudents'] = [];
        if (sortedStudents.length > 0) {
            let rank = 1;
            for (let i = 0; i < sortedStudents.length; i++) {
                if (i > 0 && sortedStudents[i].score! < sortedStudents[i - 1].score!) {
                    rank = i + 1;
                }
                const { grade } = calculateSubjectGradeAndPoints(sortedStudents[i].score);
                rankedStudents.push({ ...sortedStudents[i], rank, score: sortedStudents[i].score, grade });
            }
        }
        
        return {
            subjectId: subject.id,
            subjectName: subject.name,
            meanScore,
            gradeDistribution,
            rankedStudents,
            studentCount: subjectScores.length
        };
    });

    return {
        classId: classId || 'all',
        className: schoolClass?.name || 'Whole School',
        stream: stream,
        termId: term.id,
        termName: term.name,
        year: term.year,
        overallMeanPoints,
        overallMeanGrade,
        gradeDistribution: overallGradeDistribution,
        totalStudents: studentSummaries.length,
        subjectAnalyses: subjectAnalyses.filter(sa => sa.studentCount > 0) // Only include subjects that were taken
    };
};

export const generatePerformanceChanges = (
  currentTerm: Term,
  comparisonTerm: Term,
  allStudents: Student[],
  allClasses: SchoolClass[],
  activeSubjects: Subject[],
  allMarks: Mark[],
  allExamSessions: ExamSession[],
  allUsers: User[],
  allSubjects: Subject[],
  classFilterId?: string | null,
): PerformanceChangeEntry[] => {
  const changes: PerformanceChangeEntry[] = [];
  
  const studentsToProcess = classFilterId ? allStudents.filter(s => s.classId === classFilterId) : allStudents;

  studentsToProcess.forEach(student => {
    const currentReport = generateStudentReport(student, currentTerm, allClasses, activeSubjects, allMarks, allExamSessions, allStudents, allUsers, allSubjects);
    const previousReport = generateStudentReport(student, comparisonTerm, allClasses, activeSubjects, allMarks, allExamSessions, allStudents, allUsers, allSubjects);

    if (
      currentReport && currentReport.meanTermPoints !== null &&
      previousReport && previousReport.meanTermPoints !== null
    ) {
      const meanPointsChange = currentReport.meanTermPoints - previousReport.meanTermPoints;
      changes.push({
        student,
        currentReport,
        previousReport,
        meanPointsChange
      });
    }
  });

  return changes;
};
