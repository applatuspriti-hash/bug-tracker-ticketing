import { useState, useEffect } from 'react';
import {
    Button,
    TextField,
    Grid,
    MenuItem,
    Stack,
    Box,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    useMediaQuery,
    useTheme,
    CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import { useData } from 'contexts/DataContext';
import { uploadFileToS3 } from 'utils/s3Client'; // Changed from firebase
import { useAuth } from 'contexts/AuthContext';

export default function TicketCreateDialog({ open, onClose }) {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const { users, createTicket, superBoards } = useData();
    const { user } = useAuth();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assigneeId, setAssigneeId] = useState('');
    const [superBoardId, setSuperBoardId] = useState('');
    const [files, setFiles] = useState([]); // Array of File objects
    const [previews, setPreviews] = useState([]); // Array of { url, type }
    const [isUploading, setIsUploading] = useState(false); // New loading state
    const [priority, setPriority] = useState('medium'); // Added priority state

    // Filter users based on selected super board
    const filteredUsers = users.filter(u => {
        if (u.role === 'admin') return false;
        if (!superBoardId) return true;
        const selectedBoard = superBoards.find(b => b.id === superBoardId);
        // If board has specific assigned users, filter by them
        if (selectedBoard && selectedBoard.assignedUsers && Array.isArray(selectedBoard.assignedUsers) && selectedBoard.assignedUsers.length > 0) {
            return selectedBoard.assignedUsers.includes(u.id);
        }
        return true;
    });

    useEffect(() => {
        if (open) {
            // Reset form when dialog opens  priti
            setTitle('');
            setDescription('');
            setAssigneeId('');
            setPriority('medium'); // Reset priority
            setFiles([]);
            setPreviews([]);
            setIsUploading(false);
            // Auto-select board if only one
            if (superBoards.length === 1) {
                setSuperBoardId(superBoards[0].id);
            } else {
                setSuperBoardId('');
            }
        }
    }, [open, superBoards]);

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) return;

        setFiles((prev) => [...prev, ...selectedFiles]);

        selectedFiles.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews((prev) => [
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

    const removeFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
        setPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleCreate = async () => {
        if (!title || !assigneeId || !superBoardId) return;

        setIsUploading(true);
        let attachmentUrls = [];
        if (files.length > 0) {
            try {
                // Upload all to S3
                attachmentUrls = await Promise.all(files.map(file => uploadFileToS3(file)));
            } catch (err) {
                console.error("Upload failed", err);
                alert('Media upload failed. Please check your console/network or try again. Ticket will NOT be created.');
                setIsUploading(false);
                return; // Stop creation if upload fails
            }
        }

        await createTicket({
            title,
            description,
            assigneeId,
            superBoardId,
            reporterId: user?.uid || 'unknown',
            role: 'user',
            images: attachmentUrls, // This now stores images and videos
            status: 'todo',
            priority: priority // Use selected priority
        });

        setIsUploading(false);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={!isUploading ? onClose : undefined} // Prevent closing while uploading
            maxWidth="md"
            fullWidth
            fullScreen={fullScreen}
        >
            <DialogTitle sx={{ m: 0, p: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="h4">Create  Ticket</Typography>
                    <IconButton
                        aria-label="close"
                        onClick={onClose}
                        disabled={isUploading}
                        sx={{
                            color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Stack>
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={3}>
                    {/* Title */}
                    <TextField
                        fullWidth
                        size="small"
                        label="Ticket Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Eg: Login issue on mobile"
                        InputLabelProps={{ shrink: true }}
                        disabled={isUploading}
                    />

                    {/* Description */}
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the issue clearly..."
                        InputLabelProps={{ shrink: true }}
                        disabled={isUploading}
                    />

                    {/* Super Board */}
                    <TextField
                        fullWidth
                        size="small"
                        select
                        label="Super Board"
                        value={superBoardId}
                        onChange={(e) => {
                            setSuperBoardId(e.target.value);
                            setAssigneeId(''); // Reset assignee when board changes
                        }}
                        required
                        InputLabelProps={{ shrink: true }}
                        disabled={isUploading}
                    >
                        <MenuItem value="" disabled>Select Board</MenuItem>
                        {superBoards.map((board) => (
                            <MenuItem key={board.id} value={board.id}>
                                {board.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Assignee */}
                    <TextField
                        fullWidth
                        size="small"
                        select
                        label="Assign To"
                        value={assigneeId}
                        onChange={(e) => setAssigneeId(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        disabled={isUploading}
                    >
                        <MenuItem value="" disabled>Select User</MenuItem>
                        {filteredUsers.map((u) => (
                            <MenuItem key={u.id} value={u.id}>
                                {u.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Priority/Status Dropdown */}
                    <TextField
                        fullWidth
                        size="small"
                        select
                        label="Priority"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        disabled={isUploading}
                    >
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="low">Low</MenuItem>
                    </TextField>

                    {/* Media Upload */}
                    <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle1">Attachments</Typography>
                            <Button variant="outlined" component="label" size="small" disabled={isUploading}>
                                Upload Media
                                <input hidden type="file" multiple accept="image/*,video/*" onChange={handleFileChange} />
                            </Button>
                        </Stack>

                        {previews.length > 0 && (
                            <Grid container spacing={2}>
                                {previews.map((preview, index) => (
                                    <Grid item xs={4} sm={3} key={index}>
                                        <Box
                                            sx={{
                                                position: 'relative',
                                                height: 100,
                                                borderRadius: 1,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                overflow: 'hidden',
                                                bgcolor: 'background.default'
                                            }}
                                        >
                                            {preview.type === 'image' ? (
                                                <Box
                                                    component="img"
                                                    src={preview.url}
                                                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <Box
                                                    component="video"
                                                    src={preview.url}
                                                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            )}
                                            <IconButton
                                                size="small"
                                                onClick={() => removeFile(index)}
                                                disabled={isUploading}
                                                sx={{
                                                    position: 'absolute',
                                                    top: 2,
                                                    right: 2,
                                                    bgcolor: 'rgba(0,0,0,0.5)',
                                                    color: 'white',
                                                    '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                                                }}
                                            >
                                                <CloseIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Stack>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
                <Button onClick={onClose} variant="outlined" color="error" disabled={isUploading}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleCreate}
                    disabled={!title || !assigneeId || !superBoardId || isUploading}
                    startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    {isUploading ? 'Uploading...' : 'Create Ticket'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
