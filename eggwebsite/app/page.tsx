'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  Scale, 
  Calculator, 
  Calendar, 
  TrendingUp, 
  History, 
  LayoutDashboard, 
  ChevronRight,
  Egg,
  Download,
  Filter,
  RefreshCcw,
  ArrowRight
} from 'lucide-react';

// --- 0. STYLES & FONTS ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');
    
    body {
      font-family: 'Prompt', sans-serif;
      background-color: #fcfbf9;
    }

    .glass-panel {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .animate-fade-in {
      animation: fadeIn 0.4s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `}</style>
);

// --- 1. TYPES & DATA ---

type EggSize = '0' | '1' | '2' | '3' | '4' | '5';
type EggBreakdown = Record<EggSize, number>;

interface DailyLog {
  date: string;
  total_sorted: number;
  total_weight_kg: number;
  breakdown: EggBreakdown;
}

const MOCK_DATA_SOURCE: DailyLog[] = [
  { date: "2024-12-01", total_sorted: 118000, total_weight_kg: 7800, breakdown: { '0': 12500, '1': 35000, '2': 48000, '3': 15000, '4': 5500, '5': 2000 } },
  { date: "2024-12-02", total_sorted: 121000, total_weight_kg: 8050, breakdown: { '0': 13000, '1': 36000, '2': 50000, '3': 15500, '4': 4500, '5': 2000 } },
  { date: "2024-12-03", total_sorted: 115500, total_weight_kg: 7650, breakdown: { '0': 12000, '1': 34000, '2': 47000, '3': 14500, '4': 6000, '5': 2000 } },
  { date: "2024-12-04", total_sorted: 119000, total_weight_kg: 7900, breakdown: { '0': 12800, '1': 35500, '2': 48500, '3': 15200, '4': 5000, '5': 2000 } },
  { date: "2024-12-05", total_sorted: 125000, total_weight_kg: 8300, breakdown: { '0': 13500, '1': 40000, '2': 52000, '3': 14500, '4': 3500, '5': 1500 } },
  { date: "2024-12-06", total_sorted: 110000, total_weight_kg: 7200, breakdown: { '0': 11000, '1': 32000, '2': 43000, '3': 14000, '4': 7000, '5': 3000 } },
  { date: "2024-12-07", total_sorted: 120500, total_weight_kg: 8100, breakdown: { '0': 12800, '1': 37000, '2': 49000, '3': 15500, '4': 4200, '5': 2000 } },
];

const EGG_SIZES: EggSize[] = ['0', '1', '2', '3', '4', '5'];

// Modern Color Palette for Eggs
const EGG_THEME: Record<EggSize, { bg: string, text: string, ring: string, label: string }> = {
  '0': { bg: 'bg-amber-100', text: 'text-amber-800', ring: 'ring-amber-200', label: 'จัมโบ้' },
  '1': { bg: 'bg-orange-100', text: 'text-orange-800', ring: 'ring-orange-200', label: 'ใหญ่' },
  '2': { bg: 'bg-rose-100', text: 'text-rose-800', ring: 'ring-rose-200', label: 'กลาง' },
  '3': { bg: 'bg-sky-100', text: 'text-sky-800', ring: 'ring-sky-200', label: 'เล็ก' },
  '4': { bg: 'bg-indigo-100', text: 'text-indigo-800', ring: 'ring-indigo-200', label: 'จิ๋ว' },
  '5': { bg: 'bg-slate-100', text: 'text-slate-700', ring: 'ring-slate-200', label: 'คละ/บุบ' }
};

// --- 2. UTILITY FUNCTIONS ---

const formatNumber = (num: number | string): string => {
  const numericValue = typeof num === 'string' ? parseFloat(num) : num;
  return new Intl.NumberFormat('th-TH').format(numericValue);
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('th-TH', { 
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' 
  }).format(date);
}

interface BreakdownItem {
  size: EggSize;
  count: number;
  percent: string;
}

const calculateDailyBreakdown = (log: DailyLog): BreakdownItem[] => {
  const breakdownData: BreakdownItem[] = EGG_SIZES.map(size => {
    const count = log.breakdown[size] || 0;
    const percent = log.total_sorted > 0 ? ((count / log.total_sorted) * 100) : 0;
    return { size, count, percent: percent.toFixed(2) };
  });
  return breakdownData;
};

// --- 3. UI COMPONENTS ---

const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow duration-300 ${className}`}>
    {children}
  </div>
);

