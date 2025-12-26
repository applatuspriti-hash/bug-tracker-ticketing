import PropTypes from 'prop-types';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Button,
    Box,
    useTheme
} from '@mui/material';
import { IconAlertTriangle } from '@tabler/icons-react';

const DeleteConfirmDialog = ({
    open,
    onClose,
    onConfirm,
    title = 'Confirm Delete',
    message = 'Are you sure you want to delete this item? This action cannot be undone.'
}) => {
    const theme = useTheme();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: '100%',
                    maxWidth: 400,
                    borderRadius: 3
                }
            }}
        >
            <DialogTitle sx={{ py: 2.5, px: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 32,
                            height: 32,
                            borderRadius: 1,
                            bgcolor: theme.palette.error.light,
                            color: theme.palette.error.main
                        }}
                    >
                        <IconAlertTriangle size={20} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        {title}
                    </Typography>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ px: 3, pb: 3 }}>
                <Typography variant="body1" color="textSecondary">
                    {message}
                </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                <Button
                    variant="text"
                    color="inherit"
                    onClick={onClose}
                    sx={{ fontWeight: 600 }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    color="error"
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                    sx={{ fontWeight: 600, px: 3 }}
                >
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
};

DeleteConfirmDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    title: PropTypes.string,
    message: PropTypes.string
};

export default DeleteConfirmDialog;
