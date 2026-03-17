"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
// Add these imports at the top
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCallDetailsStore } from "../store/store";
import CallDetailsModal from "./CallDetailsModal";
import {
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Printer,
  X,
  ExternalLink,
} from "lucide-react";
import FollowupTasksModal from "./FollowupTasksModal";
export default function CallTable() {
  const calls = useCallDetailsStore((state) => state.calls);
  // type Call = typeof calls[number];
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<SelectedCallRecord | null>(null);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [selectedOperator, setSelectedOperator] = useState("equals");
  const [selectedValue, setSelectedValue] = useState("");
  const [sorted, setSorted] = useState<CallRecord[]>([]);
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

  const sortedData = useCallback((data: typeof calls) => {
    return [...data].sort((a, b) => {
      if(!a.call_time || !b.call_time) return 0; // Handle cases where call_time might be undefined
      const dateA = new Date(a.call_time).getTime();
      const dateB = new Date(b.call_time).getTime();
      return dateB - dateA;
    });
  }, []);

  // Filter calls based on searchable fields and advanced filters
  const getFilteredData = useCallback((callsData: CallRecord[]) => {
    return callsData.filter((call) => {
      const matchesSearch = Object.values({
        call_time: call.call_time,
        call_direction: call.call_direction,
        phone_number: call.phone_number,
        agent_name: call.agent_name,
        first_name: call.first_name,
        last_name: call.last_name,
        customerName: call.call_summary?.customerName,
        call_duration: call.call_duration,
        call_date: call.call_date,
      }).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (selectedAgent && selectedValue) {
        const fieldValue = call[selectedAgent as keyof typeof call];
        const match =
          selectedOperator === "equals"
            ? fieldValue === selectedValue
            : fieldValue !== selectedValue;
        return matchesSearch && match;
      }

      return matchesSearch;
    });
  }, [searchTerm, selectedAgent, selectedValue, selectedOperator]);

  useEffect(() => {
    const filtered = getFilteredData(calls);
    const sorted = sortedData(filtered);
    setSorted(sorted);
  }, [calls, getFilteredData, sortedData]);

  const filteredData = useMemo(() => getFilteredData(calls), [calls, getFilteredData]);
  const pageCount = Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = useMemo(
    () =>
      sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [sorted, currentPage, itemsPerPage]
  );
  const exportToExcel = () => {
    // Prepare data for export
    const exportData = filteredData.map((call) => ({
      "Call Time": call.call_time,
      Direction: call.call_direction,
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
    const source = sorted && sorted.length > 0 ? sorted : calls;
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
        <div className="flex items-center gap-4">
          <span className="text-sm">Custom Search Builder</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setSelectedAgent("");
              setSelectedOperator("equals");
              setSelectedValue("");
              setCurrentPage(1);
            }}
          >
            Clear All
          </Button>
        </div>

        <div className="flex flex-col gap-4 overflow-visible">
          <div className="flex items-center gap-2 flex-wrap overflow-visible">
            <div className="flex items-center gap-2">
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select Field" />
                </SelectTrigger>
                <SelectContent className="bg-gray-100">
                  <SelectItem value="agent_name">Agent Name</SelectItem>
                  <SelectItem value="call_direction">Call Direction</SelectItem>
                  {/* <SelectItem value="call_duration">Duration</SelectItem> */}
                </SelectContent>
              </Select>

              <Select
                value={selectedOperator}
                onValueChange={setSelectedOperator}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Equals" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="not_equals">Not Equals</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedValue} onValueChange={setSelectedValue}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select Value" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(
                    new Set(
                      calls.map((call) => {
                        const value = selectedAgent
                          ? call[selectedAgent as keyof typeof call]
                          : "";
                        return value?.toString() || "";
                      })
                    )
                  )
                    .filter(Boolean)
                    .map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedAgent("");
                  setSelectedOperator("equals");
                  setSelectedValue("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* <Button variant="outline">Add Condition</Button> */}
          </div>

          <div className="flex items-center justify-between">
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
            <TableHead>Call Time</TableHead>
            <TableHead>Direction</TableHead>
            <TableHead>Customer Name</TableHead>
            <TableHead>Phone Number</TableHead>
            <TableHead>Agent Name</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Confusion</TableHead>
            <TableHead>Complaint</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((call) => (
            <TableRow key={call.id}>
              <TableCell>{call.call_time}</TableCell>
              <TableCell>{call.call_direction}</TableCell>
              <TableCell
                className="relative group"
                onMouseEnter={() => setHoveredCallId(call.id)}
                onMouseLeave={() => setHoveredCallId(null)}
              >
                <div className="flex items-center gap-1">
                  {[call.first_name?.trim(), call.last_name?.trim()].filter(Boolean).join(" ") || "-"}
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
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, sorted.length)} of{" "}
            {sorted.length} entries
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
            disabled={currentPage === pageCount}
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
