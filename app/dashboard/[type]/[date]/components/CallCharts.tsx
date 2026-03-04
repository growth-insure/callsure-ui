"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { useCallDetailsStore } from "../store/store";
import PieChart from "./PieChart";
// import {
//   Bar,
//   BarChart,
//   Cell,
//   Legend,
//   Pie,
//   // PieChart,
//   ResponsiveContainer,
//   XAxis,
//   YAxis,
// } from "recharts";
import ResolutionMeter from "@/components/ResolutionMeter";
import CallDirectionChart from "./CallDirectioinChart";
import CallFrequencyChart from "./CallFrequencyChart";

export default function CallCharts() {
  const chartData = useCallDetailsStore((state) => state.chartData);
  // const chartConfig = { theme: "light" };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      {/* <Card>
        <CardHeader>
          <CardTitle>Insurance Coverage Types</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-[300px]" config={chartConfig}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData.insuranceData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  label={({ name, value }) => `${name} ${value}%`}
                  labelLine={false}
                >
                  {chartData.insuranceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip
                  formatter={(value, name, entry: any) =>
                    `${entry.payload.count} (${value}%)`
                  }
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card> */}

      <PieChart data={chartData.insuranceData} />

      {/* <Card>
        <CardHeader>
          <CardTitle>Call Direction Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-[300px]" config={chartConfig}>
            <ResponsiveContainer>
              <BarChart data={chartData.callDirectionData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Legend />
                <ChartTooltip />
                <Bar
                  dataKey="outbound"
                  fill="#2196F3" // Exact blue color
                  name="Outbound Calls"
                  radius={[4, 4, 0, 0]}
                  barSize={60}
                />
                <Bar
                  dataKey="inbound"
                  fill="#FFC107" // Exact yellow color
                  name="Inbound Calls"
                  radius={[4, 4, 0, 0]}
                  barSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card> */}

      <CallDirectionChart data={chartData.callDirectionData} />

      {/*  <Card>
        <CardHeader>
          <CardTitle>Call Frequency Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-[300px]" config={chartConfig}>
            <ResponsiveContainer>
              <BarChart data={chartData.callFrequencyData}>
                <XAxis
                  dataKey="hour"
                  label={{
                    value: "Hour of Day",
                    position: "insideBottom",
                    offset: -10,
                  }}
                />
                <YAxis
                  label={{
                    value: "Number of Calls",
                    angle: -90,
                    position: "insideLeft",
                  }}
                  allowDecimals={false}
                  domain={[0, 4]}
                  ticks={[0, 1, 2, 3, 4]}
                />
                <Bar
                  dataKey="calls"
                  fill="#2196F3"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
                <ChartTooltip />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card> */}

      <CallFrequencyChart data={chartData.callFrequencyData} />

      <Card>
        <CardHeader>
          <CardTitle>Issue Resolution Score (%)</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center pt-6">
          <ResolutionMeter value={chartData.resolutionScore} />
        </CardContent>
      </Card>
    </div>
  );
}