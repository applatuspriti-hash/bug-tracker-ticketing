import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// material-ui
import {
    Button,
    TextField,
    Grid,
    MenuItem,
    Stack,
    Box,
    Typography
} from '@mui/material';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import { useData } from 'contexts/DataContext';
import { uploadImage } from 'services/firebase';
import { useAuth } from 'contexts/AuthContext';

export default function TicketCreate() {
    const { users, createTicket, superBoards } = useData();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assigneeId, setAssigneeId] = useState('');
    const [superBoardId, setSuperBoardId] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    // Auto select if only one board
    useEffect(() => {
        if (superBoards.length === 1 && !superBoardId) {
            setSuperBoardId(superBoards[0].id);
        }
    }, [superBoards, superBoardId]);

    const handleCreate = async () => {
        if (!title || !assigneeId || !superBoardId) return;

        let imageUrl = '';
        if (imageFile) {
            try {
                imageUrl = await uploadImage(imageFile);
            } catch (err) {
                alert('Image upload failed, ticket will be created without image');
            }
        }

        await createTicket({
            title,
            description,
            assigneeId,
            superBoardId,
            reporterId: user?.uid || 'unknown',
            role: 'user',
            images: imageUrl ? [imageUrl] : [],
            status: 'todo',
            priority: 'medium'
        });

        navigate('/tickets/board');
    };

    return (
        <MainCard title="Create Ticket">
            <Grid container spacing={3}>
                {/* Title */}
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Ticket Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Eg: Login issue on mobile"
                        InputLabelProps={{ shrink: true }} ss
                    />
                </Grid>

                {/* Description */}


                {/* Super Board */}
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        size="small"
                        select
                        label="Super Board"
                        value={superBoardId}
                        onChange={(e) => setSuperBoardId(e.target.value)}
                        required
                        InputLabelProps={{ shrink: true }}
                    >
                        <MenuItem value="" disabled>
                            Select Super Board
                        </MenuItem>
                        {superBoards.map((board) => (
                            <MenuItem key={board.id} value={board.id}>
                                {board.name}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>

                {/* Assignee */}
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        size="small"
                        select
                        label="Assign To"
                        value={assigneeId}
                        onChange={(e) => setAssigneeId(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    >
                        <MenuItem value="" disabled>
                            Select User
                        </MenuItem>
                        {users
                            .filter((u) => u.role !== 'admin')
                            .map((u) => (
                                <MenuItem key={u.id} value={u.id}>
                                    {u.name}
                                </MenuItem>
                            ))}
                    </TextField>
                </Grid>

                {/* Image Upload */}
                <Grid item xs={12}>
                    <Stack spacing={1}>
                        <Button variant="outlined" component="label" size="small">
                            Upload Image
                            <input hidden type="file" accept="image/*" onChange={handleImageChange} />
                        </Button>

                        {imageFile && (
                            <Typography variant="caption" color="text.secondary">
                                {imageFile.name}
                            </Typography>
                        )}

                        {imagePreview && (
                            <Box
                                component="img"
                                src={imagePreview}
                                sx={{
                                    mt: 1,
                                    height: 150,
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: 'divider'
                                }}
                            />
                        )}
                    </Stack>
                </Grid>

                {/* Actions */}
                <Grid item xs={12}>
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button onClick={() => navigate('/tickets/board')} color="inherit">
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleCreate}
                            disabled={!title || !assigneeId || !superBoardId}
                        >
                            Create Ticket
                        </Button>
                    </Stack>
                </Grid>
            </Grid>
        </MainCard>
    );
}
