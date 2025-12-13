import { useMemo } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { RawFinancialData } from '../types/types';

interface MetricRingChartProps {
  metricName: string;
  metricId: string;
  items: Array<{ id: string; name: string }>;
  itemsData: Map<string, RawFinancialData>;
  calculateValue: (data: RawFinancialData) => number | null;
  format: string;
  betterDirection?: 'higher' | 'lower';
}

export function MetricRingChart({
  metricName,
  metricId,
  items,
  itemsData,
  calculateValue,
  format,
  betterDirection,
}: MetricRingChartProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const chartData = useMemo(() => {
    const values = items
      .map(item => {
        const data = itemsData.get(item.id);
        if (!data) return null;
        
        const value = calculateValue(data);
        if (value === null || !isFinite(value)) return null;

        return {
          name: item.name,
          value,
          id: item.id,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (values.length === 0) return { values: [], min: 0, max: 0 };

    const numericValues = values.map(v => v.value);
    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);

    return { values, min, max };
  }, [items, itemsData, calculateValue]);

  const formatValue = (value: number) => {
    if (format === 'currency') {
      if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
      if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
      if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
      return `$${value.toFixed(2)}`;
    }
    if (format === 'percentage') {
      return `${value.toFixed(2)}%`;
    }
    if (format === 'ratio') {
      return value.toFixed(2);
    }
    return value.toLocaleString();
  };

  if (chartData.values.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No data available
        </Typography>
      </Box>
    );
  }

  const { values, min, max } = chartData;
  const range = max - min || 1;

  // Calculate percentage for each value (0-100%)
  const getPercentage = (value: number) => {
    return ((value - min) / range) * 100;
  };

  // Get ring color based on position in range
  const getRingColor = (percentage: number) => {
    if (betterDirection === 'higher') {
      // Green for higher values
      if (percentage > 70) return isDark ? '#10b981' : '#059669';
      if (percentage > 40) return isDark ? '#f59e0b' : '#d97706';
      return isDark ? '#ef4444' : '#dc2626';
    } else if (betterDirection === 'lower') {
      // Green for lower values (inverted)
      if (percentage < 30) return isDark ? '#10b981' : '#059669';
      if (percentage < 60) return isDark ? '#f59e0b' : '#d97706';
      return isDark ? '#ef4444' : '#dc2626';
    } else {
      // Default blue gradient
      return isDark ? '#60a5fa' : '#2563eb';
    }
  };

  const ringSize = 120;
  const ringStrokeWidth = 12;
  const radius = (ringSize - ringStrokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        p: 2
      }}
    >
      {/* Metric Name */}
      <Box
        sx={{
          textAlign: 'center',
          mb: 1,
          p: 2,
          borderRadius: 2,
          background: 'transparent',
          border: '1px solid',
          borderColor: isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(37, 99, 235, 0.08)',
        }}
      >
        <Typography
          variant="h6"
          fontWeight="700"
          sx={{
            fontSize: '1.1rem',
            background: isDark
              ? 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)'
              : 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {metricName}
        </Typography>
      </Box>

      {/* Rings Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 3,
          justifyContent: 'center',
        }}
      >
        {values.map((item) => {
          const percentage = getPercentage(item.value);
          const strokeDashoffset = circumference - (percentage / 100) * circumference;
          const ringColor = getRingColor(percentage);

          return (
            <Box
              key={item.id}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              {/* Ring */}
              <Box
                sx={{
                  position: 'relative',
                  width: ringSize,
                  height: ringSize,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg
                  width={ringSize}
                  height={ringSize}
                  style={{ transform: 'rotate(-90deg)' }}
                >
                  {/* Background ring */}
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={radius}
                    fill="none"
                    stroke={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}
                    strokeWidth={ringStrokeWidth}
                  />
                  {/* Progress ring */}
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={radius}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth={ringStrokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{
                      transition: 'stroke-dashoffset 0.6s ease-in-out',
                      filter: isDark
                        ? `drop-shadow(0 0 8px ${ringColor}40)`
                        : `drop-shadow(0 0 6px ${ringColor}30)`,
                    }}
                  />
                </svg>
                {/* Center content */}
                <Box
                  sx={{
                    position: 'absolute',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    gap: 0.5,
                    width: '100%',
                    height: '100%',
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight="600"
                    sx={{
                      fontSize: '0.75rem',
                      color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                      lineHeight: 1.2,
                      maxWidth: '80px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.7rem',
                      color: ringColor,
                      fontWeight: 700,
                    }}
                  >
                    {formatValue(item.value)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

