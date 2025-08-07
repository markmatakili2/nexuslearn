

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { User, AppState, UserRole, Student, Subject, SchoolClass, Mark, Term, ExamSession, StudentFormData, TeacherFormData, UserProfileFormData } from './types';
import { 
    MOCK_USERS, MOCK_STUDENTS, MOCK_SUBJECTS, MOCK_CLASSES, MOCK_MARKS, 
    MOCK_SCHOOL_NAME_DISPLAY, DEFAULT_SCHOOL_DOMAIN, MOCK_TERMS, DEFAULT_TERM_ID,
    DEFAULT_SCHOOL_NAME, DEFAULT_SCHOOL_ADDRESS,
    DEFAULT_ACTIVE_SUBJECT_IDS,
    MOCK_EXAM_SESSIONS
} from './constants';
import { LoginForm } from './components/AuthForm';
import { AppLayout } from './components/Layout';
import { KeyIcon } from './components/common/IconComponents';

// Import page components with corrected paths
import { AdminExamConfigPage } from '../components/admin/AdminExamConfigPage';
import { DashboardPage } from '../components/DashboardPage';
import { TeacherMarksEntryPage } from '../components/TeacherMarksEntryPage';
import { AdminStudentsPage } from '../components/admin/AdminStudentsPage';
import { AdminTeachersPage } from '../components/admin/AdminTeachersPage';
import { ProfilePage } from '../components/ProfilePage';
import { MeritListPage } from '../components/MeritListPage';
import { AdminSchoolSettingsPage } from '../components/admin/SchoolSettingsPage';
import { AdminExamAnalysisPage } from '../components/admin/ExamAnalysisPage';
import { AdminClassBroadsheetPage } from '../components/admin/ClassBroadsheetPage';
import { AdminMarkSheetsPage } from '../components/admin/MarkSheetsPage';
import { AIInsightsPage } from '../components/admin/AIInsightsPage';
import { AdminClassListPage } from '../components/admin/AdminClassListPage';
import { AdminNotificationsPage } from '../components/admin/AdminNotificationsPage';


// Helper function to convert image file to base64
const imageToBase64 = (file: File): Promise<string | ArrayBuffer | null> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};


