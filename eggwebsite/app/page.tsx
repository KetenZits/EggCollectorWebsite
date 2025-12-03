'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';

// --- 1. TYPESCRIPT TYPES & DATA MOCKUP ---

// Define specific types for egg sizes and log data
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
const EGG_COLORS: Record<EggSize, string> = {
    '0': 'bg-yellow-400', '1': 'bg-teal-500', '2': 'bg-red-500',
    '3': 'bg-blue-500', '4': 'bg-purple-500', '5': 'bg-slate-500'
};
const ACCENT_COLOR = 'bg-amber-100'; // สีเนื้อ/ครีมอ่อน
const BRAND_COLOR = 'bg-amber-500'; // สีสำหรับปุ่ม/เน้น

// --- 2. UTILITY FUNCTIONS ---
const formatNumber = (num: number | string): string => {
    // Handle potential string inputs from toFixed
    const numericValue = typeof num === 'string' ? parseFloat(num) : num;
    return new Intl.NumberFormat('th-TH').format(numericValue);
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

// --- 3. COMPONENTS ---

// Component สำหรับ Tooltip
interface ChartTooltipProps {
    content: string;
    x: number;
    y: number;
    visible: boolean;
}
const ChartTooltip: React.FC<ChartTooltipProps> = ({ content, x, y, visible }) => {
    return (
        <div
            style={{ left: x, top: y }}
            className={`absolute z-20 p-2 bg-neutral-800 text-white text-xs rounded-lg shadow-xl pointer-events-none transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'} transform -translate-x-1/2 -translate-y-full whitespace-nowrap`}
        >
            {content}
        </div>
    );
};

// Card สำหรับสรุปข้อมูลตัวเลขรายวัน
interface SummaryCardProps {
    title: string;
    value: number | string;
    unit: string;
    icon: string;
}
const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, unit, icon }) => (
    <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-amber-300 transition-all hover:shadow-lg">
        <div className="flex items-center space-x-3 mb-2">
            <span className="text-amber-500">{icon}</span>
            <p className="text-sm font-medium text-neutral-500 uppercase tracking-wider">{title}</p>
        </div>
        <div className="flex items-end">
            <p className="text-4xl font-extrabold text-neutral-800 mr-2">{formatNumber(value)}</p>
            <p className="text-md text-neutral-600 pb-1">{unit}</p>
        </div>
    </div>
);

// Component จำลองกราฟแท่งสำหรับแสดงผลรายวัน พร้อม Tooltip
interface MockBarChartProps {
    data: BreakdownItem[];
}
const MockBarChart: React.FC<MockBarChartProps> = ({ data }) => {
    const maxCount = Math.max(...data.map(d => d.count)) * 1.1; // 10% buffer
    const [tooltip, setTooltip] = useState<{ visible: boolean, x: number, y: number, content: string }>({ visible: false, x: 0, y: 0, content: '' });
    const chartRef = useRef<HTMLDivElement>(null);

    return (
        <div ref={chartRef} className="relative h-72 w-full p-4">
            {/* Chart Bars - ปรับจาก ml-16 เป็น ml-4 */}
            <div className="flex space-x-4 h-full items-end ml-4">
                {data.map((item, index) => (
                    <div 
                        key={item.size} 
                        className="flex flex-col items-center group cursor-pointer w-1/6 h-full relative"
                        onMouseMove={(e) => {
                            if (chartRef.current) {
                                const chartRect = chartRef.current.getBoundingClientRect();
                                const x = e.clientX - chartRect.left;
                                const y = e.clientY - chartRect.top;
                                setTooltip({
                                    visible: true,
                                    x: x, 
                                    y: y,
                                    content: `เบอร์ ${item.size}: ${formatNumber(item.count)} (${item.percent}%)`
                                });
                            }
                        }}
                        onMouseLeave={() => setTooltip({ ...tooltip, visible: false })}
                    >
                        {/* Bar */}
                        <div
                            style={{ height: `${(item.count / maxCount) * 100}%`, backgroundColor: EGG_COLORS[item.size] ? '' : '' }}
                            className={`w-full rounded-t-md transition-all duration-300 hover:scale-y-[1.05] relative ${EGG_COLORS[item.size]}`}
                        >
                        </div>
                        <span className="text-sm font-medium mt-1 text-neutral-600">เบอร์ {item.size}</span>
                    </div>
                ))}
            </div>
            
            {/* Tooltip Render */}
            {tooltip.visible && <ChartTooltip x={tooltip.x} y={tooltip.y} content={tooltip.content} visible={tooltip.visible} />}
        </div>
    );
};

