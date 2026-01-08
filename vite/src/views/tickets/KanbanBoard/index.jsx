import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// project imports
import KanbanColumn from './KanbanColumn';
import TicketCard from './TicketCard';
import TicketDetail from './TicketDetail';
import TicketCreateDialog from './TicketCreateDialog';
import { useData } from 'contexts/DataContext';
import { useAuth } from 'contexts/AuthContext';
import { useEffect } from 'react';
import { useToast } from 'contexts/ToastContext';
import DeleteConfirmDialog from 'ui-component/extended/DeleteConfirmDialog';
import { DragDropContext } from '@hello-pangea/dnd';

const KanbanBoard = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { tickets, updateTicketStatus, updateTicket, deleteTicket, users, superBoards, isAdmin, userAssignments } = useData();
    const { user } = useAuth();

    // State for Filter
    const [filterUser, setFilterUser] = useState('all');
    const [filterSuperBoard, setFilterSuperBoard] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');

    // Use superBoards directly as they are already filtered by DataContext
    const availableSuperBoards = superBoards;

    // Sync URL param 'superBoardId' with state and Default Selection
    useEffect(() => {
        const sbId = searchParams.get('superBoardId');

        if (sbId) {
            setFilterSuperBoard(sbId);
        } else {
            if (availableSuperBoards.length > 0) {
                if (isAdmin) {
                    setFilterSuperBoard('all');
                } else {
                    setFilterSuperBoard(availableSuperBoards[0]?.id || 'all');
                }
            } else {
                setFilterSuperBoard('all');
            }
        }
    }, [searchParams, availableSuperBoards, userAssignments, isAdmin]);

    // Handle filter change
    const handleSuperBoardChange = (newValue) => {
        setFilterSuperBoard(newValue);
        if (newValue === 'all') {
            searchParams.delete('superBoardId');
        } else {
            searchParams.set('superBoardId', newValue);
        }
        setSearchParams(searchParams);
    };

    const { showToast } = useToast();

    // State for Detail Dialog
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [openDetail, setOpenDetail] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // State for Create Dialog
    const [openCreate, setOpenCreate] = useState(false);

    // Delete confirm dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [ticketIdToDelete, setTicketIdToDelete] = useState(null);

    // Columns Configuration
    const columns = [
        { id: 'todo', title: 'To Do' },
        { id: 'inprogress', title: 'In Progress' },
        { id: 'fixed', title: 'Fixed' },
        { id: 'blocked', title: 'Blocked' },
        { id: 'deployed', title: 'Deployed' },
        ...(isAdmin ? [{ id: 'complete', title: 'Complete' }] : []),
        ...(isAdmin ? [{ id: 'deleted', title: 'Deleted' }] : [])
    ];

    // Helper to get tickets for a column
    const getTicketsForColumn = (columnId) => {
        let filtered = tickets.filter(t => t.status === columnId);

        if (filterUser !== 'all') {
            filtered = filtered.filter(t => t.assigneeId === filterUser);
        }

        if (filterSuperBoard !== 'all') {
            filtered = filtered.filter(t => t.superBoardId === filterSuperBoard);
        } else {
            if (!isAdmin) {
                const allowedIds = availableSuperBoards.map(sb => sb.id);
                filtered = filtered.filter(t => allowedIds.includes(t.superBoardId));
            }
        }

        if (filterPriority !== 'all') {
            filtered = filtered.filter(t => t.priority === filterPriority);
        }

        // Sort by updatedAt descending (newest first)
        return filtered.sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.createdAt || 0);
            const dateB = new Date(b.updatedAt || b.createdAt || 0);
            return dateB - dateA;
        });
    };

    // Filter User Dropdown Logic
    const displayedUsers = useMemo(() => {
        let targetBoardId = filterSuperBoard;

        if (targetBoardId === 'all') {
            if (isAdmin) return users;
            const allowedBoardIds = availableSuperBoards.map(sb => sb.id);
            const meaningfulUsers = new Set(
                tickets
                    .filter(t => allowedBoardIds.includes(t.superBoardId))
                    .map(t => t.assigneeId)
                    .filter(Boolean)
            );
            return users.filter(u => meaningfulUsers.has(u.id));
        }

        const boardTicketAssignees = new Set(
            tickets
                .filter(t => t.superBoardId === targetBoardId)
                .map(t => t.assigneeId)
                .filter(Boolean)
        );

        const selectedBoard = superBoards.find(b => b.id === targetBoardId);
        if (selectedBoard && selectedBoard.assignedUsers && Array.isArray(selectedBoard.assignedUsers)) {
            selectedBoard.assignedUsers.forEach(id => boardTicketAssignees.add(id));
        }

        return users.filter(u => boardTicketAssignees.has(u.id));
    }, [users, tickets, filterSuperBoard, availableSuperBoards, isAdmin, superBoards]);

    // Deep linking for tickets
    useEffect(() => {
        const ticketId = searchParams.get('ticketId');
        if (ticketId && tickets.length > 0 && !selectedTicket) {
            const ticket = tickets.find(t => t.id.toString() === ticketId);
            if (ticket) {
                const richTicket = {
                    ...ticket,
                    assigneeName: users.find(u => u.id === ticket.assigneeId)?.name,
                    assigneeAvatar: users.find(u => u.id === ticket.assigneeId)?.avatar,
                    reporterName: users.find(u => u.id === ticket.reporterId)?.name,
                    reporterAvatar: users.find(u => u.id === ticket.reporterId)?.avatar,
                    epic: ticket.epic || 'EXAMPLE EPIC 1'
                };
                setSelectedTicket(richTicket);
                setIsEditMode(true);
                setOpenDetail(true);
            }
        }
    }, [searchParams, tickets, users, selectedTicket]);

    const handleTicketClick = (ticket, isEdit = true) => {
        const richTicket = {
            ...ticket,
            assigneeName: users.find(u => u.id === ticket.assigneeId)?.name,
            assigneeAvatar: users.find(u => u.id === ticket.assigneeId)?.avatar,
            reporterName: users.find(u => u.id === ticket.reporterId)?.name,
            reporterAvatar: users.find(u => u.id === ticket.reporterId)?.avatar,
            epic: ticket.epic || 'EXAMPLE EPIC 1'
        };
        setSelectedTicket(richTicket);
        setIsEditMode(true);
        setOpenDetail(true);

        searchParams.set('ticketId', ticket.id);
        setSearchParams(searchParams);
    };

    const handleCloseDetail = () => {
        setOpenDetail(false);
        setSelectedTicket(null);
        setIsEditMode(false);
        searchParams.delete('ticketId');
        setSearchParams(searchParams);
    };

    const handleUpdateStatus = (ticketId, newStatus) => {
        updateTicketStatus(ticketId, newStatus);
        if (selectedTicket && selectedTicket.id === ticketId) {
            setSelectedTicket(prev => ({ ...prev, status: newStatus }));
        }
    };

    const handleTicketAssign = (ticketId, userId) => {
        updateTicket(ticketId, { assigneeId: userId });
    };

    const handleTicketDelete = (ticketId) => {
        setTicketIdToDelete(ticketId);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (ticketIdToDelete) {
            try {
                await deleteTicket(ticketIdToDelete);
                showToast('Ticket deleted successfully');
                setDeleteDialogOpen(false);
            } catch (error) {
                console.error(error);
                showToast('Delete failed', 'error');
            }
        }
    };

    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileStatusFilter, setMobileStatusFilter] = useState('all');

    const onDragEnd = (result) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const newStatus = destination.droppableId;
        const ticketId = draggableId;
        handleUpdateStatus(ticketId, newStatus);
        showToast(`Ticket moved to ${newStatus.toUpperCase().replace('INPROGRESS', 'IN PROGRESS')}`, 'info');
    };

    const renderMobileLayout = () => {
        const mobileCols = mobileStatusFilter === 'all'
            ? columns
            : columns.filter(c => c.id === mobileStatusFilter);

        return (
            <Box>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12}>
                        <FormControl size="small" fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={mobileStatusFilter}
                                label="Status"
                                onChange={(e) => setMobileStatusFilter(e.target.value)}
                            >
                                <MenuItem value="all">All Statuses</MenuItem>
                                {columns.map(col => (
                                    <MenuItem key={col.id} value={col.id}>{col.title}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                        <FormControl size="small" fullWidth>
                            <InputLabel>Board</InputLabel>
                            <Select
                                value={filterSuperBoard}
                                label="Board"
                                onChange={(e) => handleSuperBoardChange(e.target.value)}
                            >
                                {isAdmin && <MenuItem value="all">All</MenuItem>}
                                {availableSuperBoards.map(sb => (
                                    <MenuItem key={sb.id} value={sb.id}>{sb.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                        <FormControl size="small" fullWidth>
                            <InputLabel>Assignee</InputLabel>
                            <Select
                                value={filterUser}
                                label="Assignee"
                                onChange={(e) => setFilterUser(e.target.value)}
                            >
                                <MenuItem value="all">All</MenuItem>
                                {users.map(u => (
                                    <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <FormControl size="small" fullWidth>
                            <InputLabel>Priority</InputLabel>
                            <Select
                                value={filterPriority}
                                label="Priority"
                                onChange={(e) => setFilterPriority(e.target.value)}
                            >
                                <MenuItem value="all">All Priorities</MenuItem>
                                <MenuItem value="high">High</MenuItem>
                                <MenuItem value="medium">Medium</MenuItem>
                                <MenuItem value="low">Low</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <Button variant="contained" fullWidth onClick={() => setOpenCreate(true)}>
                            Create Ticket
                        </Button>
                    </Grid>
                </Grid>

                <Stack spacing={2}>
                    {mobileCols.map(col => (
                        <Box key={col.id} sx={{ minHeight: 200, bgcolor: 'secondary.light', p: 1, borderRadius: 2 }}>
                            <KanbanColumn
                                id={col.id}
                                title={col.title}
                                tickets={getTicketsForColumn(col.id).map(t => ({
                                    ...t,
                                    assigneeName: users.find(u => u.id === t.assigneeId)?.name,
                                    assigneeAvatar: users.find(u => u.id === t.assigneeId)?.avatar,
                                    epic: t.epic || 'EXAMPLE EPIC 1',
                                    key: `SMP-${(t.id.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 10000).toString().padStart(4, '0')}`
                                }))}
                                renderTicket={(ticket, index) => (
                                    <TicketCard
                                        key={ticket.id}
                                        index={index}
                                        ticket={ticket}
                                        onClick={handleTicketClick}
                                        onAssign={handleTicketAssign}
                                        onDelete={handleTicketDelete}
                                        onUpdateStatus={handleUpdateStatus}
                                        userList={displayedUsers}
                                        isAdmin={isAdmin}
                                    />
                                )}
                            />
                        </Box>
                    ))}
                </Stack>
            </Box>
        );
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Box sx={{
                height: 'calc(100vh - 100px)',
                overflowX: isMobile ? 'hidden' : 'auto',
                p: 2,
                bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.default : '#f4f6f8',
                transition: 'background-color 0.3s ease'
            }}>
                {!isMobile && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                        <Typography variant="h2">Board</Typography>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Filter by Super Board</InputLabel>
                                <Select
                                    value={filterSuperBoard}
                                    label="Filter by Super Board"
                                    onChange={(e) => handleSuperBoardChange(e.target.value)}
                                >
                                    {isAdmin && <MenuItem value="all">All Boards</MenuItem>}
                                    {availableSuperBoards.map(sb => (
                                        <MenuItem key={sb.id} value={sb.id}>{sb.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Filter by Assignee</InputLabel>
                                <Select
                                    value={filterUser}
                                    label="Filter by Assignee"
                                    onChange={(e) => setFilterUser(e.target.value)}
                                >
                                    <MenuItem value="all">All Users</MenuItem>
                                    {users.map(u => (
                                        <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <InputLabel>Filter by Priority</InputLabel>
                                <Select
                                    value={filterPriority}
                                    label="Filter by Priority"
                                    onChange={(e) => setFilterPriority(e.target.value)}
                                >
                                    <MenuItem value="all">All Priorities</MenuItem>
                                    <MenuItem value="high">High</MenuItem>
                                    <MenuItem value="medium">Medium</MenuItem>
                                    <MenuItem value="low">Low</MenuItem>
                                </Select>
                            </FormControl>
                            <Button variant="contained" onClick={() => setOpenCreate(true)}>
                                Create Ticket main
                            </Button>
                        </Stack>
                    </Box>
                )}

                {isMobile ? renderMobileLayout() : (
                    <Box sx={{
                        display: 'flex',
                        gap: 3,
                        height: 'calc(100% - 60px)',
                        overflowX: 'auto',
                        pb: 2,
                        px: 1,
                        '&::-webkit-scrollbar': { height: '8px' },
                        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.1)', borderRadius: '10px' }
                    }}>
                        {columns.map(col => (
                            <Box key={col.id} sx={{ flex: '0 0 320px', width: 320, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <KanbanColumn
                                    id={col.id}
                                    title={col.title}
                                    tickets={getTicketsForColumn(col.id).map(t => ({
                                        ...t,
                                        assigneeName: users.find(u => u.id === t.assigneeId)?.name,
                                        assigneeAvatar: users.find(u => u.id === t.assigneeId)?.avatar,
                                        key: `SMP-${(t.id.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 10000).toString().padStart(4, '0')}`
                                    }))}
                                    renderTicket={(ticket, index) => (
                                        <TicketCard
                                            key={ticket.id}
                                            index={index}
                                            ticket={ticket}
                                            onClick={handleTicketClick}
                                            onAssign={handleTicketAssign}
                                            onDelete={handleTicketDelete}
                                            onUpdateStatus={handleUpdateStatus}
                                            userList={displayedUsers}
                                            isAdmin={isAdmin}
                                        />
                                    )}
                                />
                            </Box>
                        ))}
                    </Box>
                )}

                <TicketDetail
                    open={openDetail}
                    onClose={handleCloseDetail}
                    ticket={selectedTicket}
                    onUpdateStatus={handleUpdateStatus}
                    onUpdateTicket={updateTicket}
                    assigneeList={users}
                    isEdit={isEditMode}
                    isAdmin={isAdmin}
                />
                <TicketCreateDialog open={openCreate} onClose={() => setOpenCreate(false)} />
                <DeleteConfirmDialog
                    open={deleteDialogOpen}
                    onClose={() => setDeleteDialogOpen(false)}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Ticket"
                    message="Are you sure you want to delete this ticket? This action cannot be undone."
                />
            </Box>
        </DragDropContext>
    );
};

export default KanbanBoard;
