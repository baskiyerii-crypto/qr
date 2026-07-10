import {

  createRouter,

  createRoute,

  createRootRoute,

  redirect,

  Outlet,

} from '@tanstack/react-router';

import { AppLayout } from '@/components/layout/Sidebar';

import { ResellerLayout } from '@/components/layout/ResellerLayout';

import { MarketerLayout } from '@/components/layout/MarketerLayout';

import { AdminLayout } from '@/components/layout/AdminLayout';

import { LoginPage } from '@/pages/LoginPage';

import { RegisterPage } from '@/pages/RegisterPage';

import { DashboardPage } from '@/pages/DashboardPage';

import { EmployeesPage } from '@/pages/EmployeesPage';

import { UsersPage } from '@/pages/UsersPage';

import { BranchesPage } from '@/pages/BranchesPage';

import { ShiftsPage } from '@/pages/ShiftsPage';

import { AttendancePage } from '@/pages/AttendancePage';

import { LeavesPage } from '@/pages/LeavesPage';

import { PayrollPage } from '@/pages/PayrollPage';

import { TasksPage } from '@/pages/TasksPage';

import { AnnouncementsPage } from '@/pages/AnnouncementsPage';

import { SurveysPage } from '@/pages/SurveysPage';

import { MessagesPage } from '@/pages/MessagesPage';

import { OnboardingPage } from '@/pages/OnboardingPage';

import { SettingsPage } from '@/pages/SettingsPage';

import { LandingPage } from '@/pages/LandingPage';

import { ResellerApplicationPage } from '@/pages/ResellerApplicationPage';

import { ApplicationStatusPage } from '@/pages/ApplicationStatusPage';

import { BillingPage } from '@/pages/BillingPage';

import { AdminResellerApplicationsPage } from '@/pages/AdminResellerApplicationsPage';

import { InvitePage } from '@/pages/InvitePage';

import { DevicesPage } from '@/pages/DevicesPage';

import { TimesheetsPage } from '@/pages/TimesheetsPage';

import { ResellerDashboardPage } from '@/pages/ResellerDashboardPage';
import { MarketerDashboardPage } from '@/pages/marketer/MarketerDashboardPage';
import { MarketerResellersPage } from '@/pages/marketer/MarketerResellersPage';
import { MarketerCompaniesPage, MarketerCompanyDetailPage } from '@/pages/marketer/MarketerCompaniesPage';
import { MarketerPerformancePage } from '@/pages/marketer/MarketerPerformancePage';
import { MarketerPaymentsPage } from '@/pages/marketer/MarketerPaymentsPage';
import { MarketerFeedbackPage } from '@/pages/marketer/MarketerFeedbackPage';
import { AdminMarketersPage } from '@/pages/admin/AdminMarketersPage';
import { AdminMarketerNewPage } from '@/pages/admin/AdminMarketerNewPage';
import { AdminMarketerDetailPage } from '@/pages/admin/AdminMarketerDetailPage';

import { ResellerCompaniesPage, ResellerCompanyDetailPage } from '@/pages/ResellerCompaniesPage';

import { AdminWhatsappPage } from '@/pages/AdminWhatsappPage';

import { AdminOverviewPage } from '@/pages/admin/AdminOverviewPage';

import { AdminCompaniesPage } from '@/pages/admin/AdminCompaniesPage';

import { AdminCompanyDetailPage } from '@/pages/admin/AdminCompanyDetailPage';

import { AdminResellersPage } from '@/pages/admin/AdminResellersPage';

import { AdminResellerNewPage } from '@/pages/admin/AdminResellerNewPage';

import { AdminResellerDetailPage } from '@/pages/admin/AdminResellerDetailPage';

import { AdminPlansPage } from '@/pages/admin/AdminPlansPage';

import { AdminSubscriptionsPage } from '@/pages/admin/AdminSubscriptionsPage';

import { AdminPaymentsPage } from '@/pages/admin/AdminPaymentsPage';

import { AdminCommissionsPage } from '@/pages/admin/AdminCommissionsPage';

