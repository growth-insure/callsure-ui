"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import html2pdf from "html2pdf.js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {CallRecord, SelectedCallRecord, NewCall} from "../store/types"; // Adjust the import path as necessary
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCallDetailsStore } from "../store/store";
import CallDetailsModal from "./CallDetailsModal";
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowUp,
  ArrowUpRight,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileSpreadsheet,
  Printer,
} from "lucide-react";
import FollowupTasksModal from "./FollowupTasksModal";

type SortDirection = "asc" | "desc";
type SortField =
  | "call_time"
  | "call_direction"
  | "customer_name"
  | "phone_number"
  | "agent_name"
  | "call_duration"
  | "confusion"
  | "complaint";

const DEFAULT_SORT: { field: SortField; direction: SortDirection } = {
  field: "call_time",
  direction: "desc",
};

const getCustomerName = (call: CallRecord) =>
  [call.first_name?.trim(), call.last_name?.trim()].filter(Boolean).join(" ");

const getCallTimeValue = (callTime?: string) => {
  if (!callTime) {
    return 0;
  }

  const timeParts = callTime.split(":").map(Number);
  if (timeParts.length >= 2 && timeParts.every((part) => !Number.isNaN(part))) {
    const [hours = 0, minutes = 0, seconds = 0] = timeParts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  const parsedDate = new Date(callTime).getTime();
  return Number.isNaN(parsedDate) ? 0 : parsedDate;
};

function DirectionIcon({ direction }: { direction: string }) {
  const normalizedDirection = direction?.toLowerCase();
  const isInbound = normalizedDirection === "inbound";
  const label = isInbound ? "Inbound" : "Outbound";
  const shortLabel = isInbound ? "IN" : "OUT";
  const Icon = isInbound ? ArrowDownLeft : ArrowUpRight;
  const badgeClass = isInbound
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span
      className="group relative inline-flex items-center"
      aria-label={label}
      title={label}
    >
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold leading-none ${badgeClass}`}
      >
        <Icon className="h-3.5 w-3.5" />
        <span>{shortLabel}</span>
      </span>
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white shadow group-hover:block">
        {label}
      </span>
    </span>
  );
}

export default function CallTable() {
  const calls = useCallDetailsStore((state) => state.calls);
  const params = useParams();
  const { type = "" } = params as { type?: string };
  const isAllCallsView = type !== "confusions" && type !== "complaints";
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<SelectedCallRecord | null>(null);
  const [sortConfig, setSortConfig] = useState(DEFAULT_SORT);
  const [showConfusionOnly, setShowConfusionOnly] = useState(false);
  const [showComplaintOnly, setShowComplaintOnly] = useState(false);
  const [isFollowupModalOpen, setIsFollowupModalOpen] = useState(false);
  const [hoveredCallId, setHoveredCallId] = useState<number | null>(null);
  const [followupTasks, setFollowupTasks] = useState<
    Array<{
      agent_name: string;
      first_name: string;
      last_name: string;
      hawksoft_url: string[];
      phone_number: string;
      customerName: string;
      tasks: string[];
      executiveSummary: string;
      call_date: string;
      call_duration: number;
      call_time: string;
    }>
  >([]);
  const { field: sortField, direction: sortDirection } = sortConfig;

  const compareCallTimeDesc = useCallback((a: CallRecord, b: CallRecord) => {
    const dateA = getCallTimeValue(a.call_time);
    const dateB = getCallTimeValue(b.call_time);
    return dateB - dateA;
  }, []);

  const getFilteredData = useCallback((callsData: CallRecord[]) => {
    return callsData.filter((call) => {
      const matchesSearch = Object.values({
        call_time: call.call_time,
        call_direction: call.call_direction,
        phone_number: call.phone_number,
        agent_name: call.agent_name,
        first_name: call.first_name,
        last_name: call.last_name,
        displayCustomerName: getCustomerName(call),
        customerName: call.call_summary?.customerName,
        call_duration: call.call_duration,
        call_date: call.call_date,
      }).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (!matchesSearch) {
        return false;
      }

      if (!isAllCallsView || (!showConfusionOnly && !showComplaintOnly)) {
        return true;
      }

      return (
        (showConfusionOnly && call.call_summary?.confusion_flag) ||
        (showComplaintOnly && call.call_summary?.complaint_flag)
      );
    });
  }, [isAllCallsView, searchTerm, showComplaintOnly, showConfusionOnly]);

  const sortedCalls = useMemo(() => {
    const filteredCalls = getFilteredData(calls);

    return [...filteredCalls].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "call_time": {
          const dateA = getCallTimeValue(a.call_time);
          const dateB = getCallTimeValue(b.call_time);
          comparison = dateA - dateB;
          break;
        }
        case "call_direction":
          comparison = (a.call_direction || "").localeCompare(b.call_direction || "", undefined, {
            sensitivity: "base",
          });
          break;
        case "customer_name": {
          const nameA = getCustomerName(a);
          const nameB = getCustomerName(b);
          const isBlankA = !nameA;
          const isBlankB = !nameB;

          if (isBlankA !== isBlankB) {
            return sortDirection === "asc"
              ? isBlankA
                ? -1
                : 1
              : isBlankA
                ? 1
                : -1;
          }

          comparison = nameA.localeCompare(nameB, undefined, {
            sensitivity: "base",
          });
          break;
        }
        case "phone_number":
          comparison = (a.phone_number || "").localeCompare(b.phone_number || "", undefined, {
            sensitivity: "base",
          });
          break;
        case "agent_name":
          comparison = (a.agent_name || "").localeCompare(b.agent_name || "", undefined, {
            sensitivity: "base",
          });
          break;
        case "call_duration":
          comparison = (a.call_duration || 0) - (b.call_duration || 0);
          break;
        case "confusion":
          comparison = Number(a.call_summary?.confusion_flag) - Number(b.call_summary?.confusion_flag);
          break;
        case "complaint":
          comparison = Number(a.call_summary?.complaint_flag) - Number(b.call_summary?.complaint_flag);
          break;
      }

      if (comparison === 0) {
        return compareCallTimeDesc(a, b);
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [calls, compareCallTimeDesc, getFilteredData, sortDirection, sortField]);

  const pageCount = Math.ceil(sortedCalls.length / itemsPerPage);

  useEffect(() => {
    if (pageCount === 0 && currentPage !== 1) {
      setCurrentPage(1);
      return;
    }

    if (pageCount > 0 && currentPage > pageCount) {
      setCurrentPage(pageCount);
    }
  }, [currentPage, pageCount]);

  const paginatedData = useMemo(
    () =>
      sortedCalls.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [sortedCalls, currentPage, itemsPerPage]
  );

  const handleSort = (field: SortField) => {
    setCurrentPage(1);
    setSortConfig((currentSort) => {
      if (currentSort.field === field) {
        return {
          field,
          direction: currentSort.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        field,
        direction: field === "call_time" ? "desc" : "asc",
      };
    });
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />;
    }

    return sortDirection === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 text-[#00B3A4]" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-[#00B3A4]" />
    );
  };

  const startEntry = sortedCalls.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endEntry = sortedCalls.length === 0 ? 0 : Math.min(currentPage * itemsPerPage, sortedCalls.length);

  const exportToExcel = () => {
    const exportData = sortedCalls.map((call) => ({
      "Call Time": call.call_time,
      Direction: call.call_direction,
      "Customer Name": getCustomerName(call) || "-",
      "Phone Number": call.phone_number,
      "Agent Name": call.agent_name,
      "Duration (s)": call.call_duration,
      Confusion: call.call_summary.confusion_flag ? "Yes" : "No",
      Complaint: call.call_summary.complaint_flag ? "Yes" : "No",
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Calls");

    // Generate and save file
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(data, `calls_export_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const exportToPDF = () => {
    // Create a clone of the table for PDF export
    const table = document
      .querySelector("table")
      ?.cloneNode(true) as HTMLElement;
    if (!table) return;

    // Create a container with some styling
    const container = document.createElement("div");
    container.style.padding = "20px";

    // Add a title
    const title = document.createElement("h2");
    title.textContent = "Call Details Report";
    title.style.marginBottom = "20px";
    container.appendChild(title);
    container.appendChild(table);

    // Configure PDF options
    const opt = {
      margin: 1,
      filename: `calls_report_${new Date().toISOString().split("T")[0]}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "landscape" },
    };

    // Generate PDF
    html2pdf().set(opt).from(container).save();
  };
  const handleDetailsClick = (call: NewCall) => {
    const coverages = call.call_summary?.question2
      ? call.call_summary.question2
          .split(",")
          .map((item: string) => item.trim())
      : [];
    const calldirection =
      call.call_direction === "inbound" ? "Inbound" : "Outbound";
    setSelectedCall({
      first_name: call.first_name,
      last_name: call.last_name,
      hawksoft_url: call.hawksoft_url,
      agentName: call.agent_name,
      callTime: call.call_time,
      phone: call.phone_number,
      area: call.phone_area,
      duration: call.call_duration.toString(),
      issueResolved: call.call_summary.issue_resolved,
      coverages: coverages,
      executiveSummary: call.call_summary.question1,
      disposition: call.call_summary.disposition||"",
      confusion: call.call_summary.question4,
      highlights: call.call_summary.key_points,
      mainIssues: call.call_summary.main_issues || [],
      actionItems: call.call_summary.follow_up_actions || [],
      transcript: call?.call_transcript,
      calldirection: calldirection,
      complaint: call.call_summary.question3
    });
    setIsModalOpen(true);
  };

  // Group followup tasks by call
  const handleFollowupTasksClick = () => {
    const source = sortedCalls.length > 0 ? sortedCalls : calls;
    if (!source || source.length === 0) {
      setFollowupTasks([]);
      setIsFollowupModalOpen(true);
      return;
    }
    
    const tasksData = source
      .filter((call) => call?.call_summary?.follow_up_actions && call.call_summary?.follow_up_actions?.length > 0)
      .map((call) => ({
        agent_name: call.agent_name || "",
        first_name: call.first_name || "",
        last_name: call.last_name || "",
        hawksoft_url: call.hawksoft_url || [],
        phone_number: call.phone_number || "",
        customerName: call?.call_summary?.customerName || "NA",
        tasks: call?.call_summary.follow_up_actions || [],
        executiveSummary: call.call_summary?.question1 || "",
        call_date: call.call_date || "",
        call_duration: call.call_duration || 0,
        call_time: call.call_time || "",
      }))
      setFollowupTasks(tasksData);
      setIsFollowupModalOpen(true);
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Call Details</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleFollowupTasksClick}
          className="ml-4 bg-blue-600 text-white font-bold hover:bg-blue-700 rounded-md px-4 py-2"
        >
          Followup Tasks
        </Button>
      </div>
      <div className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportToExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={exportToPDF}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            {isAllCallsView && (
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-sm text-muted-foreground">Filters:</span>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={showConfusionOnly}
                    onChange={(event) => {
                      setShowConfusionOnly(event.target.checked);
                      setCurrentPage(1);
                    }}
                    className="h-4 w-4 rounded border-gray-300 accent-[#00B3A4]"
                  />
                  Confusion only
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={showComplaintOnly}
                    onChange={(event) => {
                      setShowComplaintOnly(event.target.checked);
                      setCurrentPage(1);
                    }}
                    className="h-4 w-4 rounded border-gray-300 accent-[#00B3A4]"
                  />
                  Complaint only
                </label>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Search:</span>
              <Input
                type="search"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-[300px]"
              />
            </div>
          </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <button
                type="button"
                onClick={() => handleSort("call_time")}
                className="flex items-center gap-1 font-semibold text-left transition-colors hover:text-[#00B3A4]"
              >
                <span>Call Time</span>
                {renderSortIcon("call_time")}
              </button>
            </TableHead>
            <TableHead>
              <button
                type="button"
                onClick={() => handleSort("call_direction")}
                className="flex items-center gap-1 font-semibold text-left transition-colors hover:text-[#00B3A4]"
              >
                <span>Direction</span>
                {renderSortIcon("call_direction")}
              </button>
            </TableHead>
            <TableHead>
              <button
                type="button"
                onClick={() => handleSort("customer_name")}
                className="flex items-center gap-1 font-semibold text-left transition-colors hover:text-[#00B3A4]"
              >
                <span>Customer Name</span>
                {renderSortIcon("customer_name")}
              </button>
            </TableHead>
            <TableHead>
              <button
                type="button"
                onClick={() => handleSort("phone_number")}
                className="flex items-center gap-1 font-semibold text-left transition-colors hover:text-[#00B3A4]"
              >
                <span>Phone Number</span>
                {renderSortIcon("phone_number")}
              </button>
            </TableHead>
            <TableHead>
              <button
                type="button"
                onClick={() => handleSort("agent_name")}
                className="flex items-center gap-1 font-semibold text-left transition-colors hover:text-[#00B3A4]"
              >
                <span>Agent Name</span>
                {renderSortIcon("agent_name")}
              </button>
            </TableHead>
            <TableHead>
              <button
                type="button"
                onClick={() => handleSort("call_duration")}
                className="flex items-center gap-1 font-semibold text-left transition-colors hover:text-[#00B3A4]"
              >
                <span>Duration</span>
                {renderSortIcon("call_duration")}
              </button>
            </TableHead>
            <TableHead>
              <button
                type="button"
                onClick={() => handleSort("confusion")}
                className="flex items-center gap-1 font-semibold text-left transition-colors hover:text-[#00B3A4]"
              >
                <span>Confusion</span>
                {renderSortIcon("confusion")}
              </button>
            </TableHead>
            <TableHead>
              <button
                type="button"
                onClick={() => handleSort("complaint")}
                className="flex items-center gap-1 font-semibold text-left transition-colors hover:text-[#00B3A4]"
              >
                <span>Complaint</span>
                {renderSortIcon("complaint")}
              </button>
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((call) => (
            <TableRow key={call.id}>
              <TableCell>{call.call_time}</TableCell>
              <TableCell>
                <DirectionIcon direction={call.call_direction} />
              </TableCell>
              <TableCell
                className="relative group"
                onMouseEnter={() => setHoveredCallId(call.id)}
                onMouseLeave={() => setHoveredCallId(null)}
              >
                <div className="flex items-center gap-1">
                  {getCustomerName(call) || "-"}
                  {call.hawksoft_url && 
                   Array.isArray(call.hawksoft_url) && 
                   call.hawksoft_url.length > 0 && (
                    <span className="text-[#00B3A4] text-xs ml-1">🔗</span>
                  )}
                </div>
                
                {/* Hover Tooltip */}
                {hoveredCallId === call.id &&
                 call.hawksoft_url &&
                 Array.isArray(call.hawksoft_url) &&
                 call.hawksoft_url.length > 0 && (
                  <div 
                    className="absolute left-0 top-full pt-2 z-50 min-w-[300px] max-w-[400px]"
                    onMouseEnter={() => setHoveredCallId(call.id)}
                    onMouseLeave={() => setHoveredCallId(null)}
                  >
                    {/* Invisible bridge to make it easier to reach tooltip */}
                    <div className="absolute left-0 top-0 w-full h-2" />
                    <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-3 animate-in fade-in-0 zoom-in-95 duration-200">
                      <div className="text-xs font-semibold text-gray-700 mb-2 pb-2 border-b border-gray-200 flex items-center gap-1">
                        <span className="text-[#00B3A4]">🔗</span>
                        Hawksoft URLs ({call.hawksoft_url.length})
                      </div>
                      <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                        {call.hawksoft_url.map((url, index) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-2 p-2 rounded-md hover:bg-[#00B3A4]/10 transition-colors group/link cursor-pointer"
                            title={url}
                          >
                            <ExternalLink className="h-3.5 w-3.5 text-[#00B3A4] flex-shrink-0 mt-0.5" />
                            <span className="text-xs text-[#00B3A4] hover:text-[#009B94] break-all group-hover/link:underline leading-relaxed">
                              {url}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </TableCell>
              <TableCell>{call.phone_number}</TableCell>
              <TableCell>{call.agent_name}</TableCell>
              <TableCell>{call.call_duration}s</TableCell>
              <TableCell>
                {call.call_summary.confusion_flag ? "Yes" : "No"}
              </TableCell>
              <TableCell>
                {call.call_summary.complaint_flag ? "Yes" : "No"}
              </TableCell>
              <TableCell>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleDetailsClick(call)}
                  className="bg-[#00B3A4] hover:bg-[#009B94]"
                >
                  Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Showing {startEntry} to {endEntry} of {sortedCalls.length} entries
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, pageCount))
            }
            disabled={pageCount === 0 || currentPage === pageCount}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <FollowupTasksModal
        isOpen={isFollowupModalOpen}
        onClose={() => setIsFollowupModalOpen(false)}
        tasks={followupTasks}
      />
      <CallDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedCall}
      />
    </Card>
  );
}
