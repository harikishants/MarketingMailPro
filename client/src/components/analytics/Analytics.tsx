import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const Analytics = () => {
  const [timeRange, setTimeRange] = useState("30days");
  const [selectedCampaign, setSelectedCampaign] = useState("all");

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["/api/analytics", { timeRange, campaign: selectedCampaign }],
  });

  const { data: campaigns } = useQuery({
    queryKey: ["/api/campaigns"],
  });

  // Prepare data for charts
  const openRateData = analyticsData?.openRateOverTime || [];
  const clickRateData = analyticsData?.clickRateOverTime || [];
  const subscriberGrowthData = analyticsData?.subscriberGrowth || [];
  const engagementStats = analyticsData?.engagementStats || {};
  const deviceUsageData = analyticsData?.deviceUsage || [];
  const bounceRateData = analyticsData?.bounceRate || [];

  // Color palette for charts
  const colors = {
    primary: "hsl(var(--chart-1))",
    secondary: "hsl(var(--chart-2))",
    accent: "hsl(var(--chart-3))",
    success: "hsl(var(--chart-4))",
    error: "hsl(var(--chart-5))",
  };

  const renderLineChart = (data: any[], dataKey: string, label: string, color: string) => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
        <YAxis stroke="hsl(var(--foreground))" />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            borderColor: "hsl(var(--border))",
            color: "hsl(var(--foreground))",
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey={dataKey}
          name={label}
          stroke={color}
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderBarChart = (data: any[], dataKey: string, label: string, color: string) => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
        <YAxis stroke="hsl(var(--foreground))" />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            borderColor: "hsl(var(--border))",
            color: "hsl(var(--foreground))",
          }}
        />
        <Legend />
        <Bar dataKey={dataKey} name={label} fill={color} />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderPieChart = (data: any[]) => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={Object.values(colors)[index % Object.values(colors).length]}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            borderColor: "hsl(var(--border))",
            color: "hsl(var(--foreground))",
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderStatCard = (
    title: string,
    value: string | number,
    description: string,
    textColorClass?: string
  ) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", textColorClass)}>{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-800 mb-1">Analytics</h1>
          <p className="text-neutral-600">Track and analyze your email campaign performance</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <Select
            value={timeRange}
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="year">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={selectedCampaign}
            onValueChange={setSelectedCampaign}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              {campaigns?.map((campaign: any) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="text-center">
            <p className="text-neutral-600">Loading analytics data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {renderStatCard(
              "Average Open Rate",
              `${engagementStats.openRate || 0}%`,
              `${engagementStats.openRateChange > 0 ? "+" : ""}${engagementStats.openRateChange || 0}% from previous period`,
              engagementStats.openRateChange > 0 ? "text-success" : engagementStats.openRateChange < 0 ? "text-error" : ""
            )}
            {renderStatCard(
              "Average Click Rate",
              `${engagementStats.clickRate || 0}%`,
              `${engagementStats.clickRateChange > 0 ? "+" : ""}${engagementStats.clickRateChange || 0}% from previous period`,
              engagementStats.clickRateChange > 0 ? "text-success" : engagementStats.clickRateChange < 0 ? "text-error" : ""
            )}
            {renderStatCard(
              "Total Subscribers",
              engagementStats.totalSubscribers || 0,
              `${engagementStats.newSubscribers || 0} new in this period`
            )}
            {renderStatCard(
              "Bounce Rate",
              `${engagementStats.bounceRate || 0}%`,
              `${engagementStats.bounceRateChange > 0 ? "+" : ""}${engagementStats.bounceRateChange || 0}% from previous period`,
              engagementStats.bounceRateChange > 0 ? "text-error" : engagementStats.bounceRateChange < 0 ? "text-success" : ""
            )}
          </div>

          {/* Chart Tabs */}
          <Tabs defaultValue="engagement" className="mb-8">
            <TabsList className="mb-4">
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
              <TabsTrigger value="devices">Devices</TabsTrigger>
              <TabsTrigger value="links">Link Performance</TabsTrigger>
            </TabsList>
            <Card>
              <CardContent className="pt-6">
                <TabsContent value="engagement" className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Open Rate Over Time</h3>
                      {renderLineChart(openRateData, "value", "Open Rate (%)", colors.primary)}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-4">Click Rate Over Time</h3>
                      {renderLineChart(clickRateData, "value", "Click Rate (%)", colors.secondary)}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="subscribers" className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Subscriber Growth</h3>
                    {renderBarChart(subscriberGrowthData, "value", "New Subscribers", colors.accent)}
                  </div>
                </TabsContent>
                <TabsContent value="devices" className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Device Usage</h3>
                      {renderPieChart(deviceUsageData)}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-4">Email Clients</h3>
                      {renderPieChart(analyticsData?.emailClients || [])}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="links" className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Top Performing Links</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="text-left py-3 px-4 border-b font-medium text-sm">Link URL</th>
                            <th className="text-left py-3 px-4 border-b font-medium text-sm">Clicks</th>
                            <th className="text-left py-3 px-4 border-b font-medium text-sm">Click Rate</th>
                            <th className="text-left py-3 px-4 border-b font-medium text-sm">Campaign</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(analyticsData?.topLinks || []).map((link: any, index: number) => (
                            <tr key={index}>
                              <td className="py-3 px-4 border-b text-sm">
                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                  {link.url.length > 40 ? `${link.url.substring(0, 40)}...` : link.url}
                                </a>
                              </td>
                              <td className="py-3 px-4 border-b text-sm">{link.clicks}</td>
                              <td className="py-3 px-4 border-b text-sm">{link.clickRate}%</td>
                              <td className="py-3 px-4 border-b text-sm">{link.campaignName}</td>
                            </tr>
                          ))}
                          {(analyticsData?.topLinks || []).length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-3 px-4 border-b text-sm text-center">
                                No link data available for this period
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>

          {/* Campaign Performance */}
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
                <CardDescription>Compare metrics across your recent campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left py-3 px-4 border-b font-medium text-sm">Campaign Name</th>
                        <th className="text-left py-3 px-4 border-b font-medium text-sm">Sent</th>
                        <th className="text-left py-3 px-4 border-b font-medium text-sm">Open Rate</th>
                        <th className="text-left py-3 px-4 border-b font-medium text-sm">Click Rate</th>
                        <th className="text-left py-3 px-4 border-b font-medium text-sm">Bounce Rate</th>
                        <th className="text-left py-3 px-4 border-b font-medium text-sm">Unsubscribes</th>
                        <th className="text-left py-3 px-4 border-b font-medium text-sm">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(analyticsData?.campaignPerformance || []).map((campaign: any) => (
                        <tr key={campaign.id}>
                          <td className="py-3 px-4 border-b text-sm font-medium">{campaign.name}</td>
                          <td className="py-3 px-4 border-b text-sm">{campaign.sentCount}</td>
                          <td className="py-3 px-4 border-b text-sm">{campaign.openRate}%</td>
                          <td className="py-3 px-4 border-b text-sm">{campaign.clickRate}%</td>
                          <td className="py-3 px-4 border-b text-sm">{campaign.bounceRate}%</td>
                          <td className="py-3 px-4 border-b text-sm">{campaign.unsubscribeRate}%</td>
                          <td className="py-3 px-4 border-b text-sm">{campaign.sentDate}</td>
                        </tr>
                      ))}
                      {(analyticsData?.campaignPerformance || []).length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-3 px-4 border-b text-sm text-center">
                            No campaign data available for this period
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bounce Rate Analysis */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Bounce Rate Analysis</CardTitle>
                <CardDescription>Track hard and soft bounces over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Bounce Rate Trends</h3>
                    {renderBarChart(bounceRateData, "value", "Bounce Rate (%)", colors.error)}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-4">Bounce Types</h3>
                    <div className="mt-6">
                      {renderPieChart([
                        { name: "Hard Bounces", value: analyticsData?.bounceTypes?.hard || 0 },
                        { name: "Soft Bounces", value: analyticsData?.bounceTypes?.soft || 0 }
                      ])}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
