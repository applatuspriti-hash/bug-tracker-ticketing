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

const KanbanBoard = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { tickets, updateTicketStatus, updateTicket, deleteTicket, users, superBoards } = useData();
    const { user } = useAuth();

    // State for Filter
    const [filterUser, setFilterUser] = useState('all');
    const [filterSuperBoard, setFilterSuperBoard] = useState('all');

    // Helper to determine user assignments (Mock Logic based on User Request)
    const getUserAssignments = (currentUser) => {
        if (!currentUser) return [];
        const email = currentUser.email.toLowerCase();

        // Admin or User with both assignments
        if (email.includes('admin') || (email.includes('user1') && email.includes('user3'))) { // Example condition for both
            return ['ALL']; // Or list both IDs if known. 'ALL' implies access to everything.
        }

        // Logic based on user request mapping
        if (email.includes('user1') || email.includes('user2')) return ['BU'];
        if (email.includes('user3')) return ['SMD'];

        // Default fallback (maybe see everything or nothing?)
        return ['ALL'];
    };

    const userAssignments = useMemo(() => getUserAssignments(user), [user]);

    // Filter available SuperBoards based on assignment
    const availableSuperBoards = useMemo(() => {
        if (userAssignments.includes('ALL')) return superBoards;
        return superBoards.filter(sb => userAssignments.includes(sb.name)); // Matching by Name 'BU', 'SMD'
    }, [superBoards, userAssignments]);

    // Sync URL param 'superBoardId' with state and Default Selection
    useEffect(() => {
        const sbId = searchParams.get('superBoardId');

        if (sbId) {
            // Validating if user has access to this board ID could go here
            setFilterSuperBoard(sbId);
        } else {
            // Default selection logic
            if (availableSuperBoards.length > 0) {
                // If only one or priority, select it. 
                // If 'ALL' access, maybe 'all'? Or first one? 
                // Requirement: "user1 assign bu... user1 login show board onlu show bu"
                if (userAssignments.includes('ALL')) {
                    setFilterSuperBoard('all');
                } else {
                    // Auto-select the first available assignment
                    // We need the ID of the board named 'BU' or 'SMD'
                    // availableSuperBoards has the filtered list.
                    // We select the first one's ID.
                    setFilterSuperBoard(availableSuperBoards[0]?.id || 'all');
                }
            } else {
                setFilterSuperBoard('all');
            }
        }
    }, [searchParams, availableSuperBoards, userAssignments]);

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
        { id: 'deployed', title: 'Deployed' }
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
            // If filter works on 'all' but user is restricted, we should probably filter here too?
            // But UI restricts the dropdown.
            // If user is restricted to 'BU', availableSuperBoards only has 'BU'.
            // If they somehow selected 'all' (not in dropdown), we should enforce.
            if (!userAssignments.includes('ALL')) {
                const allowedIds = availableSuperBoards.map(sb => sb.id);
                filtered = filtered.filter(t => allowedIds.includes(t.superBoardId));
            }
        }

        return filtered;
    };

    // Filter User Dropdown Logic
    const displayedUsers = useMemo(() => {
        // "user1 login show board onlu show bu assign users , not shopw smd users"
        // This implies: If board 'BU' is selected, show users assigned to tickets on that board?
        // Or users who BELONG to that group? 
        // Assuming "users who have tickets on this board" as per previous logic, 
        // OR we can filter users who are "mapped" effectively.

        let targetBoardId = filterSuperBoard;

        // If 'all' is selected, and we are restricted, we consider "all visible boards"
        if (targetBoardId === 'all' && !userAssignments.includes('ALL')) {
            // We can collect users from all allowed boards
        }

        if (targetBoardId === 'all') {
            if (userAssignments.includes('ALL')) return users;

            // Filter users relevant to allowed boards
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

        return users.filter(u => boardTicketAssignees.has(u.id));
    }, [users, tickets, filterSuperBoard, availableSuperBoards, userAssignments]);

    const handleTicketClick = (ticket, isEdit = true) => {
        // Hydrate with assignee info if needed, though card likely has it
        const richTicket = {
            ...ticket,
            assigneeName: users.find(u => u.id === ticket.assigneeId)?.name,
            assigneeAvatar: users.find(u => u.id === ticket.assigneeId)?.avatar, // Assuming avatar prop exists or we mock it
            reporterName: users.find(u => u.id === ticket.reporterId)?.name,
            reporterAvatar: users.find(u => u.id === ticket.reporterId)?.avatar,
            // Mock Epic logic if not in data
            epic: ticket.epic || 'EXAMPLE EPIC 1'
        };
        setSelectedTicket(richTicket);
        setIsEditMode(true); // Always editable as per request
        setOpenDetail(true);
    };

    const handleCloseDetail = () => {
        setOpenDetail(false);
        setSelectedTicket(null);
        setIsEditMode(false);
    };

    const handleUpdateStatus = (ticketId, newStatus) => {
        updateTicketStatus(ticketId, newStatus);
        // Also update local selected ticket so the dialog reflects the change immediately if needed
        if (selectedTicket && selectedTicket.id === ticketId) {
            setSelectedTicket(prev => ({ ...prev, status: newStatus }));
        }
    };

    // Mock handlers purely for UI demonstration if context doesn't exist yet
    // In a real app these would call context methods
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
            } catch (error) {
                console.error(error);
                showToast('Delete failed', 'error');
            }
        }
    };

    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileStatusFilter, setMobileStatusFilter] = useState('all');

    // ... (rest of the component)

    // Mobile layout renderer
    const renderMobileLayout = () => {
        // Filter columns based on mobileStatusFilter
        const mobileCols = mobileStatusFilter === 'all'
            ? columns
            : columns.filter(c => c.id === mobileStatusFilter);

        return (
            <Box>
                {/* Mobile Filters */}

                <Grid container spacing={2} sx={{ mb: 2 }}>
                    {/* Status Filter - Full Width */}
                    <Grid item xs={12}>
                        <FormControl size="small" fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={mobileStatusFilter}
                                label="Status"
                                onChange={(e) => setMobileStatusFilter(e.target.value)}
                            >
                                <MenuItem value="all">All Statuses</MenuItem>
                                <MenuItem value="todo">To Do</MenuItem>
                                <MenuItem value="inprogress">In Progress</MenuItem>
                                <MenuItem value="fixed">Fixed</MenuItem>
                                <MenuItem value="blocked">Blocked</MenuItem>
                                <MenuItem value="deployed">Deployed</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Board and Assignee Filters - Side by Side */}
                    <Grid item xs={6}>
                        <FormControl size="small" fullWidth>
                            <InputLabel>Board</InputLabel>
                            <Select
                                value={filterSuperBoard}
                                label="Board"
                                onChange={(e) => handleSuperBoardChange(e.target.value)}
                            >
                                {userAssignments.includes('ALL') && <MenuItem value="all">All</MenuItem>}
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

                    {/* Create Ticket Button - Full Width */}
                    <Grid item xs={12}>
                        <Button variant="contained" fullWidth onClick={() => setOpenCreate(true)}>
                            Create Ticket
                        </Button>
                    </Grid>
                </Grid>

                {/* Mobile Columns (Stacked Vertically) */}
                <Stack spacing={2}>
                    {mobileCols.map(col => (
                        <Box key={col.id} sx={{ minHeight: 200, bgcolor: 'secondary.light', p: 1, borderRadius: 2 }}>
                            <KanbanColumn
                                title={col.title}
                                tickets={getTicketsForColumn(col.id).map(t => ({
                                    ...t,
                                    assigneeName: users.find(u => u.id === t.assigneeId)?.name,
                                    assigneeAvatar: users.find(u => u.id === t.assigneeId)?.avatar,
                                    epic: t.epic || 'EXAMPLE EPIC 1',
                                    key: `SMP-${(t.id.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 10000).toString().padStart(4, '0')}`
                                }))}
                                renderTicket={(ticket) => (
                                    <TicketCard
                                        ticket={ticket}
                                        onClick={handleTicketClick}
                                        onAssign={handleTicketAssign}
                                        onDelete={handleTicketDelete}
                                        userList={displayedUsers}
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
                    <Stack direction="row" spacing={2}>
                        <Button variant="contained" onClick={() => setOpenCreate(true)}>
                            Create Ticket
                        </Button>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel id="sb-filter-label">Filter by Super Board</InputLabel>
                                <Select
                                    labelId="sb-filter-label"
                                    value={filterSuperBoard}
                                    label="Filter by Super Board"
                                    onChange={(e) => handleSuperBoardChange(e.target.value)}
                                >
                                    {userAssignments.includes('ALL') && <MenuItem value="all">All Boards</MenuItem>}
                                    {availableSuperBoards.map(sb => (
                                        <MenuItem key={sb.id} value={sb.id}>{sb.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel id="user-filter-label">Filter by Assignee</InputLabel>
                                <Select
                                    labelId="user-filter-label"
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
                        </Stack>
                    </Stack>
                </Box>
            )}

            {isMobile ? renderMobileLayout() : (
                <Box sx={{
                    display: 'flex',
                    gap: 3,
                    height: 'calc(100% - 60px)', // Subtracting header height
                    overflowX: 'auto',
                    pb: 2,
                    px: 1,
                    '&::-webkit-scrollbar': {
                        height: '8px'
                    },
                    '&::-webkit-scrollbar-thumb': {
                        bgcolor: 'rgba(0,0,0,0.1)',
                        borderRadius: '10px'
                    }
                }}>
                    {columns.map(col => (
                        <Box key={col.id} sx={{
                            flex: '0 0 320px', // Slightly wider for better card spacing
                            width: 320,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <KanbanColumn
                                id={col.id} // Passing id for color logic
                                title={col.title}
                                tickets={getTicketsForColumn(col.id).map(t => ({
                                    ...t,
                                    assigneeName: users.find(u => u.id === t.assigneeId)?.name,
                                    assigneeAvatar: users.find(u => u.id === t.assigneeId)?.avatar,
                                    key: `SMP-${(t.id.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 10000).toString().padStart(4, '0')}`
                                }))}
                                renderTicket={(ticket) => (
                                    <TicketCard
                                        ticket={ticket}
                                        onClick={handleTicketClick}
                                        onAssign={handleTicketAssign}
                                        onDelete={handleTicketDelete}
                                        onUpdateStatus={handleUpdateStatus}
                                        userList={displayedUsers}
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
            />

            <TicketCreateDialog
                open={openCreate}
                onClose={() => setOpenCreate(false)}
            />

            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Ticket"
                message="Are you sure you want to delete this ticket? This action cannot be undone."
            />
        </Box>
    );
};

export default KanbanBoard;
