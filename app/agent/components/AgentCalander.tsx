"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Phone, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAgentStore } from "../store/store";
import { CallDataRecord, AudioFile } from "../store/types";
import dayjs from "dayjs";
import { useAuthStore } from "@/store/auth/store";

export default function Dashboard() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedNav, setSelectedNav] = useState<"today" | "previous" | "next">(
    "today"
  );

  const { dailySummaries, fetchDailySummaries, isLoading } = useAgentStore();
  const { user } = useAuthStore();
  const [monthAudioFiles, setMonthAudioFiles] = useState<AudioFile[]>([]);
  const [monthLoading, setMonthLoading] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<{ type: 'calls' | 'tasks'; day: number } | null>(null);

  useEffect(() => {
    const month = dayjs(currentDate).startOf('month').format("YYYY-MM-DD");
    if (user?.user_metadata?.extension) {
      fetchDailySummaries(user.user_metadata.extension, month);
    }
  }, [currentDate, fetchDailySummaries, user?.user_metadata?.extension]);

  // Fetch all audio files for the month
  useEffect(() => {
    if (user?.user_metadata?.extension) {
      setMonthLoading(true);
      const startOfMonth = dayjs(currentDate).startOf('month').format("YYYY-MM-DD");
      const endOfMonth = dayjs(currentDate).endOf('month').format("YYYY-MM-DD");
      
      fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/audio_files?select=*&call_date=gte.${startOfMonth}&call_date=lte.${endOfMonth}&extension=eq.${user.user_metadata.extension}&order=call_date.asc`,
        {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
        }
      )
        .then(response => response.json())
        .then(async (data: AudioFile[]) => {
          // Set audio files immediately so calendar can render
          setMonthAudioFiles(data);
          setMonthLoading(false); // Stop loading spinner immediately
        })
        .catch((error) => {
          console.error("Failed to fetch month audio files:", error);
          setMonthLoading(false);
        });
    }
  }, [currentDate, user?.user_metadata?.extension]);

  // Calculate call data from daily summaries
  const callData = dailySummaries.reduce((acc, summary) => {
    const dateString = summary.day.split("T")[0];
    acc[dateString] = {
      day: summary.day,
      total_count: summary.total_calls,
      confusion_count: summary.total_confusion_calls || 0,
      complaint_count: summary.total_complaint_calls || 0,
    };
    return acc;
  }, {} as CallDataRecord);

  // Calculate follow-up tasks count by date (calls that have follow_up_actions)
  const followUpTasksByDate = monthAudioFiles.reduce((acc, file) => {
    const dateString = file.call_date;
    if (file.call_summary?.follow_up_actions && file.call_summary.follow_up_actions.length > 0) {
      if (!acc[dateString]) {
        acc[dateString] = 0;
      }
      acc[dateString] += 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Calculate records with todo items (files that have at least one todo item)
  // const recordsWithTodoByDate = monthAudioFiles.reduce((acc, file) => {
  //   const dateString = file.call_date;
  //   if (file.call_summary.todoItems && file.call_summary.todoItems.length > 0) {
  //     if (!acc[dateString]) {
  //       acc[dateString] = 0;
  //     }
  //     acc[dateString] += 1; // Count the record itself
  //   }
  //   return acc;
  // }, {} as Record<string, number>);

  // // Calculate todo progress for each date based on checked items from database
  // const todoProgressByDate = monthAudioFiles.reduce((acc, file) => {
  //   const dateString = file.call_date;
  //   if (file.call_summary.todoItems && file.call_summary.todoItems.length > 0) {
  //     if (!acc[dateString]) {
  //       acc[dateString] = { total: 0, checked: 0 };
  //     }
      
  //     const totalItems = file.call_summary.todoItems.length;
  //     acc[dateString].total += totalItems;
      
  //     // Count checked items from database
  //     const fileActionItem = actionItems[file.id];
  //     if (fileActionItem && fileActionItem.todo_items) {
  //       // Count how many items are checked (value is true)
  //       const checkedCount = fileActionItem.todo_items.reduce((count, itemObj) => {
  //         // itemObj is like { "todo item text": true/false }
  //         const values = Object.values(itemObj);
  //         return count + (values[0] === true ? 1 : 0);
  //       }, 0);
  //       acc[dateString].checked += checkedCount;
  //     }
  //   }
  //   return acc;
  // }, {} as Record<string, { total: number; checked: number }>);

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const handlePrevious = (): void => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
    setSelectedNav("previous");
  };

  const handleNext = (): void => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
    setSelectedNav("next");
  };

  const handleToday = (): void => {
    setCurrentDate(new Date());
    setSelectedNav("today");
  };

  const navigateToCalls = (
    type: "all" | "confusions" | "complaints" | "followups",
    date: Date,
    day: number
  ) => {
    const month = dayjs(currentDate).format("MMMM YYYY")
    // Extract year and month name from the month string
    const [monthName, year] = month.split(" ");

    // Create a Day.js object for the given date
    const stringDate = dayjs(`${year}-${monthName}-${day}`, "YYYY-MMMM-D");

    // Format the date as YYYY-MM-DD
    const formattedDate = stringDate.format("YYYY-MM-DD");

    // Navigate to agent detail page with type and date
    router.push(`/agent/${type}/${formattedDate}`);
  };

  const renderCalendar = (): JSX.Element[] => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getFirstDayOfMonth(currentDate);
    const days: JSX.Element[] = [];
    const weekDays = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    // Add week days header
    weekDays.forEach((day) => {
      days.push(
        <div
          key={`header-${day}`}
          className="p-4 text-sm font-medium text-gray-500"
        >
          {day}
        </div>
      );
    });

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="bg-white" />);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDayDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      const dateString = dayjs(currentDayDate).format("YYYY-MM-DD");
      const dayData = callData[dateString];
      const followUpTasksCount = followUpTasksByDate[dateString] || 0;

      days.push(
        <div
          key={day}
          className={`min-h-[100px] p-4 bg-white hover:bg-gray-50 ${
            isToday(currentDayDate) ? "ring-2 ring-[#00B3A4] ring-inset" : ""
          }`}
        >
          <div
            className={`font-normal mb-3 ${
              isToday(currentDayDate) ? "text-[#00B3A4] font-medium" : ""
            }`}
          >
            {day}
          </div>
          {dayData && (
            <div className="flex items-center gap-2 relative">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2 py-1 h-auto text-xs bg-blue-100 hover:bg-blue-200 rounded-md flex items-center gap-1.5"
                  onClick={() => navigateToCalls("all", currentDayDate, day)}
                  onMouseEnter={() => setHoveredButton({ type: 'calls', day })}
                  onMouseLeave={() => setHoveredButton(null)}
                >
                  <Phone/>
                  <span className="font-medium">{dayData.total_count}</span>
                </Button>
                {hoveredButton?.type === 'calls' && hoveredButton?.day === day && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
                    Total Calls
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                )}
              </div>
              {followUpTasksCount > 0 && (
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 py-1 h-auto text-xs bg-green-100 hover:bg-green-200 rounded-md flex items-center gap-1.5"
                    onClick={() => navigateToCalls("followups", currentDayDate, day)}
                    onMouseEnter={() => setHoveredButton({ type: 'tasks', day })}
                    onMouseLeave={() => setHoveredButton(null)}
                  >
                    <ClipboardList/>
                    <span className="font-medium">{followUpTasksCount}</span>
                  </Button>
                  {hoveredButton?.type === 'tasks' && hoveredButton?.day === day && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
                      Calls with Follow-up Tasks
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                        <div className="border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  // Calculate total recordings
  const totalRecordings = Object.values(callData).reduce(
    (sum, day) => sum + day.total_count,
    0
  );

  return (
    <div className="max-w-[1200px] mx-auto">
      <h1 className="text-2xl font-semibold text-center mb-8">Dashboard</h1>

      <Card className="shadow-xl bg-gray-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-8">
              <h2 className="text-base font-normal">
                {formatDate(currentDate)}
              </h2>
              <div className="text-base font-normal">
                Total Recordings - {totalRecordings}
              </div>
            </div>

            <div className="flex border rounded-md overflow-hidden">
              <Button
                variant={selectedNav === "today" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-none border-r"
                onClick={handleToday}
              >
                Today
              </Button>
              <Button
                variant={selectedNav === "previous" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-none border-r"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant={selectedNav === "next" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-none"
                onClick={handleNext}
                disabled={isCurrentMonth(currentDate)}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
          {isLoading || monthLoading ? (
            <div className="min-h-[600px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00B3A4]"></div>
            </div>
          ) : (
            <div className="grid grid-cols-7 text-sm gap-px bg-gray-200">
              {renderCalendar()}
            </div>
          )}

          <div className="mt-6 flex justify-center gap-6 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-100 rounded mr-2 flex items-center justify-center">
                <Phone className="h-2.5 w-2.5 text-blue-600" />
              </div>
              <span className="font-medium">Total Calls</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-100 rounded mr-2 flex items-center justify-center">
                <ClipboardList className="h-2.5 w-2.5 text-green-600" />
              </div>
              <span className="font-medium">Calls with Follow-up Tasks</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
