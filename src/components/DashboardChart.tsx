"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const data = [
  { name: "Mon", tickets: 12 },
  { name: "Tue", tickets: 19 },
  { name: "Wed", tickets: 15 },
  { name: "Thu", tickets: 22 },
  { name: "Fri", tickets: 28 },
  { name: "Sat", tickets: 10 },
  { name: "Sun", tickets: 8 },
];

export default function DashboardChart() {
  return (
    <div className="w-full h-full min-h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="rgba(255,255,255,0.3)" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.3)" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "rgba(15, 23, 42, 0.9)", 
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)"
            }}
            itemStyle={{ color: "#fff", fontWeight: "bold" }}
          />
          <Area 
            type="monotone" 
            dataKey="tickets" 
            stroke="#a78bfa" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorTickets)" 
            activeDot={{ r: 6, fill: "#c4b5fd", stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