// Component จำลองกราฟเส้นสำหรับข้อมูลย้อนหลัง พร้อม Tooltip
interface MockLineChartProps {
    data: DailyLog[];
}
const MockLineChart: React.FC<MockLineChartProps> = ({ data }) => {
    const maxTotal = Math.max(...data.map(d => d.total_sorted)) * 1.1; // 10% buffer
    const minTotal = Math.min(...data.map(d => d.total_sorted));
    const [hoveredPoint, setHoveredPoint] = useState<DailyLog | null>(null);
    const [tooltipPos, setTooltipPos] = useState<{ x: number, y: number, content: string, visible: boolean }>({ x: 0, y: 0, content: '', visible: false });
    const chartRef = useRef<HTMLDivElement>(null);
    
    const yAxisRange = maxTotal - minTotal;
    const yAxisValues = [0, 0.25, 0.5, 0.75, 1].map(ratio => Math.round(minTotal + yAxisRange * ratio));
    
    if (data.length === 0) return null;

    const getRelativeY = (value: number) => 10 + 80 * (1 - (value - minTotal) / yAxisRange); // 10% padding top/bottom (10 to 90)
    const getRelativeX = (index: number) => (index / (data.length - 1)) * 100;

    const points = data.map((d, i) => {
        const x = getRelativeX(i);
        const y = getRelativeY(d.total_sorted);
        return { data: d, x, y };
    });
    
    const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

    const handlePointHover = (e: React.MouseEvent<SVGCircleElement, MouseEvent>, p: typeof points[0]) => {
        if (chartRef.current) {
            const chartRect = chartRef.current.getBoundingClientRect();
            // Adjust X for left padding (16px from pl-16)
            const x = (e.clientX - chartRect.left) - 16; 
            const y = e.clientY - chartRect.top; 
            setTooltipPos({ 
                x: x, 
                y: y, 
                content: `วันที่ ${p.data.date}: ${formatNumber(p.data.total_sorted)} ฟอง`,
                visible: true
            });
            setHoveredPoint(p.data);
        }
    };

    const handleMouseLeave = () => {
        setTooltipPos({ ...tooltipPos, visible: false });
        setHoveredPoint(null);
    };

    return (
        <div ref={chartRef} className="relative p-4 border border-neutral-200 rounded-lg bg-white h-96 flex flex-col justify-center items-center">
            <div className="text-lg font-semibold text-neutral-700 mb-4">แนวโน้มจำนวนคัดแยกทั้งหมด (รายวัน)</div>
            <div className="relative w-full h-full pb-8"> {/* Adjusted padding for X-axis labels */}
                
                {/* Y-Axis Labels */}
                <div className="absolute inset-y-0 w-16 left-0 text-right pr-2 pt-2 pb-8">
                    {yAxisValues.map((value, index) => {
                        const top = `${10 + 80 * (1 - index / (yAxisValues.length - 1))}%`;
                        return (
                            <span 
                                key={index} 
                                style={{ top: `calc(${top} - 0.5em)` }} // 0.5em offset for text center
                                className="absolute right-0 text-xs text-neutral-500"
                            >
                                {formatNumber(value)}
                            </span>
                        );
                    })}
                </div>

                <svg 
                    className="absolute inset-0 w-full h-full pl-16 pr-4 pb-8" 
                    viewBox="0 0 100 100" 
                    preserveAspectRatio="none"
                    onMouseLeave={handleMouseLeave}
                >
                    {/* Grid Lines */}
                    {[1, 2, 3, 4].map(i => (
                        <line key={`grid-${i}`} x1="0" y1={10 + 80 * i / 5} x2="100" y2={10 + 80 * i / 5} stroke="#f0f0f0" strokeDasharray="2,2" />
                    ))}

                    {/* Line Drawing */}
                    <polyline
                        fill="none"
                        stroke="#f59e0b" // สีส้มอำพัน
                        strokeWidth="2"
                        points={polylinePoints}
                    />

                    {/* Data Points and Hover Targets */}
                    {points.map((p, i) => (
                        <React.Fragment key={i}>
                            <circle cx={p.x} cy={p.y} r="2" fill="#f59e0b" stroke="white" strokeWidth="1.5" />
                            {/* Larger invisible circle for hover target */}
                            <circle 
                                cx={p.x} cy={p.y} r="5" fill="transparent"
                                onMouseEnter={(e) => handlePointHover(e, p)}
                            />
                        </React.Fragment>
                    ))}
                </svg>

                {/* X-Axis Labels (Dates) */}
                <div className="absolute bottom-0 left-16 right-4 flex justify-between h-8">
                    {data.map((d, i) => (
                        <span 
                            key={i} 
                            className="text-xs text-neutral-600 absolute"
                            style={{ left: `${getRelativeX(i)}%`, transform: 'translateX(-50%)' }}
                        >
                            {d.date.substring(5)}
                        </span>
                    ))}
                </div>
            </div>
            
            {/* Tooltip Render */}
            {tooltipPos.visible && <ChartTooltip x={tooltipPos.x} y={tooltipPos.y} content={tooltipPos.content} visible={tooltipPos.visible} />}
        </div>
    );
};


