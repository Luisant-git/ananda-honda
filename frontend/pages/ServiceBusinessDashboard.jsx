import React, { useState } from 'react';

const ServiceBusinessDashboard = ({ data: dynamicData }) => {
  // Static data matching the user's dashboard image for initial layout
  const [defaultData] = useState({
    summary: {
      serviceVolume: 581,
      labour: 413834,
      stdParts: 463831,
      overallParts: 544376,
      lubrications: 86935,
      labourPerVehicle: 669,
      partsPerVehicle: 798,
      oilCount: 495,
      amc: 26,
      battery: 14,
      paintingPanels: 11,
      tyre: 23,
      startDate: '31-03-2023',
      todaysDate: '15-05-2026',
      reportDate: '30-04-2023',
      daysCompleted: 30,
      daysLeft: 1,
      daysInMonth: 31,
    },
    serviceVolume: [
      { type: 'Data For the Month', free01: '', free02: '', free03: '', paid: '', accidentRepairs: '', general: '', minor: '', total: '', withoutMinor: '' },
      { type: 'Target For the Month', free01: '', free02: '', free03: '', paid: '', accidentRepairs: '', general: '', minor: '', total: '', withoutMinor: '' },
      { type: 'Received Vehicles', free01: 54, free02: 64, free03: 48, paid: 312, accidentRepairs: 0, general: 146, minor: 34, total: 657, withoutMinor: 623 },
      { type: 'Invoice Pending', free01: 0, free02: 0, free03: 0, paid: 6, accidentRepairs: 0, general: 0, minor: 0, total: 6, withoutMinor: 6 },
      { type: 'Invoiced Vehicles', free01: 54, free02: 64, free03: 47, paid: 301, accidentRepairs: 0, general: 119, minor: 12, total: 593, withoutMinor: 581 },
      { type: 'Per Day Invoice', free01: 2, free02: 2, free03: 2, paid: 10, accidentRepairs: 0, general: 4, minor: 0, total: 20, withoutMinor: 19 },
      { type: 'Volume Service Rate', free01: 56, free02: 66, free03: 49, paid: 311, accidentRepairs: 0, general: 119, minor: 12, total: 613, withoutMinor: 600 },
    ],
    incomeTargetCount: [
      { particulars: '3 months Average Sale', battery: '', tyre: '', amc: '', painting: '' },
      { particulars: 'Target', battery: 120, tyre: 100, amc: 250, painting: 100 },
      { particulars: 'Achieved No', battery: 14, tyre: 23, amc: 26, painting: 11 },
      { particulars: 'Per Day Count Achieved', battery: 0, tyre: 1, amc: 1, painting: 0 },
      { particulars: 'Current Rate for the month', battery: 14, tyre: 21, amc: 27, painting: 11 },
    ],
    incomeParameters: [
      { particulars: 'Last 3 Months Average Achieve', serviceVolume: 2465, labour: 1775582, std: 1208698, overallParts: 1803685, lubrication: '', battery: '', batteryJet: '', tyre: '', amc: '', carbonCleaner: '', healthCard: '', painting: '', oilRevenue: '' },
      { particulars: 'Target', serviceVolume: 3000, labour: 1775582, std: 1250000, overallParts: 1820000, lubrication: '', battery: '', batteryJet: '', tyre: '', amc: '', carbonCleaner: '', healthCard: '', painting: '', oilRevenue: '' },
      { particulars: 'Achieved', serviceVolume: 581, labour: 413834, std: 463831, overallParts: 544376, lubrication: 86810, battery: 14831, batteryJet: 15132, tyre: 28314, amc: 23901, carbonCleaner: 22578, healthCard: 0, painting: 13207, oilRevenue: 86935 },
      { particulars: 'Per Day', serviceVolume: 19, labour: 13794, std: 15461, overallParts: 18146, lubrication: 2887, battery: 494, batteryJet: 504, tyre: 944, amc: 797, carbonCleaner: 753, healthCard: 0, painting: 440, oilRevenue: 2898 },
      { particulars: 'Rate for the month', serviceVolume: 600, labour: 427628, std: 479292, overallParts: 562522, lubrication: 89497, battery: 15325, batteryJet: 15636, tyre: 29258, amc: 24698, carbonCleaner: 23329, healthCard: 0, painting: 13647, oilRevenue: 89833 },
    ]
  });

  const data = dynamicData?.summary ? dynamicData : defaultData;

  return (
    <div className="w-full bg-white overflow-x-auto text-[10px] sm:text-xs font-sans border border-gray-300">
      <div className="min-w-max">
        {/* Top Header Summary Row */}
        <div className="flex border-b border-gray-300 text-white font-bold text-center">
          <div className="w-32 bg-purple-600 p-2 flex flex-col justify-center">
            <div>Service Volume</div>
            <div className="text-xl sm:text-2xl">{data.summary.serviceVolume}</div>
          </div>
          <div className="w-32 bg-orange-500 p-2 flex flex-col justify-center">
            <div>Labour</div>
            <div className="text-lg sm:text-xl">{data.summary.labour}</div>
          </div>
          <div className="w-32 bg-pink-500 p-2 flex flex-col justify-center">
            <div>Std parts</div>
            <div className="text-lg sm:text-xl">{data.summary.stdParts}</div>
          </div>
          <div className="w-32 bg-yellow-500 p-2 flex flex-col justify-center">
            <div>Overall parts</div>
            <div className="text-lg sm:text-xl">{data.summary.overallParts}</div>
          </div>
          <div className="w-32 bg-blue-500 p-2 flex flex-col justify-center">
            <div>Lubrications</div>
            <div className="text-lg sm:text-xl">{data.summary.lubrications}</div>
          </div>
          
          <div className="flex-1 grid grid-cols-7 border-l border-gray-300 bg-gray-500 text-white divide-x divide-gray-400">
            <div className="flex flex-col items-center justify-center p-1">
              <div className="text-[9px] leading-tight text-center">Labour Per<br/>vehicle</div>
              <div className="text-lg">{data.summary.labourPerVehicle}</div>
            </div>
            <div className="flex flex-col items-center justify-center p-1 bg-gray-400">
              <div className="text-[9px] leading-tight text-center">Parts Per<br/>vehicle</div>
              <div className="text-lg">{data.summary.partsPerVehicle}</div>
            </div>
            <div className="flex flex-col items-center justify-center p-1 bg-green-400 text-black">
              <div className="text-[9px] leading-tight">Oil Count</div>
              <div className="text-lg">{data.summary.oilCount}</div>
            </div>
            <div className="flex flex-col items-center justify-center p-1 bg-orange-300 text-black">
              <div className="text-[9px] leading-tight">AMC</div>
              <div className="text-lg">{data.summary.amc}</div>
            </div>
            <div className="flex flex-col items-center justify-center p-1 bg-indigo-400">
              <div className="text-[9px] leading-tight">Battery</div>
              <div className="text-lg">{data.summary.battery}</div>
            </div>
            <div className="flex flex-col items-center justify-center p-1 bg-blue-400">
              <div className="text-[9px] leading-tight text-center">Painting<br/>Panels</div>
              <div className="text-lg">{data.summary.paintingPanels}</div>
            </div>
            <div className="flex flex-col items-center justify-center p-1 bg-cyan-500">
              <div className="text-[9px] leading-tight">Tyre</div>
              <div className="text-lg">{data.summary.tyre}</div>
            </div>
          </div>
        </div>

        {/* Title and Dates Row */}
        <div className="flex border-b border-gray-300">
          <div className="flex-1 bg-gray-500 text-white font-bold text-lg sm:text-xl p-3 flex items-center justify-center uppercase tracking-wider border-r border-gray-300">
            ANANDA HONDA ATTIBELE - {data.summary.startDate === 'All Time' ? 'ALL TIME' : `${data.summary.startDate} to ${data.summary.reportDate}`}
          </div>
          <div className="w-[350px] grid grid-cols-4 bg-gray-400 text-white text-[9px] sm:text-[10px] text-center divide-x divide-gray-300">
            <div className="flex flex-col justify-between">
              <div className="p-1 border-b border-gray-300 font-semibold h-10 flex items-center justify-center">Start Date</div>
              <div className="p-1 bg-white text-black font-medium">{data.summary.startDate}</div>
            </div>
            <div className="flex flex-col justify-between">
              <div className="p-1 border-b border-gray-300 font-semibold h-10 flex items-center justify-center">Todays Date</div>
              <div className="p-1 bg-white text-black font-medium">{data.summary.todaysDate}</div>
            </div>
            <div className="flex flex-col justify-between">
              <div className="p-1 border-b border-gray-300 font-semibold h-10 flex items-center justify-center">Report Date</div>
              <div className="p-1 bg-white text-black font-medium">{data.summary.reportDate}</div>
            </div>
            <div className="flex flex-col justify-between">
              <div className="p-1 border-b border-gray-300 font-semibold h-10 flex items-center justify-center leading-tight">No of days<br/>completed</div>
              <div className="p-1 bg-white text-black font-medium">{data.summary.daysCompleted}</div>
            </div>
          </div>
          <div className="w-[120px] grid grid-cols-2 bg-gray-500 text-white text-[9px] sm:text-[10px] text-center divide-x divide-gray-400">
            <div className="flex flex-col justify-between">
              <div className="p-1 border-b border-gray-400 font-semibold h-10 flex items-center justify-center">No of days Left</div>
              <div className="p-1 bg-white text-black font-medium">{data.summary.daysLeft}</div>
            </div>
            <div className="flex flex-col justify-between">
              <div className="p-1 border-b border-gray-400 font-semibold h-10 flex items-center justify-center leading-tight">No of days in<br/>the month</div>
              <div className="p-1 bg-white text-black font-medium">{data.summary.daysInMonth}</div>
            </div>
          </div>
        </div>

        {/* Two Columns Section */}
        <div className="flex">
          {/* Left Column: Service Volume */}
          <div className="flex-1 border-r border-gray-300">
            <div className="bg-gray-300 text-black font-bold text-center py-2 border-b border-gray-400">Service Volume</div>
            <table className="w-full text-center divide-y divide-gray-300 border-b border-gray-300">
              <thead className="bg-gray-200 font-bold text-gray-800">
                <tr className="divide-x divide-gray-300">
                  <th className="py-2 px-2 text-left w-36">Service Types</th>
                  <th className="py-2 px-1">Free 01</th>
                  <th className="py-2 px-1">Free 02</th>
                  <th className="py-2 px-1">Free 03</th>
                  <th className="py-2 px-1">Paid</th>
                  <th className="py-2 px-1 leading-tight">Accident<br/>Repairs</th>
                  <th className="py-2 px-1">General</th>
                  <th className="py-2 px-1">Minor</th>
                  <th className="py-2 px-1">Total</th>
                  <th className="py-2 px-1 leading-tight">Without<br/>Minor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.serviceVolume.map((row, idx) => (
                  <tr key={idx} className="divide-x divide-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="py-2 px-2 text-left font-medium text-gray-700 bg-gray-100">{row.type}</td>
                    <td className="py-2 px-1 font-semibold">{row.free01}</td>
                    <td className="py-2 px-1 font-semibold">{row.free02}</td>
                    <td className="py-2 px-1 font-semibold">{row.free03}</td>
                    <td className="py-2 px-1 font-semibold text-red-600">{row.paid}</td>
                    <td className="py-2 px-1 font-semibold">{row.accidentRepairs}</td>
                    <td className="py-2 px-1 font-semibold text-green-600">{row.general}</td>
                    <td className="py-2 px-1 font-semibold text-red-500">{row.minor}</td>
                    <td className="py-2 px-1 font-bold bg-gray-50">{row.total}</td>
                    <td className="py-2 px-1 font-bold bg-gray-100">{row.withoutMinor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right Column: Income Parameters Target Count */}
          <div className="w-[470px]">
            <div className="bg-white text-black font-bold text-center py-2 border-b border-gray-300">Income Parameters Target Count</div>
            <table className="w-full text-center divide-y divide-gray-300 border-b border-gray-300">
              <thead className="bg-[#8A1538] text-white font-bold">
                <tr className="divide-x divide-[#A32A50]">
                  <th className="py-2 px-2 text-left w-40">Particulars</th>
                  <th className="py-2 px-2">Battery</th>
                  <th className="py-2 px-2">Tyre</th>
                  <th className="py-2 px-2">AMC</th>
                  <th className="py-2 px-2">Painting</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.incomeTargetCount.map((row, idx) => (
                  <tr key={idx} className="divide-x divide-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="py-2 px-2 text-left font-medium text-gray-700 bg-white">{row.particulars}</td>
                    <td className="py-2 px-2 font-semibold text-[#8A1538] bg-pink-50">{row.battery}</td>
                    <td className="py-2 px-2 font-semibold text-[#8A1538] bg-pink-50">{row.tyre}</td>
                    <td className="py-2 px-2 font-semibold text-[#8A1538] bg-pink-50">{row.amc}</td>
                    <td className="py-2 px-2 font-semibold text-[#8A1538] bg-pink-50">{row.painting}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={5} className="bg-[#8A1538] h-9"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Section: Income Parameters */}
        <div className="bg-cyan-400 text-black font-bold text-center py-1.5 border-b border-gray-400">Income Parameters</div>
        <table className="w-full text-center divide-y divide-gray-300">
          <thead className="bg-gray-500 text-white text-[10px]">
            <tr className="divide-x divide-gray-400">
              <th className="py-2 px-2 text-left w-36">Particulars</th>
              <th className="py-2 px-1 leading-tight">Service<br/>Volume</th>
              <th className="py-2 px-1">Labour</th>
              <th className="py-2 px-1">STD</th>
              <th className="py-2 px-1 leading-tight">Overall<br/>Parts</th>
              <th className="py-2 px-1">Lubrication</th>
              <th className="py-2 px-1">Battery</th>
              <th className="py-2 px-1 leading-tight">Battery<br/>Jet</th>
              <th className="py-2 px-1">Tyre</th>
              <th className="py-2 px-1">AMC</th>
              <th className="py-2 px-1 leading-tight">Carbon<br/>Cleaner</th>
              <th className="py-2 px-1 leading-tight">Health<br/>Card</th>
              <th className="py-2 px-1">Painting</th>
              <th className="py-2 px-1 bg-gray-600">Oil Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.incomeParameters.map((row, idx) => (
              <tr key={idx} className="divide-x divide-gray-200 hover:bg-gray-50 transition-colors">
                <td className="py-2 px-2 text-left font-medium text-gray-700 bg-gray-100">{row.particulars}</td>
                <td className="py-2 px-1 font-semibold">{row.serviceVolume}</td>
                <td className="py-2 px-1 font-semibold">{row.labour}</td>
                <td className="py-2 px-1 font-semibold">{row.std}</td>
                <td className="py-2 px-1 font-semibold">{row.overallParts}</td>
                <td className="py-2 px-1 font-semibold">{row.lubrication}</td>
                <td className="py-2 px-1 font-semibold">{row.battery}</td>
                <td className="py-2 px-1 font-semibold">{row.batteryJet}</td>
                <td className="py-2 px-1 font-semibold">{row.tyre}</td>
                <td className="py-2 px-1 font-semibold">{row.amc}</td>
                <td className="py-2 px-1 font-semibold">{row.carbonCleaner}</td>
                <td className="py-2 px-1 font-semibold">{row.healthCard}</td>
                <td className="py-2 px-1 font-semibold">{row.painting}</td>
                <td className="py-2 px-1 font-bold bg-gray-50">{row.oilRevenue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Workshop Report Graph */}
      {data.dailyTrend && (
        <div className="mt-8">
          <WorkshopReportGraph dailyTrend={data.dailyTrend} />
        </div>
      )}
    </div>
  );
};

const WorkshopReportGraph = ({ dailyTrend }) => {
  if (!dailyTrend || dailyTrend.length === 0) return null;

  // Calculate max value for scaling, default to 70 as per image
  const maxVal = Math.max(70, ...dailyTrend.map(d => (d.received || 0) + (d.pending || 0) + (d.invoiced || 0)));
  
  return (
    <div className="bg-[#666666] p-4 sm:p-6 rounded-sm shadow-xl border border-gray-500 overflow-x-auto mb-8">
      <h3 className="text-white text-center text-sm sm:text-lg font-medium mb-8 tracking-wide">
        Total Received Vehicles, Pending Vehicles and Invoiced as per Workshop report
      </h3>
      
      <div className="flex items-start gap-2 min-w-[900px] px-2">
        {/* Y-Axis Labels */}
        <div className="flex flex-col justify-between h-[250px] text-white text-[9px] font-bold pr-2 pb-6 select-none">
          {[70, 60, 50, 40, 30, 20, 10, 0].map(val => (
            <div key={val} className="flex items-center justify-end h-0">
              <span className="mr-1">{val}</span>
              <div className="w-1.5 h-[1px] bg-white/50"></div>
            </div>
          ))}
        </div>

        {/* Chart Area */}
        <div className="flex-1 relative h-[250px] border-l border-b border-gray-400 flex items-end px-2 gap-1.5 bg-black/10">
          {/* Horizontal Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
            {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
              <div key={i} className="w-full border-t border-white/10 h-0"></div>
            ))}
          </div>

          {dailyTrend.map((day, idx) => {
            const total = (day.received || 0) + (day.pending || 0) + (day.invoiced || 0);
            const hReceived = ((day.received || 0) / maxVal) * 100;
            const hPending = ((day.pending || 0) / maxVal) * 100;
            const hInvoiced = ((day.invoiced || 0) / maxVal) * 100;
            
            return (
              <div key={idx} className="flex flex-col items-center flex-1 min-w-[26px] group relative h-full">
                {/* The Stacked Bar */}
                <div className="w-full h-full flex flex-col justify-end items-center mb-1">
                  <div className="w-4 flex flex-col justify-end shadow-2xl transition-all duration-300 group-hover:scale-y-105 origin-bottom">
                    {/* Invoiced - Yellow */}
                    {day.invoiced > 0 && (
                      <div 
                        className="bg-[#FFB700] border-t border-x border-black/30 flex items-center justify-center text-[7px] font-bold text-black overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]" 
                        style={{ height: `${hInvoiced}%` }}
                        title={`Invoiced: ${day.invoiced}`}
                      >
                        {day.invoiced}
                      </div>
                    )}
                    {/* Pending - Red */}
                    {day.pending > 0 && (
                      <div 
                        className="bg-[#D32F2F] border-x border-black/30 flex items-center justify-center text-[7px] font-bold text-white overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]" 
                        style={{ height: `${hPending}%` }}
                        title={`Pending: ${day.pending}`}
                      >
                        {day.pending}
                      </div>
                    )}
                    {/* Received - Blue */}
                    {day.received > 0 && (
                      <div 
                        className="bg-[#2196F3] border-b border-x border-black/30 flex items-center justify-center text-[7px] font-bold text-black overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]" 
                        style={{ height: `${hReceived}%` }}
                        title={`Received: ${day.received}`}
                      >
                        {day.received}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* X-Axis Date Label */}
                <div className="absolute top-full mt-2 left-1/2 transform -rotate-45 origin-top-left text-white text-[8px] whitespace-nowrap opacity-70 group-hover:opacity-100 group-hover:font-bold transition-all">
                  {day.date}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend Panel */}
        <div className="w-52 flex flex-col gap-4 ml-6 mt-12 bg-black/20 p-4 rounded border border-white/5">
          <div className="flex items-center gap-3 group cursor-default">
            <div className="w-3.5 h-3.5 bg-[#FFB700] border border-black/40 shadow-md group-hover:scale-110 transition-transform"></div>
            <span className="text-white text-[9px] font-medium leading-tight">Invoiced as per Workshop report</span>
          </div>
          <div className="flex items-center gap-3 group cursor-default">
            <div className="w-3.5 h-3.5 bg-[#D32F2F] border border-black/40 shadow-md group-hover:scale-110 transition-transform"></div>
            <span className="text-white text-[9px] font-medium leading-tight">Pending Vehicles</span>
          </div>
          <div className="flex items-center gap-3 group cursor-default">
            <div className="w-3.5 h-3.5 bg-[#2196F3] border border-black/40 shadow-md group-hover:scale-110 transition-transform"></div>
            <span className="text-white text-[9px] font-medium leading-tight">Total Received Vehicles</span>
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/10 text-[8px] text-white/40 italic">
            * Data aggregated daily from service logs
          </div>
        </div>
      </div>
      
      {/* Bottom spacer for rotated labels */}
      <div className="h-16"></div>
    </div>
  );
};

export default ServiceBusinessDashboard;
