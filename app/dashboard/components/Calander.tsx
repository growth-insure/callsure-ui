"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CallData } from "@/app/agent/store/types";
import { useDashboardStore } from "../store/dashboardStore";
import dayjs from "dayjs";

const Dashboard = () => {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedNav, setSelectedNav] = useState<"today" | "previous" | "next">(
    "today"
  );
  const { dailySummaries, fetchDailySummaries, isLoading } =
    useDashboardStore();

  useEffect(() => {
    const month = dayjs(currentDate).startOf('month').format("YYYY-MM-DD");
    fetchDailySummaries(month);
  }, [currentDate, fetchDailySummaries]);

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

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };
  const isCurrentMonth = (): boolean => {
    const today = new Date();
    return (
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const navigateToCalls = (
    type: "all" | "confusions" | "complaints",
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

    // console.log("formattedDate---------> ", formattedDate); // Output: 2025-06-05

    // const formattedDate = dayjs(date).format("YYYY-MM-DD"); // Format: YYYY-MM-DD
    
    router.push(`/dashboard/${type}/${formattedDate}`);
  };

  const renderCalendar = (): JSX.Element[] => {
    const daysInMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    ).getDate();
    const firstDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    ).getDay();
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

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="bg-white" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDayDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      const dateString = dayjs(currentDayDate).format("YYYY-MM-DD");
      const dayData = Array.isArray(dailySummaries)
        ? dailySummaries.find(
            (summary) => summary.day.split("T")[0] === dateString
          )
        : undefined;

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
            <div className="inline-flex rounded-md overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                className="px-2 py-1 h-auto text-xs bg-blue-100 hover:bg-blue-200 rounded-l-md rounded-r-none"
                onClick={() => navigateToCalls("all", currentDayDate, day)}
              >
                {dayData.total_count}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="px-2 py-1 h-auto text-xs bg-yellow-100 hover:bg-yellow-200 border-x border-gray-200"
                onClick={() => navigateToCalls("confusions", currentDayDate, day)}
              >
                {dayData.confusion_count}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="px-2 py-1 h-auto text-xs bg-red-100 hover:bg-red-200 rounded-r-md rounded-l-none"
                onClick={() => navigateToCalls("complaints", currentDayDate, day)}
              >
                {dayData.complaint_count}
              </Button>
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="max-w-[1200px] mx-auto">
      <h1 className="text-2xl font-semibold text-center mb-8">Dashboard</h1>

      <Card className="shadow-xl bg-gray-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-8">
              <h2 className="text-base font-normal">
                {dayjs(currentDate).format("MMMM YYYY")}
              </h2>
              <div className="text-base font-normal">
                Total Recordings -{" "}
                {Array.isArray(dailySummaries)
                  ? dailySummaries.reduce(
                      (sum: number, day: CallData) => sum + day.total_count,
                      0
                    )
                  : 0}
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
                disabled={isCurrentMonth()}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="min-h-[600px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00B3A4]"></div>
            </div>
          ) : (
            <div className="grid grid-cols-7 text-sm gap-px bg-gray-200">
              {renderCalendar()}
            </div>
          )}

          <div className="mt-6 flex justify-center gap-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-100 mr-2"></div>
              <span>Total Calls</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-100 mr-2"></div>
              <span>Confusions</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-100 mr-2"></div>
              <span>Complaints</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
