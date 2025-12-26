import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';

const KanbanColumn = ({ id, title, tickets, renderTicket }) => {
    const theme = useTheme();

    // Determine underline color based on title or id
    const getStatusColor = () => {
        const statusId = id || title.toLowerCase().replace(/\s/g, '');
        switch (statusId) {
            case 'todo':
                return theme.palette.primary.main;
            case 'inprogress':
                return theme.palette.secondary.main;
            case 'fixed':
                return theme.palette.success.main;
            case 'blocked':
                return theme.palette.error.main;
            case 'deployed':
                return theme.palette.orange?.main || '#ffab00';
            default:
                return theme.palette.grey[400];
        }
    };

    const statusColor = getStatusColor();

    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                bgcolor: theme.palette.mode === 'dark' ? theme.palette.dark[800] : '#ebedf0',
                p: 2,
                borderRadius: 2,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? theme.palette.dark[900] : '#dfe1e6',
                    '& .column-header-underline': {
                        width: '100%'
                    }
                }
            }}
        >
            <Box sx={{ position: 'relative', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h5" sx={{ mr: 1, textTransform: 'uppercase', color: 'text.secondary', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                        {title}
                    </Typography>
                    <Chip
                        label={tickets.length}
                        size="small"
                        sx={{
                            height: 20,
                            minWidth: 20,
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            '& .MuiChip-label': { px: 1 }
                        }}
                    />
                </Box>
                {/* Underline */}
                <Box
                    className="column-header-underline"
                    sx={{
                        height: 3,
                        width: '40px',
                        bgcolor: statusColor,
                        borderRadius: 1,
                        transition: 'width 0.3s ease'
                    }}
                />
            </Box>

            <Stack spacing={2}>
                {tickets.map((ticket, index) => (
                    <Box key={ticket.id || index} sx={{ width: '100%' }}>
                        {renderTicket(ticket)}
                    </Box>
                ))}
            </Stack>
        </Box>
    );
};

KanbanColumn.propTypes = {
    id: PropTypes.string,
    title: PropTypes.string.isRequired,
    tickets: PropTypes.array.isRequired,
    renderTicket: PropTypes.func.isRequired
};

export default KanbanColumn;
