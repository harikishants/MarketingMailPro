import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

interface GrowthMetric {
  value: number;
  change: number;
}

interface AudienceGrowthData {
  monthlyGrowth?: {
    labels: string[];
    data: number[];
  };
  newSubscribers?: GrowthMetric;
  unsubscribers?: GrowthMetric;
  growthRate?: GrowthMetric;
}

interface AudienceGrowthProps {
  data: AudienceGrowthData;
}

const AudienceGrowth = ({ data }: AudienceGrowthProps) => {
  const chartData = data.monthlyGrowth?.labels.map((month, index) => ({
    name: month,
    value: data.monthlyGrowth?.data[index] || 0,
  })) || [];

  const metricItems = [
    {
      label: "New Subscribers",
      value: data.newSubscribers?.value || 0,
      change: data.newSubscribers?.change || 0,
      prefix: "+",
    },
    {
      label: "Unsubscribers",
      value: data.unsubscribers?.value || 0,
      change: data.unsubscribers?.change || 0,
      prefix: "-",
    },
    {
      label: "Growth Rate",
      value: data.growthRate?.value || 0,
      change: data.growthRate?.change || 0,
      prefix: "+",
      suffix: "%",
    },
  ];

  return (
    <Card className="lg:col-span-2 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral-800">Audience Growth</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis hide={true} />
              <Tooltip 
                formatter={(value) => [`${value}`, 'Subscribers']}
                contentStyle={{ borderRadius: '8px', borderColor: '#E1E7EF' }}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {metricItems.map((item, index) => (
            <div key={index} className="border border-neutral-100 rounded p-3">
              <p className="text-xs text-neutral-600 mb-1">{item.label}</p>
              <p className="text-lg font-semibold text-neutral-800">
                {item.prefix}{item.value}{item.suffix || ""}
              </p>
              <p className={`text-xs flex items-center mt-1 ${item.change >= 0 ? "text-success" : "text-error"}`}>
                {item.change >= 0 ? (
                  <ArrowUpIcon className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDownIcon className="h-3 w-3 mr-1" />
                )}
                {Math.abs(item.change)}%
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AudienceGrowth;
