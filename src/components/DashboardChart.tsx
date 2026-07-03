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
import { useAppTheme } from "@/components/ThemeContext";

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
  const { theme } = useAppTheme();
  const isLight = theme === "light";
  const axisColor = isLight ? "rgba(15,23,42,0.5)" : "rgba(255,255,255,0.3)";
  const gridColor = isLight ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.05)";
  const tooltipBg = isLight ? "rgba(255,255,255,0.97)" : "rgba(15, 23, 42, 0.9)";
  const tooltipBorder = isLight ? "rgba(15,23,42,0.12)" : "rgba(255,255,255,0.1)";
  const tooltipText = isLight ? "#0f172a" : "#fff";
  return (
    <div className="w-full h-full min-h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38E8B0" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#38E8B0" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis
            dataKey="name"
            stroke={axisColor}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={axisColor}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: "8px",
              boxShadow: isLight ? "0 4px 20px rgba(15,23,42,0.12)" : "0 4px 20px rgba(0,0,0,0.5)"
            }}
            itemStyle={{ color: tooltipText, fontWeight: "bold" }}
          />
          <Area 
            type="monotone" 
            dataKey="tickets" 
            stroke="#38E8B0"
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorTickets)" 
            activeDot={{ r: 6, fill: "#5EEAD4", stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
