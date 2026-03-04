// "use client";

// import { useParams, useRouter } from "next/navigation";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Home } from "lucide-react";
// import Navbar from "../../components/Navbar";
// import CallDetailsTable from "../../components/CallDetailsTable";
// import {
//   Bar,
//   BarChart,
//   Cell,
//   Pie,
//   PieChart,
//   XAxis,
//   YAxis,
//   Legend,
//   ResponsiveContainer,
// } from "recharts";
// import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
// import { useEffect, useRef } from "react";
// import { init } from "echarts";
// import type { EChartsOption } from "echarts";
// import ResolutionMeter from "@/components/ResolutionMeter";

// const chartConfig = {
//   inbound: {
//     color: "hsl(var(--chart-1))",
//     label: "Inbound Calls",
//   },
//   outbound: {
//     color: "hsl(var(--chart-2))",
//     label: "Outbound Calls",
//   },
//   home: {
//     color: "hsl(var(--chart-yellow))",
//     label: "Home Insurance",
//   },
//   auto: {
//     color: "hsl(var(--chart-2))",
//     label: "Auto Insurance",
//   },
//   rental: {
//     color: "hsl(var(--chart-1))",
//     label: "Rental Insurance",
//   },
//   business: {
//     color: "hsl(var(--chart-amber))",
//     label: "Business Insurance",
//   },
// };
// interface CallMetrics {
//   totalCalls: number;
//   outboundCalls: number;
//   inboundCalls: number;
//   averageDuration: number;
//   needsAttention: number;
// }

// const CallDetails = () => {
//   const router = useRouter();
//   const params = useParams();
//   const { type = "", date = "" } = params as { type?: string; date?: string };

//   // This would normally come from an API
//   const metrics: CallMetrics = {
//     totalCalls: 23,
//     outboundCalls: 13,
//     inboundCalls: 10,
//     averageDuration: 3.42,
//     needsAttention: 23,
//   };

//   const formatDate = (dateString: string): string => {
//     const date = new Date(dateString);
//     return isNaN(date.getTime())
//       ? "Invalid Date"
//       : date.toLocaleDateString("en-US", {
//           year: "numeric",
//           month: "long",
//           day: "numeric",
//         });
//   };

//   const capitalizeFirstLetter = (string: string): string => {
//     return string.charAt(0).toUpperCase() + string.slice(1);
//   };
//   const insuranceData = [
//     { name: "Home", value: 45, color: "hsl(var(--chart-yellow))" },
//     { name: "Auto", value: 30, color: "hsl(var(--chart-2))" },
//     { name: "Rental", value: 15, color: "hsl(var(--chart-1))" },
//     { name: "Business", value: 10, color: "hsl(var(--chart-amber))" },
//   ];

//   const callDirectionData = [
//     { name: "Archana", inbound: 12, outbound: 3 },
//     { name: "Mandeep", inbound: 3, outbound: 4 },
//   ];

//   const callFrequencyData = [
//     { hour: "00", calls: 0 },
//     { hour: "01", calls: 0 },
//     { hour: "02", calls: 0 },
//     { hour: "03", calls: 0 },
//     { hour: "04", calls: 0 },
//     { hour: "05", calls: 0 },
//     { hour: "06", calls: 0 },
//     { hour: "07", calls: 0 },
//     { hour: "08", calls: 0 },
//     { hour: "09", calls: 3 },
//     { hour: "10", calls: 1 },
//     { hour: "11", calls: 2 },
//     { hour: "12", calls: 2 },
//     { hour: "13", calls: 2 },
//     { hour: "14", calls: 4 },
//     { hour: "15", calls: 3 },
//     { hour: "16", calls: 4 },
//     { hour: "17", calls: 4 },
//     { hour: "18", calls: 0 },
//     { hour: "19", calls: 0 },
//     { hour: "20", calls: 0 },
//     { hour: "21", calls: 0 },
//     { hour: "22", calls: 0 },
//     { hour: "23", calls: 0 },
//   ];

