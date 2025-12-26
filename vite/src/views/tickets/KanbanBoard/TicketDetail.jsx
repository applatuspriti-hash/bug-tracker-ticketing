import PropTypes from 'prop-types';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from 'contexts/AuthContext';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';

// Icons
import { IconX, IconMaximize, IconPlus, IconSettings } from '@tabler/icons-react';
import { uploadFileToS3 } from 'utils/s3Client';

function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} id={`simple-tabpanel-${index}`} aria-labelledby={`simple-tab-${index}`} {...other}>
            {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
        </div>
    );
}

const TicketDetail = ({ open, onClose, ticket, onUpdateStatus, onUpdateTicket, assigneeList, isEdit }) => {
    const { user } = useAuth();
    const [description, setDescription] = useState('');
    const [isDescriptionChanged, setIsDescriptionChanged] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [images, setImages] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Sync state with ticket prop when it opens/changes
    useEffect(() => {
        if (ticket) {
            setDescription(ticket.description || 'No description provided.');
            setImages(ticket.images || []);
            setIsDescriptionChanged(false);
        }
    }, [ticket]);

    const handleImageUpload = async (event) => {
        const selectedFiles = Array.from(event.target.files);
        if (selectedFiles.length === 0) return;

        setIsUploading(true);
        try {
            const uploadedUrls = await Promise.all(selectedFiles.map(file => uploadFileToS3(file)));
            const updatedImages = [...(ticket.images || []), ...uploadedUrls];
            await onUpdateTicket(ticket.id, { images: updatedImages });
            setImages(updatedImages);
            event.target.value = ''; // Reset input
        } catch (error) {
            console.error('Failed to upload attachments:', error);
            alert('Failed to upload some attachments. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveComment = async () => {
        if (!newComment.trim()) return;
        const comment = {
            text: newComment,
            author: user?.displayName || user?.name || user?.email || 'Anonymous',
            timestamp: new Date().toISOString()
        };
        const updatedComments = [...(ticket.comments || []), comment];
        try {
            await onUpdateTicket(ticket.id, { comments: updatedComments });
            setNewComment('');
        } catch (error) {
            console.error('Failed to save comment:', error);
        }
    };

    const handleSaveDescription = async () => {
        try {
            await onUpdateTicket(ticket.id, { description });
            setIsDescriptionChanged(false);
        } catch (error) {
            console.error('Failed to save description:', error);
        }
    };

    const handleDescriptionChange = (e) => {
        setDescription(e.target.value);
        setIsDescriptionChanged(e.target.value !== ticket.description);
    };

    if (!ticket) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown';
        return new Date(dateString).toLocaleString();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"

            scroll="paper"
            sx={{
                '& .MuiDialog-container': {
                    alignItems: 'center', // vertical center
                },
                '& .MuiDialog-paper': {
                    borderRadius: 3,
                    m: 2,
                    maxHeight: '90vh',

                }
            }}
        >

            <DialogTitle sx={{ p: 0 }}>
                {/* Header Toolbar */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" spacing={1} alignItems="center">

                        <Checkbox checked disabled size="small" />
                        <Typography
                            variant="body2"
                            color="textSecondary"
                            sx={{ fontWeight: 500 }}
                        >
                            SMP-{String(ticket.id).slice(-5)}
                        </Typography>

                    </Stack>
                    <Stack direction="row" spacing={1}>
                        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}><IconX size={20} /></IconButton>
                    </Stack>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ p: { xs: 2, md: 3 } }}>

                <Grid container spacing={3}>

                    {/* Left Column: Main Content */}
                    <Grid
                        item
                        xs={12}
                        md={8}
                        sx={{
                            borderRight: { md: '1px solid' },
                            borderColor: { md: 'divider' }
                        }}
                    >
                        <Box
                            sx={{
                                maxWidth: 720,        // 👈 key fix
                                mx: 'auto',           // 👈 centers content
                                px: { xs: 2, md: 3 },
                                py: 3
                            }}
                        >
                            <Typography
                                variant="h3"
                                sx={{
                                    mb: 3,
                                    fontWeight: 700,
                                    lineHeight: 1.3,
                                    wordBreak: 'break-word',
                                    overflowWrap: 'break-word'
                                }}
                            >
                                {ticket.title}
                            </Typography>

                            <Typography variant="h5" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                Description
                            </Typography>

                            <TextField
                                multiline
                                minRows={4}
                                fullWidth
                                variant="outlined"
                                value={description}
                                onChange={handleDescriptionChange}
                                InputProps={{
                                    readOnly: !isEdit,
                                }}
                                sx={{
                                    mb: 2,
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: isEdit ? 'background.paper' : 'grey.50',
                                        borderRadius: 2
                                    }
                                }}
                                placeholder="No description provided."
                            />

                            {isEdit && isDescriptionChanged && (
                                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button variant="contained" size="small" onClick={handleSaveDescription}>
                                        Save Changes
                                    </Button>
                                </Box>
                            )}

                            {isEdit && (
                                <Box sx={{ mb: 3 }}>
                                    <Button
                                        startIcon={isUploading ? <CircularProgress size={16} color="inherit" /> : <IconPlus size={16} />}
                                        size="small"
                                        variant="outlined"
                                        color="secondary"
                                        onClick={() => fileInputRef.current.click()}
                                        disabled={isUploading}
                                    >
                                        {isUploading ? 'Uploading...' : 'Add Attachment'}
                                    </Button>
                                    <input
                                        type="file"
                                        hidden
                                        multiple
                                        ref={fileInputRef}
                                        accept="image/*,video/*"
                                        onChange={handleImageUpload}
                                    />
                                </Box>
                            )}

                            {/* Attachments */}
                            {(images && images.length > 0) && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="h5" sx={{ mb: 2 }}>Attachments ({images.length})</Typography>
                                    <Stack
                                        direction="row"
                                        spacing={2}
                                        sx={{
                                            overflowX: 'auto',
                                            pb: 1,
                                            px: 1
                                        }}
                                    >

                                        {images.map((img, index) => {
                                            const isVideo = img.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || img.includes('video');
                                            return (
                                                <Box
                                                    key={index}
                                                    sx={{
                                                        position: 'relative',
                                                        minWidth: 100,
                                                        width: 100,
                                                        height: 100,
                                                        borderRadius: 2,
                                                        overflow: 'hidden',
                                                        border: '1px solid',
                                                        borderColor: 'divider',
                                                        cursor: 'pointer',
                                                        '&:hover': { opacity: 0.9 }
                                                    }}
                                                    onClick={() => window.open(img, '_blank')}
                                                >
                                                    {isVideo ? (
                                                        <video
                                                            src={img}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        <img
                                                            src={img}
                                                            alt={`attachment-${index}`}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    )}
                                                </Box>
                                            );
                                        })}
                                    </Stack>
                                </Box>
                            )}

                            {/* Comments Section */}
                            <Divider sx={{ my: 4 }} />
                            <Box>
                                <Typography variant="h4" sx={{ mb: 2 }}>Comments</Typography>

                                {/* New Comment Input */}
                                <Box sx={{ mb: 4 }}>
                                    <TextField
                                        multiline
                                        minRows={2}
                                        fullWidth
                                        placeholder="Add a comment..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        sx={{
                                            mb: 1,
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2
                                            }
                                        }}
                                    />
                                    {newComment.trim() && (
                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={handleSaveComment}
                                                color="primary"
                                            >
                                                Save
                                            </Button>
                                            <Button
                                                variant="text"
                                                size="small"
                                                onClick={() => setNewComment('')}
                                                color="inherit"
                                            >
                                                Cancel
                                            </Button>
                                        </Stack>
                                    )}
                                </Box>

                                {/* Comments List */}
                                <Stack spacing={3}>
                                    {(ticket.comments || []).slice().reverse().map((comment, index) => (
                                        <Box key={index} sx={{ display: 'flex', gap: 2 }}>
                                            <Avatar
                                                sx={{ width: 32, height: 32, fontSize: '0.875rem' }}
                                                src={comment.authorAvatar}
                                            >
                                                {comment.author?.charAt(0).toUpperCase()}
                                            </Avatar>
                                            <Box sx={{ flex: 1 }}>
                                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                        {comment.author}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {formatDate(comment.timestamp)}
                                                    </Typography>
                                                </Stack>
                                                <Typography variant="body2" sx={{ color: 'text.primary', whiteSpace: 'pre-wrap' }}>
                                                    {comment.text}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                    {(!ticket.comments || ticket.comments.length === 0) && (
                                        <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                                            No comments yet.
                                        </Typography>
                                    )}
                                </Stack>
                            </Box>
                        </Box>
                    </Grid>

                    {/* Right Column: Details Sidebar */}
                    <Grid
                        item
                        xs={12}
                        md={4}
                        sx={{
                            p: 3,
                            bgcolor: 'grey.50',
                            borderRadius: { md: '0 12px 12px 0' }
                        }}
                    >

                        <Box sx={{ mb: 3 }}>
                            <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1, textTransform: 'uppercase', fontWeight: 600 }}>Status</Typography>
                            <Select
                                value={ticket.status}
                                onChange={(e) => onUpdateStatus(ticket.id, e.target.value)}
                                fullWidth
                                size="small"
                                sx={{ bgcolor: 'background.paper', fontWeight: 500 }}
                            >
                                <MenuItem value="todo">To Do</MenuItem>
                                <MenuItem value="inprogress">In Progress</MenuItem>
                                <MenuItem value="fixed">Fixed</MenuItem>
                                <MenuItem value="blocked">Blocked</MenuItem>
                                <MenuItem value="deployed">Deployed</MenuItem>
                            </Select>
                        </Box>

                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h4">Details</Typography>
                                <IconSettings size={18} color="gray" />
                            </Box>

                            <Stack spacing={2.5}>
                                <Box>
                                    <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 0.5 }}>Assignee</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Avatar src={ticket.assigneeAvatar} sx={{ width: 28, height: 28 }} />
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{ticket.assigneeName || 'Unassigned'}</Typography>
                                    </Box>
                                </Box>

                                <Divider />

                                <Box>
                                    <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 0.5 }}>Reporter</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Avatar src={ticket.reporterAvatar} sx={{ width: 28, height: 28 }}>
                                            {ticket.reporterName ? ticket.reporterName.charAt(0) : 'R'}
                                        </Avatar>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{ticket.reporterName || 'System'}</Typography>
                                    </Box>
                                </Box>
                            </Stack>
                        </Box>

                        <Box sx={{ mt: 4 }}>
                            <Stack spacing={1}>
                                <Typography variant="caption" color="textSecondary">Created: {formatDate(ticket.createdAt)}</Typography>
                                <Typography variant="caption" color="textSecondary">Updated: {formatDate(ticket.updatedAt)}</Typography>
                            </Stack>
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );
};

TicketDetail.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    ticket: PropTypes.object,
    onUpdateStatus: PropTypes.func.isRequired,
    onUpdateTicket: PropTypes.func.isRequired,
    assigneeList: PropTypes.array,
    isEdit: PropTypes.bool
};

export default TicketDetail;
