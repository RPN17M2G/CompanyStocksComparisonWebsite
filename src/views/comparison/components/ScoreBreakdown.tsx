/**
 * Score Breakdown Component
 * Shows transparent calculation breakdown for each company's score
 */
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Theme,
  LinearProgress,
} from '@mui/material';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { GlassPaper } from '../../../shared/ui/GlassPaper';
import { ItemScore } from '../../../engine/scoreCalculator';
import { scrollbarStyles } from '../../../app/theme/theme';

interface ScoreBreakdownProps {
  score: ItemScore & {
    categoryScores?: Array<{
      category: string;
      score: number;
      weight: number;
      metrics: Array<{
        metricId: string;
        metricName: string;
        score: number;
        weight: number;
        value: number | null;
        contribution: number;
      }>;
    }>;
    calculationBreakdown?: string;
  };
  expanded?: boolean;
  onToggleExpand?: () => void;
}

export function ScoreBreakdown({ score, expanded: controlledExpanded, onToggleExpand }: ScoreBreakdownProps) {
  const [internalExpanded, setInternalExpanded] = useState(true); // Default to expanded when used in card
  const expanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const handleToggle = onToggleExpand || (() => setInternalExpanded(!internalExpanded));
  const showHeader = controlledExpanded === undefined && onToggleExpand === undefined; // Only show header if not controlled

  const hasCategoryScores = score.categoryScores && score.categoryScores.length > 0;

  return (
    <Box sx={{ mt: 2 }}>
      {showHeader && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            p: 1,
            borderRadius: 1,
            '&:hover': {
              backgroundColor: (theme: Theme) =>
                theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            },
          }}
          onClick={handleToggle}
        >
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleToggle(); }}>
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </IconButton>
          <Info size={16} />
          <Typography variant="body2" fontWeight="600">
            Score Calculation Breakdown
          </Typography>
        </Box>
      )}

      <Collapse in={expanded} timeout="auto">
        <GlassPaper sx={{ mt: 2, p: 2 }}>
          {hasCategoryScores ? (
            <Box>
              <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2 }}>
                Category-Based Breakdown
              </Typography>

              {score.categoryScores!.map((category, idx) => {
                const categoryContribution = (category.score * category.weight) / 100;
                const contributionPercentage = (categoryContribution / score.totalScore) * 100;

                return (
                  <Box key={idx} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" fontWeight="600">
                        {category.category}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Weight: {category.weight.toFixed(1)}%
                        </Typography>
                        <Typography variant="body2" fontWeight="600">
                          Score: {category.score.toFixed(2)}
                        </Typography>
                        <Chip
                          label={`${contributionPercentage.toFixed(1)}% of total`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={category.score}
                      sx={{
                        height: 8,
                        borderRadius: 1,
                        mb: 2,
                        backgroundColor: (theme: Theme) =>
                          theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                      }}
                    />

                    {category.metrics.length > 0 && (
                      <TableContainer sx={scrollbarStyles}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Metric</TableCell>
                              <TableCell align="right">Value</TableCell>
                              <TableCell align="right">Score</TableCell>
                              <TableCell align="right">Weight</TableCell>
                              <TableCell align="right">Contribution</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {category.metrics.map((metric, mIdx) => (
                              <TableRow key={mIdx}>
                                <TableCell>
                                  <Typography variant="body2">{metric.metricName}</Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" color="text.secondary">
                                    {metric.value !== null ? metric.value.toLocaleString() : 'N/A'}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" fontWeight="600">
                                    {metric.score.toFixed(2)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" color="text.secondary">
                                    {metric.weight.toFixed(1)}%
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" color="primary.main" fontWeight="600">
                                    {metric.contribution.toFixed(3)}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                );
              })}

              <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: 'background.paper' }}>
                <Typography variant="body2" fontWeight="600" sx={{ mb: 1 }}>
                  Formula:
                </Typography>
                <Typography variant="body2" color="text.secondary" component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  Total Score = Σ(Category_Score × Category_Weight / 100)
                  {'\n'}
                  Category_Score = Σ(Metric_Score × Metric_Weight / 100)
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary">
                {score.calculationBreakdown || 'No breakdown available'}
              </Typography>
            </Box>
          )}
        </GlassPaper>
      </Collapse>
    </Box>
  );
}

