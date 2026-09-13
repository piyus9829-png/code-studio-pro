import React from 'react';
import { ChartPlotData } from '../types';
import { BarChart3, Download, PieChart, TrendingUp, Sparkles } from 'lucide-react';

interface ChartPlotViewerProps {
  plotData: ChartPlotData;
}

export const ChartPlotViewer: React.FC<ChartPlotViewerProps> = ({ plotData }) => {
  const { type, title, xlabel, ylabel, grid = true, series, labels } = plotData;

  const width = 560;
  const height = 300;
  const padding = { top: 35, right: 30, bottom: 45, left: 55 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Flatten all series Y values to calculate scale
  const allY: number[] = series.flatMap(s => s.y || []);
  const minY = Math.min(0, ...allY);
  const maxY = Math.max(1, ...allY);
  const yRange = maxY - minY || 1;

  // Collect or generate X points
  const primarySeries = series[0] || { y: [] };
  const xCount = primarySeries.y.length;
  const xValues: any[] = primarySeries.x && primarySeries.x.length === xCount 
    ? primarySeries.x 
    : Array.from({ length: xCount }, (_, i) => i + 1);

  const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  const getXCoord = (index: number) => {
    if (xCount <= 1) return padding.left + plotWidth / 2;
    return padding.left + (index / (xCount - 1)) * plotWidth;
  };

  const getYCoord = (val: number) => {
    return padding.top + plotHeight - ((val - minY) / yRange) * plotHeight;
  };

  const handleExportSVG = () => {
    const svgElement = document.getElementById(`chart-svg-${title || 'plot'}`);
    if (!svgElement) return;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title || 'matplotlib_plot'}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 my-2 shadow-xl max-w-2xl">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            {type === 'bar' ? <BarChart3 className="w-4 h-4" /> : type === 'pie' ? <PieChart className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">{title || 'Matplotlib Figure'}</h4>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
              matplotlib.pyplot • {type.toUpperCase()}
            </span>
          </div>
        </div>

        <button
          onClick={handleExportSVG}
          title="Save Chart as SVG"
          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
        >
          <Download className="w-3 h-3" />
          <span>Save Plot</span>
        </button>
      </div>

      <div className="flex justify-center overflow-x-auto">
        <svg
          id={`chart-svg-${title || 'plot'}`}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-[560px] h-auto bg-slate-950 rounded-lg select-none"
        >
          {/* Background & Gridlines */}
          {grid && (
            <g stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3">
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = padding.top + plotHeight * ratio;
                return <line key={i} x1={padding.left} y1={y} x2={width - padding.right} y2={y} />;
              })}
              {xValues.map((_, i) => {
                const x = getXCoord(i);
                return <line key={i} x1={x} y1={padding.top} x2={x} y2={padding.top + plotHeight} />;
              })}
            </g>
          )}

          {/* Axes */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + plotHeight}
            stroke="#64748b"
            strokeWidth="1.5"
          />
          <line
            x1={padding.left}
            y1={padding.top + plotHeight}
            x2={width - padding.right}
            y2={padding.top + plotHeight}
            stroke="#64748b"
            strokeWidth="1.5"
          />

          {/* Y Axis Labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const val = minY + (1 - ratio) * yRange;
            const y = padding.top + plotHeight * ratio;
            return (
              <text
                key={i}
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#94a3b8"
                fontFamily="monospace"
              >
                {val.toFixed(1)}
              </text>
            );
          })}

          {/* X Axis Labels */}
          {xValues.map((val, i) => {
            if (xValues.length > 10 && i % 2 !== 0) return null;
            const x = getXCoord(i);
            return (
              <text
                key={i}
                x={x}
                y={padding.top + plotHeight + 16}
                textAnchor="middle"
                fontSize="10"
                fill="#94a3b8"
                fontFamily="monospace"
              >
                {String(val)}
              </text>
            );
          })}

          {/* Axis Titles */}
          {xlabel && (
            <text
              x={padding.left + plotWidth / 2}
              y={height - 8}
              textAnchor="middle"
              fontSize="11"
              fontWeight="bold"
              fill="#cbd5e1"
            >
              {xlabel}
            </text>
          )}

          {ylabel && (
            <text
              transform={`rotate(-90 ${16} ${padding.top + plotHeight / 2})`}
              x={16}
              y={padding.top + plotHeight / 2}
              textAnchor="middle"
              fontSize="11"
              fontWeight="bold"
              fill="#cbd5e1"
            >
              {ylabel}
            </text>
          )}

          {/* Render Plot Type: Line */}
          {type === 'line' &&
            series.map((s, sIdx) => {
              const color = s.color || colors[sIdx % colors.length];
              const points = s.y.map((val, i) => `${getXCoord(i)},${getYCoord(val)}`).join(' ');
              return (
                <g key={sIdx}>
                  <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                  />
                  {s.y.map((val, i) => (
                    <circle
                      key={i}
                      cx={getXCoord(i)}
                      cy={getYCoord(val)}
                      r="4"
                      fill={color}
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                  ))}
                </g>
              );
            })}

          {/* Render Plot Type: Scatter */}
          {type === 'scatter' &&
            series.map((s, sIdx) => {
              const color = s.color || colors[sIdx % colors.length];
              return (
                <g key={sIdx}>
                  {s.y.map((val, i) => (
                    <circle
                      key={i}
                      cx={getXCoord(i)}
                      cy={getYCoord(val)}
                      r="5.5"
                      fill={color}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  ))}
                </g>
              );
            })}

          {/* Render Plot Type: Bar / Histogram */}
          {(type === 'bar' || type === 'histogram') &&
            series.map((s, sIdx) => {
              const color = s.color || colors[sIdx % colors.length];
              const barWidth = Math.max(8, (plotWidth / s.y.length) * 0.6);
              return (
                <g key={sIdx}>
                  {s.y.map((val, i) => {
                    const x = getXCoord(i) - barWidth / 2;
                    const y = getYCoord(val);
                    const barHeight = padding.top + plotHeight - y;
                    return (
                      <rect
                        key={i}
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill={color}
                        rx="3"
                        className="transition-all hover:opacity-80"
                      />
                    );
                  })}
                </g>
              );
            })}
        </svg>
      </div>

      {/* Series Legend */}
      {series.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-4 mt-3 pt-2 border-t border-slate-800 text-xs">
          {series.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 font-mono text-slate-300">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: s.color || colors[i % colors.length] }}
              />
              <span>{s.name || `Series ${i + 1}`}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
