import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, PlusCircle, UsersRound, FileText, Copy } from "lucide-react";

interface QuickActionsProps {
  onCreateCampaign: () => void;
}

const QuickActions = ({ onCreateCampaign }: QuickActionsProps) => {
  const actions = [
    {
      icon: <PlusCircle className="text-primary h-5 w-5 mr-3" />,
      label: "Create New Campaign",
      onClick: onCreateCampaign,
    },
    {
      icon: <UsersRound className="text-primary h-5 w-5 mr-3" />,
      label: "Import Contacts",
      href: "/contacts/import",
    },
    {
      icon: <FileText className="text-primary h-5 w-5 mr-3" />,
      label: "Create Template",
      href: "/templates/new",
    },
    {
      icon: <Copy className="text-primary h-5 w-5 mr-3" />,
      label: "Duplicate Campaign",
      href: "/campaigns",
    },
  ];

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral-800">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => (
          action.onClick ? (
            <Button
              key={index}
              variant="outline"
              className="w-full flex items-center justify-between text-left p-3 border border-neutral-100 rounded hover:border-primary hover:bg-primary hover:bg-opacity-5 transition-colors h-auto"
              onClick={action.onClick}
            >
              <div className="flex items-center">
                {action.icon}
                <span className="text-neutral-800 font-medium">{action.label}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-400" />
            </Button>
          ) : (
            <Link key={index} href={action.href || "#"}>
              <Button
                variant="outline"
                className="w-full flex items-center justify-between text-left p-3 border border-neutral-100 rounded hover:border-primary hover:bg-primary hover:bg-opacity-5 transition-colors h-auto"
              >
                <div className="flex items-center">
                  {action.icon}
                  <span className="text-neutral-800 font-medium">{action.label}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400" />
              </Button>
            </Link>
          )
        ))}
      </CardContent>
    </Card>
  );
};

export default QuickActions;
