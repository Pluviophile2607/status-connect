import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Calendar, DollarSign, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CampaignCardProps {
  id: string;
  title: string;
  status: string;
  mediaUrl?: string;
  mediaType?: string;
  price: number;
  views?: number;
  createdAt: string;
  businessName?: string;
  agentName?: string;
  onView?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  isBusinessView?: boolean;
}

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  open: "bg-green-100 text-green-800",
  assigned: "bg-blue-100 text-blue-800",
  pending_review: "bg-yellow-100 text-yellow-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  live: "bg-purple-100 text-purple-800",
  completed: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  open: "Open for Agents",
  assigned: "Agent Assigned",
  pending_review: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
  live: "Live",
  completed: "Completed",
};

const CampaignCard: React.FC<CampaignCardProps> = ({
  title,
  status,
  mediaUrl,
  mediaType,
  price,
  views = 0,
  createdAt,
  businessName,
  agentName,
  onView,
  onApprove,
  onReject,
  onDelete,
  showActions = false,
  isBusinessView = false,
}) => {
  const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="dashboard-card group animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Media preview */}
        <div className="w-full sm:w-32 h-32 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
          {mediaUrl ? (
            mediaType === "video" ? (
              <video
                src={mediaUrl}
                className="w-full h-full object-cover"
                muted
              />
            ) : (
              <img
                src={mediaUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <div className="text-muted-foreground text-sm">No media</div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-foreground truncate">
                {title}
              </h3>
              {businessName && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {businessName}
                </p>
              )}
              {agentName && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  Agent: {agentName}
                </p>
              )}
            </div>
            <Badge
              className={cn(
                "status-badge",
                statusStyles[status] || "bg-gray-100 text-gray-800"
              )}
            >
              {statusLabels[status] || status}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-4 w-4" />
              <span>₹{price.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              <span>{views.toLocaleString()} views</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {showActions && (
            <div className="flex flex-wrap gap-2 mt-4">
              {onView && (
                <Button variant="outline" size="sm" onClick={onView}>
                  View Details
                </Button>
              )}
              {isBusinessView && status === "pending_review" && (
                <>
                  {onApprove && (
                    <Button
                      size="sm"
                      onClick={onApprove}
                      className="btn-gradient"
                    >
                      Approve
                    </Button>
                  )}
                  {onReject && (
                    <Button variant="destructive" size="sm" onClick={onReject}>
                      Request Changes
                    </Button>
                  )}
                </>
              )}
              {isBusinessView && onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDelete}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignCard;