import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';

import { AdminIntegrationsPage } from '@/pages/admin/AdminIntegrationsPage';

import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';

import { AdminLogsPage } from '@/pages/admin/AdminLogsPage';
import { AdminHierarchyPage } from '@/pages/admin/AdminHierarchyPage';
import { FeedbackPage } from '@/pages/FeedbackPage';
import { ResellerFeedbackPage } from '@/pages/ResellerFeedbackPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { AttendanceApprovalsPage } from '@/pages/AttendanceApprovalsPage';
import { BranchTransfersPage } from '@/pages/BranchTransfersPage';
import { RequestsPage } from '@/pages/RequestsPage';
import { RecruitmentPostingsPage } from '@/pages/RecruitmentPostingsPage';
import { RecruitmentApplicationsPage } from '@/pages/RecruitmentApplicationsPage';
import { RecruitmentFormTemplatesPage } from '@/pages/RecruitmentFormTemplatesPage';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { AuditLogPage } from '@/pages/AuditLogPage';
import { JobApplyPage } from '@/pages/JobApplyPage';
import { JobStatusPage } from '@/pages/JobStatusPage';
import { CompanyCareersPage } from '@/pages/CompanyCareersPage';

import { getStoredUser, getHomeRoute, isCompanyStaff, clearSession } from '@/lib/auth-routes';

import { UserRole } from '@qr/shared';



const rootRoute = createRootRoute({ component: () => <Outlet /> });



const loginRoute = createRoute({

  getParentRoute: () => rootRoute,

  path: '/login',

  component: LoginPage,

});



const registerRoute = createRoute({

  getParentRoute: () => rootRoute,

  path: '/register',

  component: RegisterPage,

});



const inviteRoute = createRoute({

  getParentRoute: () => rootRoute,

  path: '/invite',

  component: InvitePage,

});



const companyLayout = createRoute({

  getParentRoute: () => rootRoute,

  id: 'company',

  beforeLoad: () => {

    const token = localStorage.getItem('accessToken');

    if (!token) throw redirect({ to: '/login' });

    const user = getStoredUser();

    if (!user || !isCompanyStaff(user.role)) {

      if (!user) clearSession();

      const target = getHomeRoute(user?.role);

      throw redirect({ to: target });

    }

  },

  component: () => (

    <AppLayout>

      <Outlet />

    </AppLayout>

  ),

});



const marketerLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: 'marketerLayout',
  beforeLoad: () => {
    const token = localStorage.getItem('accessToken');
    if (!token) throw redirect({ to: '/login' });
    const user = getStoredUser();
    if (!user) { clearSession(); throw redirect({ to: '/login' }); }
    if (user.role !== UserRole.MARKETER) throw redirect({ to: getHomeRoute(user.role) });
  },
  component: () => (
    <MarketerLayout><Outlet /></MarketerLayout>
  ),
});

const resellerLayout = createRoute({

  getParentRoute: () => rootRoute,

  id: 'reseller',

  beforeLoad: () => {

    const token = localStorage.getItem('accessToken');

    if (!token) throw redirect({ to: '/login' });

    const user = getStoredUser();

    if (!user) {

      clearSession();

      throw redirect({ to: '/login' });

    }

    if (user.role !== UserRole.RESELLER) throw redirect({ to: getHomeRoute(user.role) });

  },

  component: () => (

    <ResellerLayout>

      <Outlet />

    </ResellerLayout>

  ),

});



const adminLayout = createRoute({

  getParentRoute: () => rootRoute,

  id: 'adminLayout',

  beforeLoad: () => {

    const token = localStorage.getItem('accessToken');

    if (!token) throw redirect({ to: '/login' });

    const user = getStoredUser();

    if (!user) {

      clearSession();

      throw redirect({ to: '/login' });

    }

    if (user.role !== UserRole.SUPER_ADMIN) throw redirect({ to: getHomeRoute(user.role) });

  },

  component: () => (

    <AdminLayout>

      <Outlet />

    </AdminLayout>

  ),

});



