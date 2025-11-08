import { useState, useCallback } from 'react'; 
import {
  Button,
  TextField,
  Box,
  Typography,
  Theme, 
} from '@mui/material';
import { ComparisonGroup, Company } from '../../shared/types/types';
import { GlassDialog } from '../../shared/ui/GlassDialog';

interface CreateGroupDialogProps {
  open: boolean;
  selectedCompanies: Company[];
  onClose: () => void;
  onCreateGroup: (group: ComparisonGroup) => void;
}

export function CreateGroupDialog({
  open,
  selectedCompanies,
  onClose,
  onCreateGroup,
}: CreateGroupDialogProps) {
  const [groupName, setGroupName] = useState('');

  const handleClose = useCallback(() => {
    setGroupName('');
    onClose();
  }, [onClose]);

  const handleCreate = useCallback(() => {
    const trimmedName = groupName.trim();
    if (!trimmedName) return;

    const newGroup: ComparisonGroup = {
      id: `group_${crypto.randomUUID()}`, 
      name: trimmedName,
      companyIds: selectedCompanies.map(c => c.id),
      isGroup: true,
    };

    onCreateGroup(newGroup);
    handleClose(); 
  }, [groupName, selectedCompanies, onCreateGroup, handleClose]);

  return (
    <GlassDialog
      open={open}
      onClose={handleClose}
      title="Create Comparison Group"
      maxWidth="sm"
      fullWidth
      actions={
        <>
          <Button onClick={handleClose} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={!groupName.trim()}
            sx={{ borderRadius: 2 }}
          >
            Create Group
          </Button>
        </>
      }
    >
      <Typography variant="body2" color="text.secondary" mb={2}>
        Selected companies ({selectedCompanies.length}):
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
        {selectedCompanies.map(company => (
          <Box
            key={company.id}
            sx={{
              px: 2,
              py: 0.5,
              backgroundColor: (theme: Theme) => 
                theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.6)' : 'rgba(37, 99, 235, 0.2)',
              backdropFilter: 'blur(5px)',
              color: 'primary.main',
              fontWeight: 'medium',
              borderRadius: 2, 
              border: '1px solid',
              borderColor: 'primary.main',
            }}
          >
            <Typography variant="body2" fontWeight="500" color="text.primary">
              {company.ticker}
            </Typography>
          </Box>
        ))}
      </Box>
      <TextField
        fullWidth
        label="Group Name"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
        placeholder="e.g., Big Tech Peers"
        autoFocus
      />
    </GlassDialog>
  );
}
