"use client";
// import { useRef } from "react";
// import { useReactToPrint } from "react-to-print";
// import type { PrintOptions } from "react-to-print";
import {
  Dialog,
  DialogContent,
  // DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, ExternalLink } from "lucide-react";
// import html2pdf from "html2pdf.js";
type ModalSize =
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "full";

import { cn } from "@/lib/utils"; // Make sure you have this utility
import { useCallback } from "react";
import { useParams } from "next/navigation";
interface Task {
  first_name: string;
  last_name: string;
  hawksoft_url: string[];
  agent_name: string;
  phone_number: string;
  customerName: string;
  executiveSummary?: string;
  tasks: string[];
  call_date: string;
  call_duration: number;
  call_time: string;
}

interface FollowupTasksModalProps {
  // printRef: React.RefObject<HTMLDivElement>;
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  size?: ModalSize;
}
  const formatDate = (dateString: string): string => {
    const [year, month, day] = dateString.split("-").map(Number);
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const formattedDate = `${monthNames[month - 1]} ${day}, ${year}`;
    // console.log(formattedDate); // Output: June 9, 2025
    return formattedDate;
  };
const modalSizes: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  full: "max-w-full",
};

export default function FollowupTasksModal({
  isOpen,
  onClose,
  tasks,
  size = "5xl",
}: FollowupTasksModalProps) {
  // const printRef = useRef<HTMLDivElement>(null);
  const params = useParams();
const handlePrint = useCallback(async () => {
  try {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    // ── 1) Define once ──────────────────────────────────────────────────────────
    const pageWidth = 210;
    const pageHeight = 297;
    const marginLeft = 20;
    const marginRight = 20;
    const marginTop = 20;
    const marginBottom = 20;
    const usableWidth = pageWidth - marginLeft - marginRight; // =170mm
    const lineHeight = 7;

    let y = marginTop;
    // Heading
    doc.setFont("helvetica", "bold");
    doc.text(`Followup Tasks - ${formatDate(params.date as string)}`, 20, y);
    y += 12;
    tasks.forEach((taskGroup, groupIdx) => {

      // Agent details
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text(`Agent - ${taskGroup.agent_name}`, 20, y);
        y += 7;

        doc.setFontSize(10);
        doc.text(
          `Phone Number - ${taskGroup.phone_number}${
            taskGroup.phone_number.includes("inbound")
              ? " (inbound)"
              : " (outbound)"
          }`,
          20,
          y
        );
        y += 7;

        doc.text(`Customer Name - ${[taskGroup.first_name?.trim(), taskGroup.last_name?.trim()].filter(Boolean).join(" ") || "-"}`, 20, y);
        y += 7;


        doc.setFontSize(10);
        doc.text(
          `Call Time - ${taskGroup.call_time}`,
          20,
          y
        );
        y += 7;


        doc.setFontSize(10);
        doc.text(
          `Call Duration - ${taskGroup.call_duration}`,
          20,
          y
        );
        y += 7;

      // ── 2) Helper: ensure section fits, else new page ─────────────────────────
      const ensureSpace = (neededLines: number) => {
        const neededHeight = neededLines * lineHeight;
        if (y + neededHeight > pageHeight - marginBottom) {
          doc.addPage();
          y = marginTop;
        }
      };

        // ── Hawksoft URLs Section ────────────────────────────────────────────────
        if (taskGroup.hawksoft_url && 
            Array.isArray(taskGroup.hawksoft_url) && 
            taskGroup.hawksoft_url.length > 0) {
          ensureSpace(taskGroup.hawksoft_url.length + 2); // +2 for heading and spacing
          y += 3;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.text(`Hawksoft URLs (${taskGroup.hawksoft_url.length}) -`, marginLeft, y);
          y += lineHeight;
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          taskGroup.hawksoft_url.forEach((url) => {
            const urlLines = doc.splitTextToSize(url, usableWidth);
            ensureSpace(urlLines.length);
            urlLines.forEach((line: string) => {
              doc.text(line, marginLeft, y);
              y += lineHeight;
            });
          });
          y += 3;
        }

      // ── 3) Call Summary Section ────────────────────────────────────────────────
      // Split the summary into lines
      const summaryLines: string[] = doc.splitTextToSize(
        taskGroup.executiveSummary || "",
        usableWidth
      );

      // +1 for the heading itself
      ensureSpace(summaryLines.length + 1);
      y += 3;
      // Heading
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Call Summary -", marginLeft, y);
      y += lineHeight;

      // Body
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      summaryLines.forEach((line) => {
        doc.text(line, marginLeft, y);
        y += lineHeight;
      });

      // Small gap before next section
      y += 3;

      // ── 4) Tasks Section ───────────────────────────────────────────────────────
      const taskHeading = "Tasks -";
      ensureSpace(1);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(taskHeading, marginLeft, y);
      y += lineHeight;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      taskGroup.tasks.forEach((task) => {
        // wrap this single task
        const taskLines = doc.splitTextToSize(task, usableWidth - 5); // leave 5mm for bullet indent

        // if this bullet + its wrapped lines don’t fit, new page
        ensureSpace(taskLines.length);

        // First line with bullet
        doc.text("•", marginLeft, y);
        doc.text(taskLines[0], marginLeft + 5, y);
        y += lineHeight;

        // continuation lines (indented)
        for (let i = 1; i < taskLines.length; i++) {
          doc.text(taskLines[i], marginLeft + 5, y);
          y += lineHeight;
        }
      });

      // ── 5) after each group, force a break (optional) ──────────────────────────
      if (groupIdx < tasks.length - 1) {
        // leave a gap before next group
        y += 10;
        // and if even that gap pushes you past bottom, new page
        if (y > pageHeight - marginBottom) {
          doc.addPage();
          y = marginTop;
        }
      }
    });

    doc.save("followup_tasks_summary.pdf");
  } catch (error) {
    console.error("Error generating PDF:", error);
  }
}, [tasks, params.date]);


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "h-[85vh] p-0 overflow-hidden flex flex-col bg-white",
          modalSizes[size]
        )}
      >
        {/* Fixed Header */}
        <div className="p-4 border-b border-gray-200">
          <DialogTitle className="text-xl font-semibold">
            Followup Tasks - {formatDate(params.date as string)}
          </DialogTitle>
        </div>

        {/* Main scrollable container */}
        <div className="flex-1 overflow-y-auto" id="followup-content">
          {/* White card container with padding */}
          <div className="bg-white m-4 rounded-lg border border-gray-200">
            {/* Tasks list */}
            <div className="p-6">
              {tasks.map((taskGroup, index) => (
                <div
                  key={index}
                  className="space-y-2 pb-6 mb-6 border-b border-gray-200 last:border-0 last:mb-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <p>
                      <span className="text-gray-500 font-semibold">Agent</span> - <span className="text-gray-500">{taskGroup.agent_name}</span>
                    </p>
                    <p>
                      <span className="text-gray-500 font-semibold">Phone Number</span> - <span className="text-gray-500">{taskGroup.phone_number}
                      {taskGroup.phone_number.includes("inbound")
                        ? " (inbound)"
                        : " (outbound)"}</span>
                    </p>
                    <p>
                      <span className="text-gray-500 font-semibold">Customer Name</span> - <span className="text-gray-500">{[taskGroup.first_name?.trim(), taskGroup.last_name?.trim()].filter(Boolean).join(" ") || "N/A"}</span>
                    </p>
                    <p>
                      <span className="text-gray-500 font-semibold">Call Time</span> - <span className="text-gray-500">{taskGroup.call_time}</span>
                    </p>
                    <p>
                      <span className="text-gray-500 font-semibold">Call Duration</span> - <span className="text-gray-500">{Number(taskGroup.call_duration)}s</span>
                    </p>
                  </div>
                  
                  {/* Hawksoft URLs */}
                  {taskGroup.hawksoft_url && 
                   Array.isArray(taskGroup.hawksoft_url) && 
                   taskGroup.hawksoft_url.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <p className="text-gray-500 font-semibold">Hawksoft URLs ({taskGroup.hawksoft_url.length}):</p>
                      <div className="flex flex-col gap-2">
                        {taskGroup.hawksoft_url.map((url, urlIndex) => (
                          <a
                            key={urlIndex}
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
                  
                  <div>
                    <h3 className="text-gray-500 font-semibold mb-2 mt-4">
                      Call Summary
                    </h3>
                    <p className="text-gray-500">
                      {taskGroup.executiveSummary || "No summary provided."}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-gray-500 font-semibold mb-2 mt-4">
                      Tasks
                    </h3>
                    <ul className="space-y-3 mt-2">
                      {taskGroup.tasks.map((task, taskIndex) => (
                        <li key={taskIndex} className="flex items-start gap-2">
                          <div className="mt-1">
                            <CheckCircle2 className="h-4 w-4 text-[#00B3A4]" />
                          </div>
                          <span className="text-gray-500">{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fixed Print Button at bottom */}
        <div className="p-4 border-t border-gray-200 flex justify-end bg-white">
          <button
            onClick={handlePrint}
            className="bg-[#1e293b] text-white px-4 py-2 rounded hover:bg-[#334155] transition-colors"
          >
            Print
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
