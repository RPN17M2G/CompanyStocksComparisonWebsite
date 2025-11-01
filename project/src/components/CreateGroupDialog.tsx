import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
} from '@mui/material';
import { ComparisonGroup, Company } from '../types';

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

  const handleCreate = () => {
    if (!groupName.trim()) return;

    const newGroup: ComparisonGroup = {
      id: `group_${Date.now()}`,
      name: groupName.trim(),
      companyIds: selectedCompanies.map(c => c.id),
      isGroup: true,
    };

    onCreateGroup(newGroup);
    setGroupName('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Comparison Group</DialogTitle>
      <DialogContent>
        <Box mt={2}>
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
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2">{company.ticker}</Typography>
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
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={!groupName.trim()}
        >
          Create Group
        </Button>
      </DialogActions>
    </Dialog>
  );
}
