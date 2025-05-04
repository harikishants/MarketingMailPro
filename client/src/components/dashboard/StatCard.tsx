import { cn } from "@/lib/utils";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: number | string;
  change: number;
  icon: string;
}

const StatCard = ({ title, value, change, icon }: StatCardProps) => {
  const isPositive = change >= 0;
  const formattedChange = Math.abs(change).toFixed(1);
  const IconComponent = isPositive ? ArrowUpIcon : ArrowDownIcon;
  
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "campaign":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.73 18l-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        );
      case "people":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case "visibility":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        );
      case "touch_app":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 14.76v-3.24a2 2 0 0 0-2-2 2 2 0 0 0-2 2v4" />
            <path d="M14 12a2 2 0 0 0-2-2 2 2 0 0 0-2 2" />
            <path d="M18.1 9.2a4 4 0 0 0-5.6-5.6C11.1 5 11.1 7.3 12.5 8.7c1.3 1.3 3 1.7 4.5.9" />
            <path d="M15 13a2 2 0 0 0-2-2" />
            <path d="M22 19l-1-1.5a6.5 6.5 0 0 0-9.3-1.3 3.5 3.5 0 0 1-1.5.7h0a4.5 4.5 0 0 0-2.8 2.7" />
            <path d="M13.6 17.8a2.8 2.8 0 0 1 .9-.3h0c1.2-.4 2-.4 3.3.2.6.4 1.7 1.2 2.2 1.8" />
            <path d="M6.1 17.8a4.5 4.5 0 0 0-1.4 1.8" />
            <path d="M10 20.4a4 4 0 0 0-2.3-1 3.9 3.9 0 0 0-3.2.7A1 1 0 0 0 4 21a1 1 0 0 0 .6.9A10 10 0 0 0 9.5 23c.8 0 1.6-.1 2.4-.4" />
            <path d="M17 22.1a10 10 0 0 0 1.5-.1" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8" />
            <path d="M8 12h8" />
          </svg>
        );
    }
  };

  return (
    <Card className="bg-white shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-neutral-600 text-sm mb-1">{title}</p>
          <h3 className="text-2xl font-semibold text-neutral-800">{value}</h3>
          <p className={cn(
            "text-sm flex items-center mt-2",
            isPositive ? "text-success" : "text-error"
          )}>
            <IconComponent className="h-4 w-4 mr-1" />
            {isPositive ? "+" : "-"}{formattedChange}% from last month
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-white bg-opacity-10 flex items-center justify-center">
          {getIconComponent(icon)}
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
