import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import StatCard from "./StatCard";
import CampaignTable from "./CampaignTable";
import AudienceGrowth from "./AudienceGrowth";
import QuickActions from "./QuickActions";
import CreateCampaignModal from "../campaigns/CreateCampaignModal";

const Dashboard = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: campaigns } = useQuery({
    queryKey: ["/api/campaigns/recent"],
  });

  const { data: audienceData } = useQuery({
    queryKey: ["/api/audience/growth"],
  });

  const statsData = stats || {
    activeCampaigns: { count: 0, change: 0 },
    totalSubscribers: { count: 0, change: 0 },
    openRate: { percentage: 0, change: 0 },
    clickRate: { percentage: 0, change: 0 }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-800 mb-1">Dashboard</h1>
          <p className="text-neutral-600">Welcome back! Here's an overview of your email marketing.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button 
            className="bg-primary text-white px-4 py-2 rounded-md flex items-center"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Active Campaigns"
          value={statsData.activeCampaigns.count}
          change={statsData.activeCampaigns.change}
          icon="campaign"
        />
        <StatCard 
          title="Total Subscribers"
          value={statsData.totalSubscribers.count}
          change={statsData.totalSubscribers.change}
          icon="people"
        />
        <StatCard 
          title="Avg. Open Rate"
          value={`${statsData.openRate.percentage}%`}
          change={statsData.openRate.change}
          icon="visibility"
        />
        <StatCard 
          title="Avg. Click Rate"
          value={`${statsData.clickRate.percentage}%`}
          change={statsData.clickRate.change}
          icon="touch_app"
        />
      </div>

      {/* Recent Campaigns */}
      <CampaignTable campaigns={campaigns || []} />

      {/* Audience Growth & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AudienceGrowth data={audienceData || {}} />
        <QuickActions onCreateCampaign={() => setIsCreateModalOpen(true)} />
      </div>

      <CreateCampaignModal 
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  );
};

export default Dashboard;
