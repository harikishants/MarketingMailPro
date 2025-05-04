import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import CreateCampaignModal from "./CreateCampaignModal";

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "sent":
      return "bg-success/10 text-success";
    case "scheduled":
      return "bg-primary/10 text-primary";
    case "draft":
      return "bg-warning/10 text-warning";
    case "failed":
      return "bg-error/10 text-error";
    default:
      return "bg-neutral-100 text-neutral-600";
  }
};

const Campaigns = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all_statuses");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["/api/campaigns", { search: searchQuery, status: statusFilter }],
  });

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-800 mb-1">Campaigns</h1>
          <p className="text-neutral-600">Manage and monitor your email campaigns</p>
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

      <Card className="bg-white rounded-lg shadow-sm mb-6">
        <div className="p-4 border-b border-neutral-100 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="flex items-center w-full sm:w-auto mb-3 sm:mb-0">
            <Input
              type="text"
              placeholder="Search campaigns..."
              className="text-sm border-none focus:ring-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex space-x-3 w-full sm:w-auto">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_statuses">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Campaign Name</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Status</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Recipients</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Open Rate</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Click Rate</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Date</TableHead>
                <TableHead className="px-6 py-3 text-right text-xs font-medium text-neutral-600 uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Loading campaigns...</TableCell>
                </TableRow>
              ) : campaigns && campaigns.length > 0 ? (
                campaigns.map((campaign: any) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-neutral-800">
                            {campaign.name}
                          </div>
                          <div className="text-xs text-neutral-500">
                            Subject: {campaign.subject}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" className={getStatusBadgeClass(campaign.status)}>
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {campaign.recipientCount || "-"}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {campaign.openRate ? `${campaign.openRate}%` : "-"}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {campaign.clickRate ? `${campaign.clickRate}%` : "-"}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {campaign.sentDate || campaign.scheduledDate || "-"}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {campaign.status === "sent" ? (
                        <Link href={`/campaigns/${campaign.id}/report`}>
                          <Button variant="link" className="text-primary h-auto p-0">
                            View Report
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/campaigns/${campaign.id}/edit`}>
                          <Button variant="link" className="text-primary h-auto p-0">
                            Edit
                          </Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No campaigns found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <CreateCampaignModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  );
};

export default Campaigns;
