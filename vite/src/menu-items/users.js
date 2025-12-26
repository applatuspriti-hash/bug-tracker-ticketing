// assets
import { IconUsers } from '@tabler/icons-react';

// constant
const icons = { IconUsers };

// ==============================|| DASHBOARD MENU ITEMS ||============================== //

const users = {
    id: 'users-group',
    title: 'User Management',
    type: 'group',
    children: [
        {
            id: 'users',
            title: 'User List',
            type: 'item',
            url: '/users',
            icon: icons.IconUsers,
            breadcrumbs: false
        }
    ]
};

export default users;
