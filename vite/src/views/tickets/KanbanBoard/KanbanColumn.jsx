import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Droppable } from '@hello-pangea/dnd';

const KanbanColumn = ({ id, title, tickets, renderTicket, isMobile }) => {
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
            case 'complete':
                return theme.palette.info.main;
            case 'deleted':
                return theme.palette.grey[500];
            default:
                return theme.palette.grey[400];
        }
    };

    const statusColor = getStatusColor();

    const headerContent = (
        <Box sx={{
            p: 2,
            position: isMobile ? 'relative' : 'sticky',
            top: 0,
            zIndex: 2,
            bgcolor: theme.palette.mode === 'dark' ? theme.palette.dark[800] : '#F2F2F2',
            borderBottom: isMobile ? 'none' : '1px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,0,0,0.1)',
            width: '100%'
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="h5" sx={{ mr: 1, textTransform: 'uppercase', color: 'text.primary', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                    {title}
                </Typography>
                <Chip
                    label={tickets.length}
                    size="small"
                    sx={{
                        height: 20,
                        minWidth: 20,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,0,0,0.1)',
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        color: theme.palette.mode === 'dark' ? 'inherit' : '#d32f2f',
                        '& .MuiChip-label': { px: 1 }
                    }}
                />
            </Box>
            <Box
                className="column-header-underline"
                sx={{
                    height: 3,
                    width: '100%',
                    bgcolor: statusColor,
                    borderRadius: 1,
                    opacity: 0.8
                }}
            />
        </Box>
    );

    const listContent = (
        <Droppable droppableId={id}>
            {(provided, snapshot) => (
                <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{
                        flexGrow: 1,
                        overflowY: isMobile ? 'visible' : 'auto',
                        p: 2,
                        bgcolor: snapshot.isDraggingOver ? 'action.hover' : 'transparent',
                        transition: 'background-color 0.2s ease',
                        '&::-webkit-scrollbar': {
                            width: '6px'
                        },
                        '&::-webkit-scrollbar-thumb': {
                            bgcolor: 'rgba(0,0,0,0.1)',
                            borderRadius: '10px'
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                            bgcolor: 'rgba(0,0,0,0.2)'
                        }
                    }}
                >
                    <Stack spacing={2}>
                        {tickets.map((ticket, index) => renderTicket(ticket, index))}
                        {provided.placeholder}
                    </Stack>
                </Box>
            )}
        </Droppable>
    );

    if (isMobile) {
        return (
            <Accordion
                defaultExpanded={false}
                sx={{
                    bgcolor: theme.palette.mode === 'dark' ? theme.palette.dark[800] : '#F2F2F2',
                    marginBottom: '16px',
                    borderRadius: 2,
                    '&:before': {
                        display: 'none',
                    }
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                        '& .MuiAccordionSummary-content': {
                            display: 'block',
                            margin: 0,
                        },
                        p: 0
                    }}
                >
                    {headerContent}
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                    {listContent}
                </AccordionDetails>
            </Accordion>
        );
    }

    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: theme.palette.mode === 'dark' ? theme.palette.dark[800] : '#F2F2F2',
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark' ? 'transparent' : '#d9dbde',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                    boxShadow: theme.shadows[2]
                }
            }}
        >
            {headerContent}
            {listContent}
        </Box>
    );
};

KanbanColumn.propTypes = {
    id: PropTypes.string,
    title: PropTypes.string.isRequired,
    tickets: PropTypes.array.isRequired,
    renderTicket: PropTypes.func.isRequired,
    isMobile: PropTypes.bool
};

export default KanbanColumn;
