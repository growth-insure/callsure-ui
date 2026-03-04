"use client";

import { Card } from "@/components/ui/card";
import { useCallDetailsStore } from "../store/store";

export default function CallMetrics() {
  const metrics = useCallDetailsStore((state) => state.metrics);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      <Card className="p-4 bg-white">
        <div className="text-sm text-gray-500">Total Calls</div>
        <div className="text-2xl font-semibold mt-1">{metrics.totalCalls}</div>
      </Card>
      <Card className="p-4 bg-white">
        <div className="text-sm text-gray-500">Outbound Calls</div>
        <div className="text-2xl font-semibold mt-1">
          {metrics.outboundCalls}
        </div>
      </Card>
      <Card className="p-4 bg-white">
        <div className="text-sm text-gray-500">Inbound Calls</div>
        <div className="text-2xl font-semibold mt-1">
          {metrics.inboundCalls}
        </div>
      </Card>
      <Card className="p-4 bg-white">
        <div className="text-sm text-gray-500">Average Duration (min)</div>
        <div className="text-2xl font-semibold mt-1">
          {metrics.averageDuration.toFixed(2)}
        </div>
      </Card>
      <Card className="p-4 bg-white">
        <div className="text-sm text-gray-500">Needs Attention</div>
        <div className="text-2xl font-semibold mt-1">
          {metrics.needsAttention}
        </div>
      </Card>
    </div>
  );
}
