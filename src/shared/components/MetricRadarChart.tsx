import { useMemo } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Box, Typography } from '@mui/material';
import { RawFinancialData } from '../types/types';

interface MetricData {
  metricId: string;
  metricName: string;
  calculateValue: (data: RawFinancialData) => number | null;
  format?: string;
  betterDirection?: 'higher' | 'lower';
}

interface ItemData {
  id: string;
  name: string;
  data: RawFinancialData;
}

interface MetricRadarChartProps {
  title: string;
  metrics: MetricData[];
  items: ItemData[];
  height?: number;
  colors?: string[];
}

/**
 * Normalizes values to 0-100 scale for radar chart
 */
function normalizeValue(value: number, min: number, max: number): number {
  if (max === min) return 50; // All values are the same
  return ((value - min) / (max - min)) * 100;
}

/**
 * Creates normalized data for radar chart
 */
function createRadarData(
  metrics: MetricData[],
  items: ItemData[]
): Array<Record<string, any>> {
  // First, collect all values to find min/max for each metric
  const metricRanges: Array<{ min: number; max: number }> = metrics.map(() => ({
    min: Infinity,
    max: -Infinity,
  }));

  items.forEach(item => {
    metrics.forEach((metric, index) => {
      const value = metric.calculateValue(item.data);
      if (value !== null && isFinite(value)) {
        // Handle negative values by shifting to positive
        const absValue = Math.abs(value);
        if (absValue > 0) {
          if (absValue < metricRanges[index].min || metricRanges[index].min === Infinity) {
            metricRanges[index].min = absValue;
          }
          if (absValue > metricRanges[index].max) {
            metricRanges[index].max = absValue;
          }
        }
      }
    });
  });

  // Build radar chart data points with actual values stored for tooltips
  return metrics.map((metric, index) => {
    const dataPoint: Record<string, any> = {
      metric: metric.metricName.length > 20 
        ? metric.metricName.substring(0, 20) + '...' 
        : metric.metricName,
      fullMetricName: metric.metricName,
      format: metric.format || 'number',
      betterDirection: metric.betterDirection,
    };

    // Store actual values for tooltips
    const actualValues: Record<string, number> = {};

    items.forEach(item => {
      const value = metric.calculateValue(item.data);
      actualValues[item.name] = value || 0;
      
      if (value !== null && isFinite(value)) {
        // Use absolute value for normalization (handles negative values)
        const absValue = Math.abs(value);
        if (absValue > 0 && metricRanges[index].max > metricRanges[index].min) {
          const normalized = normalizeValue(
            absValue,
            metricRanges[index].min,
            metricRanges[index].max
          );
          dataPoint[item.name] = Math.max(0, Math.min(100, normalized));
        } else if (absValue > 0) {
          // All values are the same, set to middle
          dataPoint[item.name] = 50;
        } else {
          dataPoint[item.name] = 0;
        }
      } else {
        dataPoint[item.name] = 0;
      }
    });

    // Attach actual values to data point for tooltip access
    dataPoint._actualValues = actualValues;

    return dataPoint;
  });
}

export function MetricRadarChart({
  title,
  metrics,
  items,
  height = 400,
  colors = ['#1976d2', '#dc004e', '#ed6c02', '#2e7d32', '#9c27b0', '#0288d1'],
}: MetricRadarChartProps) {
  const chartData = useMemo(() => {
    if (metrics.length === 0 || items.length === 0) return [];
    
    // Filter out metrics that don't have data for at least one item
    const validMetrics = metrics.filter(metric =>
      items.some(item => {
        const value = metric.calculateValue(item.data);
        return value !== null && isFinite(value) && Math.abs(value) > 0;
      })
    );

    if (validMetrics.length === 0) return [];

    return createRadarData(validMetrics, items);
  }, [metrics, items]);

  if (chartData.length === 0 || items.length < 2 || metrics.length < 3) {
    const emptyReason = items.length < 2 
      ? 'Need at least 2 items to compare'
      : metrics.length < 3
      ? 'Need at least 3 high-priority metrics'
      : 'No numeric high-priority metrics available';
    
    const emptyMessage = items.length < 2 
      ? 'Add more items to see the radar comparison'
      : metrics.length < 3
      ? 'Select 3 or more high-priority metrics (priority 8+) to see the radar chart'
      : 'Configure metrics with priority 8+ to see them here';

    return (
      <Box sx={{ 
        p: 4, 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: height || 400
      }}>
        <Box
          sx={{
            width: 200,
            height: 200,
            borderRadius: '50%',
            border: '3px dashed',
            borderColor: (theme) => theme.palette.mode === 'dark' 
              ? 'rgba(96, 165, 250, 0.3)' 
              : 'rgba(37, 99, 235, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: '2px dashed',
              borderColor: (theme) => theme.palette.mode === 'dark' 
                ? 'rgba(167, 139, 250, 0.2)' 
                : 'rgba(124, 58, 237, 0.15)',
              transform: 'scale(0.7)',
            }
          }}
        >
          <Typography 
            variant="h4" 
            sx={{ 
              opacity: 0.4,
              fontSize: '3rem',
              lineHeight: 1
            }}
          >
            📊
          </Typography>
        </Box>
        <Typography 
          variant="h6" 
          color="text.secondary" 
          sx={{ 
            mb: 1, 
            fontWeight: 600,
            background: (theme) => theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)'
              : 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {emptyReason}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.7, maxWidth: 400 }}>
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Typography 
        variant="h5" 
        fontWeight="700" 
        sx={{ 
          mb: 3,
          background: (theme) => 
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)'
              : 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontSize: '1.5rem'
        }}
      >
        {title}
      </Typography>
      <Box sx={{ width: '100%', height: `${height}px`, minHeight: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData}>
          <PolarGrid strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ 
              fontSize: 12,
              fill: '#888',
              fontWeight: 500
            }}
            style={{ textTransform: 'none' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ 
              fontSize: 10,
              fill: '#666'
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(18, 30, 54, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 8,
              padding: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
            }}
            labelFormatter={(label) => {
              const data = chartData.find(d => d.metric === label);
              return data?.fullMetricName || label;
            }}
            formatter={(_value: number, name: string, props: any) => {
              // Get actual value from the data point
              const dataPoint = props.payload;
              const actualValue = dataPoint?._actualValues?.[name];
              
              if (actualValue === undefined || actualValue === null) {
                return 'N/A';
              }

              // Format based on metric format
              const format = dataPoint?.format || 'number';
              if (format === 'currency') {
                if (Math.abs(actualValue) >= 1e12) return `$${(actualValue / 1e12).toFixed(2)}T`;
                if (Math.abs(actualValue) >= 1e9) return `$${(actualValue / 1e9).toFixed(2)}B`;
                if (Math.abs(actualValue) >= 1e6) return `$${(actualValue / 1e6).toFixed(2)}M`;
                return `$${actualValue.toFixed(2)}`;
              }
              if (format === 'percentage') {
                return `${actualValue.toFixed(2)}%`;
              }
              if (format === 'ratio') {
                return actualValue.toFixed(2);
              }
              return actualValue.toLocaleString();
            }}
          />
          {items.map((item, index) => (
            <Radar
              key={item.id}
              name={item.name}
              dataKey={item.name}
              stroke={colors[index % colors.length]}
              fill={colors[index % colors.length]}
              fillOpacity={0.3}
              strokeWidth={2}
            />
          ))}
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
      </Box>
    </Box>
  );
}

