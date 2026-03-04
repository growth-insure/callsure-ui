import * as echarts from "echarts";
import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface CallData {
  name: string;
  inbound: number;
  outbound: number;
}

interface CallDirectionChartProps {
  data: CallData[];
}

const CallDirectionChart: React.FC<CallDirectionChartProps> = ({ data }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      if (!chartInstance.current) {
        chartInstance.current = echarts.init(chartRef.current);
      }

      const option = {
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
          },
        },
        legend: {
          data: ["Outbound", "Inbound"],
          bottom: "5%",
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "15%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          data: data.map((item) => item.name),
        },
        yAxis: {
          type: "value",
        },
        series: [
          {
            name: "Outbound",
            type: "bar",
            data: data.map((item) => item.outbound),
            itemStyle: {
              color: "#36A2EB",
            },
          },
          {
            name: "Inbound",
            type: "bar",
            data: data.map((item) => item.inbound),
            itemStyle: {
              color: "#FFCD56",
            },
          },
        ],
      };

      chartInstance.current.setOption(option);
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, [data]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Card className="w-full h-[500px]">
      <CardHeader>
        <h3 className="text-lg font-semibold">Call Direction Summary</h3>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="w-full h-[400px]" />
      </CardContent>
    </Card>
  );
};

export default CallDirectionChart;