const dashboardRoute = createRoute({ getParentRoute: () => companyLayout, path: '/dashboard', component: DashboardPage });

const employeesRoute = createRoute({ getParentRoute: () => companyLayout, path: '/employees', component: EmployeesPage });

const usersRoute = createRoute({ getParentRoute: () => companyLayout, path: '/users', component: UsersPage });

const branchesRoute = createRoute({ getParentRoute: () => companyLayout, path: '/branches', component: BranchesPage });

const shiftsRoute = createRoute({ getParentRoute: () => companyLayout, path: '/shifts', component: ShiftsPage });

const attendanceRoute = createRoute({ getParentRoute: () => companyLayout, path: '/attendance', component: AttendancePage });

const leavesRoute = createRoute({ getParentRoute: () => companyLayout, path: '/leaves', component: LeavesPage });

const payrollRoute = createRoute({ getParentRoute: () => companyLayout, path: '/payroll', component: PayrollPage });

const tasksRoute = createRoute({ getParentRoute: () => companyLayout, path: '/tasks', component: TasksPage });

const announcementsRoute = createRoute({ getParentRoute: () => companyLayout, path: '/announcements', component: AnnouncementsPage });

const surveysRoute = createRoute({ getParentRoute: () => companyLayout, path: '/surveys', component: SurveysPage });

const messagesRoute = createRoute({ getParentRoute: () => companyLayout, path: '/messages', component: MessagesPage });
const feedbackRoute = createRoute({ getParentRoute: () => companyLayout, path: '/feedback', component: FeedbackPage });
const notificationsRoute = createRoute({ getParentRoute: () => companyLayout, path: '/notifications', component: NotificationsPage });

const onboardingRoute = createRoute({ getParentRoute: () => companyLayout, path: '/onboarding', component: OnboardingPage });

const settingsRoute = createRoute({ getParentRoute: () => companyLayout, path: '/settings', component: SettingsPage });

const devicesRoute = createRoute({ getParentRoute: () => companyLayout, path: '/devices', component: DevicesPage });

const timesheetsRoute = createRoute({ getParentRoute: () => companyLayout, path: '/timesheets', component: TimesheetsPage });

const attendanceApprovalsRoute = createRoute({ getParentRoute: () => companyLayout, path: '/attendance-approvals', component: AttendanceApprovalsPage });

const branchTransfersRoute = createRoute({ getParentRoute: () => companyLayout, path: '/branch-transfers', component: BranchTransfersPage });

const requestsRoute = createRoute({ getParentRoute: () => companyLayout, path: '/requests', component: RequestsPage });

const recruitmentRoute = createRoute({ getParentRoute: () => companyLayout, path: '/recruitment', component: RecruitmentPostingsPage });

const recruitmentTemplatesRoute = createRoute({ getParentRoute: () => companyLayout, path: '/recruitment/templates', component: RecruitmentFormTemplatesPage });

const recruitmentApplicationsRoute = createRoute({ getParentRoute: () => companyLayout, path: '/recruitment/$id', component: RecruitmentApplicationsPage });

const documentsRoute = createRoute({ getParentRoute: () => companyLayout, path: '/documents', component: DocumentsPage });

const reportsRoute = createRoute({ getParentRoute: () => companyLayout, path: '/reports', component: ReportsPage });

const auditLogRoute = createRoute({ getParentRoute: () => companyLayout, path: '/audit-log', component: AuditLogPage });

const jobApplyRoute = createRoute({ getParentRoute: () => rootRoute, path: '/kariyer/basvuru/$token', component: JobApplyPage });

const jobStatusRoute = createRoute({ getParentRoute: () => rootRoute, path: '/kariyer/durum', component: JobStatusPage });

const companyCareersRoute = createRoute({ getParentRoute: () => rootRoute, path: '/kariyer/$slug', component: CompanyCareersPage });



const billingRoute = createRoute({ getParentRoute: () => companyLayout, path: '/billing', component: BillingPage });



