import PropTypes from 'prop-types';
import { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';

import { IconCheck, IconDotsVertical, IconTrash, IconEdit, IconPaperclip } from '@tabler/icons-react';

// Status Configuration
const getStatusConfig = (status) => {
    switch (status) {
        case 'todo': return { label: 'TD', color: '#673ab7' }; // Deep Purple
        case 'inprogress': return { label: 'IP', color: '#2196f3' }; // Blue
        case 'fixed': return { label: 'F', color: '#00c853' }; // Green
        case 'blocked': return { label: 'B', color: '#f44336' }; // Red
        case 'deployed': return { label: 'D', color: '#ff9800' }; // Orange
        default: return { label: 'TD', color: '#673ab7' };
    }
};

const getPriorityColor = (priority, theme) => {
    switch (priority) {
        case 'high': return theme.palette.error.main;
        case 'medium': return theme.palette.warning.main;
        case 'low': return theme.palette.success.main; // or info.main
        default: return theme.palette.divider;
    }
};

// Helper to calculate time ago
const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + (interval === 1 ? " year ago" : " years ago");

    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + (interval === 1 ? " month ago" : " months ago");

    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + (interval === 1 ? " day ago" : " days ago"); // Required format "2 days ago"

    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + (interval === 1 ? " hour ago" : " hours ago");

    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + (interval === 1 ? " minute ago" : " minutes ago");

    return "Just now";
};

