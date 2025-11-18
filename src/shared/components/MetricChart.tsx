import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import { RawFinancialData } from '../types/types';
import { parseNumericValue } from '../../engine/metricCalculator';
import { GlassPaper } from '../ui/GlassPaper';

interface MetricChartProps {
  metricName: string;
  metricId: string;
  items: Array<{ id: string; name: string }>;
  itemsData: Map<string, RawFinancialData>;
  calculateValue: (data: RawFinancialData) => number | null;
  format: string;
  betterDirection?: 'higher' | 'lower';
  height?: number;
}

export function MetricChart({
  metricName,
  metricId,
  items,
  itemsData,
  calculateValue,
  format,
  betterDirection,
  height = 300,
}: MetricChartProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  const chartData = useMemo(() => {
    return items
      .map(item => {
        const data = itemsData.get(item.id);
        if (!data) return null;
        
        const value = calculateValue(data);
        if (value === null || !isFinite(value)) return null;

        return {
          name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
          fullName: item.name,
          value,
          id: item.id,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => (betterDirection === 'higher' ? b.value - a.value : a.value - b.value));
  }, [items, itemsData, calculateValue, betterDirection]);

  if (chartData.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No data available for chart
        </Typography>
      </Box>
    );
  }

  const maxValue = Math.max(...chartData.map(d => Math.abs(d.value)));
  const minValue = Math.min(...chartData.map(d => d.value));

  // Get gradient colors based on betterDirection
  const getGradientColors = () => {
    if (!betterDirection) {
      return isDark 
        ? { start: 'rgba(96, 165, 250, 0.4)', end: 'rgba(167, 139, 250, 0.2)', stroke: '#60a5fa' }
        : { start: 'rgba(37, 99, 235, 0.3)', end: 'rgba(124, 58, 237, 0.15)', stroke: '#2563eb' };
    }

    if (betterDirection === 'higher') {
      // Green gradient for higher is better
      return isDark
        ? { start: 'rgba(16, 185, 129, 0.4)', end: 'rgba(16, 185, 129, 0.1)', stroke: '#10b981' }
        : { start: 'rgba(16, 185, 129, 0.3)', end: 'rgba(16, 185, 129, 0.08)', stroke: '#10b981' };
    } else {
      // Blue gradient for lower is better (neutral)
      return isDark
        ? { start: 'rgba(96, 165, 250, 0.4)', end: 'rgba(96, 165, 250, 0.1)', stroke: '#60a5fa' }
        : { start: 'rgba(37, 99, 235, 0.3)', end: 'rgba(37, 99, 235, 0.08)', stroke: '#2563eb' };
    }
  };

  const gradientColors = getGradientColors();

  const formatTooltipValue = (value: number) => {
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

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        '& .recharts-cartesian-grid': {
          stroke: isDark ? 'rgba(96, 165, 250, 0.08)' : 'rgba(37, 99, 235, 0.06)',
          strokeDasharray: '3 3'
        },
        '& .recharts-text': {
          fill: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
          fontSize: '11px',
          fontWeight: 500
        },
        '& .recharts-area': {
          filter: isDark
            ? 'drop-shadow(0 4px 8px rgba(96, 165, 250, 0.15))'
            : 'drop-shadow(0 4px 8px rgba(37, 99, 235, 0.1))'
        }
      }}
    >
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 50 }}>
          <defs>
            <linearGradient id={`gradient-${metricId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={gradientColors.start} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={gradientColors.end} stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={70}
            tick={{ fontSize: 10, fill: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
            axisLine={{ stroke: isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(37, 99, 235, 0.1)' }}
          />
          <YAxis 
            tick={{ fontSize: 10, fill: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
            axisLine={{ stroke: isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(37, 99, 235, 0.1)' }}
          />
          <Tooltip
            formatter={(value: number) => formatTooltipValue(value)}
            labelFormatter={(label, payload) => {
              const data = payload?.[0]?.payload;
              return data?.fullName || label;
            }}
            contentStyle={{
              backgroundColor: isDark ? 'rgba(18, 30, 54, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid',
              borderColor: isDark ? 'rgba(96, 165, 250, 0.3)' : 'rgba(37, 99, 235, 0.2)',
              borderRadius: 12,
              padding: '12px 16px',
              boxShadow: isDark
                ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(96, 165, 250, 0.2)'
                : '0 8px 32px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(37, 99, 235, 0.15)'
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={gradientColors.stroke}
            strokeWidth={2.5}
            fill={`url(#gradient-${metricId})`}
            fillOpacity={1}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}