const loadStateFromStorage = (): AppState => {
    let loadedUsers: User[] = MOCK_USERS;
    const persistedUsersString = localStorage.getItem('appUsers');
    if (persistedUsersString) { try { loadedUsers = JSON.parse(persistedUsersString); } catch (e) { console.error("Failed to parse users from localStorage", e); } }

    let loadedStudents: Student[] = MOCK_STUDENTS;
    const persistedStudentsString = localStorage.getItem('appStudents');
    if (persistedStudentsString) { try { loadedStudents = JSON.parse(persistedStudentsString); } catch (e) { console.error("Failed to parse students from localStorage", e); } }

    const finalUsers = [...loadedUsers];
    const userSet = new Set(finalUsers.map(u => u.username.toLowerCase()));

    loadedStudents.forEach(student => {
        if (!userSet.has(student.parentUsername.toLowerCase())) {
            finalUsers.push({
                id: `parent_${student.id}_${Date.now()}`,
                username: student.parentUsername,
                password: student.admissionNumber,
                role: UserRole.PARENT,
                name: `Parent of ${student.name.split(' ')[0]}`,
                studentId: student.id
            });
            userSet.add(student.parentUsername.toLowerCase());
        }
    });

    let loadedMarks: Mark[] = MOCK_MARKS;
    const persistedMarksString = localStorage.getItem('appMarks');
    if (persistedMarksString) { try { loadedMarks = JSON.parse(persistedMarksString); } catch (e) { console.error("Failed to parse marks from localStorage", e); } }

    let loadedTerms: Term[] = MOCK_TERMS;
    const persistedTermsString = localStorage.getItem('appTerms');
    if (persistedTermsString) { try { loadedTerms = JSON.parse(persistedTermsString); } catch (e) { console.error("Failed to parse terms from localStorage", e); } }

    let loadedExamSessions: ExamSession[] = MOCK_EXAM_SESSIONS;
    const persistedExamSessions = localStorage.getItem('appExamSessions');
    if (persistedExamSessions) { try { loadedExamSessions = JSON.parse(persistedExamSessions); } catch (e) { console.error("Failed to parse exam sessions from localStorage", e); } }

    const persistedActiveSubjects = localStorage.getItem('activeSubjectIds');
    const activeSubjectIds = persistedActiveSubjects ? JSON.parse(persistedActiveSubjects) : DEFAULT_ACTIVE_SUBJECT_IDS;

    const storedCurrentTermId = localStorage.getItem('currentTermId') || loadedTerms[0]?.id || DEFAULT_TERM_ID;

    return {
        currentUser: null,
        users: finalUsers,
        students: loadedStudents,
        subjects: MOCK_SUBJECTS,
        classes: MOCK_CLASSES,
        terms: loadedTerms,
        examSessions: loadedExamSessions,
        marks: loadedMarks,
        isLoading: false,
        error: null,
        schoolNameDisplay: MOCK_SCHOOL_NAME_DISPLAY,
        actualSchoolName: localStorage.getItem('actualSchoolName') || DEFAULT_SCHOOL_NAME,
        schoolAddress: localStorage.getItem('schoolAddress') || DEFAULT_SCHOOL_ADDRESS,
        schoolNameDomain: localStorage.getItem('schoolNameDomain') || DEFAULT_SCHOOL_DOMAIN,
        currentTermId: storedCurrentTermId,
        schoolBadgeUrl: localStorage.getItem('schoolBadgeUrl') || null,
        activeSubjectIds: activeSubjectIds,
        selectedComparisonTermId: null, // Initialize comparison term
    };
};

