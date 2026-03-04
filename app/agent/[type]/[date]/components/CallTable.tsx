"use client";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import html2pdf from "html2pdf.js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {CallRecord, SelectedCallRecord, NewCall} from "../store/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAgentCallDetailsStore } from "../store/store";
import CallDetailsModal from "./CallDetailsModal";
import {
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Printer,
  ExternalLink,
} from "lucide-react";
import FollowupTasksModal from "./FollowupTasksModal";
import { useParams, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth/store";

export default function CallTable() {
  const calls = useAgentCallDetailsStore((state) => state.calls);
  const params = useParams();
  const searchParams = useSearchParams();
  const { date = "" } = params as { date: string };
  const { user } = useAuthStore();
  const extension = user?.user_metadata?.extension || "";
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<SelectedCallRecord | null>(null);
  const [sorted, setSorted] = useState<CallRecord[]>([]);
  const [isFollowupModalOpen, setIsFollowupModalOpen] = useState(false);
  const [hoveredCallId, setHoveredCallId] = useState<number | null>(null);
  const followupTasksButtonRef = useRef<HTMLButtonElement>(null);
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
  const [completedActionItems, setCompletedActionItems] = useState<Record<number, boolean>>({});
  const [loadingActionItems, setLoadingActionItems] = useState<Record<number, boolean>>({});
  const [isMarkAllCompleteDialogOpen, setIsMarkAllCompleteDialogOpen] = useState(false);
  const [isMarkingAllComplete, setIsMarkingAllComplete] = useState(false);

  const sortedData = useCallback((data: typeof calls) => {
    return [...data].sort((a, b) => {
      if(!a.call_time || !b.call_time) return 0;
      const dateA = new Date(a.call_time).getTime();
      const dateB = new Date(b.call_time).getTime();
      return dateB - dateA;
    });
  }, []);

  // Filter calls based on searchable fields
  const getFilteredData = useCallback((callsData: CallRecord[]) => {
    const searchTermLower = searchTerm.toLowerCase().trim();
    
    return callsData.filter((call) => {
      // Special handling for "yes" or "no" - only filter by action items status
      if (searchTermLower === "yes" || searchTermLower === "no") {
        const hasActionItems = call.call_summary?.follow_up_actions && call.call_summary.follow_up_actions.length > 0;
        return searchTermLower === "yes" ? hasActionItems : !hasActionItems;
      }
      
      // Normal search across all other fields (excluding action items)
      const matchesSearch = Object.values({
        call_time: call.call_time,
        call_direction: call.call_direction,
        phone_number: call.phone_number,
        agent_name: call.agent_name,
        first_name: call.first_name,
        last_name: call.last_name,
        customerName: call.call_summary?.customerName,
        call_duration: call.call_duration,
        call_date: call.call_date
      }).some((value) =>
        value?.toString().toLowerCase().includes(searchTermLower)
      );

      return matchesSearch;
    });
  }, [searchTerm]);

  useEffect(() => {
    const filtered = getFilteredData(calls);
    const sorted = sortedData(filtered);
    setSorted(sorted);
  }, [calls, getFilteredData, sortedData]);

  // Fetch action items from Supabase when calls are loaded - using bulk API for efficiency
  useEffect(() => {
    if (calls.length === 0 || !extension || !date) return;

    const fetchActionItems = async () => {
      const callsWithTodoItems = calls.filter(
        (call) => call.call_summary?.follow_up_actions && call.call_summary.follow_up_actions.length > 0
      );

      if (callsWithTodoItems.length === 0) return;

      try {
        // Use bulk API to fetch all action items for the date in one call
        const bulkResponse = await fetch(
          `/api/action-items/bulk?extension=${extension}&call_date_start=${date}&call_date_end=${date}`
        );

        if (!bulkResponse.ok) {
          console.error('Failed to fetch bulk action items');
          return;
        }

        const bulkResult = await bulkResponse.json();
        const completionState: Record<number, boolean> = {};

        if (bulkResult.data && Array.isArray(bulkResult.data)) {
          // Create a map of action items by audio_file_id for quick lookup
          bulkResult.data.forEach((actionItem: { audio_file_id: number; todo_items: Array<Record<string, boolean>> }) => {
            if (actionItem.audio_file_id && actionItem.todo_items) {
              // Check if all action items are completed
              const allCompleted = actionItem.todo_items.every((item) => {
                return Object.values(item)[0] === true;
              });
              completionState[actionItem.audio_file_id] = allCompleted;
            }
          });
        }

        setCompletedActionItems((prev) => ({ ...prev, ...completionState }));
      } catch (error) {
        console.error('Error fetching bulk action items:', error);
      }
    };

    fetchActionItems();
  }, [calls, extension, date]);

  // Auto-scroll to Followup Tasks button if coming from calendar
  useEffect(() => {
    const scrollTo = searchParams.get('scrollTo');
    if (scrollTo === 'followupTasks' && followupTasksButtonRef.current) {
      // Small delay to ensure the page is fully rendered
      setTimeout(() => {
        followupTasksButtonRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start'
        });
        // Remove the query parameter from URL without reloading
        const url = new URL(window.location.href);
        url.searchParams.delete('scrollTo');
        window.history.replaceState({}, '', url.toString());
      }, 1000);
    }
  }, [searchParams, calls]);

  const filteredData = useMemo(() => getFilteredData(calls), [calls, getFilteredData]);
  const pageCount = Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = useMemo(
    () =>
      sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [sorted, currentPage, itemsPerPage]
  );

  const exportToExcel = () => {
    const exportData = filteredData.map((call) => ({
      "Call Time": call.call_time,
      Direction: call.call_direction,
      "Phone Number": call.phone_number,
      "Agent Name": call.agent_name,
      "Duration (s)": call.call_duration,
      Confusion: call.call_summary.confusion_flag ? "Yes" : "No",
      Complaint: call.call_summary.complaint_flag ? "Yes" : "No",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Calls");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(data, `calls_export_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const table = document
      .querySelector("table")
      ?.cloneNode(true) as HTMLElement;
    if (!table) return;

    const container = document.createElement("div");
    container.style.padding = "20px";

    const title = document.createElement("h2");
    title.textContent = "Call Details Report";
    title.style.marginBottom = "20px";
    container.appendChild(title);
    container.appendChild(table);

    const opt = {
      margin: 1,
      filename: `calls_report_${new Date().toISOString().split("T")[0]}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "landscape" },
    };

    html2pdf().set(opt).from(container).save();
  };

  const handleDetailsClick = (call: CallRecord | NewCall) => {
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
      disposition: call.call_summary?.disposition || "",
      confusion: call.call_summary.question4,
      highlights: call.call_summary.key_points,
      mainIssues: call.call_summary.main_issues || [],
      actionItems: call.call_summary.follow_up_actions || [],
      transcript: call?.call_transcript,
      calldirection: calldirection,
      complaint: call.call_summary.question3,
      callId: 'id' in call ? call.id : undefined,
      call_date: 'call_date' in call ? call.call_date : undefined,
      todoItems: call.call_summary?.follow_up_actions || []
    });
    setIsModalOpen(true);
  };

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

  const handleMarkAllComplete = async () => {
    if (!extension || !date) return;

    setIsMarkingAllComplete(true);

    try {
      // Get all calls with follow_up_actions that are NOT already completed
      const callsWithTasks = calls.filter(
        (call) => {
          const hasTasks = call.call_summary?.follow_up_actions && call.call_summary.follow_up_actions.length > 0;
          const isAlreadyCompleted = completedActionItems[call.id] === true;
          return hasTasks && !isAlreadyCompleted;
        }
      );

      if (callsWithTasks.length === 0) {
        setIsMarkingAllComplete(false);
        setIsMarkAllCompleteDialogOpen(false);
        return;
      }

      // Mark all tasks as complete for all uncompleted calls
      const updatePromises = callsWithTasks.map(async (call) => {
        try {
          const todoItems = (call.call_summary?.follow_up_actions || []).map((item) => ({
            [item]: true, // Mark all as complete
          }));

          const response = await fetch("/api/action-items", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              audio_file_id: call.id,
              extension: extension,
              date: call.call_date || date,
              todoItems: todoItems,
            }),
          });

          if (response.ok) {
            // Update local state
            setCompletedActionItems((prev) => ({
              ...prev,
              [call.id]: true,
            }));
          }
        } catch (error) {
          console.error(`Error marking complete for call ${call.id}:`, error);
        }
      });

      await Promise.all(updatePromises);
      setIsMarkAllCompleteDialogOpen(false);
    } catch (error) {
      console.error("Error marking all complete:", error);
    } finally {
      setIsMarkingAllComplete(false);
    }
  };

  // Count calls with tasks that are NOT already completed
  const callsWithTasksCount = calls.filter(
    (call) => {
      const hasTasks = call.call_summary?.follow_up_actions && call.call_summary.follow_up_actions.length > 0;
      const isAlreadyCompleted = completedActionItems[call.id] === true;
      return hasTasks && !isAlreadyCompleted;
    }
  ).length;

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Call Details</h2>
        <div className="flex items-center gap-2">
          {callsWithTasksCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMarkAllCompleteDialogOpen(true)}
              className="bg-green-600 text-white font-bold hover:bg-green-700 rounded-md px-4 py-2 flex items-center gap-2"
            >
              {/* <CheckCheck className="h-4 w-4" /> */}
              Mark All Complete
            </Button>
          )}
          <Button
            ref={followupTasksButtonRef}
            variant="outline"
            size="sm"
            onClick={handleFollowupTasksClick}
            className="bg-blue-600 text-white font-bold hover:bg-blue-700 rounded-md px-4 py-2"
          >
            Followup Tasks
          </Button>
        </div>
      </div>
      <div className="space-y-4">
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Call Time</TableHead>
            <TableHead>Direction</TableHead>
            <TableHead>Customer Name</TableHead>
            <TableHead>Phone Number</TableHead>
            <TableHead>Agent Name</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Action Items</TableHead>
            <TableHead>
              <div className="flex items-center gap-2">
                Mark Complete
              </div>
            </TableHead>
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
                  {call.first_name && call.last_name
                    ? `${call.first_name} ${call.last_name}`
                    : "-"}
                  {call.hawksoft_url && 
                   Array.isArray(call.hawksoft_url) && 
                   call.hawksoft_url.length > 0 && (
                    <span className="text-[#00B3A4] text-xs ml-1">🔗</span>
                  )}
                </div>
                
                {hoveredCallId === call.id &&
                 call.hawksoft_url &&
                 Array.isArray(call.hawksoft_url) &&
                 call.hawksoft_url.length > 0 && (
                  <div 
                    className="absolute left-0 top-full pt-2 z-50 min-w-[300px] max-w-[400px]"
                    onMouseEnter={() => setHoveredCallId(call.id)}
                    onMouseLeave={() => setHoveredCallId(null)}
                  >
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
                {call.call_summary?.follow_up_actions && call.call_summary.follow_up_actions.length > 0 ? (
                  <span>Yes</span>
                ) : (
                  <span>No</span>
                )}
              </TableCell>
              <TableCell>
                {call.call_summary?.follow_up_actions && call.call_summary.follow_up_actions.length > 0 ? (() => {
                  const isCompleted = completedActionItems[call.id] || false;
                  const isLoading = loadingActionItems[call.id] || false;
                  return (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        disabled={isLoading}
                        onChange={async () => {
                          if (isLoading || !extension || !call.call_date) return;

                          const newCompletedState = !isCompleted;
                          
                          // Optimistically update UI
                          setCompletedActionItems((prev) => ({
                            ...prev,
                            [call.id]: newCompletedState,
                          }));
                          setLoadingActionItems((prev) => ({
                            ...prev,
                            [call.id]: true,
                          }));

                          try {
                            // Build todo_items structure: [{ "item1": true/false }, { "item2": true/false }]
                            // Using follow_up_actions instead of todoItems
                            const todoItems = (call.call_summary?.follow_up_actions || []).map((item) => ({
                              [item]: newCompletedState,
                            }));

                            const response = await fetch("/api/action-items", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                audio_file_id: call.id,
                                extension: extension,
                                date: call.call_date || date,
                                todoItems: todoItems,
                              }),
                            });

                            if (!response.ok) {
                              const errorData = await response.json();
                              console.error("Failed to update action items:", errorData);
                              // Revert optimistic update on error
                              setCompletedActionItems((prev) => ({
                                ...prev,
                                [call.id]: !newCompletedState,
                              }));
                            }
                          } catch (error) {
                            console.error("Error updating action items:", error);
                            // Revert optimistic update on error
                            setCompletedActionItems((prev) => ({
                              ...prev,
                              [call.id]: !newCompletedState,
                            }));
                          } finally {
                            setLoadingActionItems((prev) => ({
                              ...prev,
                              [call.id]: false,
                            }));
                          }
                        }}
                        className="sr-only peer"
                        aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
                      />
                      <div className={`relative w-11 h-6 rounded-full transition-colors peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#00B3A4] peer-focus:ring-offset-2 ${
                        isCompleted ? "bg-[#00B3A4]" : "bg-gray-300"
                      } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}>
                        <span
                          className={`absolute top-1 left-1 inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                            isCompleted ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </div>
                    </label>
                  );
                })() : (
                  "-"
                )}
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
        onActionItemsUpdate={(callId, isCompleted) => {
          setCompletedActionItems((prev) => ({
            ...prev,
            [callId]: isCompleted,
          }));
        }}
      />

      {/* Mark All Complete Confirmation Dialog */}
      <Dialog 
        open={isMarkAllCompleteDialogOpen} 
        onOpenChange={(open) => {
          // Only allow closing if not marking (prevent closing during operation)
          if (!open && !isMarkingAllComplete) {
            setIsMarkAllCompleteDialogOpen(false);
          }
        }}
      >
        <DialogContent 
          className="bg-white"
          onInteractOutside={(e) => {
            // Prevent closing when clicking outside
            e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            // Prevent closing with Escape key
            if (!isMarkingAllComplete) {
              e.preventDefault();
              setIsMarkAllCompleteDialogOpen(false);
            } else {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Mark All Tasks Complete</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark all tasks as complete for all {callsWithTasksCount} call(s) with follow-up tasks?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMarkAllCompleteDialogOpen(false)}
              disabled={isMarkingAllComplete}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkAllComplete}
              disabled={isMarkingAllComplete}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isMarkingAllComplete ? "Marking..." : "Mark All Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}