// Tooltip Component
const ChartTooltip: React.FC<{ content: React.ReactNode, x: number, y: number, visible: boolean }> = ({ content, x, y, visible }) => (
  <div
    style={{ left: x, top: y }}
    className={`absolute z-50 p-3 bg-slate-800/90 backdrop-blur-sm text-white text-xs rounded-xl shadow-xl pointer-events-none transition-all duration-200 transform -translate-x-1/2 -translate-y-full mb-2 ${visible ? 'opacity-100 translate-y-[-10px]' : 'opacity-0 translate-y-0'}`}
  >
    {content}
    {/* Arrow */}
    <div className="absolute left-1/2 bottom-[-4px] w-2 h-2 bg-slate-800/90 transform -translate-x-1/2 rotate-45"></div>
  </div>
);

// Summary Card
interface SummaryCardProps {
  title: string;
  value: number | string;
  unit: string;
  icon: React.ReactNode;
  trend?: string;
  colorClass?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, unit, icon, colorClass = "bg-amber-500" }) => (
  <Card className="p-6 relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-24 h-24 ${colorClass} opacity-5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110`} />
    <div className="flex items-center justify-between mb-4 relative z-10">
      <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 text-${colorClass.split('-')[1]}-600`}>
        {icon}
      </div>
    </div>
    <div className="relative z-10">
      <p className="text-sm font-medium text-stone-500 mb-1">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-bold text-stone-800">{formatNumber(value)}</h3>
        <span className="text-sm font-medium text-stone-400">{unit}</span>
      </div>
    </div>
  </Card>
);

// Bar Chart
interface ModernBarChartProps {
  data: BreakdownItem[];
}

const ModernBarChart: React.FC<ModernBarChartProps> = ({ data }) => {
  const maxCount = Math.max(...data.map(d => d.count)) * 1.15;
  const [tooltip, setTooltip] = useState<{ visible: boolean, x: number, y: number, content: React.ReactNode }>({ visible: false, x: 0, y: 0, content: '' });
  const chartRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={chartRef} className="relative h-80 w-full pt-10 pb-2">
      <div className="flex justify-between h-full items-end gap-2 sm:gap-4 px-2">
        {data.map((item) => {
          const heightPercent = (item.count / maxCount) * 100;
          const theme = EGG_THEME[item.size];
          
          return (
            <div 
              key={item.size} 
              className="flex flex-col items-center justify-end h-full w-full group relative"
              onMouseMove={(e) => {
                if (chartRef.current) {
                  const rect = chartRef.current.getBoundingClientRect();
                  setTooltip({
                    visible: true,
                    x: e.clientX - rect.left, 
                    y: e.clientY - rect.top,
                    content: (
                      <div className="text-center">
                         <div className="font-bold text-sm mb-1">เบอร์ {item.size} ({theme.label})</div>
                         <div className="text-lg font-mono">{formatNumber(item.count)} ฟอง</div>
                         <div className="text-xs opacity-80">{item.percent}% ของทั้งหมด</div>
                      </div>
                    )
                  });
                }
              }}
              onMouseLeave={() => setTooltip({ ...tooltip, visible: false })}
            >
              <div className="relative w-full sm:w-16 flex flex-col justify-end h-full">
                {/* Bar */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t-xl transition-all duration-500 ease-out hover:opacity-90 relative overflow-hidden ${theme.bg}`}
                >
                  <div className={`absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-white/0 to-white/30`} />
                  <div className={`absolute bottom-0 w-full h-1 ${theme.text.replace('text', 'bg')} opacity-20`} />
                </div>
              </div>
              
              {/* Label */}
              <div className="mt-3 flex flex-col items-center">
                 <span className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full text-xs sm:text-sm font-bold border-2 ${theme.bg} ${theme.text} ${theme.ring} mb-1`}>
                   {item.size}
                 </span>
                 <span className="text-[10px] sm:text-xs text-stone-400 hidden sm:block">{theme.label}</span>
              </div>
            </div>
          );
        })}
      </div>
      {tooltip.visible && <ChartTooltip {...tooltip} />}
    </div>
  );
};

// Line Chart
interface ModernLineChartProps {
  data: DailyLog[];
}

const ModernLineChart: React.FC<ModernLineChartProps> = ({ data }) => {
  const chartHeight = 300;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  
  if (data.length === 0) return null;

  const maxVal = Math.max(...data.map(d => d.total_sorted)) * 1.1;
  const minVal = Math.min(...data.map(d => d.total_sorted)) * 0.9;
  const range = maxVal - minVal;

  const getX = (index: number) => ((index / (data.length - 1)) * 100);
  const getY = (val: number) => 100 - ((val - minVal) / range) * 100;

  const points = data.map((d, i) => ({
    x: getX(i),
    y: getY(d.total_sorted),
    data: d
  }));

  const pathD = points.map((p, i) => 
    (i === 0 ? 'M' : 'L') + ` ${p.x} ${p.y}`
  ).join(' ');

  // Create area fill
  const areaD = `${pathD} L 100 100 L 0 100 Z`;

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="w-full h-[350px] relative select-none">
       {/* Y Axis Labels */}
       <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-[10px] text-stone-400 py-4 text-right pr-2 border-r border-stone-100">
          <span>{formatNumber(maxVal.toFixed(0))}</span>
          <span>{formatNumber((minVal + range/2).toFixed(0))}</span>
          <span>{formatNumber(minVal.toFixed(0))}</span>
       </div>

       {/* Chart Area */}
       <div className="absolute left-14 right-4 top-4 bottom-8">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
             <defs>
               <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                 <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                 <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
               </linearGradient>
             </defs>
             
             {/* Grid Lines */}
             {[0, 25, 50, 75, 100].map(y => (
               <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#e7e5e4" strokeDasharray="3,3" strokeWidth="0.5" />
             ))}

             {/* Area Fill */}
             <path d={areaD} fill="url(#chartGradient)" />

             {/* Line */}
             <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

             {/* Points */}
             {points.map((p, i) => (
                <g key={i} 
                   onMouseEnter={() => setHoveredIndex(i)} 
                   onMouseLeave={() => setHoveredIndex(null)}
                   className="cursor-pointer"
                >
                  {/* Invisible Hit Area */}
                  <circle cx={p.x} cy={p.y} r="6" fill="transparent" />
                  
                  {/* Visible Dot */}
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r={hoveredIndex === i ? 5 : 3} 
                    fill="white" 
                    stroke="#f59e0b" 
                    strokeWidth="2" 
                    className="transition-all duration-200"
                  />
                </g>
             ))}
          </svg>

          {/* Tooltip Overlay */}
          {hoveredIndex !== null && (
             <div 
               className="absolute bg-white shadow-xl rounded-lg p-3 border border-stone-100 transform -translate-x-1/2 -translate-y-full pointer-events-none z-10"
               style={{ 
                 left: `${points[hoveredIndex].x}%`, 
                 top: `${points[hoveredIndex].y}%`,
                 marginTop: '-15px'
               }}
             >
                <div className="text-xs font-semibold text-stone-500 mb-1">{points[hoveredIndex].data.date}</div>
                <div className="text-lg font-bold text-amber-600">{formatNumber(points[hoveredIndex].data.total_sorted)} ฟอง</div>
             </div>
          )}
       </div>

       {/* X Axis Labels */}
       <div className="absolute bottom-0 left-14 right-4 flex justify-between text-[10px] text-stone-400">
         {data.map((d, i) => (
           <div key={i} className="text-center transform -translate-x-1/2" style={{ width: '40px' }}>
              {d.date.substring(5)}
           </div>
         ))}
       </div>
    </div>
  );
};


// --- 4. PAGE SECTIONS ---

// Dashboard View
const DailyDashboard: React.FC<{ 
  selectedDate: string;
  log: DailyLog | null;
  setView: (v: 'dashboard' | 'history') => void;
  setDate: (d: string) => void;
}> = ({ selectedDate, log, setView, setDate }) => {
  
  const breakdownData = useMemo(() => log ? calculateDailyBreakdown(log) : [], [log]);
  const totalSorted = log?.total_sorted || 0;
  const totalWeight = log?.total_weight_kg || 0;
  const avgWeight = totalSorted > 0 ? (totalWeight / totalSorted * 1000).toFixed(2) : '0.00';

  return (
    <div className="space-y-6 animate-fade-in">
       {/* Date Picker Header */}
       <Card className="p-4 flex flex-col sm:flex-row justify-between items-center bg-gradient-to-r from-stone-50 to-white">
          <div className="flex items-center space-x-3 w-full sm:w-auto mb-4 sm:mb-0">
             <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
               <Calendar size={20} />
             </div>
             <div>
               <label className="text-xs font-bold text-stone-400 uppercase tracking-wide">ข้อมูลประจำวันที่</label>
               <input 
                 type="date" 
                 value={selectedDate}
                 onChange={(e) => setDate(e.target.value)}
                 className="block w-full bg-transparent border-none p-0 text-stone-800 font-bold text-lg focus:ring-0 cursor-pointer"
               />
             </div>
          </div>

          <div className="flex items-center text-sm text-stone-500 bg-white px-4 py-2 rounded-full border border-stone-100 shadow-sm">
             {log ? (
               <><span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span> บันทึกแล้ว</>
             ) : (
               <><span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span> ไม่มีข้อมูล</>
             )}
          </div>
       </Card>

       {log ? (
         <>
           {/* Top Stats */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SummaryCard 
                 title="จำนวนไข่คัดแยก" 
                 value={totalSorted} 
                 unit="ฟอง" 
                 icon={<Calculator size={24} />} 
                 colorClass="bg-amber-500"
              />
              <SummaryCard 
                 title="น้ำหนักรวม" 
                 value={totalWeight} 
                 unit="กิโลกรัม" 
                 icon={<Scale size={24} />} 
                 colorClass="bg-emerald-500"
              />
              <SummaryCard 
                 title="เฉลี่ยต่อฟอง" 
                 value={avgWeight} 
                 unit="กรัม" 
                 icon={<Egg size={24} />} 
                 colorClass="bg-blue-500"
              />
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart Section */}
              <Card className="lg:col-span-2 p-6">
                 <div className="flex justify-between items-center mb-6">
                   <div>
                     <h2 className="text-xl font-bold text-stone-800">สัดส่วนเบอร์ไข่</h2>
                     <p className="text-sm text-stone-500">จำแนกตามขนาด (0-5)</p>
                   </div>
                   <div className="p-2 bg-stone-50 rounded-lg">
                      <TrendingUp size={20} className="text-stone-400" />
                   </div>
                 </div>
                 <ModernBarChart data={breakdownData} />
              </Card>

              {/* Table Section */}
              <Card className="lg:col-span-1 p-0 overflow-hidden flex flex-col">
                 <div className="p-6 border-b border-stone-100 bg-stone-50/50">
                    <h2 className="text-lg font-bold text-stone-800">รายละเอียด</h2>
                 </div>
                 <div className="flex-1 overflow-y-auto">
                    <table className="w-full">
                       <thead className="bg-stone-50 text-stone-500 text-xs uppercase font-medium">
                          <tr>
                            <th className="px-6 py-3 text-left">ขนาด</th>
                            <th className="px-6 py-3 text-right">จำนวน</th>
                            <th className="px-6 py-3 text-right">%</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-stone-100">
                          {breakdownData.map((item) => {
                             const theme = EGG_THEME[item.size];
                             return (
                               <tr key={item.size} className="hover:bg-amber-50/30 transition-colors">
                                  <td className="px-6 py-4">
                                     <div className="flex items-center">
                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${theme.bg} ${theme.text}`}>
                                           {item.size}
                                        </span>
                                        <div className="flex flex-col">
                                          <span className="text-sm font-medium text-stone-700">เบอร์ {item.size}</span>
                                          <span className="text-[10px] text-stone-400">{theme.label}</span>
                                        </div>
                                     </div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                     <div className="text-sm font-bold text-stone-700">{formatNumber(item.count)}</div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                     <div className="text-sm text-stone-500">{item.percent}%</div>
                                  </td>
                               </tr>
                             );
                          })}
                       </tbody>
                    </table>
                 </div>
                 <div className="p-4 bg-stone-50 border-t border-stone-100">
                    <div className="flex justify-between items-center text-sm">
                       <span className="font-semibold text-stone-600">รวมทั้งหมด</span>
                       <span className="font-bold text-amber-600 text-lg">{formatNumber(totalSorted)}</span>
                    </div>
                 </div>
              </Card>
           </div>
         </>
       ) : (
         <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-stone-200">
            <div className="bg-stone-100 p-4 rounded-full mb-4">
               <Calendar size={40} className="text-stone-300" />
            </div>
            <h3 className="text-lg font-bold text-stone-500">ไม่พบข้อมูลสำหรับวันที่เลือก</h3>
            <p className="text-stone-400 mt-1">กรุณาเลือกวันที่อื่น หรือเพิ่มข้อมูลใหม่</p>
         </div>
       )}
    </div>
  );
};

