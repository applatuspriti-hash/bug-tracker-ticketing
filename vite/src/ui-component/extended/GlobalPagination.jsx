import PropTypes from 'prop-types';
import { TablePagination, Box } from '@mui/material';

/**
 * GlobalPagination Component
 * 
 * Reusable pagination component based on MUI TablePagination.
 * 
 * @param {number} count - Total number of items
 * @param {number} page - Current page (0-indexed)
 * @param {number} rowsPerPage - Number of items per page
 * @param {function} onPageChange - Callback when page changes (event, newPage)
 * @param {function} onRowsPerPageChange - Callback when rows per page changes
 * @param {Array} rowsPerPageOptions - Options for rows per page
 */
const GlobalPagination = ({
    count = 0,
    page = 0,
    rowsPerPage = 10,
    onPageChange,
    onRowsPerPageChange,
    rowsPerPageOptions = [5, 10, 25, 50],
    ...others
}) => {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2, ...others.sx }}>
            <TablePagination
                component="div"
                count={count}
                page={page}
                onPageChange={onPageChange}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={onRowsPerPageChange}
                rowsPerPageOptions={rowsPerPageOptions}
                labelRowsPerPage="Rows per page:"
                showFirstButton
                showLastButton
            />
        </Box>
    );
};

GlobalPagination.propTypes = {
    count: PropTypes.number,
    page: PropTypes.number,
    rowsPerPage: PropTypes.number,
    onPageChange: PropTypes.func.isRequired,
    onRowsPerPageChange: PropTypes.func.isRequired,
    rowsPerPageOptions: PropTypes.array
};

export default GlobalPagination;