const bayiBasvuruRoute = createRoute({

  getParentRoute: () => rootRoute,

  path: '/bayi-basvuru',

  component: ResellerApplicationPage,

});



const bayiDurumRoute = createRoute({

  getParentRoute: () => rootRoute,

  path: '/bayi-basvuru/durum',

  component: ApplicationStatusPage,

});



const marketerDashboardRoute = createRoute({ getParentRoute: () => marketerLayout, path: '/marketer', component: MarketerDashboardPage });
const marketerResellersRoute = createRoute({ getParentRoute: () => marketerLayout, path: '/marketer/resellers', component: MarketerResellersPage });
const marketerCompaniesRoute = createRoute({ getParentRoute: () => marketerLayout, path: '/marketer/companies', component: MarketerCompaniesPage });
const marketerCompanyDetailRoute = createRoute({ getParentRoute: () => marketerLayout, path: '/marketer/companies/$id', component: MarketerCompanyDetailPage });
const marketerPerformanceRoute = createRoute({ getParentRoute: () => marketerLayout, path: '/marketer/performance', component: MarketerPerformancePage });
const marketerPaymentsRoute = createRoute({ getParentRoute: () => marketerLayout, path: '/marketer/payments', component: MarketerPaymentsPage });
const marketerFeedbackRoute = createRoute({ getParentRoute: () => marketerLayout, path: '/marketer/feedback', component: MarketerFeedbackPage });

const resellerDashboardRoute = createRoute({ getParentRoute: () => resellerLayout, path: '/reseller', component: ResellerDashboardPage });

const resellerCompaniesRoute = createRoute({ getParentRoute: () => resellerLayout, path: '/reseller/companies', component: ResellerCompaniesPage });

const resellerCompanyDetailRoute = createRoute({ getParentRoute: () => resellerLayout, path: '/reseller/companies/$id', component: ResellerCompanyDetailPage });
const resellerFeedbackRoute = createRoute({ getParentRoute: () => resellerLayout, path: '/reseller/feedback', component: ResellerFeedbackPage });



const adminMarketersRoute = createRoute({ getParentRoute: () => adminLayout, path: '/admin/marketers', component: AdminMarketersPage });
const adminMarketerNewRoute = createRoute({ getParentRoute: () => adminLayout, path: '/admin/marketers/new', component: AdminMarketerNewPage });
const adminMarketerDetailRoute = createRoute({ getParentRoute: () => adminLayout, path: '/admin/marketers/$id', component: AdminMarketerDetailPage });

const adminOverviewRoute = createRoute({ getParentRoute: () => adminLayout, path: '/admin', component: AdminOverviewPage });

const adminCompaniesRoute = createRoute({ getParentRoute: () => adminLayout, path: '/admin/companies', component: AdminCompaniesPage });

const adminCompanyDetailRoute = createRoute({ getParentRoute: () => adminLayout, path: '/admin/companies/$id', component: AdminCompanyDetailPage });

const adminResellersRoute = createRoute({ getParentRoute: () => adminLayout, path: '/admin/resellers', component: AdminResellersPage });

const adminResellerNewRoute = createRoute({ getParentRoute: () => adminLayout, path: '/admin/resellers/new', component: AdminResellerNewPage });

const adminResellerDetailRoute = createRoute({ getParentRoute: () => adminLayout, path: '/admin/resellers/$id', component: AdminResellerDetailPage });

const adminApplicationsRoute = createRoute({ getParentRoute: () => adminLayout, path: '/admin/applications', component: AdminResellerApplicationsPage });

const adminPlansRoute = createRoute({ getParentRoute: () => adminLayout, path: '/admin/plans', component: AdminPlansPage });

const adminSubscriptionsRoute = createRoute({ getParentRoute: () => adminLayout, path: '/admin/subscriptions', component: AdminSubscriptionsPage });

const adminPaymentsRoute = createRoute({ getParentRoute: () => adminLayout, path: '/admin/payments', component: AdminPaymentsPage });

