import * as echarts from "echarts";
import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface DataItem {
  name: string;
  value: number;
  count: number;
  color: string;
}

interface PieChartProps {
  data: DataItem[];
}
interface TooltipParams {
  name: string;
  value: number;
  data: {
    count: number;
  };
}

const PieChart: React.FC<PieChartProps> = ({ data }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      if (!chartInstance.current) {
        chartInstance.current = echarts.init(chartRef.current);
      }

      const option = {
        tooltip: {
          trigger: "item",
          formatter: (params: TooltipParams) => {
            const { name, value, data } = params;
            return `${name}<br/>Count: ${data.count}<br/>Percentage: ${value}%`;
          },
        },
        legend: {
          left: "left",
          orient: "vertical",
          textStyle: {
            fontSize: 12,
            color: "#666",
          },
        },
        color: data.map((item) => item.color),
        series: [
          {
            type: "pie",
            radius: ["40%", "70%"],

            itemStyle: {
              borderRadius: 12,
              borderColor: "#fff",
              borderWidth: 4,
            },
            label: {
              show: true,
              position: "outside",
              formatter: "{b}: {d}%",
              fontSize: 12,
            },
            labelLine: {
              show: true,
            },
            animation: true,
            animationDuration: 1000,
            animationEasing: "cubicInOut",
            animationDelay: (idx: number) => idx * 100,
            data: data,
          },
        ],
      };

      chartInstance.current.setOption(option);
    }

    // Cleanup function
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

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <Card className="w-full h-[500px]">
      <CardHeader>
        <h3 className="text-lg font-semibold">Insurance Coverage Types</h3>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="w-full h-[400px]" />
      </CardContent>
    </Card>
  );
};

export default PieChart;


