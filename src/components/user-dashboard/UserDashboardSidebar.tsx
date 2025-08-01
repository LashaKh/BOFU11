import { useState, useEffect, SVGProps } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

interface NavItem {
  name: string;
  href: string;
  icon: JSX.Element;
  count?: number;
  section?: string;
}

const UserDashboardSidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const [briefsCount, setBriefsCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [generatedArticlesCount, setGeneratedArticlesCount] = useState<number>(0);

  // Helper function to get company name for display
  const getCompanyName = (userData: any) => {
    // First check user_metadata.company_name
    if (userData?.user_metadata?.company_name) {
      return userData.user_metadata.company_name;
    }
    // If no company_name in user_metadata, check app_metadata.company_name
    if (userData?.app_metadata?.company_name) {
      return userData.app_metadata.company_name;
    }
    // Extract company name from email if available
    if (userData?.email) {
      const emailParts = userData.email.split('@');
      if (emailParts.length > 1) {
        const domain = emailParts[1].split('.')[0];
        return domain.charAt(0).toUpperCase() + domain.slice(1);
      }
    }
    // Fallback to a generic name
    return 'Dashboard';
  };

  useEffect(() => {
    const fetchSidebarData = async () => {
      if (!user) return;

      // Get total briefs count
      const { count: totalBriefs, error: briefsError } = await supabase
        .from('content_briefs')
        .select('id', { count: 'exact', head: true });
      if (briefsError) console.error('Error fetching briefs count:', briefsError);
      else setBriefsCount(totalBriefs || 0);

      // Get approved content count
      const { count: approvedBriefs, error: approvedError } = await supabase
        .from('content_briefs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved');
      if (approvedError) console.error('Error fetching approved count:', approvedError);
      else setApprovedCount(approvedBriefs || 0);

      // Fetch generated articles count
      const { count: articlesCountVal, error: articlesCountError } = await supabase
        .from('content_briefs')
        .select('id', { count: 'exact', head: true })
        .not('article_content', 'is', null)
        .neq('article_content', '')
        .neq('article_content', 'null');

      if (articlesCountError) {
        console.error('Error fetching generated articles count:', articlesCountError);
        setGeneratedArticlesCount(0);
      } else {
        setGeneratedArticlesCount(articlesCountVal || 0);
      }
    };

    fetchSidebarData();
  }, [user]);

  const navigation: NavItem[] = [
    {
      section: 'Main',
      name: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      section: 'Content',
      name: 'Content Briefs',
      href: '/dashboard/content-briefs',
      count: briefsCount,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      section: 'Content',
      name: 'Approved Content',
      href: '/dashboard/approved-content',
      count: approvedCount,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      section: 'Content',
      name: 'Media Library',
      href: '/dashboard/media-library',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  // Group navigation items by section
  const groupedNavigation: Record<string, NavItem[]> = {};
  navigation.forEach(item => {
    const section = item.section || 'Other';
    if (!groupedNavigation[section]) {
      groupedNavigation[section] = [];
    }
    groupedNavigation[section].push(item);
  });

  const FileTextIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props} 
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <line x1="10" y1="9" x2="8" y2="9"></line>
    </svg>
  );

  return (
    <div className={`hidden md:flex md:flex-shrink-0 transition-all duration-300 ${collapsed ? 'md:w-16' : 'md:w-64'}`}>
      <div className="flex flex-col w-full">
        <div className="flex flex-col h-full border-r border-gray-200 bg-white shadow-sm">
          {/* Sidebar header with logo and collapse button */}
          <div className="flex items-center justify-between flex-shrink-0 h-16 px-4 border-b border-gray-200">
            {!collapsed && (
              <div className="flex items-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur-sm opacity-15"></div>
                  <div className="relative bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm">
                    <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                      {getCompanyName(user)}
                    </h1>
                    <div className="text-xs text-blue-700 font-medium uppercase tracking-wide mt-0.5">
                      Dashboard
                    </div>
                  </div>
                </div>
              </div>
            )}
            {collapsed && (
              <div className="mx-auto">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-200"></div>
                  <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 flex items-center justify-center text-white font-bold text-lg shadow-lg border border-blue-400/30 hover:scale-105 transition-transform duration-200">
                    {getCompanyName(user).charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-gray-500 hover:text-gray-600 focus:outline-none"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {collapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /> /* Hamburger */
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> /* Close */
                )}
              </svg>
            </button>
          </div>

          {/* User profile summary */}
          {!collapsed && (
            <div className="flex items-center px-4 py-3 border-b border-gray-200">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium text-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">PRO Plan</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex-1 flex flex-col overflow-y-auto pt-2 pb-4">
            <nav className="flex-1 px-2 space-y-6">
              {Object.entries(groupedNavigation).map(([section, items]) => (
                <div key={section} className="space-y-1">
                  {!collapsed && (
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {section}
                    </h3>
                  )}
                  {items.map((item) => {
                    const isActive = location.pathname === item.href ||
                      (location.pathname.startsWith(item.href) && item.href !== '/dashboard');
                    
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}
                        title={collapsed ? item.name : undefined}
                      >
                        <div className={isActive ? 'text-primary-600' : ''}>
                          {item.icon}
                        </div>
                        {!collapsed && (
                          <div className="flex flex-1 items-center justify-between">
                            <span>{item.name}</span>
                            {item.count !== undefined && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {item.count}
                              </span>
                            )}
                          </div>
                        )}
                        {collapsed && item.count !== undefined && (
                          <span className="absolute top-0 right-0 -mr-1 -mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-xs font-medium text-white">
                            {item.count}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
              <li>
                <NavLink to="/dashboard/generated-articles" title={collapsed ? "Generated Articles" : undefined}>
                  {({ isActive }) => (
                    <span
                      className={`nav-item group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
                        isActive
                          ? 'bg-gray-100 text-primary-600'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                      } ${collapsed ? 'justify-center' : ''}`}
                    >
                      <FileTextIcon
                        className={`h-5 w-5 ${collapsed ? '' : 'mr-3 flex-shrink-0'} ${
                          isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                        }`}
                        aria-hidden="true"
                      />
                      {!collapsed && (
                        <div className="flex flex-1 items-center justify-between">
                          <span>Generated Articles</span>
                          {generatedArticlesCount > 0 && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                              {generatedArticlesCount}
                            </span>
                          )}
                        </div>
                      )}
                    </span>
                  )}
                </NavLink>
              </li>
            </nav>

            {/* Usage stats */}
            {!collapsed && (
              <div className="px-3 mt-6">
                <div className="rounded-lg bg-gray-50 p-3">
                  <h3 className="text-xs font-medium text-gray-700">Your usage</h3>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>4/10 briefs used</span>
                      <span>40%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-value" style={{ width: '40%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboardSidebar;
