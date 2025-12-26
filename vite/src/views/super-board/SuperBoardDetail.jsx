import { useParams } from 'react-router-dom';
import { useMemo } from 'react';

// material-ui
import { Grid, Typography, Avatar, Tooltip, Stack, Box, Paper } from '@mui/material';

// project
import MainCard from 'ui-component/cards/MainCard';
import { useData } from 'contexts/DataContext';

const SuperBoardDetail = () => {
    const { id } = useParams();
    const { superBoards, tickets, users } = useData();

    const board = superBoards.find(b => b.id === id);

    // Filter tickets for this board
    const boardTickets = useMemo(() =>
        tickets.filter(t => t.superBoardId === id),
        [tickets, id]);

    // Find assigned users
    const assignedUsers = useMemo(() => {
        const userIds = new Set(boardTickets.map(t => t.assigneeId).filter(Boolean));
        return users.filter(u => userIds.has(u.uid)); // Assuming u.uid matches assigneeId
    }, [boardTickets, users]);

    if (!board) return <Typography>Loading Board...</Typography>;

    return (
        <MainCard title={`${board.name} Board`}>

            {/* Assigned Users Header */}
            <Box mb={4}>
                <Typography variant="h4" gutterBottom>Team Members</Typography>
                <Stack direction="row" spacing={1}>
                    {assignedUsers.map(u => (
                        <Tooltip key={u.id} title={u.name}>
                            <Avatar alt={u.name} src={u.avatar} />
                        </Tooltip>
                    ))}
                    {assignedUsers.length === 0 && <Typography variant="body2">No members assigned.</Typography>}
                </Stack>
            </Box>

            {/* Ticket Columns */}
            <Grid container spacing={2}>
                {['todo', 'inprogress', 'fixed', 'deployed'].map(status => (
                    <Grid item xs={12} sm={6} md={3} key={status}>
                        <Paper sx={{ p: 2, bgcolor: '#f4f6f8' }}>
                            <Typography variant="h5" sx={{ textTransform: 'uppercase', mb: 2 }}>{status}</Typography>
                            <Stack spacing={2}>
                                {boardTickets.filter(t => t.status === status).map(ticket => (
                                    <Paper key={ticket.id} sx={{ p: 2 }}>
                                        <Typography variant="subtitle1">{ticket.title}</Typography>
                                        <Typography variant="body2" color="textSecondary">{ticket.description}</Typography>
                                        {/* You can add more ticket details here */}
                                    </Paper>
                                ))}
                            </Stack>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </MainCard>
    );
};

export default SuperBoardDetail;
