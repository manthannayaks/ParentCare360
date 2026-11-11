import React from 'react';

/**
 * SparklineChart: High-Performance, Zero-Dependency Miniature SVG Trend Visualizer
 * Used in Clinical Dashboards to replace raw numbers with at-a-glance 7-day trajectories.
 */
export function SparklineChart({
  data = [],
  color = '#10b981',
  height = 36,
  width = 110,
  minVal,
  maxVal,
  unit = ''
}) {
  if (!data || data.length < 2) {
    return <span className="text-xs text-slate-500 font-mono">Insufficient data</span>;
  }

  const values = data.map((d) => (typeof d === 'number' ? d : d.value));
  const min = minVal !== undefined ? minVal : Math.min(...values);
  const max = maxVal !== undefined ? maxVal : Math.max(...values);
  const range = max - min || 1;

  // Compute SVG Points
  const points = values.map((val, idx) => {
    const x = (idx / (values.length - 1)) * (width - 8) + 4;
    const y = height - 4 - ((val - min) / range) * (height - 8);
    return `${x},${y}`;
  });

  const polylineStr = points.join(' ');
  const latestValue = values[values.length - 1];
  const firstValue = values[0];
  const isUp = latestValue > firstValue;

  return (
    <div className="inline-flex items-center gap-2">
      <svg width={width} height={height} className="overflow-visible">
        {/* Soft Background Fill Under Curve */}
        <polygon
          points={`4,${height - 4} ${polylineStr} ${width - 4},${height - 4}`}
          fill={color}
          fillOpacity="0.15"
        />
        {/* Main Trajectory Line */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polylineStr}
        />
        {/* Latest Value Terminal Dot */}
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].split(',')[0]}
            cy={points[points.length - 1].split(',')[1]}
            r="3.5"
            fill={color}
            stroke="#0f172a"
            strokeWidth="1.5"
          />
        )}
      </svg>
      <div className="text-right font-mono">
        <div className="text-xs font-bold" style={{ color }}>
          {latestValue}
          <span className="text-[10px] text-slate-400 font-normal ml-0.5">{unit}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * DualSparklineBP: Visualizes Systolic & Diastolic 7-Day Trajectories Concurrently
 */
export function DualSparklineBP({
  history = [
    { sys: 125, dia: 82 },
    { sys: 128, dia: 84 },
    { sys: 122, dia: 80 },
    { sys: 135, dia: 88 },
    { sys: 130, dia: 85 },
    { sys: 124, dia: 81 },
    { sys: 122, dia: 80 }
  ],
  height = 40,
  width = 120
}) {
  const sysData = history.map((h) => h.sys);
  const diaData = history.map((h) => h.dia);

  const allVals = [...sysData, ...diaData];
  const min = Math.min(...allVals) - 5;
  const max = Math.max(...allVals) + 5;
  const range = max - min || 1;

  const toPoints = (vals) =>
    vals
      .map((val, idx) => {
        const x = (idx / (vals.length - 1)) * (width - 8) + 4;
        const y = height - 4 - ((val - min) / range) * (height - 8);
        return `${x},${y}`;
      })
      .join(' ');

  const latestSys = sysData[sysData.length - 1];
  const latestDia = diaData[diaData.length - 1];

  return (
    <div className="inline-flex items-center gap-2">
      <svg width={width} height={height} className="overflow-visible">
        {/* Systolic Line (Amber/Red) */}
        <polyline
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={toPoints(sysData)}
        />
        {/* Diastolic Line (Teal/Cyan) */}
        <polyline
          fill="none"
          stroke="#06b6d4"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={toPoints(diaData)}
        />
      </svg>
      <div className="text-right font-mono">
        <div className="text-xs font-bold text-amber-400">
          {latestSys}/<span className="text-cyan-400">{latestDia}</span>
          <span className="text-[9px] text-slate-400 font-normal ml-0.5">mmHg</span>
        </div>
      </div>
    </div>
  );
}