// History View
const HistoryView: React.FC<{ setView: (v: 'dashboard' | 'history') => void }> = ({ setView }) => {
  const defaultEndDate = MOCK_DATA_SOURCE[MOCK_DATA_SOURCE.length - 1].date;
  const defaultStartDate = MOCK_DATA_SOURCE[0].date;
  
  const [startDate, setStartDate] = useState<string>(defaultStartDate);
  const [endDate, setEndDate] = useState<string>(defaultEndDate);
  const [filterData, setFilterData] = useState<DailyLog[]>(MOCK_DATA_SOURCE);

  const handleFilter = useCallback(() => {
    const filtered = MOCK_DATA_SOURCE.filter(log => log.date >= startDate && log.date <= endDate);
    setFilterData(filtered);
  }, [startDate, endDate]);

  const summary = useMemo(() => {
    const totalSorted = filterData.reduce((sum, log) => sum + log.total_sorted, 0);
    const totalWeight = filterData.reduce((sum, log) => sum + log.total_weight_kg, 0);
    const avgPerDay = filterData.length > 0 ? (totalSorted / filterData.length).toFixed(0) : 0;
    
    // Calculate aggregate breakdown
    const breakdownTotal: Record<string, number> = {};
    filterData.forEach(log => {
      EGG_SIZES.forEach(size => breakdownTotal[size] = (breakdownTotal[size] || 0) + log.breakdown[size]);
    });
    
    const breakdownArray = EGG_SIZES.map(size => ({
      size,
      count: breakdownTotal[size] || 0,
      percent: totalSorted > 0 ? ((breakdownTotal[size] / totalSorted) * 100).toFixed(2) : '0.00'
    }));

    return { totalSorted, totalWeight, avgPerDay, breakdownArray, days: filterData.length };
  }, [filterData]);

  return (
    <div className="space-y-6 animate-fade-in">
       {/* Filter Section */}
       <Card className="p-6">
          <div className="flex flex-col lg:flex-row justify-between items-end gap-4">
             <div className="w-full">
                <h2 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
                   <Filter size={20} className="text-amber-500" />
                   กำหนดช่วงเวลา
                </h2>
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                   <div className="flex-1">
                      <label className="text-xs font-semibold text-stone-500 mb-1 block">วันเริ่มต้น</label>
                      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none" />
                   </div>
                   <div className="flex-1">
                      <label className="text-xs font-semibold text-stone-500 mb-1 block">วันสิ้นสุด</label>
                      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none" />
                   </div>
                </div>
             </div>
             <div className="flex gap-3 w-full lg:w-auto">
                <button onClick={handleFilter} className="flex-1 lg:flex-none px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2">
                   <RefreshCcw size={18} /> อัพเดท
                </button>
             </div>
          </div>
       </Card>

       {filterData.length > 0 ? (
         <>
            {/* Charts & Summary Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <Card className="lg:col-span-2 p-6">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-lg font-bold text-stone-800">แนวโน้มการผลิต</h3>
                     <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-1 rounded-md">{summary.days} วัน</span>
                  </div>
                  <ModernLineChart data={filterData} />
               </Card>

               <div className="space-y-6">
                  <SummaryCard 
                     title="ยอดรวมทั้งหมด" 
                     value={summary.totalSorted} 
                     unit="ฟอง" 
                     icon={<LayoutDashboard size={20} />} 
                     colorClass="bg-indigo-500"
                  />
                  <SummaryCard 
                     title="เฉลี่ยต่อวัน" 
                     value={summary.avgPerDay} 
                     unit="ฟอง/วัน" 
                     icon={<Calculator size={20} />} 
                     colorClass="bg-rose-500"
                  />
               </div>
            </div>

            {/* Breakdown Summary */}
            <Card className="p-6">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-stone-800">สรุปยอดรวมตามขนาด</h3>
                  <button className="flex items-center gap-2 text-sm text-stone-500 hover:text-amber-600 transition-colors">
                     <Download size={16} /> Export CSV
                  </button>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {summary.breakdownArray.map(item => (
                    <div key={item.size} className="bg-stone-50 rounded-xl p-4 border border-stone-100 flex flex-col items-center justify-center text-center hover:border-amber-200 transition-colors">
                       <div className={`w-10 h-10 rounded-full ${EGG_THEME[item.size].bg} ${EGG_THEME[item.size].text} flex items-center justify-center font-bold text-lg mb-2`}>
                          {item.size}
                       </div>
                       <span className="text-xs text-stone-400 mb-1">{EGG_THEME[item.size].label}</span>
                       <span className="text-lg font-bold text-stone-800">{formatNumber(item.count)}</span>
                       <span className="text-xs font-medium text-stone-500">{item.percent}%</span>
                    </div>
                  ))}
               </div>
            </Card>
         </>
       ) : (
         <div className="p-12 text-center bg-white rounded-2xl shadow-sm border border-stone-100">
            <p className="text-stone-400">ไม่พบข้อมูลในช่วงเวลาที่เลือก</p>
         </div>
       )}
    </div>
  );
};