const adminCommissionsRoute = createRoute({ getParentRoute: () => adminLayout, path: '/admin/commissions', component: AdminCommissionsPage });

const adminSettingsRoute = createRoute({ getParentRoute: () => adminLayout, path: '/admin/settings', component: AdminSettingsPage });

const adminIntegrationsRoute = createRoute({ getParentRoute: () => adminLayout, path: '/admin/settings/integrations', component: AdminIntegrationsPage });

const adminWhatsappRoute = createRoute({ getParentRoute: () => adminLayout, path: '/admin/whatsapp', component: AdminWhatsappPage });

const adminUsersRoute = createRoute({ getParentRoute: () => adminLayout, path: '/admin/users', component: AdminUsersPage });

const adminLogsRoute = createRoute({ getParentRoute: () => adminLayout, path: '/admin/logs', component: AdminLogsPage });
const adminHierarchyRoute = createRoute({ getParentRoute: () => adminLayout, path: '/admin/hierarchy', component: AdminHierarchyPage });
const adminFeedbackRoute = createRoute({ getParentRoute: () => adminLayout, path: '/admin/feedback', component: FeedbackPage });



const indexRoute = createRoute({

  getParentRoute: () => rootRoute,

  path: '/',

  beforeLoad: () => {

    const token = localStorage.getItem('accessToken');

    if (token) {

      const user = getStoredUser();

      if (!user) {

        clearSession();

        return;

      }

      throw redirect({ to: getHomeRoute(user.role) });

    }

  },

  component: LandingPage,

});



const routeTree = rootRoute.addChildren([

  indexRoute,

  loginRoute,

  registerRoute,

  inviteRoute,

  bayiBasvuruRoute,

  bayiDurumRoute,

  jobApplyRoute,

  jobStatusRoute,

  companyCareersRoute,

  companyLayout.addChildren([

    dashboardRoute, employeesRoute, usersRoute, branchesRoute, shiftsRoute,

    attendanceRoute, attendanceApprovalsRoute, branchTransfersRoute, leavesRoute, requestsRoute,
    timesheetsRoute, payrollRoute, tasksRoute,

    recruitmentRoute, recruitmentTemplatesRoute, recruitmentApplicationsRoute, documentsRoute, reportsRoute, auditLogRoute,

    announcementsRoute, surveysRoute, messagesRoute, feedbackRoute, notificationsRoute, devicesRoute, onboardingRoute, settingsRoute,

    billingRoute,

  ]),

  resellerLayout.addChildren([resellerDashboardRoute, resellerCompaniesRoute, resellerCompanyDetailRoute, resellerFeedbackRoute]),

  marketerLayout.addChildren([
    marketerDashboardRoute, marketerResellersRoute, marketerCompaniesRoute, marketerCompanyDetailRoute,
    marketerPerformanceRoute, marketerPaymentsRoute, marketerFeedbackRoute,
  ]),

  adminLayout.addChildren([

    adminOverviewRoute,

    adminCompaniesRoute,

    adminCompanyDetailRoute,

    adminResellersRoute,

    adminMarketersRoute,

    adminMarketerNewRoute,

    adminMarketerDetailRoute,

    adminResellerNewRoute,

    adminResellerDetailRoute,

    adminApplicationsRoute,

    adminPlansRoute,

    adminSubscriptionsRoute,

    adminPaymentsRoute,

    adminCommissionsRoute,

    adminSettingsRoute,

    adminIntegrationsRoute,

    adminWhatsappRoute,

    adminUsersRoute,
    adminLogsRoute,
    adminHierarchyRoute,
    adminFeedbackRoute,
  ]),

]);



export const router = createRouter({

  routeTree,

  defaultNotFoundComponent: () => (

    <div className="flex min-h-screen items-center justify-center text-slate-600">

      Sayfa bulunamadı. <a href="/" className="ml-2 text-primary underline">Ana sayfa</a>

    </div>

  ),

});



declare module '@tanstack/react-router' {

  interface Register { router: typeof router; }

}