export function App(): React.ReactElement | null {
  const [appState, setAppState] = useState<AppState>(loadStateFromStorage);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'light');
  const navigate = useNavigate();
  const location = useLocation();

  const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false);
  const [teacherForPasswordReset, setTeacherForPasswordReset] = useState<User | null>(null);
  const [newPasswordForReset, setNewPasswordForReset] = useState('');
  
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const persistedCurrentUserString = localStorage.getItem('currentUser');
    let currentActiveUser: User | null = null;
    if (persistedCurrentUserString) {
      try {
        const user: User = JSON.parse(persistedCurrentUserString);
        const validUser = appState.users.find(u => u.id === user.id && u.username === user.username);
        if (validUser) {
            currentActiveUser = validUser;
            setAppState(prev => ({...prev, currentUser: validUser}));
        } else {
            localStorage.removeItem('currentUser');
        }
      } catch (e) { 
          localStorage.removeItem('currentUser'); 
      }
    }
    
    if (currentActiveUser && (location.pathname === '/login' || location.pathname === '/')) {
      navigate('/dashboard');
    } else if (!currentActiveUser && location.pathname !== '/login' && location.pathname !== '/profile') {
        navigate('/login');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTermChange = useCallback((termId: string) => {
    setAppState(prev => ({ ...prev, currentTermId: termId, selectedComparisonTermId: null })); // Reset comparison on term change
    localStorage.setItem('currentTermId', termId);
  }, []);

  const handleComparisonTermChange = useCallback((termId: string | null) => {
      setAppState(prev => ({...prev, selectedComparisonTermId: termId}));
  }, []);

  const handleUpdateBadge = useCallback((newBadgeUrl: string | null) => {
    setAppState(prev => ({ ...prev, schoolBadgeUrl: newBadgeUrl }));
    if (newBadgeUrl) {
        localStorage.setItem('schoolBadgeUrl', newBadgeUrl);
    } else {
        localStorage.removeItem('schoolBadgeUrl');
    }
    alert(newBadgeUrl ? "School badge updated successfully." : "School badge removed successfully.");
  }, []);

  const handleUpdateSchoolDetails = useCallback(({ name, domain, address }: { name: string; domain: string; address: string }) => {
      setAppState(prev => {
          const oldDomain = prev.schoolNameDomain;
          const newDomain = domain.trim();

          if (!name.trim() || !newDomain || !address.trim()) {
              alert("School Name, Domain, and Address cannot be empty.");
              return prev;
          }

          if (oldDomain === newDomain && prev.actualSchoolName === name && prev.schoolAddress === address) {
              return prev;
          }

          const updatedUsers = prev.users.map(user => {
              if (user.username !== 'superadmin' && user.username.endsWith(`@${oldDomain}`)) {
                  const localPart = user.username.split('@')[0];
                  return { ...user, username: `${localPart}@${newDomain}` };
              }
              return user;
          });
          
          const updatedStudents = prev.students.map(student => {
              if (student.parentUsername.endsWith(`@${oldDomain}`)) {
                  const localPart = student.parentUsername.split('@')[0];
                  return { ...student, parentUsername: `${localPart}@${newDomain}` };
              }
              return student;
          });

          let updatedCurrentUser = prev.currentUser;
          if (updatedCurrentUser && updatedCurrentUser.username !== 'superadmin' && updatedCurrentUser.username.endsWith(`@${oldDomain}`)) {
              const localPart = updatedCurrentUser.username.split('@')[0];
              updatedCurrentUser = { ...updatedCurrentUser, username: `${localPart}@${newDomain}` };
              localStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
          }

          localStorage.setItem('actualSchoolName', name);
          localStorage.setItem('schoolNameDomain', newDomain);
          localStorage.setItem('schoolAddress', address);
          localStorage.setItem('appUsers', JSON.stringify(updatedUsers));
          localStorage.setItem('appStudents', JSON.stringify(updatedStudents));
          
          alert("School details updated successfully! Usernames have been updated to the new domain if applicable.");

          return {
              ...prev,
              actualSchoolName: name,
              schoolAddress: address,
              schoolNameDomain: newDomain,
              users: updatedUsers,
              students: updatedStudents,
              currentUser: updatedCurrentUser,
          };
      });
  }, []);
  
  const handleUpdateActiveSubjects = useCallback((newActiveIds: string[]) => {
      setAppState(prev => ({ ...prev, activeSubjectIds: newActiveIds }));
      localStorage.setItem('activeSubjectIds', JSON.stringify(newActiveIds));
      alert("Subject configuration updated successfully!");
  }, []);


  const handleLogin = useCallback((username: string, passwordParam: string) => {
    setAppState(prev => ({ ...prev, isLoading: true, error: null }));
    setTimeout(() => {
        let userToLogin = appState.users.find(u => u.username.toLowerCase() === username.toLowerCase());
        
        if (!userToLogin && !username.includes('@')) {
            userToLogin = appState.users.find(u => u.username.toLowerCase().startsWith(username.toLowerCase() + '@'));
        }

        if (userToLogin) {
            if (userToLogin.password === passwordParam) {
                setAppState(prev => ({ ...prev, currentUser: userToLogin, isLoading: false, error: null }));
                localStorage.setItem('currentUser', JSON.stringify(userToLogin));
                if (!appState.currentTermId && appState.terms.length > 0) {
                    handleTermChange(appState.terms[0].id);
                }
                navigate('/dashboard');
            } else {
                setAppState(prev => ({ ...prev, error: 'Invalid username or password.', isLoading: false }));
            }
        } else {
            setAppState(prev => ({ ...prev, error: 'Invalid username or password.', isLoading: false }));
        }
    }, 500);
}, [appState.users, appState.currentTermId, appState.terms, navigate, handleTermChange]);


  const handleLogout = useCallback(() => {
    setAppState(prev => ({ ...prev, currentUser: null, error: null }));
    localStorage.removeItem('currentUser');
    navigate('/login');
  }, [navigate]);

  const handleMarksSubmit = useCallback((updatedMarks: Mark[], examSessionId: string) => {
    setAppState(prev => ({ ...prev, isLoading: true }));
    setTimeout(() => {
      const otherSessionMarks = appState.marks.filter(m => m.examSessionId !== examSessionId);
      
      let currentSessionMarksForUpdate = appState.marks.filter(m => m.examSessionId === examSessionId);
      
      updatedMarks.forEach(updatedMark => {
        const existingMarkIndex = currentSessionMarksForUpdate.findIndex(
          m => m.studentId === updatedMark.studentId && m.subjectId === updatedMark.subjectId
        );
        if (existingMarkIndex > -1) {
          currentSessionMarksForUpdate[existingMarkIndex] = updatedMark;
        } else {
          currentSessionMarksForUpdate.push(updatedMark);
        }
      });

      const finalMarks = [...otherSessionMarks, ...currentSessionMarksForUpdate];
      setAppState(prev => ({ ...prev, marks: finalMarks, isLoading: false }));
      localStorage.setItem('appMarks', JSON.stringify(finalMarks)); 
      alert('Marks submitted successfully for the session!');
    }, 500);
  }, [appState.marks]);

  const handleConfigSave = useCallback((updatedTerms: Term[], updatedSessions: ExamSession[]) => {
    setAppState(prev => ({...prev, terms: updatedTerms, examSessions: updatedSessions}));
    localStorage.setItem('appTerms', JSON.stringify(updatedTerms));
    localStorage.setItem('appExamSessions', JSON.stringify(updatedSessions));
  }, []);

  const handleStudentSave = async (studentData: StudentFormData) => {
    setAppState(prev => ({ ...prev, isLoading: true }));
    let updatedStudents = [...appState.students];
    let updatedUsers = [...appState.users];
    const isEditing = !!studentData.id;
    let profileImageUrl: string | undefined = studentData.id ? updatedStudents.find(s=>s.id === studentData.id)?.profileImageUrl : undefined;

    if (studentData.profileImageFile) {
        try {
            const base64 = await imageToBase64(studentData.profileImageFile);
            profileImageUrl = base64 as string;
        } catch (error) {
            console.error("Error converting image to base64:", error);
            alert("Failed to process image. Please try another image.");
            setAppState(prev => ({ ...prev, isLoading: false }));
            return;
        }
    } else if (studentData.profileImageFile === null) {
        profileImageUrl = undefined;
    }


    const finalStudentData = { ...studentData, profileImageUrl };
    delete (finalStudentData as any).profileImageFile;

    if (isEditing) {
        const originalStudent = appState.students.find(s => s.id === finalStudentData.id);
        updatedStudents = updatedStudents.map(s => s.id === finalStudentData.id ? { ...s, ...finalStudentData } as Student : s);

        const newParentUsername = (finalStudentData as Student).parentUsername;
        if (originalStudent && originalStudent.parentUsername.toLowerCase() !== newParentUsername.toLowerCase()) {
            const oldParentUser = updatedUsers.find(u => u.username.toLowerCase() === originalStudent.parentUsername.toLowerCase() && u.role === UserRole.PARENT);
            if (oldParentUser) {
                const hasOtherChildren = updatedStudents.some(s => 
                    s.parentUsername.toLowerCase() === oldParentUser.username.toLowerCase()
                );
                if (!hasOtherChildren) {
                    updatedUsers = updatedUsers.filter(u => u.id !== oldParentUser.id);
                }
            }
        }
    } else {
        const newStudentId = `S_${Date.now()}`;
        updatedStudents.push({ ...finalStudentData, id: newStudentId } as Student);
    }

    const studentBeingSaved = isEditing ? updatedStudents.find(s=>s.id === finalStudentData.id) : updatedStudents[updatedStudents.length-1];
    if (studentBeingSaved) {
        const parentUsername = studentBeingSaved.parentUsername.toLowerCase();
        let parentUser = updatedUsers.find(u => u.username.toLowerCase() === parentUsername && u.role === UserRole.PARENT);
        if (!parentUser) {
            parentUser = {
                id: `parent_${studentBeingSaved.id}_${Date.now()}`,
                username: studentBeingSaved.parentUsername,
                password: studentBeingSaved.admissionNumber, 
                role: UserRole.PARENT,
                name: `Parent of ${studentBeingSaved.name.split(' ')[0]}`,
                studentId: studentBeingSaved.id
            };
            updatedUsers.push(parentUser);
        } else { 
            if(parentUser.studentId === studentBeingSaved.id) {
            } else if (!parentUser.studentId) { 
                updatedUsers = updatedUsers.map(u => u.id === parentUser!.id ? {...u, studentId: studentBeingSaved.id} : u);
            }
        }
    }
    
    setAppState(prev => ({ ...prev, students: updatedStudents, users: updatedUsers, isLoading: false }));
    localStorage.setItem('appStudents', JSON.stringify(updatedStudents));
    localStorage.setItem('appUsers', JSON.stringify(updatedUsers));
    alert(`Student ${isEditing ? 'updated' : 'added'} successfully!`);
  };

  const handleStudentDelete = (studentId: string) => {
    if (!window.confirm("Are you sure you want to delete this student? This will also remove their marks and potentially their parent's account if they have no other children registered.")) return;

    setAppState(prev => ({ ...prev, isLoading: true }));
    const studentToDelete = appState.students.find(s => s.id === studentId);
    if (!studentToDelete) {
        setAppState(prev => ({ ...prev, isLoading: false }));
        alert("Student not found.");
        return;
    }

    const updatedStudents = appState.students.filter(s => s.id !== studentId);
    const updatedMarks = appState.marks.filter(m => m.studentId !== studentId);
    
    let updatedUsers = [...appState.users];
    const parentUser = updatedUsers.find(u => u.username.toLowerCase() === studentToDelete.parentUsername.toLowerCase() && u.role === UserRole.PARENT);
    if (parentUser) {
        const otherChildrenOfThisParent = updatedStudents.some(s => s.parentUsername.toLowerCase() === parentUser!.username.toLowerCase());
        if (!otherChildrenOfThisParent) { 
            updatedUsers = updatedUsers.filter(u => u.id !== parentUser.id); 
        }
    }

    setAppState(prev => ({ ...prev, students: updatedStudents, marks: updatedMarks, users: updatedUsers, isLoading: false }));
    localStorage.setItem('appStudents', JSON.stringify(updatedStudents));
    localStorage.setItem('appMarks', JSON.stringify(updatedMarks));
    localStorage.setItem('appUsers', JSON.stringify(updatedUsers));
    alert("Student deleted successfully.");
  };

const handleTeacherSave = async (teacherData: TeacherFormData & {profileImageFile?: File | null; classSubjectAssignments?: { classId: string; subjectIds: string[] }[], signatureImageFile?: File | null}) => {
    setAppState(prev => ({ ...prev, isLoading: true }));
    let updatedUsers = [...appState.users];
    const isEditing = !!teacherData.id;
    let profileImageUrl: string | undefined = isEditing ? updatedUsers.find(u => u.id === teacherData.id)?.profileImageUrl : undefined;
    let signatureImageUrl: string | undefined = isEditing ? updatedUsers.find(u => u.id === teacherData.id)?.signatureImageUrl : undefined;

    if (teacherData.profileImageFile) {
        try {
            profileImageUrl = await imageToBase64(teacherData.profileImageFile) as string;
        } catch (error) {
            console.error("Error converting image to base64 for teacher:", error);
            alert("Failed to process teacher image.");
            setAppState(prev => ({ ...prev, isLoading: false }));
            return;
        }
    } else if (teacherData.profileImageFile === null) {
        profileImageUrl = undefined;
    }

    if (teacherData.signatureImageFile) {
        try {
            signatureImageUrl = await imageToBase64(teacherData.signatureImageFile) as string;
        } catch (error) {
            console.error("Error converting signature image to base64 for teacher:", error);
            alert("Failed to process teacher signature image.");
            setAppState(prev => ({ ...prev, isLoading: false }));
            return;
        }
    } else if (teacherData.signatureImageFile === null) {
        signatureImageUrl = undefined;
    }

    const finalTeacherData = { ...teacherData, profileImageUrl, signatureImageUrl };
    delete (finalTeacherData as any).profileImageFile;
    delete (finalTeacherData as any).signatureImageFile;


    if (isEditing) {
        updatedUsers = updatedUsers.map(u => {
            if (u.id === finalTeacherData.id) {
                return {
                    ...u,
                    name: finalTeacherData.name,
                    username: finalTeacherData.username,
                    teacherId: finalTeacherData.teacherId || u.teacherId,
                    password: finalTeacherData.password_param ? finalTeacherData.password_param : u.password,
                    phoneNumber: finalTeacherData.phoneNumber || u.phoneNumber,
                    profileImageUrl: finalTeacherData.profileImageUrl,
                    signatureImageUrl: finalTeacherData.signatureImageUrl,
                    classSubjectAssignments: finalTeacherData.classSubjectAssignments,
                    role: finalTeacherData.role || u.role
                };
            }
            return u;
        });
    } else {
        const newTeacher: User = {
            id: `user_${Date.now()}`,
            username: finalTeacherData.username,
            password: finalTeacherData.password_param || 'changeme', 
            role: finalTeacherData.role || UserRole.TEACHER,
            name: finalTeacherData.name,
            phoneNumber: finalTeacherData.phoneNumber,
            teacherId: finalTeacherData.teacherId || `T_${Date.now()}`,
            profileImageUrl: finalTeacherData.profileImageUrl,
            signatureImageUrl: finalTeacherData.signatureImageUrl,
            classSubjectAssignments: finalTeacherData.classSubjectAssignments
        };
        updatedUsers.push(newTeacher);
    }
    
    setAppState(prev => ({ ...prev, users: updatedUsers, isLoading: false }));
    localStorage.setItem('appUsers', JSON.stringify(updatedUsers));
    alert(`User ${isEditing ? 'updated' : 'added'} successfully!`);
};

const handleTeacherDelete = (teacherId: string) => {
    const userToDelete = appState.users.find(u => u.id === teacherId);
    if (userToDelete && userToDelete.username === 'superadmin') {
        alert("The super admin account cannot be deleted.");
        return;
    }
    if (!window.confirm(`Are you sure you want to delete this user (${userToDelete?.name})? This action cannot be undone.`)) return;

    setAppState(prev => ({ ...prev, isLoading: true }));
    const updatedUsers = appState.users.filter(u => u.id !== teacherId);
    
    setAppState(prev => ({ ...prev, users: updatedUsers, isLoading: false }));
    localStorage.setItem('appUsers', JSON.stringify(updatedUsers));
    alert("User deleted successfully.");
};

const handleCurrentUserProfileUpdate = async (formData: UserProfileFormData) => {
    if (!appState.currentUser) return;
    setAppState(prev => ({ ...prev, isLoading: true }));

    let profileImageUrl = appState.currentUser.profileImageUrl;
    if (formData.profileImageFile) {
        try {
            profileImageUrl = await imageToBase64(formData.profileImageFile) as string;
        } catch (error) {
            alert("Failed to update profile image.");
            setAppState(prev => ({ ...prev, isLoading: false }));
            return;
        }
    } else if (formData.profileImageFile === null) {
        profileImageUrl = undefined;
    }
    
    let signatureImageUrl = appState.currentUser.signatureImageUrl;
    if (formData.signatureImageFile) {
        try {
            signatureImageUrl = await imageToBase64(formData.signatureImageFile) as string;
        } catch (error) {
            alert("Failed to update signature image.");
            setAppState(prev => ({...prev, isLoading: false}));
            return;
        }
    } else if (formData.signatureImageFile === null) {
        signatureImageUrl = undefined;
    }

    const updatedUser: User = {
        ...appState.currentUser,
        name: formData.name || appState.currentUser.name,
        password: formData.password ? formData.password : appState.currentUser.password,
        profileImageUrl: profileImageUrl,
        signatureImageUrl: signatureImageUrl,
    };

    const updatedUsers = appState.users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setAppState(prev => ({ ...prev, users: updatedUsers, currentUser: updatedUser, isLoading: false }));
    localStorage.setItem('appUsers', JSON.stringify(updatedUsers));
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    alert("Profile updated successfully!");
};

const openTeacherPasswordResetModal = (teacher: User) => {
    setTeacherForPasswordReset(teacher);
    setIsPasswordResetModalOpen(true);
    setNewPasswordForReset('');
};

const handleTeacherPasswordReset = () => {
    if (!teacherForPasswordReset || !newPasswordForReset) {
        alert("Please enter a new password.");
        return;
    }
    if (newPasswordForReset.length < 6) {
        alert("New password must be at least 6 characters long.");
        return;
    }

    setAppState(prev => {
        const updatedUsers = prev.users.map(u =>
            u.id === teacherForPasswordReset.id ? { ...u, password: newPasswordForReset } : u
        );
        localStorage.setItem('appUsers', JSON.stringify(updatedUsers));
        return { ...prev, users: updatedUsers };
    });
    alert(`Password for ${teacherForPasswordReset.name} has been reset successfully.`);
    setIsPasswordResetModalOpen(false);
    setTeacherForPasswordReset(null);
};

  const activeSubjects = useMemo(() => 
    appState.subjects.filter(s => appState.activeSubjectIds.includes(s.id)),
    [appState.subjects, appState.activeSubjectIds]
  );

  const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: UserRole[] }> = ({ children, roles }) => {
    if (!appState.currentUser) return <Navigate to="/login" state={{ from: location }} replace />;
    if (roles && !roles.includes(appState.currentUser.role)) return <Navigate to="/dashboard" replace />; 
    return <>{children}</>;
  };

  const LoginPage: React.FC = () => {
     if (appState.currentUser) return <Navigate to="/dashboard" replace />;
    return <LoginForm onLogin={handleLogin} isLoading={appState.isLoading} error={appState.error} schoolNameDomain={appState.schoolNameDomain} />
  };

  return (
    <AppLayout 
      currentUser={appState.currentUser} 
      onLogout={handleLogout}
      availableTerms={appState.terms}
      currentTermId={appState.currentTermId}
      onTermChange={handleTermChange}
      schoolBadgeUrl={appState.schoolBadgeUrl}
      theme={theme}
      onToggleTheme={toggleTheme}
    >
        {isPasswordResetModalOpen && teacherForPasswordReset && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-sm">
                    <h3 className="text-lg font-semibold dark:text-slate-100">Reset Password for {teacherForPasswordReset.name}</h3>
                    <input type="password" value={newPasswordForReset} onChange={e => setNewPasswordForReset(e.target.value)} className="mt-4 block w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" placeholder="Enter new password"/>
                    <div className="mt-4 flex justify-end space-x-2">
                        <button onClick={() => setIsPasswordResetModalOpen(false)} className="px-4 py-2 border rounded-md dark:border-slate-600 dark:text-slate-200">Cancel</button>
                        <button onClick={handleTeacherPasswordReset} className="px-4 py-2 bg-primary-600 text-white rounded-md">Reset</button>
                    </div>
                </div>
            </div>
        )}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
        
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage {...appState} activeSubjects={activeSubjects} /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage currentUser={appState.currentUser} onProfileUpdate={handleCurrentUserProfileUpdate} /></ProtectedRoute>} />
        
        <Route path="/teacher/marks-entry" element={<ProtectedRoute roles={[UserRole.ADMIN, UserRole.TEACHER]}><TeacherMarksEntryPage {...appState} activeSubjects={activeSubjects} onMarksSubmit={handleMarksSubmit} /></ProtectedRoute>} />
        
        {/* Shared Routes for Admins and Teachers */}
        <Route path="/analysis/merit-list" element={<ProtectedRoute roles={[UserRole.ADMIN, UserRole.TEACHER]}><MeritListPage {...appState} activeSubjects={activeSubjects} onComparisonTermChange={handleComparisonTermChange} /></ProtectedRoute>} />
        <Route path="/analysis/class-broadsheet" element={<ProtectedRoute roles={[UserRole.ADMIN, UserRole.TEACHER]}><AdminClassBroadsheetPage {...appState} activeSubjects={activeSubjects} /></ProtectedRoute>} />
        <Route path="/analysis/exam-analysis" element={<ProtectedRoute roles={[UserRole.ADMIN, UserRole.TEACHER]}><AdminExamAnalysisPage {...appState} activeSubjects={activeSubjects} /></ProtectedRoute>} />

        {/* Admin-Only Routes */}
        <Route path="/admin/students" element={<ProtectedRoute roles={[UserRole.ADMIN]}><AdminStudentsPage students={appState.students} classes={appState.classes} schoolNameDomain={appState.schoolNameDomain} onStudentSave={handleStudentSave} onStudentDelete={handleStudentDelete} activeSubjects={activeSubjects} /></ProtectedRoute>} />
        <Route path="/admin/class-lists" element={<ProtectedRoute roles={[UserRole.ADMIN]}><AdminClassListPage classes={appState.classes} students={appState.students} actualSchoolName={appState.actualSchoolName} /></ProtectedRoute>} />
        <Route path="/admin/teachers" element={<ProtectedRoute roles={[UserRole.ADMIN]}><AdminTeachersPage users={appState.users} schoolNameDomain={appState.schoolNameDomain} onTeacherSave={handleTeacherSave} onTeacherDelete={handleTeacherDelete} onPasswordReset={openTeacherPasswordResetModal} classes={appState.classes} activeSubjects={activeSubjects} /></ProtectedRoute>} />
        <Route path="/admin/ai-insights" element={<ProtectedRoute roles={[UserRole.ADMIN]}><AIInsightsPage {...appState} activeSubjects={activeSubjects} /></ProtectedRoute>} />
        <Route path="/admin/mark-sheets" element={<ProtectedRoute roles={[UserRole.ADMIN]}><AdminMarkSheetsPage {...appState} activeSubjects={activeSubjects} /></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute roles={[UserRole.ADMIN]}><AdminNotificationsPage {...appState} activeSubjects={activeSubjects} /></ProtectedRoute>} />
        <Route path="/admin/exam-config" element={<ProtectedRoute roles={[UserRole.ADMIN]}><AdminExamConfigPage initialTerms={appState.terms} initialExamSessions={appState.examSessions} onConfigSave={handleConfigSave} /></ProtectedRoute>} />
        <Route path="/admin/school-settings" element={<ProtectedRoute roles={[UserRole.ADMIN]}><AdminSchoolSettingsPage currentBadgeUrl={appState.schoolBadgeUrl} onUpdateBadge={handleUpdateBadge} isLoading={appState.isLoading} allSubjects={appState.subjects} activeSubjectIds={appState.activeSubjectIds} onUpdateActiveSubjects={handleUpdateActiveSubjects} actualSchoolName={appState.actualSchoolName} schoolAddress={appState.schoolAddress} schoolNameDomain={appState.schoolNameDomain} onUpdateSchoolDetails={handleUpdateSchoolDetails} /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </AppLayout>
  );
}
