"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAgentCallDetailsStore } from "../store/store";
import PieChart from "./PieChart";
import ResolutionMeter from "@/components/ResolutionMeter";
import CallDirectionChart from "./CallDirectioinChart";
import CallFrequencyChart from "./CallFrequencyChart";

export default function CallCharts() {
  const chartData = useAgentCallDetailsStore((state) => state.chartData);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      <PieChart data={chartData.insuranceData} />

      <CallDirectionChart data={chartData.callDirectionData} />

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


