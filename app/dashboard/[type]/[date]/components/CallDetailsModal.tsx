"use client";

import { CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface CallModalData {
  // [x: string]: any;
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
}

interface CallDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CallModalData | null;
}

export default function CallDetailsModal({
  isOpen,
  onClose,
  data,
}: CallDetailsModalProps) {
  if (!data) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-white max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-start justify-between border-b pb-4">
          <DialogTitle className="text-xl font-semibold text-[#00B3A4]">
            Call Summary
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-gray-100"
            onClick={onClose}
          ></Button>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-grow pr-6 custom-scrollbar">
          {/* Call Details */}
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

          {/* Hawksoft URLs */}
          {data.hawksoft_url && 
           Array.isArray(data.hawksoft_url) && 
           data.hawksoft_url.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium">Hawksoft URLs ({data.hawksoft_url.length}) :</p>
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
          {data.coverages.length > 0 && (
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
          )}

          {/* Executive Summary */}
          {data.executiveSummary && (
            <div className="space-y-2">
              <h3 className="font-medium">Executive Summary</h3>
              <p className="text-sm text-gray-700">{data.executiveSummary}</p>
            </div>
          )}

          {/* Call Disposition */}
          {data.disposition && (
            <div className="space-y-2">
              <h3 className="font-medium">Call Disposition</h3>
              <p className="text-sm">{data.disposition}</p>
            </div>
          )}

          {/* Confusion Section */}
          {data.confusion && (
            <div className="space-y-2 rounded-md bg-red-50 p-4 border border-red-100">
              <h3 className="font-medium text-black-800">
                Confusion or misunderstanding in the conversation
              </h3>
              <p className="text-sm text-black-700">{data.confusion}</p>
            </div>
          )}

          {/* Complaint Section */}
          {data.complaint && (
            <div className="space-y-2 rounded-md bg-red-50 p-4 border border-red-100">
              <h3 className="font-medium text-black-800">
                Complaint or dissatisfaction in the conversation
              </h3>
              <p className="text-sm text-black-700">{data.complaint}</p>
            </div>
          )}

          {/* Highlights */}
          {data.highlights.length > 0 && (
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
          )}

          {/* Main Issues */}
          {data.mainIssues.length > 0 && (
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
          )}

          {/* Action Items */}
          {data.actionItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Action Items for {data.agentName}</h3>
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
          <div className="space-y-2">
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
