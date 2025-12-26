import { useState } from 'react';

// material-ui
import Typography from '@mui/material/Typography';
import { Box, Card, CardContent, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, IconButton, Tooltip, Stack, Chip, Menu, MenuItem, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';

import { useData } from 'contexts/DataContext';
// project imports
import MainCard from 'ui-component/cards/MainCard';
import { useAuth } from 'contexts/AuthContext';
import GlobalPagination from 'ui-component/extended/GlobalPagination';
import usePagination from 'hooks/usePagination';
import useFirestoreQuery from 'hooks/useFirestoreQuery';
import { useToast } from 'contexts/ToastContext';
import DeleteConfirmDialog from 'ui-component/extended/DeleteConfirmDialog';

export default function UserList() {
    // Note: 'users' from useData is ignored in favor of server-side fetch
    const { createUser, updateUser, deleteUser } = useData();
    const { isAdmin } = useAuth();
    const theme = useTheme();
    const isMobileView = useMediaQuery(theme.breakpoints.down('md'));

    // Pagination
    const { page, limit, handleChangePage, handleChangeRowsPerPage } = usePagination();
    const { data: users, totalCount, loading, error, refresh } = useFirestoreQuery('users', {
        page,
        limit,
        orderByField: 'createdAt',
        orderDirection: 'desc'
    });

    const { showToast } = useToast();

    const [open, setOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user' });

    // Delete confirm dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    // Menu state for mobile
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(null);

    const handleMenuOpen = (event, user) => {
        setAnchorEl(event.currentTarget);
        setSelectedUserId(user);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedUserId(null);
    };

    if (!isAdmin) {
        return (
            <MainCard title="User Management">
                <Typography variant="h3" color="error">Access Denied</Typography>
                <Typography>You do not have permission to view this page.</Typography>
            </MainCard>
        );
    }

    const handleOpenCreate = () => {
        setEditingUser(null);
        setFormData({ name: '', email: '', password: '', role: 'user' });
        setOpen(true);
    };

    const handleOpenEdit = (user) => {
        setEditingUser(user);
        setFormData({ name: user.name, email: user.email, password: '', role: user.role || 'user' }); // Password blank for edit
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleSubmit = async () => {
        if (formData.name && formData.email) {
            try {
                if (editingUser) {
                    await updateUser(editingUser.id, {
                        name: formData.name,
                        email: formData.email,
                        role: formData.role
                    });
                    showToast('User updated successfully');
                } else {
                    if (!formData.password) return; // Password required for create
                    await createUser(formData);
                    showToast('User created successfully');
                }
                refresh(); // Refresh list
                handleClose();
            } catch (error) {
                console.error(error);
                showToast('Action failed', 'error');
            }
        }
    };

    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (userToDelete) {
            try {
                await deleteUser(userToDelete.id);
                showToast('User deleted successfully');
                refresh(); // Refresh list
            } catch (error) {
                console.error(error);
                showToast('Delete failed', 'error');
            }
        }
    };

    const handleMobileEdit = () => {
        if (selectedUserId) handleOpenEdit(selectedUserId);
        handleMenuClose();
    };

    const handleMobileDelete = () => {
        if (selectedUserId) handleDeleteClick(selectedUserId);
        handleMenuClose();
    };

    return (
        <MainCard title="User Management" secondary={
            <Button variant="contained" onClick={handleOpenCreate}>Add User</Button>
        }>
            {isMobileView ? (
                <Stack spacing={2}>
                    {users.map((user) => (
                        <Card key={user.id} variant="outlined">
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                    <Box>
                                        <Typography variant="h4" gutterBottom>{user.name}</Typography>
                                        <Typography variant="body2" color="textSecondary" gutterBottom>{user.email}</Typography>
                                        <Chip label={user.role} size="small" color={user.role === 'admin' ? 'primary' : 'default'} />
                                    </Box>
                                    <IconButton onClick={(e) => handleMenuOpen(e, user)}>
                                        <MoreVertIcon />
                                    </IconButton>
                                </Stack>
                            </CardContent>
                        </Card>
                    ))}
                </Stack>
            ) : (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.role}</TableCell>
                                    <TableCell align="right">
                                        <IconButton onClick={(e) => handleMenuOpen(e, user)}>
                                            <MoreVertIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <GlobalPagination
                count={totalCount}
                page={page}
                rowsPerPage={limit}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleMobileEdit}>
                    <EditIcon fontSize="small" />
                </MenuItem>
                <MenuItem onClick={handleMobileDelete}>
                    <DeleteIcon fontSize="small" color="error" />
                </MenuItem>
            </Menu>

            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth label="Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth label="Email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={!!editingUser} // Cannot change email usually in simple implementations
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth label={editingUser ? "New Password (Optional)" : "Password"} type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                helperText={editingUser ? "Leave blank to keep current password" : ""}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">{editingUser ? 'Update' : 'Create'}</Button>
                </DialogActions>
            </Dialog>

            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete User"
                message={`Are you sure you want to delete user "${userToDelete?.name}"?`}
            />
        </MainCard>
    );
}
