"use client";

import { CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/store/auth/store";

interface CallModalData {
  first_name: string;
  last_name: string;
  hawksoft_url: string[];
  agentName: string;
  callTime: string;
  phone: string;
  area: string;
  duration: string;
  issueResolved: boolean;
  coverages: string[];
  executiveSummary: string;
  disposition: string;
  confusion: string;
  highlights: string[];
  mainIssues: string[];
  actionItems: string[];
  transcript?: string;
  calldirection: string;
  complaint?: string;
  callId?: number;
  call_date?: string;
  todoItems?: string[];
}

interface CallDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CallModalData | null;
  onActionItemsUpdate?: (callId: number, isCompleted: boolean) => void;
}

export default function CallDetailsModal({
  isOpen,
  onClose,
  data,
  onActionItemsUpdate,
}: CallDetailsModalProps) {
  const sectionCardClass = "rounded-md border border-slate-200 bg-white p-4";
  const sectionTitleClass = "text-sm font-semibold text-slate-900";
  const params = useParams();
  const { date = "" } = params as { date: string };
  const { user } = useAuthStore();
  const extension = user?.user_metadata?.extension || "";
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingStatus, setIsFetchingStatus] = useState(true);

  // Fetch action items completion status when modal opens
  useEffect(() => {
    if (!isOpen || !data || !data.callId || !data.actionItems || data.actionItems.length === 0) {
      setIsCompleted(false);
      setIsFetchingStatus(false);
      return;
    }

    const fetchCompletionStatus = async () => {
      setIsFetchingStatus(true);
      try {
        const response = await fetch(
          `/api/action-items?audio_file_id=${data.callId}&extension=${extension}&date=${data.call_date || date}`
        );

        if (!response.ok) {
          console.error("Failed to fetch action items");
          setIsCompleted(false);
          return;
        }

        const result = await response.json();
        // If no record exists in action_items table, result.data will be null
        // In that case, action items are not completed (default to false)
        if (result.success && result.data && result.data.todo_items) {
          const todoItems = result.data.todo_items as Array<Record<string, boolean>>;
          // Check if all action items are completed
          const allCompleted = todoItems.every((item) => {
            return Object.values(item)[0] === true;
          });
          setIsCompleted(allCompleted);
        } else {
          // No record exists, so action items are not completed
          setIsCompleted(false);
        }
      } catch (error) {
        console.error("Error fetching action items:", error);
        setIsCompleted(false);
      } finally {
        setIsFetchingStatus(false);
      }
    };

    fetchCompletionStatus();
  }, [isOpen, data, extension, date]);

  const handleMarkComplete = async () => {
    if (!data || !data.callId || !data.actionItems || data.actionItems.length === 0 || !extension || !data.call_date) {
      return;
    }

    if (isLoading) return;

    const newCompletedState = !isCompleted;
    
    // Optimistically update UI
    setIsCompleted(newCompletedState);
    setIsLoading(true);

    try {
      // Build todo_items structure: [{ "item1": true/false }, { "item2": true/false }]
      // Using actionItems (which comes from follow_up_actions) instead of todoItems
      const todoItems = data.actionItems.map((item) => ({
        [item]: newCompletedState,
      }));

      const response = await fetch("/api/action-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audio_file_id: data.callId,
          extension: extension,
          date: data.call_date || date,
          todoItems: todoItems,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to update action items:", errorData);
        // Revert optimistic update on error
        setIsCompleted(!newCompletedState);
      } else {
        // Successfully updated - notify parent component to update table toggle
        if (data.callId && onActionItemsUpdate) {
          onActionItemsUpdate(data.callId, newCompletedState);
        }
      }
    } catch (error) {
      console.error("Error updating action items:", error);
      // Revert optimistic update on error
      setIsCompleted(!newCompletedState);
    } finally {
      setIsLoading(false);
    }
  };

  if (!data) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-white max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-start justify-between border-b pb-4">
          <DialogTitle className="text-xl font-semibold text-[#00B3A4]">
            Call Summary
          </DialogTitle>
          <div className="flex items-center gap-2">
            {data.actionItems && data.actionItems.length > 0 && (
              <Button
                variant={isCompleted ? "default" : "outline"}
                size="sm"
                onClick={isCompleted ? undefined : handleMarkComplete}
                disabled={isCompleted || isLoading || isFetchingStatus}
                className={`${isCompleted
                    ? "bg-[#00B3A4] text-white cursor-not-allowed"
                    : "border-[#00B3A4] text-[#00B3A4] hover:bg-[#00B3A4] hover:text-white"
                  } ${isLoading || isFetchingStatus ? "opacity-20 cursor-not-allowed" : ""}`}
              >
                {isFetchingStatus ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : isCompleted ? (
                  "Completed"
                ) : (
                  "Mark Complete"
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-gray-100"
              onClick={onClose}
            ></Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-grow pr-6 custom-scrollbar">
          {/* Call Details */}
          <div className={`${sectionCardClass} space-y-3`}>
            <h3 className={sectionTitleClass}>Call Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
              <p>
                Agent Name: {data.agentName} ({data.calldirection})
              </p>
              <p>Call Time: {data.callTime}</p>
              <p>Issue Resolved: {data.issueResolved ? "Yes" : "No"}</p>
              </div>
              <div className="text-right">
                <p>Customer Name: {[data.first_name?.trim(), data.last_name?.trim()].filter(Boolean).join(" ") || "N/A"}</p>
                <p>Phone: {data.phone}</p>
                <p>Area: {data.area}</p>
                <p>Call Duration: {data.duration} Seconds</p>
              </div>
            </div>
          </div>

          {/* Hawksoft URLs */}
          {data.hawksoft_url &&
            Array.isArray(data.hawksoft_url) &&
            data.hawksoft_url.length > 0 && (
              <div className={`${sectionCardClass} space-y-2`}>
                <h3 className={sectionTitleClass}>Hawksoft URLs ({data.hawksoft_url.length})</h3>
                <div className="flex flex-col gap-2">
                  {data.hawksoft_url.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#00B3A4] hover:text-[#009B94] hover:underline transition-colors"
                      title={url}
                    >
                      <ExternalLink className="h-4 w-4 flex-shrink-0" />
                      <span className="break-all">{url}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

          {/* Insurance Coverages */}
          {/* {data.coverages.length > 0 && (
            <div className="flex items-center space-x-2">
              <p className="font-medium">Insurance Coverages discussed:</p>
              <div className="flex flex-wrap gap-2">
                {data.coverages.map((coverage, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    {coverage}
                  </Badge>
                ))}
              </div>
            </div>
          )} */}

          {/* Executive Summary */}
          {data.executiveSummary && (
            <div className={`${sectionCardClass} space-y-2`}>
              <h3 className={sectionTitleClass}>Executive Summary</h3>
              <p className="text-sm text-gray-700">{data.executiveSummary}</p>
            </div>
          )}

          {/* Call Disposition */}
          {/* {data.disposition && (
            <div className="space-y-2">
              <h3 className="font-medium">Call Disposition</h3>
              <p className="text-sm">{data.disposition}</p>
            </div>
          )} */}

          {/* Confusion Section */}
          {/* {data.confusion && (
            <div className="space-y-2 rounded-md bg-red-50 p-4 border border-red-100">
              <h3 className="font-medium text-black-800">
                Confusion or misunderstanding in the conversation
              </h3>
              <p className="text-sm text-black-700">{data.confusion}</p>
            </div>
          )} */}

          {/* Complaint Section */}
          {/* {data.complaint && (
            <div className="space-y-2 rounded-md bg-red-50 p-4 border border-red-100">
              <h3 className="font-medium text-black-800">
                Complaint or dissatisfaction in the conversation
              </h3>
              <p className="text-sm text-black-700">{data.complaint}</p>
            </div>
          )} */}

          {/* Highlights */}
          {/* {data.highlights.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Highlights</h3>
              <ul className="space-y-2 text-sm">
                {data.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-1 h-4 w-4 text-green-500" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )} */}

          {/* Main Issues */}
          {/* {data.mainIssues.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Main Issues</h3>
              <ul className="space-y-2 text-sm">
                {data.mainIssues.map((issue, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-1 h-4 w-4 text-green-500" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )} */}

          {/* Action Items */}
          {data.actionItems.length > 0 && (
            <div className={`${sectionCardClass} space-y-2`}>
              <h3 className={sectionTitleClass}>Action Items for {data.agentName}</h3>
              <ul className="space-y-2 text-sm">
                {data.actionItems.map((action, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-1 h-4 w-4 text-green-500" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Call Transcript */}
          {/* <div className="space-y-2">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="transcript" className="border rounded-md">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <span className="font-medium">Call Transcript</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="bg-gray-50 p-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {data.transcript ? (
                      <p className="text-sm whitespace-pre-wrap">
                        {data.transcript.split("\n").map((line, index) => (
                          <span key={index} className="block mb-2">
                            {line}
                          </span>
                        ))}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        No transcript available for this call
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div> */}
        </div>
      </DialogContent>
    </Dialog>
  );
}

