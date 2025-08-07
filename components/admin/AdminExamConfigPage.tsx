import React, { useState, useEffect } from 'react';
import { PageWrapper } from '../Layout';
import { Term, ExamSession, TermCalculationMode } from '../../types';
import { PlusIcon, TrashIcon } from '../common/IconComponents';

interface AdminExamConfigPageProps {
    initialTerms: Term[]; 
    initialExamSessions: ExamSession[]; 
    onConfigSave: (updatedTerms: Term[], updatedSessions: ExamSession[]) => void
}

export const AdminExamConfigPage: React.FC<AdminExamConfigPageProps> = ({initialTerms, initialExamSessions, onConfigSave}) => {
  const [editableTerms, setEditableTerms] = useState<Term[]>([]);
  const [editableSessions, setEditableSessions] = useState<ExamSession[]>([]);

  useEffect(() => {
    // Deep copy to prevent mutation of props
    setEditableTerms(JSON.parse(JSON.stringify(initialTerms)));
    setEditableSessions(JSON.parse(JSON.stringify(initialExamSessions)));
  }, [initialTerms, initialExamSessions]);

  // Term handlers
  const handleAddTerm = () => {
    const newTerm: Term = {
      id: `term_${Date.now()}`,
      name: 'New Term',
      year: new Date().getFullYear(),
      calculationMode: TermCalculationMode.WEIGHTED_AVERAGE,
    };
    setEditableTerms(prev => [...prev, newTerm]);
  };

  const handleDeleteTerm = (termId: string) => {
    if (window.confirm("Are you sure you want to delete this term and all its associated exam sessions? This action cannot be undone.")) {
      setEditableTerms(prev => prev.filter(t => t.id !== termId));
      setEditableSessions(prev => prev.filter(s => s.termId !== termId));
    }
  };
  
  const handleTermChange = (termId: string, field: 'name' | 'year' | 'calculationMode' | 'closingDate' | 'openingDate', value: string | TermCalculationMode) => {
    setEditableTerms(prev => prev.map(t => {
      if (t.id === termId) {
        if (field === 'year') {
          return { ...t, year: parseInt(value as string, 10) || 0 };
        }
        return { ...t, [field]: value };
      }
      return t;
    }));
  };

  // Session handlers
  const handleAddSession = (termId: string) => {
    const newSession: ExamSession = {
      id: `session_${Date.now()}`,
      termId: termId,
      name: 'New Exam Session',
      weight: 0,
    };
    setEditableSessions(prev => [...prev, newSession]);
  };

  const handleDeleteSession = (sessionId: string) => {
    if (window.confirm("Are you sure you want to delete this exam session?")) {
      setEditableSessions(prev => prev.filter(s => s.id !== sessionId));
    }
  };
  
  const handleSessionChange = (sessionId: string, field: 'name' | 'weight', value: string) => {
    setEditableSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        if (field === 'weight') {
          const weight = parseInt(value, 10);
          return { ...s, weight: isNaN(weight) ? 0 : Math.max(0, Math.min(100, weight)) };
        }
        return { ...s, name: value };
      }
      return s;
    }));
  };

  // Save handler
  const handleSave = () => {
    for (const term of editableTerms) {
      if (!term.name.trim()) {
        alert("Term names cannot be empty.");
        return;
      }
      if (isNaN(term.year) || term.year < 2000 || term.year > 2100) {
        alert(`Invalid year for term ${term.name}. Please enter a valid year.`);
        return;
      }
      
      const sessionsForTerm = editableSessions.filter(s => s.termId === term.id);
      
      if (term.calculationMode === TermCalculationMode.WEIGHTED_AVERAGE && sessionsForTerm.length > 0) {
        const totalWeight = sessionsForTerm.reduce((sum, s) => sum + s.weight, 0);
        if (totalWeight !== 100) {
          alert(`Weights for "${term.name} - ${term.year}" do not sum to 100%. Current sum: ${totalWeight}%.`);
          return;
        }
      }

      for (const session of sessionsForTerm) {
          if (!session.name.trim()) {
              alert(`Exam session names cannot be empty in term "${term.name} - ${term.year}".`);
              return;
          }
      }
    }
    onConfigSave(editableTerms, editableSessions);
    alert("Configurations saved successfully!");
  };

  return (
    <PageWrapper title="Term & Exam Configuration">
      <div className="flex justify-end mb-6">
        <button
            onClick={handleAddTerm}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add New Term
        </button>
      </div>

      <div className="space-y-8">
        {editableTerms.length > 0 ? editableTerms.map(term => {
          const sessionsForTerm = editableSessions.filter(es => es.termId === term.id);
          const totalWeight = sessionsForTerm.reduce((sum, s) => sum + s.weight, 0);

          return (
            <div key={term.id} className="p-4 md:p-6 border-2 border-gray-200 dark:border-slate-700 rounded-xl shadow-md bg-white dark:bg-slate-800 transition-all hover:shadow-lg">
              <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-primary-800 dark:text-primary-300">Term Details</h3>
                  <button onClick={() => handleDeleteTerm(term.id)} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full" aria-label="Delete term"><TrashIcon /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor={`termName-${term.id}`} className="block text-sm font-medium text-gray-700 dark:text-slate-300">Term Name</label>
                  <input id={`termName-${term.id}`} type="text" value={term.name} onChange={(e) => handleTermChange(term.id, 'name', e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"/>
                </div>
                <div>
                  <label htmlFor={`termYear-${term.id}`} className="block text-sm font-medium text-gray-700 dark:text-slate-300">Year</label>
                  <input id={`termYear-${term.id}`} type="number" value={term.year} onChange={(e) => handleTermChange(term.id, 'year', e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" min="2000" max="2100"/>
                </div>
                <div>
                  <label htmlFor={`termClosingDate-${term.id}`} className="block text-sm font-medium text-gray-700 dark:text-slate-300">Closing Date</label>
                  <input id={`termClosingDate-${term.id}`} type="date" value={term.closingDate || ''} onChange={(e) => handleTermChange(term.id, 'closingDate', e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"/>
                </div>
                <div>
                  <label htmlFor={`termOpeningDate-${term.id}`} className="block text-sm font-medium text-gray-700 dark:text-slate-300">Next Opening Date</label>
                  <input id={`termOpeningDate-${term.id}`} type="date" value={term.openingDate || ''} onChange={(e) => handleTermChange(term.id, 'openingDate', e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"/>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t dark:border-slate-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Final Score Calculation Method</label>
                  <div className="flex items-center space-x-6 mt-2">
                    <label className="flex items-center cursor-pointer">
                      <input type="radio" name={`calcMode-${term.id}`} value={TermCalculationMode.WEIGHTED_AVERAGE} checked={term.calculationMode === TermCalculationMode.WEIGHTED_AVERAGE} onChange={() => handleTermChange(term.id, 'calculationMode', TermCalculationMode.WEIGHTED_AVERAGE)} className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-slate-500 dark:bg-slate-600"/>
                      <span className="ml-2 text-sm text-gray-700 dark:text-slate-300">Weighted Average</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input type="radio" name={`calcMode-${term.id}`} value={TermCalculationMode.SIMPLE_AVERAGE} checked={term.calculationMode === TermCalculationMode.SIMPLE_AVERAGE} onChange={() => handleTermChange(term.id, 'calculationMode', TermCalculationMode.SIMPLE_AVERAGE)} className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-slate-500 dark:bg-slate-600"/>
                      <span className="ml-2 text-sm text-gray-700 dark:text-slate-300">Simple Average</span>
                    </label>
                  </div>
              </div>
              
              <div className="mt-6 border-t dark:border-slate-700 pt-4">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-lg font-semibold text-gray-700 dark:text-slate-200">Exam Sessions</h4>
                    {term.calculationMode === TermCalculationMode.WEIGHTED_AVERAGE && (
                      <p className={`text-sm font-semibold ${totalWeight !== 100 && sessionsForTerm.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          Total Weight: {totalWeight}%
                      </p>
                    )}
                </div>
                
                <div className="space-y-3">
                  {sessionsForTerm.map(session => (
                    <div key={session.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border dark:border-slate-700">
                      <div className="flex-grow">
                        <label htmlFor={`sessionName-${session.id}`} className="sr-only">Session Name</label>
                        <input id={`sessionName-${session.id}`} type="text" value={session.name} onChange={(e) => handleSessionChange(session.id, 'name', e.target.value)} placeholder="Session Name" className="w-full p-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-600 dark:border-slate-500 dark:text-slate-200"/>
                      </div>
                      {term.calculationMode === TermCalculationMode.WEIGHTED_AVERAGE && (
                        <div className="flex items-center space-x-2">
                          <label htmlFor={`weight-${session.id}`} className="sr-only">Weight</label>
                          <input id={`weight-${session.id}`} type="number" value={session.weight} onChange={(e) => handleSessionChange(session.id, 'weight', e.target.value)} className="w-24 p-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-600 dark:border-slate-500 dark:text-slate-200" min="0" max="100"/>
                          <span className="text-gray-600 dark:text-slate-300">%</span>
                        </div>
                      )}
                      <button onClick={() => handleDeleteSession(session.id)} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full" aria-label="Delete session"><TrashIcon className="w-4 h-4"/></button>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4">
                    <button onClick={() => handleAddSession(term.id)} className="inline-flex items-center px-3 py-1.5 border border-dashed border-gray-400 dark:border-slate-600 text-sm font-medium rounded-md text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:border-gray-500 dark:hover:border-slate-500">
                        <PlusIcon className="w-4 h-4 mr-1"/> Add Session
                    </button>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-12 text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
            <p>No terms configured.</p>
            <p className="text-sm">Click "Add New Term" to get started.</p>
          </div>
        )}
      </div>
      <div className="mt-8 text-right">
        <button onClick={handleSave} className="px-8 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-lg no-print">
            Save All Configurations
        </button>
      </div>
    </PageWrapper>
  );
};