import PropTypes from 'prop-types';
import { useState, useRef, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
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
import { IconX, IconMaximize, IconPlus, IconSettings, IconShare } from '@tabler/icons-react';
import { uploadFileToS3 } from 'utils/s3Client';
import { useToast } from 'contexts/ToastContext';

const quillModules = {
    toolbar: [
        ['bold', 'italic', 'underline', 'strike', 'code'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote', 'code-block'],
        // ['link'],
        ['clean']
    ]
};

const quillFormats = [
    'bold', 'italic', 'underline', 'strike', 'code',
    'list', 'bullet',
    'blockquote', 'code-block'
    // 'link'
];

function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} id={`simple-tabpanel-${index}`} aria-labelledby={`simple-tab-${index}`} {...other}>
            {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
        </div>
    );
}

const TicketDetail = ({ open, onClose, ticket, onUpdateStatus, onUpdateTicket, assigneeList, isEdit, isAdmin }) => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assigneeId, setAssigneeId] = useState('');
    const [priority, setPriority] = useState('medium');
    const [type, setType] = useState('bug');
    const [isDescriptionChanged, setIsDescriptionChanged] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [images, setImages] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [commentFiles, setCommentFiles] = useState([]);
    const [commentPreviews, setCommentPreviews] = useState([]);
    const [isCommenting, setIsCommenting] = useState(false);
    const [spendTime, setSpendTime] = useState('');
    const fileInputRef = useRef(null);
    const commentFileInputRef = useRef(null);
    const { showToast } = useToast();



    console.log("ticket", ticket)

    const handleShare = () => {
        const url = new URL(window.location.href);
        url.searchParams.set('ticketId', ticket.id);
        navigator.clipboard.writeText(url.toString()).then(() => {
            showToast('Direct link copied to clipboard!', 'success');
        });
    };

    // Sync state with ticket prop when it opens/changes
    useEffect(() => {
        if (ticket) {
            setTitle(ticket.title || '');
            setDescription(ticket.description || '');
            setAssigneeId(ticket.assigneeId || '');
            setPriority(ticket.priority || 'medium');
            setType(ticket.type || 'bug');
            setImages(ticket.images || []);
            setSpendTime(ticket.spendTime || '');
            setIsDescriptionChanged(false);
        }
    }, [ticket]);

    const handleTitleBlur = async () => {
        if (ticket && title !== ticket.title) {
            try {
                await onUpdateTicket(ticket.id, { title });
            } catch (error) {
                console.error('Failed to update title:', error);
            }
        }
    };

    const handleAssigneeChange = async (newAssigneeId) => {
        setAssigneeId(newAssigneeId);
        try {
            await onUpdateTicket(ticket.id, { assigneeId: newAssigneeId });
        } catch (error) {
            console.error('Failed to update assignee:', error);
        }
    };

    const handlePriorityChange = async (newPriority) => {
        setPriority(newPriority);
        try {
            await onUpdateTicket(ticket.id, { priority: newPriority });
        } catch (error) {
            console.error('Failed to update priority:', error);
        }
    };

    const handleTypeChange = async (newType) => {
        setType(newType);
        try {
            await onUpdateTicket(ticket.id, { type: newType });
        } catch (error) {
            console.error('Failed to update ticket type:', error);
        }
    };

    const handleSpendTimeChange = async (newTime) => {
        setSpendTime(newTime);
        try {
            await onUpdateTicket(ticket.id, { spendTime: newTime });
        } catch (error) {
            console.error('Failed to update spend time:', error);
        }
    };

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

    const handleCommentFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) return;

        setCommentFiles((prev) => [...prev, ...selectedFiles]);

        selectedFiles.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCommentPreviews((prev) => [
                    ...prev,
                    {
                        url: reader.result,
                        type: file.type.startsWith('video/') ? 'video' : 'image',
                        name: file.name
                    }
                ]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeCommentFile = (index) => {
        setCommentFiles((prev) => prev.filter((_, i) => i !== index));
        setCommentPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSaveComment = async () => {
        const isCommentEmpty = !newComment || newComment === '<p><br></p>' || newComment.trim() === '';
        if (isCommentEmpty && commentFiles.length === 0) return;

        setIsCommenting(true);
        try {
            let commentAttachmentUrls = [];
            if (commentFiles.length > 0) {
                commentAttachmentUrls = await Promise.all(commentFiles.map(file => uploadFileToS3(file)));
            }

            const comment = {
                text: newComment,
                author: user?.displayName || user?.name || user?.email || 'Anonymous',
                timestamp: new Date().toISOString(),
                attachments: commentAttachmentUrls
            };
            const updatedComments = [...(ticket.comments || []), comment];
            await onUpdateTicket(ticket.id, { comments: updatedComments });
            setNewComment('');
            setCommentFiles([]);
            setCommentPreviews([]);
        } catch (error) {
            console.error('Failed to save comment:', error);
            alert('Failed to save comment or upload attachments.');
        } finally {
            setIsCommenting(false);
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

    const handleDescriptionChange = (content) => {
        setDescription(content);
        // Normalize empty Quill content to empty string for comparison
        const isCurrentlyEmpty = content === '<p><br></p>' || content === '';
        const wasEmpty = !ticket.description || ticket.description === '<p><br></p>' || ticket.description === '';

        if (isCurrentlyEmpty && wasEmpty) {
            setIsDescriptionChanged(false);
        } else {
            setIsDescriptionChanged(content !== (ticket.description || ''));
        }
    };

    if (!ticket) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown';
        return new Date(dateString).toLocaleString();
    };

    return (
        <Dialog
            open={open}
            // onClose={onClose}
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
                        <IconButton size="small" onClick={handleShare} sx={{ color: 'primary.main' }} title="Share ticket link">
                            <IconShare size={20} />
                        </IconButton>
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
                            <TextField
                                fullWidth
                                multiline
                                variant="standard"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={handleTitleBlur}
                                InputProps={{
                                    readOnly: !isEdit,
                                    disableUnderline: !isEdit,
                                    style: { fontSize: '1.5rem', fontWeight: 700 }
                                }}
                                sx={{ mb: 3 }}
                            />

                            <Typography variant="h5" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                Description
                            </Typography>

                            <Box sx={{
                                mb: 2,
                                '& .quill': {
                                    bgcolor: isEdit ? 'background.paper' : 'grey.50',
                                    borderRadius: 2,
                                    border: isEdit ? '1px solid' : 'none',
                                    borderColor: 'divider',
                                    overflow: 'hidden'
                                },
                                '& .ql-toolbar': {
                                    display: isEdit ? 'block' : 'none',
                                    border: 'none',
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: 'grey.50'
                                },
                                '& .ql-container': {
                                    border: 'none',
                                    minHeight: isEdit ? '150px' : 'auto',
                                    fontSize: '0.95rem',
                                    fontFamily: 'inherit'
                                },
                                '& .ql-editor': {
                                    minHeight: isEdit ? '150px' : 'auto',
                                    p: isEdit ? 2 : 0,
                                    color: 'text.primary'
                                }
                            }}>
                                <ReactQuill
                                    theme="snow"
                                    value={description}
                                    onChange={handleDescriptionChange}
                                    modules={quillModules}
                                    formats={quillFormats}
                                    readOnly={!isEdit}
                                    placeholder="No description provided."
                                />
                            </Box>

                            {isEdit && isDescriptionChanged && (
                                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        size="medium"
                                        onClick={handleSaveDescription}
                                        sx={{ borderRadius: 2, px: 3 }}
                                    >
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
                                    <Box sx={{
                                        mb: 1,
                                        '& .quill': {
                                            bgcolor: 'background.paper',
                                            borderRadius: 2,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            overflow: 'hidden'
                                        },
                                        '& .ql-toolbar': {
                                            border: 'none',
                                            borderBottom: '1px solid',
                                            borderColor: 'divider',
                                            bgcolor: 'grey.50'
                                        },
                                        '& .ql-container': {
                                            border: 'none',
                                            minHeight: '100px',
                                            fontSize: '0.9rem'
                                        },
                                        '& .ql-editor': {
                                            minHeight: '100px'
                                        }
                                    }}>
                                        <ReactQuill
                                            theme="snow"
                                            value={newComment}
                                            onChange={setNewComment}
                                            modules={quillModules}
                                            formats={quillFormats}
                                            placeholder="Add a comment..."
                                            readOnly={isCommenting}
                                        />
                                    </Box>

                                    {/* Comment Attachments Preview */}
                                    {commentPreviews.length > 0 && (
                                        <Grid container spacing={1} sx={{ mb: 2 }}>
                                            {commentPreviews.map((preview, index) => (
                                                <Grid item key={index}>
                                                    <Box sx={{ position: 'relative', width: 60, height: 60, borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                                                        {preview.type === 'image' ? (
                                                            <img src={preview.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <video src={preview.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        )}
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => removeCommentFile(index)}
                                                            sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', p: 0.2, '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
                                                        >
                                                            <IconX size={12} />
                                                        </IconButton>
                                                    </Box>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    )}

                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={handleSaveComment}
                                            color="primary"
                                            disabled={isCommenting || (!newComment.trim() && commentFiles.length === 0)}
                                            startIcon={isCommenting ? <CircularProgress size={16} color="inherit" /> : null}
                                        >
                                            {isCommenting ? 'Posting...' : 'Save'}
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            color="secondary"
                                            onClick={() => commentFileInputRef.current.click()}
                                            disabled={isCommenting}
                                            startIcon={<IconPlus size={16} />}
                                        >
                                            Attach
                                        </Button>
                                        {(newComment.trim() || commentFiles.length > 0) && !isCommenting && (
                                            <Button
                                                variant="text"
                                                size="small"
                                                onClick={() => {
                                                    setNewComment('');
                                                    setCommentFiles([]);
                                                    setCommentPreviews([]);
                                                }}
                                                color="inherit"
                                            >
                                                Cancel
                                            </Button>
                                        )}
                                        <input
                                            type="file"
                                            hidden
                                            multiple
                                            ref={commentFileInputRef}
                                            accept="image/*,video/*"
                                            onChange={handleCommentFileChange}
                                        />
                                    </Stack>
                                </Box>

                                {/* Comments List */}
                                <Stack spacing={3}>
                                    {(ticket.comments || []).slice().reverse().map((comment, index) => (
                                        <Box key={index} sx={{ display: 'flex', gap: 2 }}>
                                            <Avatar
                                                sx={{ width: 32, height: 32, fontSize: '0.875rem' }}
                                                src={comment.authorAvatar}
                                            >
                                                {comment.author ? comment.author.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'A'}
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
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: 'text.primary',
                                                        mb: comment.attachments?.length > 0 ? 1 : 0,
                                                        '& p': { m: 0 }
                                                    }}
                                                    dangerouslySetInnerHTML={{ __html: comment.text }}
                                                />
                                                {comment.attachments && comment.attachments.length > 0 && (
                                                    <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
                                                        {comment.attachments.map((att, attIndex) => {
                                                            const isVideo = att.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || att.includes('video');
                                                            return (
                                                                <Box
                                                                    key={attIndex}
                                                                    sx={{
                                                                        width: 80,
                                                                        height: 80,
                                                                        borderRadius: 1,
                                                                        overflow: 'hidden',
                                                                        border: '1px solid',
                                                                        borderColor: 'divider',
                                                                        cursor: 'pointer',
                                                                        flexShrink: 0
                                                                    }}
                                                                    onClick={() => window.open(att, '_blank')}
                                                                >
                                                                    {isVideo ? (
                                                                        <video src={att} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                    ) : (
                                                                        <img src={att} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                    )}
                                                                </Box>
                                                            );
                                                        })}
                                                    </Stack>
                                                )}
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
                                {isAdmin && <MenuItem value="complete">Complete</MenuItem>}
                                {isAdmin && <MenuItem value="deleted">Deleted</MenuItem>}
                            </Select>
                        </Box>

                        <Box sx={{ mb: 3 }}>
                            <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1, textTransform: 'uppercase', fontWeight: 600 }}>Priority</Typography>
                            <Select
                                value={priority}
                                onChange={(e) => handlePriorityChange(e.target.value)}
                                fullWidth
                                size="small"
                                sx={{ bgcolor: 'background.paper', fontWeight: 500 }}
                            >
                                <MenuItem value="high">High</MenuItem>
                                <MenuItem value="medium">Medium</MenuItem>
                                <MenuItem value="low">Low</MenuItem>
                            </Select>
                        </Box>

                        <Box sx={{ mb: 3 }}>
                            <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1, textTransform: 'uppercase', fontWeight: 600 }}>Ticket Type</Typography>
                            <Select
                                value={type}
                                onChange={(e) => handleTypeChange(e.target.value)}
                                fullWidth
                                size="small"
                                sx={{ bgcolor: 'background.paper', fontWeight: 500 }}
                            >
                                <MenuItem value="bug">Bug</MenuItem>
                                <MenuItem value="feature">Feature</MenuItem>
                            </Select>
                        </Box>

                        <Box sx={{ mb: 3 }}>
                            <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1, textTransform: 'uppercase', fontWeight: 600 }}>Spend Time</Typography>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Eg: 1.5 or 2"
                                value={spendTime}
                                onChange={(e) => setSpendTime(e.target.value)}
                                onBlur={(e) => handleSpendTimeChange(e.target.value)}
                                InputProps={{
                                    sx: { bgcolor: 'background.paper', fontWeight: 500 }
                                }}
                            />
                        </Box>

                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h4">Details</Typography>
                                <IconSettings size={18} color="gray" />
                            </Box>

                            <Stack spacing={2.5}>
                                <Box>
                                    <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 0.5 }}>Assignee</Typography>
                                    <Select
                                        value={assigneeId}
                                        onChange={(e) => handleAssigneeChange(e.target.value)}
                                        fullWidth
                                        size="small"
                                        variant="standard"
                                        disableUnderline
                                        sx={{
                                            fontWeight: 500,
                                            '& .MuiSelect-select': { display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }
                                        }}
                                    >
                                        {assigneeList && assigneeList.map((u) => (
                                            <MenuItem key={u.id} value={u.id}>
                                                <Avatar src={u.avatar} sx={{ width: 24, height: 24, mr: 1 }} />
                                                {u.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </Box>

                                <Divider />

                                <Box>
                                    <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 0.5 }}>Reporter</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Avatar src={ticket.reporterAvatar} sx={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                                            {ticket.reporterName ? ticket.reporterName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'A'}
                                        </Avatar>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{ticket.reporterName || 'Admin'}</Typography>
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
    isEdit: PropTypes.bool,
    isAdmin: PropTypes.bool
};

export default TicketDetail;