//   const chartRef = useRef<HTMLDivElement>(null);
//   const gaugeValue = 39.13;
//   useEffect(() => {
//     // Initialize chart
//     let chart: echarts.ECharts | undefined;
//     if (chartRef.current !== null) {
//       chart = init(chartRef.current);
//     }

//     // Chart configuration
//     const option: EChartsOption = {
//       series: [
//         {
//           type: "gauge",
//           startAngle: 180,
//           endAngle: 0,
//           min: 0,
//           max: 90,
//           splitNumber: 9,
//           radius: "100%",
//           axisLine: {
//             lineStyle: {
//               width: 16,
//               color: [
//                 [gaugeValue / 90, "hsl(var(--primary))"],
//                 [1, "hsl(var(--muted) / 0.2)"],
//               ],
//             },
//           },
//           pointer: {
//             icon: "path://M2090.36389,615.30999 L2090.36389,615.30999 C2091.48372,615.30999 2092.40383,616.194028 2092.44859,617.312956 L2096.90698,728.755929 C2097.05155,732.369577 2094.2393,735.416212 2090.62566,735.56078 C2090.53845,735.564269 2090.45117,735.566014 2090.36389,735.566014 L2090.36389,735.566014 C2086.74736,735.566014 2083.81557,732.63423 2083.81557,729.017692 C2083.81557,728.930412 2083.81732,728.84314 2083.82081,728.755929 L2088.2792,617.312956 C2088.32396,616.194028 2089.24407,615.30999 2090.36389,615.30999 Z",
//             length: "60%",
//             width: 4,
//             offsetCenter: [0, 0],
//             itemStyle: {
//               color: "hsl(var(--foreground))",
//             },
//           },
//           axisTick: {
//             length: 8,
//             lineStyle: {
//               color: "hsl(var(--muted-foreground))",
//               width: 1,
//             },
//           },
//           splitLine: {
//             length: 12,
//             lineStyle: {
//               color: "hsl(var(--muted-foreground))",
//               width: 2,
//             },
//           },
//           axisLabel: {
//             color: "hsl(var(--muted-foreground))",
//             distance: 25,
//             fontSize: 12,
//           },
//           detail: {
//             valueAnimation: true,
//             formatter: "{value}",
//             color: "hsl(var(--foreground))",
//             fontSize: 24,
//             fontWeight: "bold",
//             offsetCenter: [0, "70%"],
//           },
//           data: [
//             {
//               value: gaugeValue,
//               name: "Score",
//             },
//           ],
//         },
//       ],
//     };

//     // Set chart option
//     chart?.setOption(option);

//     // Cleanup
//     return () => {
//       chart?.dispose();
//     };
//   }, [gaugeValue]);
//   return (
//     <>
//       <Navbar />
//       <div className="max-w-7xl mx-auto p-6">
//         {/* Breadcrumb */}
//         <div className="flex items-center gap-2 text-sm mb-6">
//           <Button
//             variant="ghost"
//             size="sm"
//             className="gap-2"
//             onClick={() => router.push("/dashboard")}
//           >
//             <Home className="h-4 w-4" />
//             Recordings
//           </Button>
//           <span className="text-gray-500">/</span>
//           <span>{formatDate(date)}</span>
//         </div>

//         {/* Title */}
//         <h1 className="text-2xl font-semibold mb-8">
//           Recording Details ({type ? capitalizeFirstLetter(type) : "All"}) -{" "}
//           {formatDate(date)}
//         </h1>

