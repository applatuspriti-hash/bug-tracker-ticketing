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

const TicketCard = ({ ticket, onClick, onAssign, onDelete, userList }) => {
    const theme = useTheme();

    // Actions Menu State
    const [anchorEl, setAnchorEl] = useState(null);
    const openMenu = Boolean(anchorEl);

    // Assign Popover State
    const [assignAnchorEl, setAssignAnchorEl] = useState(null);
    const openAssign = Boolean(assignAnchorEl);

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

    return (
        <Card
            sx={{
                p: 2,
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: '0 2px 8px 0 rgba(0,0,0,0.05)',
                border: '1px solid',
                borderColor: 'divider',
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
                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, letterSpacing: '0.02em' }}>
                        {ticket.key || `#${ticket.id}`}
                    </Typography>
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
        status: PropTypes.string,
        assigneeName: PropTypes.string,
        assigneeAvatar: PropTypes.string,
    }).isRequired,
    onClick: PropTypes.func,
    onAssign: PropTypes.func,
    onDelete: PropTypes.func,
    userList: PropTypes.array
};

export default TicketCard;
