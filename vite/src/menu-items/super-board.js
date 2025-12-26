// assets
import { IconDashboard } from '@tabler/icons-react';

// constant
const icons = { IconDashboard };

// ==============================|| DASHBOARD MENU ITEMS ||============================== //

const superBoard = {
    id: 'super-board-group',
    title: 'Super Board',
    type: 'group',
    children: [
        {
            id: 'super-board',
            title: 'Super Board',
            type: 'item',
            url: '/super-board',
            icon: icons.IconDashboard,
            breadcrumbs: false
        }
    ]
};

export default superBoard;