// --- 4. DAILY DASHBOARD PAGE ---
interface DailyDashboardProps {
    selectedDate: string;
    log: DailyLog | null;
    setView: (view: 'dashboard' | 'history') => void;
    setDate: (date: string) => void;
}
const DailyDashboard: React.FC<DailyDashboardProps> = ({ selectedDate, log, setView, setDate }) => {
    const breakdownData = useMemo(() => {
        return log ? calculateDailyBreakdown(log) : [];
    }, [log]);

    const totalSorted = log?.total_sorted || 0;
    const totalWeight = log?.total_weight_kg || 0;
    const avgWeight = totalSorted > 0 ? (totalWeight / totalSorted * 1000).toFixed(2) : '0.00'; // กรัม/ฟอง

    return (
        <div className="p-4 sm:p-8">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-4 border-b border-amber-200">
                <h1 className="text-3xl font-bold text-neutral-800">🥚 สรุปการคัดแยกประจำวัน</h1>
                <button
                    onClick={() => setView('history')}
                    className={`mt-4 sm:mt-0 px-6 py-2 rounded-full font-medium text-white transition-all shadow-md ${BRAND_COLOR} hover:bg-amber-600`}
                >
                    ดูข้อมูลย้อนหลัง
                </button>
            </header>

            {/* Date Selector */}
            <div className="mb-8 p-4 bg-white rounded-xl shadow-sm inline-block">
                <label className="text-neutral-700 mr-3 font-medium block sm:inline">วันที่ที่เลือก: </label>
                <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={(e) => setDate(e.target.value)}
                    className="border border-neutral-300 p-2 rounded-lg text-neutral-700 mt-2 sm:mt-0" 
                />
                {log === null && (
                    <p className="text-red-500 mt-2">ไม่พบข้อมูลสำหรับวันที่นี้</p>
                )}
            </div>

            {log && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        <SummaryCard 
                            title="จำนวนรวมที่คัดแยก" 
                            value={totalSorted} 
                            unit="ฟอง" 
                            icon="🔢"
                        />
                        <SummaryCard 
                            title="น้ำหนักรวม" 
                            value={totalWeight} 
                            unit="กก." 
                            icon="⚖️"
                        />
                        <SummaryCard 
                            title="น้ำหนักเฉลี่ยต่อฟอง" 
                            value={avgWeight} 
                            unit="กรัม" 
                            icon="🍳"
                        />
                    </div>

                    {/* Breakdown: Graph & Table */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-semibold text-neutral-800 mb-6 border-b pb-3">รายละเอียดตามเบอร์ไข่ ({log.date})</h2>
                        
                        <div className="mb-10">
                            <MockBarChart data={breakdownData} />
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-neutral-200 border border-neutral-200 rounded-lg">
                                <thead className={`text-neutral-800 ${ACCENT_COLOR}`}>
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">เบอร์ไข่</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider">จำนวนฟอง</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider">เปอร์เซ็นต์ (%)</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-neutral-100">
                                    {breakdownData.map((item) => (
                                        <tr key={item.size} className="hover:bg-neutral-50 transition duration-100">
                                            <td className="px-6 py-3 whitespace-nowrap font-medium text-neutral-800">
                                                <span className={`inline-block w-3 h-3 rounded-full mr-3 ${EGG_COLORS[item.size]}`}></span>
                                                เบอร์ {item.size}
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap text-right text-sm text-neutral-700">
                                                {formatNumber(item.count)}
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap text-right text-sm text-neutral-700">
                                                {item.percent}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className={`font-bold ${BRAND_COLOR}/30`}>
                                        <td className='px-6 py-3 text-left text-neutral-800'>รวม</td>
                                        <td className='px-6 py-3 text-right text-neutral-800'>{formatNumber(totalSorted)}</td>
                                        <td className='px-6 py-3 text-right text-neutral-800'>100.00%</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};


// --- 5. HISTORICAL SUMMARY PAGE ---
interface HistoricalSummaryProps {
    setView: (view: 'dashboard' | 'history') => void;
}
const HistoricalSummary: React.FC<HistoricalSummaryProps> = ({ setView }) => {
    // กำหนดช่วงเวลาเริ่มต้นและสิ้นสุด
    const defaultEndDate = MOCK_DATA_SOURCE[MOCK_DATA_SOURCE.length - 1].date;
    const defaultStartDate = MOCK_DATA_SOURCE[0].date;
    
    const [startDate, setStartDate] = useState<string>(defaultStartDate);
    const [endDate, setEndDate] = useState<string>(defaultEndDate);
    const [filterData, setFilterData] = useState<DailyLog[]>(MOCK_DATA_SOURCE);

    // ฟังก์ชันกรองข้อมูลตามช่วงเวลา
    const handleFilter = useCallback(() => {
        const filtered = MOCK_DATA_SOURCE.filter(log => log.date >= startDate && log.date <= endDate);
        setFilterData(filtered);
    }, [startDate, endDate]);

    // สรุปข้อมูลรวมสำหรับช่วงเวลาที่เลือก
    const aggregateSummary = useMemo(() => {
        const totalSorted = filterData.reduce((sum, log) => sum + log.total_sorted, 0);
        const totalWeight = filterData.reduce((sum, log) => sum + log.total_weight_kg, 0);
        const days = filterData.length;
        const avgPerDay = days > 0 ? (totalSorted / days).toFixed(0) : 0;

        const breakdown: Record<string, number> = {};
        filterData.forEach(log => {
            EGG_SIZES.forEach(size => {
                breakdown[size] = (breakdown[size] || 0) + (log.breakdown[size] || 0);
            });
        });
        
        const breakdownArray: BreakdownItem[] = EGG_SIZES.map(size => ({
            size,
            count: breakdown[size] || 0,
            percent: totalSorted > 0 ? ((breakdown[size] / totalSorted) * 100).toFixed(2) : '0.00'
        }));

        return { totalSorted, totalWeight, days, avgPerDay, breakdownArray };
    }, [filterData]);


    return (
        <div className="p-4 sm:p-8">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-4 border-b border-amber-200">
                <h1 className="text-3xl font-bold text-neutral-800">📊 สรุปข้อมูลย้อนหลัง</h1>
                <button
                    onClick={() => setView('dashboard')}
                    className="mt-4 sm:mt-0 px-6 py-2 rounded-full font-medium text-neutral-700 bg-neutral-200 hover:bg-neutral-300 transition-all shadow-md"
                >
                    กลับหน้า Dashboard
                </button>
            </header>

            {/* Date Range Selector */}
            <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
                <h2 className="text-xl font-semibold text-neutral-800 mb-4">กำหนดขอบเขตระยะเวลา</h2>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                    <label className="block">
                        <span className="text-neutral-700">วันเริ่มต้น:</span>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2 border rounded-lg mt-1" />
                    </label>
                    <label className="block">
                        <span className="text-neutral-700">วันสิ้นสุด:</span>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2 border rounded-lg mt-1" />
                    </label>
                    <button 
                        onClick={handleFilter}
                        className={`w-full py-2 rounded-lg font-medium text-white shadow-md ${BRAND_COLOR} hover:bg-amber-600 transition-all`}
                    >
                        เรียกดูข้อมูล
                    </button>
                    <button 
                        onClick={() => {setStartDate(defaultStartDate); setEndDate(defaultEndDate); handleFilter()}}
                        className="w-full py-2 rounded-lg font-medium text-neutral-700 bg-neutral-100 border border-neutral-300 hover:bg-neutral-200 transition-all"
                    >
                        รีเซ็ต
                    </button>
                </div>
            </div>
            
            {filterData.length > 0 ? (
                <>
                    {/* Historical Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
                        <h2 className="text-2xl font-semibold text-neutral-800 mb-4 border-b pb-2">กราฟจำนวนคัดแยกรายวัน (ช่วง {startDate} ถึง {endDate})</h2>
                        <MockLineChart data={filterData} />
                    </div>
                    
                    {/* Aggregate Summary Table */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-semibold text-neutral-800 mb-4 border-b pb-2">ตารางสรุปข้อมูลรวม</h2>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            <SummaryCard 
                                title="จำนวนรวมทั้งหมด" 
                                value={aggregateSummary.totalSorted} 
                                unit="ฟอง" 
                                icon="📈"
                            />
                            <SummaryCard 
                                title="เฉลี่ยต่อวัน" 
                                value={aggregateSummary.avgPerDay} 
                                unit="ฟอง" 
                                icon="🗓️"
                            />
                            <SummaryCard 
                                title="จำนวนวันบันทึก" 
                                value={aggregateSummary.days} 
                                unit="วัน" 
                                icon="⏳"
                            />
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-neutral-200 border border-neutral-200 rounded-lg">
                                <thead className={`text-neutral-800 ${ACCENT_COLOR}`}>
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">เบอร์ไข่</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider">จำนวนรวม (ฟอง)</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider">สัดส่วนรวม (%)</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-neutral-100">
                                    {aggregateSummary.breakdownArray.map((item) => (
                                        <tr key={item.size} className="hover:bg-neutral-50 transition duration-100">
                                            <td className="px-6 py-3 whitespace-nowrap font-medium text-neutral-800">
                                                <span className={`inline-block w-3 h-3 rounded-full mr-3 ${EGG_COLORS[item.size]}`}></span>
                                                เบอร์ {item.size}
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap text-right text-sm text-neutral-700">
                                                {formatNumber(item.count)}
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap text-right text-sm text-neutral-700">
                                                {item.percent}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className={`font-bold ${BRAND_COLOR}/30`}>
                                        <td className='px-6 py-3 text-left text-neutral-800'>รวมทั้งหมด</td>
                                        <td className='px-6 py-3 text-right text-neutral-800'>{formatNumber(aggregateSummary.totalSorted)}</td>
                                        <td className='px-6 py-3 text-right text-neutral-800'>100.00%</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        
                        <div className="mt-6 text-right">
                            <button className="bg-neutral-700 text-white py-2 px-4 rounded-lg hover:bg-neutral-800 transition duration-150 shadow-md">
                                ⬇️ Export ข้อมูล (CSV/Excel)
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="text-center p-10 bg-white rounded-xl shadow-lg text-neutral-600">
                    ไม่พบข้อมูลในช่วงวันที่ที่เลือก กรุณาลองเลือกช่วงเวลาอื่น
                </div>
            )}

        </div>
    );
};


// --- 6. MAIN APP COMPONENT ---

const App: React.FC = () => {
    // State สำหรับจำลองการเปลี่ยนหน้า: 'dashboard' หรือ 'history'
    const [view, setView] = useState<'dashboard' | 'history'>('dashboard'); 
    
    // State สำหรับเลือกวันที่ใน Dashboard
    const latestDate = MOCK_DATA_SOURCE[MOCK_DATA_SOURCE.length - 1].date;
    const [selectedDate, setSelectedDate] = useState<string>(latestDate);

    // ดึงข้อมูล Log ของวันที่เลือก
    const currentLog: DailyLog | null = useMemo(() => {
        return MOCK_DATA_SOURCE.find(log => log.date === selectedDate) || null;
    }, [selectedDate]);

    return (
        <div className="min-h-screen bg-stone-50 font-sans antialiased">
            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto">
                {view === 'dashboard' && (
                    <DailyDashboard 
                        selectedDate={selectedDate} 
                        log={currentLog} 
                        setView={setView} 
                        setDate={setSelectedDate} 
                    />
                )}
                {view === 'history' && (
                    <HistoricalSummary setView={setView} />
                )}
            </main>
        </div>
    );
};

export default App;