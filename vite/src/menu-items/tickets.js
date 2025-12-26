// assets
import { IconTicket } from '@tabler/icons-react';

// constant
const icons = { IconTicket };

// ==============================|| DASHBOARD MENU ITEMS ||============================== //

const tickets = {
    id: 'tickets-group',
    title: 'Tickets',
    type: 'group',
    children: [
        {
            id: 'tickets',
            title: 'Tickets',
            type: 'item',
            url: '/tickets',
            icon: icons.IconTicket,
            breadcrumbs: false
        },
        {
            id: 'board',
            title: 'Board',
            type: 'item',
            url: '/tickets/board',
            icon: icons.IconTicket, // You might want to import IconLayoutKanban if available, reusing IconTicket for now
            breadcrumbs: false
        }
    ]
};

export default tickets;
