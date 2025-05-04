import { Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Mail } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Campaign {
  id: string;
  name: string;
  listName: string;
  status: "draft" | "scheduled" | "sent" | "failed";
  sentCount?: number;
  openRate?: number;
  clickRate?: number;
  scheduledDate?: string;
  sentDate?: string;
}

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

interface CampaignTableProps {
  campaigns: Campaign[];
}

const CampaignTable = ({ campaigns }: CampaignTableProps) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-800">Recent Campaigns</h2>
        <Link href="/campaigns" className="text-primary text-sm font-medium flex items-center">
          View all
          <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Campaign Name</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Status</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Sent</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Open Rate</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Click Rate</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Date</TableHead>
                <TableHead className="px-6 py-3 text-right text-xs font-medium text-neutral-600 uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.length > 0 ? (
                campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-white bg-opacity-10 flex items-center justify-center mr-3">
                          <Mail className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-neutral-800">{campaign.name}</div>
                          <div className="text-xs text-neutral-600">To: {campaign.listName}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" className={getStatusBadgeClass(campaign.status)}>
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {campaign.sentCount ? campaign.sentCount.toLocaleString() : "-"}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {campaign.openRate ? `${campaign.openRate}%` : "-"}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {campaign.clickRate ? `${campaign.clickRate}%` : "-"}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {campaign.sentDate ? formatDate(campaign.sentDate) : 
                       campaign.scheduledDate ? formatDate(campaign.scheduledDate) : "-"}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {campaign.status === "sent" ? (
                        <Link href={`/campaigns/${campaign.id}/report`} className="text-primary hover:text-primary-700">
                          View Report
                        </Link>
                      ) : (
                        <Link href={`/campaigns/${campaign.id}/edit`} className="text-primary hover:text-primary-700">
                          Edit
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="px-6 py-4 text-center text-neutral-600">
                    No campaigns found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default CampaignTable;