//         {/* Metrics */}
//         <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8 ">
//           <Card className="p-4 bg-white ">
//             <div className="text-sm text-gray-500">Total Calls</div>
//             <div className="text-2xl font-semibold mt-1">
//               {metrics.totalCalls}
//             </div>
//           </Card>
//           <Card className="p-4 bg-white">
//             <div className="text-sm text-gray-500">Outbound Calls</div>
//             <div className="text-2xl font-semibold mt-1">
//               {metrics.outboundCalls}
//             </div>
//           </Card>
//           <Card className="p-4 bg-white">
//             <div className="text-sm text-gray-500">Inbound Calls</div>
//             <div className="text-2xl font-semibold mt-1">
//               {metrics.inboundCalls}
//             </div>
//           </Card>
//           <Card className="p-4 bg-white">
//             <div className="text-sm text-gray-500">Average Duration (min)</div>
//             <div className="text-2xl font-semibold mt-1">
//               {metrics.averageDuration}
//             </div>
//           </Card>
//           <Card className="p-4 bg-white">
//             <div className="text-sm text-gray-500">Needs Attention</div>
//             <div className="text-2xl font-semibold mt-1">
//               {metrics.needsAttention}
//             </div>
//           </Card>
//         </div>

//         {/* Charts */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//           <Card>
//             <CardHeader>
//               <CardTitle>Insurance Coverage Types</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <ChartContainer className="h-[300px]" config={chartConfig}>
//                 <ResponsiveContainer width="100%" height="100%">
//                   <PieChart>
//                     <Pie
//                       data={insuranceData}
//                       dataKey="value"
//                       nameKey="name"
//                       cx="50%"
//                       cy="50%"
//                       innerRadius={60}
//                       outerRadius={80}
//                       label={({ name, percent }) =>
//                         `${name} ${(percent * 100).toFixed(0)}%`
//                       }
//                       labelLine={false}
//                     >
//                       {insuranceData.map((entry, index) => (
//                         <Cell key={`cell-${index}`} fill={entry.color} />
//                       ))}
//                     </Pie>
//                     <ChartTooltip />
//                     <Legend verticalAlign="bottom" height={36} />
//                   </PieChart>
//                 </ResponsiveContainer>
//               </ChartContainer>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardHeader>
//               <CardTitle>Call Direction Summary</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <ChartContainer className="h-[300px]" config={chartConfig}>
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart data={callDirectionData}>
//                     <XAxis dataKey="name" />
//                     <YAxis />
//                     <Legend />
//                     <ChartTooltip />
//                     <Bar
//                       dataKey="inbound"
//                       fill="hsl(var(--chart-1))"
//                       name="Inbound Calls"
//                     />
//                     <Bar
//                       dataKey="outbound"
//                       fill="hsl(var(--chart-2))"
//                       name="Outbound Calls"
//                     />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </ChartContainer>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardHeader>
//               <CardTitle>Call Frequency Analysis</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <ChartContainer className="h-[300px]" config={chartConfig}>
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart data={callFrequencyData}>
//                     <XAxis
//                       dataKey="hour"
//                       label={{
//                         value: "Hour of Day",
//                         position: "insideBottom",
//                         offset: -10,
//                       }}
//                     />
//                     <YAxis
//                       label={{
//                         value: "Number of Calls",
//                         angle: -90,
//                         position: "insideLeft",
//                       }}
//                       allowDecimals={false}
//                       domain={[0, 4]}
//                       ticks={[0, 1, 2, 3, 4]}
//                     />
//                     <Bar
//                       dataKey="calls"
//                       fill="hsl(var(--chart-1))"
//                       radius={[4, 4, 0, 0]}
//                       barSize={15}
//                     />
//                     <ChartTooltip />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </ChartContainer>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle>Issue Resolution Score (%)</CardTitle>
//             </CardHeader>
//             <CardContent className="flex items-center justify-center pt-6">
//               <ResolutionMeter value={39.13} />
//             </CardContent>
//           </Card>
//         </div>
//         {/* Call Details Component */}
//         <div className="mt-8">
//           <Card className="p-6">
//             <CallDetailsTable />
//           </Card>
//         </div>
//       </div>
//     </>
//   );
// };

// export default CallDetails;