const TicketCard = ({ ticket, onClick, onAssign, onDelete, userList, onUpdateStatus }) => {
    const theme = useTheme();

    // Actions Menu State
    const [anchorEl, setAnchorEl] = useState(null);
    const openMenu = Boolean(anchorEl);

    // Assign Popover State
    const [assignAnchorEl, setAssignAnchorEl] = useState(null);
    const openAssign = Boolean(assignAnchorEl);

    // Status Menu State
    const [statusAnchorEl, setStatusAnchorEl] = useState(null);
    const openStatus = Boolean(statusAnchorEl);

    const handleMenuClick = (event) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = (event) => {
        event?.stopPropagation();
        setAnchorEl(null);
    };

    const handleEdit = (event) => {
        event.stopPropagation();
        onClick(ticket, true);
        setAnchorEl(null);
    };

    const handleDelete = (event) => {
        event.stopPropagation();
        if (onDelete) onDelete(ticket.id);
        setAnchorEl(null);
    };

    // Assignment Handlers
    const handleAvatarClick = (event) => {
        event.stopPropagation();
        setAssignAnchorEl(event.currentTarget);
    };

    const handleAssignClose = (event) => {
        event?.stopPropagation();
        setAssignAnchorEl(null);
    };

    const handleSelectUser = (event, userId) => {
        event.stopPropagation();
        if (onAssign) onAssign(ticket.id, userId);
        setAssignAnchorEl(null);
    };

    // Status Handlers
    const handleStatusClick = (event) => {
        event.stopPropagation();
        setStatusAnchorEl(event.currentTarget);
    };

    const handleStatusClose = (event) => {
        event?.stopPropagation();
        setStatusAnchorEl(null);
    };

    const handleSelectStatus = (event, newStatus) => {
        event.stopPropagation();
        if (onUpdateStatus) onUpdateStatus(ticket.id, newStatus);
        setStatusAnchorEl(null);
    };

    const statusConfig = getStatusConfig(ticket.status);
    const priorityColor = getPriorityColor(ticket.priority, theme);
    const timeAgo = getTimeAgo(ticket.createdAt);

    return (
        <Card
            sx={{
                p: 2,
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: '0 2px 8px 0 rgba(0,0,0,0.05)',
                border: '1px solid',
                borderColor: 'divider',
                borderLeft: `5px solid ${priorityColor}`, // Visual Priority Indicator
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    boxShadow: '0 4px 12px 0 rgba(0,0,0,0.1)',
                    transform: 'translateY(-2px)'
                },
                position: 'relative',
                overflow: 'hidden',
                height: 168, // Exact height for total uniformity
                minHeight: 168,
                maxHeight: 168,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box'
            }}
            onClick={() => onClick(ticket, false)}
        >
            <Stack spacing={1.5} sx={{ flexGrow: 1 }}> {/* Main content area that grows */}
                {/* Header: Number and Menu */}
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, letterSpacing: '0.02em' }}>
                            {ticket.key || `#${ticket.id}`}
                        </Typography>
                        {timeAgo && (
                            <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                                • {timeAgo}
                            </Typography>
                        )}
                    </Stack>
                    <IconButton size="small" onClick={handleMenuClick} sx={{ mt: -1, mr: -1 }}>
                        <IconDotsVertical size={16} />
                    </IconButton>
                </Stack>
                {/* Menu */}
                <Menu
                    anchorEl={anchorEl}
                    open={openMenu}
                    onClose={handleMenuClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <MenuItem onClick={handleEdit}>
                        <IconEdit size={16} />
                    </MenuItem>
                    <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                        <IconTrash size={16} />
                    </MenuItem>
                </Menu>

                {/* Title with Tooltip on hover */}
                <Tooltip title={ticket.title} placement="top-start" arrow>
                    <Typography
                        variant="subtitle1"
                        sx={{
                            fontWeight: 600,
                            lineHeight: 1.3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            wordBreak: 'break-word',
                            minHeight: '2.6em', // Reserve space for 2 lines
                            maxHeight: '2.6em' // Cap at 2 lines
                        }}
                    >
                        {ticket.title}
                    </Typography>
                </Tooltip>

                {/* Epic Tag Container - Always present to maintain height */}
                <Box sx={{ minHeight: 24, display: 'flex', alignItems: 'center' }}>
                    {ticket.epic && (
                        <Chip
                            label={ticket.epic.toUpperCase()}
                            size="small"
                            sx={{
                                height: 20,
                                fontSize: '0.625rem',
                                fontWeight: 600,
                                borderRadius: 1,
                                bgcolor: theme.palette.secondary.light,
                                color: theme.palette.secondary.dark
                            }}
                        />
                    )}
                </Box>
            </Stack>

            {/* Footer: Always at the bottom */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" mt={1}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Checkbox
                        size="small"
                        checked={ticket.status === 'done' || ticket.status === 'deployed'}
                        sx={{ p: 0, '& .MuiSvgIcon-root': { fontSize: 18 } }}
                    />
                    {ticket.images && ticket.images.length > 0 && (
                        <Stack direction="row" alignItems="center" spacing={0.2} sx={{ color: 'text.secondary' }}>
                            <IconPaperclip size={14} />
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                {ticket.images.length}
                            </Typography>
                        </Stack>
                    )}
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1}>

                    {/* Status Indicator (Interactive) */}
                    <Avatar
                        sx={{
                            width: 24,
                            height: 24,
                            fontSize: '0.65rem',
                            bgcolor: statusConfig.color,
                            color: '#fff',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            border: '1px solid white'
                        }}
                        onClick={handleStatusClick}
                    >
                        {statusConfig.label}
                    </Avatar>
                    <Menu
                        anchorEl={statusAnchorEl}
                        open={openStatus}
                        onClose={handleStatusClose}
                    >
                        <MenuItem onClick={(e) => handleSelectStatus(e, 'todo')}>To Do</MenuItem>
                        <MenuItem onClick={(e) => handleSelectStatus(e, 'inprogress')}>In Progress</MenuItem>
                        <MenuItem onClick={(e) => handleSelectStatus(e, 'fixed')}>Fixed</MenuItem>
                        <MenuItem onClick={(e) => handleSelectStatus(e, 'blocked')}>Blocked</MenuItem>
                        <MenuItem onClick={(e) => handleSelectStatus(e, 'deployed')}>Deployed</MenuItem>
                    </Menu>

                    {/* Assignee Avatar */}
                    <Avatar
                        src={ticket.assigneeAvatar}
                        sx={{ width: 24, height: 24, fontSize: '0.75rem', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                        onClick={handleAvatarClick}
                    >
                        {ticket.assigneeName ? ticket.assigneeName.charAt(0) : 'U'}
                    </Avatar>

                    {/* Assignment Popover */}
                    <Popover
                        open={openAssign}
                        anchorEl={assignAnchorEl}
                        onClose={handleAssignClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    >
                        <Box sx={{ p: 1, minWidth: 200 }}>
                            <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 'bold' }}>Assign to...</Typography>
                            <List dense sx={{ p: 0 }}>
                                {userList && userList.map(user => (
                                    <ListItem key={user.id} button onClick={(e) => handleSelectUser(e, user.id)}>
                                        <ListItemAvatar>
                                            <Avatar src={user.avatar} sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>{user.name.charAt(0)}</Avatar>
                                        </ListItemAvatar>
                                        <ListItemText primary={user.name} />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    </Popover>
                </Stack>
            </Stack>
        </Card>
    );
};

TicketCard.propTypes = {
    ticket: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        title: PropTypes.string.isRequired,
        epic: PropTypes.string,
        key: PropTypes.string,
        key: PropTypes.string,
        status: PropTypes.string,
        priority: PropTypes.string,
        assigneeName: PropTypes.string,
        assigneeAvatar: PropTypes.string,
        images: PropTypes.array
    }).isRequired,
    onClick: PropTypes.func,
    onAssign: PropTypes.func,
    onDelete: PropTypes.func,
    onUpdateStatus: PropTypes.func, // Added handler
    userList: PropTypes.array
};

export default TicketCard;
