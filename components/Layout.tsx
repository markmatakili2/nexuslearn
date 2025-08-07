
import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { User, UserRole } from '../types';
import { LogoutIcon, AcademicCapIcon, CogIcon, ListBulletIcon, ChartBarIcon, UsersIcon, UserCircleIcon, MenuIcon, XMarkIcon, DocumentTextIcon, SparklesIcon, SunIcon, MoonIcon, BellIcon, ChevronLeftIcon } from './common/IconComponents';
import { MOCK_SCHOOL_NAME_DISPLAY } from '../constants';

interface HeaderProps {
  currentUser: User | null;
  onLogout: () => void;
  availableTerms: {id: string, name: string, year: number}[];
  currentTermId: string | null;
  onTermChange: (termId: string) => void;
  onToggleSidebar: () => void;
  schoolBadgeUrl?: string | null;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, availableTerms, currentTermId, onTermChange, onToggleSidebar, schoolBadgeUrl, theme, onToggleTheme }) => {
  return (
    <header className="bg-primary-700 text-white p-4 shadow-md no-print dark:bg-slate-900/80 dark:backdrop-blur-sm dark:border-b dark:border-slate-700">
      <div className="container mx-auto flex flex-wrap justify-between items-center">
        <div className="flex items-center space-x-2">
           <button 
            onClick={onToggleSidebar} 
            className="md:hidden p-2 mr-1 rounded-md text-primary-200 hover:text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            aria-label="Open sidebar"
            aria-expanded={false} 
            aria-controls="app-sidebar"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-3"> {/* Increased space-x for badge */}
            {schoolBadgeUrl ? (
              <img src={schoolBadgeUrl} alt="School Badge" className="w-8 h-8 object-contain rounded" />
            ) : (
              <AcademicCapIcon className="w-8 h-8" />
            )}
            <h1 className="text-xl font-bold">{MOCK_SCHOOL_NAME_DISPLAY} Exam Portal</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4 mt-2 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center space-x-2 sm:space-x-4">
             {currentUser && availableTerms.length > 0 && (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <label htmlFor="termSelectGlobal" className="text-sm sr-only">Select Term:</label>
                  <select 
                    id="termSelectGlobal"
                    value={currentTermId || ''}
                    onChange={(e) => onTermChange(e.target.value)}
                    className="bg-primary-600 border border-primary-500 text-white text-sm rounded-md p-1.5 focus:ring-white focus:border-white w-full max-w-[180px] sm:max-w-xs sm:w-auto dark:bg-slate-700 dark:border-slate-600"
                  >
                    {availableTerms.map(term => (
                      <option key={term.id} value={term.id}>{term.name} - {term.year}</option>
                    ))}
                  </select>
                </div>
              )}
               <button onClick={onToggleTheme} className="p-2 rounded-full text-primary-200 hover:text-white hover:bg-primary-600 dark:hover:bg-slate-700 transition-colors" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
                {theme === 'light' ? <MoonIcon className="w-5 h-5"/> : <SunIcon className="w-5 h-5"/>}
              </button>
          </div>
          {currentUser && (
            <div className="flex items-center space-x-2 sm:space-x-4">
              {currentUser.profileImageUrl && (
                <img src={currentUser.profileImageUrl} alt={currentUser.name} className="w-8 h-8 rounded-full object-cover border-2 border-primary-500 dark:border-slate-500" />
              )}
              <span className="text-sm hidden md:inline">Welcome, {currentUser.name} ({currentUser.role})</span>
              <button
                onClick={onLogout}
                className="flex items-center space-x-1 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-md text-sm transition duration-150"
                aria-label="Logout"
              >
                <LogoutIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

interface SidebarProps {
  role: UserRole;
  isOpenOnMobile: boolean;
  closeMobileSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ role, isOpenOnMobile, closeMobileSidebar }) => {
  const baseLinkClasses = "flex items-center space-x-3 block py-2.5 px-4 rounded transition duration-200 hover:bg-primary-600 hover:text-white dark:hover:bg-slate-700";
  const activeLinkClasses = "bg-primary-600 text-white dark:bg-slate-700";

  const handleNavLinkClick = () => {
    if (isOpenOnMobile) {
      closeMobileSidebar();
    }
  };

  return (
    <>
      {isOpenOnMobile && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}
      <aside 
        id="app-sidebar"
        className={`
          fixed inset-y-0 left-0 z-40
          w-3/4 max-w-xs
          bg-primary-700 text-primary-100 space-y-2 p-4
          dark:bg-slate-800 dark:text-slate-300
          transform transition-transform duration-300 ease-in-out
          shadow-lg md:shadow-none
          md:w-64 md:relative md:translate-x-0 md:z-auto md:block md:h-auto md:min-h-screen
          overflow-y-auto /* Added for scrollability */
          no-print
          ${isOpenOnMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} 
        `}
        aria-label="Sidebar"
      >
        <div className="flex justify-between items-center md:hidden mb-4">
            <span className="text-xl font-semibold text-white dark:text-slate-100 px-2">{MOCK_SCHOOL_NAME_DISPLAY}</span>
            <button 
            onClick={closeMobileSidebar} 
            className="p-1 text-primary-200 hover:text-white dark:text-slate-300 dark:hover:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Close sidebar"
            >
            <XMarkIcon className="w-6 h-6" />
            </button>
        </div>
        <nav>
          <ul>
            <li>
              <NavLink to="/dashboard" onClick={handleNavLinkClick} className={({ isActive }) => `${baseLinkClasses} ${isActive ? activeLinkClasses : ""}`}>
                <ChartBarIcon className="w-5 h-5" /> 
                <span>Dashboard</span>
              </NavLink>
            </li>
            {(role === UserRole.TEACHER || role === UserRole.ADMIN || role === UserRole.PARENT) && (
              <li>
                <NavLink to="/profile" onClick={handleNavLinkClick} className={({ isActive }) => `${baseLinkClasses} ${isActive ? activeLinkClasses : ""}`}>
                  <UserCircleIcon className="w-5 h-5" />
                  <span>My Profile</span>
                </NavLink>
              </li>
            )}
            {role === UserRole.ADMIN && (
              <>
                <li>
                  <NavLink to="/admin/students" onClick={handleNavLinkClick} className={({ isActive }) => `${baseLinkClasses} ${isActive ? activeLinkClasses : ""}`}>
                     <AcademicCapIcon className="w-5 h-5" />
                    <span>Manage Students</span>
                  </NavLink>
                </li>
                 <li>
                  <NavLink to="/admin/class-lists" onClick={handleNavLinkClick} className={({ isActive }) => `${baseLinkClasses} ${isActive ? activeLinkClasses : ""}`}>
                     <ListBulletIcon className="w-5 h-5" />
                    <span>Class Lists</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/admin/teachers" onClick={handleNavLinkClick} className={({ isActive }) => `${baseLinkClasses} ${isActive ? activeLinkClasses : ""}`}>
                     <UsersIcon className="w-5 h-5" />
                    <span>Manage Teachers</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/admin/ai-insights" onClick={handleNavLinkClick} className={({ isActive }) => `${baseLinkClasses} ${isActive ? activeLinkClasses : ""}`}>
                    <SparklesIcon className="w-5 h-5" />
                    <span>AI Insights</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/admin/mark-sheets" onClick={handleNavLinkClick} className={({ isActive }) => `${baseLinkClasses} ${isActive ? activeLinkClasses : ""}`}>
                     <DocumentTextIcon className="w-5 h-5" />
                    <span>Mark Sheets</span>
                  </NavLink>
                </li>
                 <li>
                  <NavLink to="/admin/notifications" onClick={handleNavLinkClick} className={({ isActive }) => `${baseLinkClasses} ${isActive ? activeLinkClasses : ""}`}>
                    <BellIcon className="w-5 h-5" />
                    <span>Notifications</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/admin/exam-config" onClick={handleNavLinkClick} className={({ isActive }) => `${baseLinkClasses} ${isActive ? activeLinkClasses : ""}`}>
                    <CogIcon className="w-5 h-5" />
                    <span>Term & Exam Config</span>
                  </NavLink>
                </li>
                 <li>
                  <NavLink to="/admin/school-settings" onClick={handleNavLinkClick} className={({ isActive }) => `${baseLinkClasses} ${isActive ? activeLinkClasses : ""}`}>
                    <CogIcon className="w-5 h-5" />
                    <span>School Settings</span>
                  </NavLink>
                </li>
              </>
            )}
            {(role === UserRole.TEACHER || role === UserRole.ADMIN) && (
              <>
                <li>
                  <NavLink to="/teacher/marks-entry" onClick={handleNavLinkClick} className={({ isActive }) => `${baseLinkClasses} ${isActive ? activeLinkClasses : ""}`}>
                    <AcademicCapIcon className="w-5 h-5" />
                    <span>Enter Marks</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/analysis/merit-list" onClick={handleNavLinkClick} className={({ isActive }) => `${baseLinkClasses} ${isActive ? activeLinkClasses : ""}`}>
                    <ListBulletIcon className="w-5 h-5" />
                    <span>Merit Lists</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/analysis/class-broadsheet" onClick={handleNavLinkClick} className={({ isActive }) => `${baseLinkClasses} ${isActive ? activeLinkClasses : ""}`}>
                    <ListBulletIcon className="w-5 h-5" />
                    <span>Class Broadsheet</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/analysis/exam-analysis" onClick={handleNavLinkClick} className={({ isActive }) => `${baseLinkClasses} ${isActive ? activeLinkClasses : ""}`}>
                    <ChartBarIcon className="w-5 h-5" />
                    <span>Exam Analysis</span>
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </nav>
      </aside>
    </>
  );
};

interface PageWrapperProps {
  children: React.ReactNode;
  title?: string;
  titleControls?: React.ReactNode;
  isPrintable?: boolean;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ children, title, titleControls, isPrintable }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const showBackButton = location.pathname !== '/dashboard';

  return (
    <div className={`flex-1 p-4 sm:p-6 bg-gray-50 dark:bg-slate-900/50 ${isPrintable ? 'printable-area' : ''}`}>
      {(title || titleControls || showBackButton) && (
        <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
          <div className="flex items-center gap-4">
             {showBackButton && (
              <button
                onClick={() => navigate(-1)}
                className="no-print inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                aria-label="Go back to previous page"
              >
                <ChevronLeftIcon className="w-5 h-5 mr-2 -ml-1" />
                <span>Back</span>
              </button>
            )}
            {title && <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-slate-200">{title}</h2>}
          </div>
          {titleControls && <div className="no-print ml-auto sm:ml-0">{titleControls}</div>}
        </div>
      )}
      <div className={`bg-white p-4 sm:p-6 rounded-lg shadow-md dark:bg-slate-800 dark:border dark:border-slate-700 ${isPrintable ? 'report-page' : ''}`}>
        {children}
      </div>
    </div>
  );
};

interface AppLayoutProps {
  currentUser: User | null;
  onLogout: () => void;
  children: React.ReactNode;
  availableTerms: {id: string, name: string, year: number}[];
  currentTermId: string | null;
  onTermChange: (termId: string) => void;
  schoolBadgeUrl?: string | null;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ currentUser, onLogout, children, availableTerms, currentTermId, onTermChange, schoolBadgeUrl, theme, onToggleTheme }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => setIsMobileSidebarOpen(!isMobileSidebarOpen);
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);
  
  if (!currentUser) {
    return <div className="no-print">{children}</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      <Header 
        currentUser={currentUser} 
        onLogout={onLogout} 
        availableTerms={availableTerms}
        currentTermId={currentTermId}
        onTermChange={onTermChange}
        onToggleSidebar={toggleMobileSidebar}
        schoolBadgeUrl={schoolBadgeUrl}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          role={currentUser.role} 
          isOpenOnMobile={isMobileSidebarOpen}
          closeMobileSidebar={closeMobileSidebar}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-slate-900"> 
           {children}
        </main>
      </div>
    </div>
  );
};
