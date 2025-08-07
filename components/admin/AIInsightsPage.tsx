import React, { useState, useMemo } from 'react';
import { PageWrapper } from '../Layout';
import { SparklesIcon } from '../common/IconComponents';
import { SchoolClass, Term, Student, Subject, Mark, ExamSession, ClassTermAnalysis } from '../../types';
import { generateClassTermAnalysis } from '../../utils/examLogic';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Props definition
interface AIInsightsPageProps {
  classes: SchoolClass[];
  terms: Term[];
  students: Student[];
  subjects: Subject[];
  activeSubjects: Subject[];
  marks: Mark[];
  examSessions: ExamSession[];
  currentTermId: string | null;
}

export const AIInsightsPage: React.FC<AIInsightsPageProps> = ({
  classes, terms, students, subjects, activeSubjects, marks, examSessions, currentTermId
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedStream, setSelectedStream] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<string>('');
  
  const activeTerm = terms.find(t => t.id === currentTermId);

  const classStreams = selectedClassId !== 'all'
    ? ['all', ...Array.from(new Set(students.filter(s => s.classId === selectedClassId).map(s => s.stream).filter(Boolean)))]
    : ['all'];

  const analysisData: ClassTermAnalysis | null = useMemo(() => {
    if (!activeTerm) return null;
    return generateClassTermAnalysis(
      selectedClassId === 'all' ? null : selectedClassId,
      selectedStream === 'all' ? null : selectedStream,
      activeTerm, students, classes, activeSubjects, marks, examSessions, subjects
    );
  }, [selectedClassId, selectedStream, activeTerm, students, classes, activeSubjects, marks, examSessions, subjects]);

  const handleGenerateInsights = async () => {
    if (!analysisData) {
      setError("No data available to generate insights. Please select a class with exam data for the current term.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setAiInsights('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const promptData = {
        term: { name: analysisData.termName, year: analysisData.year },
        group: {
          name: analysisData.className,
          stream: analysisData.stream || 'All',
        },
        summary: {
          totalStudents: analysisData.totalStudents,
          overallMeanPoints: analysisData.overallMeanPoints?.toFixed(3),
          overallMeanGrade: analysisData.overallMeanGrade,
        },
        overallGradeDistribution: analysisData.gradeDistribution,
        subjectRanking: analysisData.subjectAnalyses
            .sort((a,b) => (b.meanScore || 0) - (a.meanScore || 0))
            .map(s => ({
                subjectName: s.subjectName,
                meanScore: s.meanScore?.toFixed(2),
                studentCount: s.studentCount
            })),
      };

      const prompt = `
        You are an expert educational analyst for a Kenyan high school. Your role is to provide insightful, constructive, and actionable feedback based on exam performance data.

        Here is the exam analysis data for ${promptData.group.name} ${promptData.group.stream} for ${promptData.term.name} ${promptData.term.year}:
        \`\`\`json
        ${JSON.stringify(promptData, null, 2)}
        \`\`\`

        Based on this data, please provide a detailed analysis using raw markdown for formatting (headings, lists, bold text).

        **CRITICAL INSTRUCTION:** Your entire response MUST be raw markdown text. Do NOT wrap it in a code fence (e.g., \`\`\`markdown ... \`\`\`). The output will be directly rendered as HTML, so it should not be in a code block format.

        The analysis should cover the following sections:

        1.  **Overall Performance Summary:** A brief, encouraging overview of the class's performance. Mention the mean points and mean grade.
        2.  **Key Strengths:** Identify the top-performing subjects and any other positive trends observed from the data.
        3.  **Areas for Improvement:** Pinpoint the subjects where the class is struggling. Analyze the grade distribution to identify if the issue is widespread or concentrated in a specific performance bracket.
        4.  **Actionable Recommendations:** Provide concrete, actionable suggestions for teachers and school administration.

        Your tone should be professional, supportive, and data-driven. The goal is to empower teachers and administrators to improve student outcomes. Do not mention specific student names.
      `;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: prompt
      });
      
      let insightsText = response.text.trim();
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = insightsText.match(fenceRegex);
      if (match && match[2]) {
        insightsText = match[2].trim();
      }
      
      setAiInsights(insightsText);

    } catch (err) {
      console.error("Error generating AI insights:", err);
      setError("An error occurred while communicating with the AI. Please check your connection or API key and try again.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <PageWrapper title="AI-Powered Insights">
      <div className="bg-primary-50 dark:bg-slate-700/30 border-l-4 border-primary-500 text-primary-800 dark:text-primary-300 p-4 rounded-r-lg mb-6" role="alert">
        <div className="flex">
          <div className="py-1"><SparklesIcon className="w-6 h-6 mr-4"/></div>
          <div>
            <p className="font-bold">Welcome to AI Insights!</p>
            <p className="text-sm">
              This tool uses Generative AI to analyze exam data. It provides a comprehensive overview of class performance,
              identifies trends, and offers actionable recommendations. Select a class and term to get started.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap justify-between items-center gap-4 no-print">
        <div className="flex items-end gap-4">
            <div>
              <label htmlFor="classSelectAnalysis" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Select Level</label>
              <select
                id="classSelectAnalysis"
                value={selectedClassId}
                onChange={e => { setSelectedClassId(e.target.value); setSelectedStream('all'); setAiInsights(''); }}
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
                onChange={e => { setSelectedStream(e.target.value); setAiInsights(''); }}
                disabled={classStreams.length <= 1}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md shadow-sm disabled:bg-gray-100 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:disabled:bg-slate-700/50"
              >
                {classStreams.map(s => <option key={s} value={s}>{s === 'all' ? 'All Streams' : s}</option>)}
              </select>
            </div>
            )}
        </div>
        <button
          onClick={handleGenerateInsights}
          disabled={isLoading || !analysisData}
          className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-6 rounded-lg inline-flex items-center disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <SparklesIcon className="w-5 h-5 mr-2" />
          {isLoading ? 'Generating...' : 'Generate AI Insights'}
        </button>
      </div>

      {!activeTerm && <p className="text-center text-gray-500 dark:text-slate-400 py-8">Please select a term to generate AI insights.</p>}
      
      {activeTerm && !analysisData && (
        <div className="text-center text-gray-500 dark:text-slate-400 py-8">
            <p>No exam data found for the selected level and term.</p>
            <p className="text-sm">Please enter marks for this selection to enable AI analysis.</p>
        </div>
      )}

      <div className="mt-6">
        {isLoading && (
            <div className="flex justify-center items-center flex-col p-8 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                <p className="mt-4 text-gray-600 dark:text-slate-300 font-semibold">The AI is analyzing the data... this may take a moment.</p>
            </div>
        )}
        {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg dark:bg-red-900/20 dark:text-red-300 dark:border-red-500/70" role="alert">
                <p className="font-bold">An Error Occurred</p>
                <p>{error}</p>
            </div>
        )}
        {aiInsights && (
            <div className="prose max-w-none p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {aiInsights}
                </ReactMarkdown>
            </div>
        )}
      </div>
    </PageWrapper>
  );
};