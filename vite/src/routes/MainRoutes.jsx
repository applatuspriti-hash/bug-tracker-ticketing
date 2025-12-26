import { lazy } from 'react';

// project imports
import MainLayout from 'layout/MainLayout';
import Loadable from 'ui-component/Loadable';
import ProtectedHandler from './ProtectedHandler';

// dashboard routing
const DashboardDefault = Loadable(lazy(() => import('views/dashboard/Default')));

// utilities routing
import UtilsTypography from 'views/utilities/Typography';
import UtilsColor from 'views/utilities/Color';
import UtilsShadow from 'views/utilities/Shadow';

// Ticket App Views
const UserList = Loadable(lazy(() => import('views/users/UserList')));
const TicketList = Loadable(lazy(() => import('views/tickets/TicketList')));
const TicketCreate = Loadable(lazy(() => import('views/tickets/TicketCreate')));
const KanbanBoard = Loadable(lazy(() => import('views/tickets/KanbanBoard')));
const SuperBoardList = Loadable(lazy(() => import('views/super-board/SuperBoardList')));
const SuperBoardDetail = Loadable(lazy(() => import('views/super-board/SuperBoardDetail')));

// sample page routing
const SamplePage = Loadable(lazy(() => import('views/sample-page')));

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: (
    <ProtectedHandler>
      <MainLayout />
    </ProtectedHandler>
  ),
  children: [
    {
      path: '/',
      element: <KanbanBoard /> // Default to board view
    },
    {
      path: 'dashboard',
      children: [
        {
          path: 'default',
          element: <KanbanBoard /> // Fallback: Dashboard goes to Board for now
        }
      ]
    },
    {
      path: 'typography',
      element: <UtilsTypography />
    },
    {
      path: 'color',
      element: <UtilsColor />
    },
    {
      path: 'shadow',
      element: <UtilsShadow />
    },
    {
      path: '/sample-page',
      element: <SamplePage />
    },
    {
      path: '/users',
      element: <UserList />
    },
    {
      path: '/tickets',
      element: <TicketList />
    },
    {
      path: '/tickets/create',
      element: <TicketCreate />
    },
    {
      path: '/tickets/board',
      element: <KanbanBoard />
    },
    {
      path: '/super-board',
      element: <SuperBoardList />
    },
    {
      path: '/super-board/:id',
      element: <SuperBoardDetail />
    }
  ]
};

export default MainRoutes;