// --- 5. MAIN LAYOUT ---

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'history'>('dashboard');
  const latestDate = MOCK_DATA_SOURCE[MOCK_DATA_SOURCE.length - 1].date;
  const [selectedDate, setSelectedDate] = useState<string>(latestDate);

  const currentLog = useMemo(() => 
    MOCK_DATA_SOURCE.find(log => log.date === selectedDate) || null
  , [selectedDate]);

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-stone-800 pb-20">
      <GlobalStyles />
      
      {/* Navbar */}
      <nav className="sticky top-0 z-40 glass-panel shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-2.5 rounded-xl shadow-lg shadow-orange-200">
                 <Egg className="text-white" size={24} strokeWidth={2.5} />
              </div>
              <div>
                 <h1 className="text-xl font-bold text-stone-800 leading-none">Smart Farm</h1>
                 <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">Egg Sorting System</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:flex bg-stone-100/50 p-1.5 rounded-xl border border-stone-200/50">
               <button 
                 onClick={() => setView('dashboard')}
                 className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${view === 'dashboard' ? 'bg-white text-amber-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
               >
                 <LayoutDashboard size={18} /> ภาพรวมวันนี้
               </button>
               <button 
                 onClick={() => setView('history')}
                 className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${view === 'history' ? 'bg-white text-amber-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
               >
                 <History size={18} /> ประวัติย้อนหลัง
               </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Nav Tabs (Visible only on mobile) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-2 z-50 flex justify-around">
          <button onClick={() => setView('dashboard')} className={`flex flex-col items-center p-2 rounded-lg w-full ${view === 'dashboard' ? 'text-amber-600 bg-amber-50' : 'text-stone-400'}`}>
             <LayoutDashboard size={24} />
             <span className="text-[10px] font-medium mt-1">วันนี้</span>
          </button>
          <button onClick={() => setView('history')} className={`flex flex-col items-center p-2 rounded-lg w-full ${view === 'history' ? 'text-amber-600 bg-amber-50' : 'text-stone-400'}`}>
             <History size={24} />
             <span className="text-[10px] font-medium mt-1">ประวัติ</span>
          </button>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
           <h2 className="text-2xl font-bold text-stone-800">
             {view === 'dashboard' ? `สรุปผลผลิต (${formatDate(selectedDate)})` : 'รายงานข้อมูลย้อนหลัง'}
           </h2>
           <p className="text-stone-500 text-sm mt-1">
             {view === 'dashboard' ? 'ตรวจสอบประสิทธิภาพการคัดแยกไข่ประจำวัน' : 'วิเคราะห์แนวโน้มและสรุปยอดรวมตามช่วงเวลา'}
           </p>
        </div>

        {view === 'dashboard' ? (
          <DailyDashboard 
            selectedDate={selectedDate} 
            log={currentLog} 
            setView={setView} 
            setDate={setSelectedDate} 
          />
        ) : (
          <HistoryView setView={setView} />
        )}
      </main>
    </div>
  );
};

export default App;