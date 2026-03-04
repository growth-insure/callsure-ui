"use client";

import { useRouter } from "next/navigation";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BreadcrumbsProps {
  type: string;
  date: string;
}

export default function Breadcrumbs({ type, date }: BreadcrumbsProps) {
  const router = useRouter();

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
    return formattedDate;
  };

  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-center gap-2 text-sm">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => router.push("/agent")}
        >
          <Home className="h-4 w-4" />
          Recordings
        </Button>
        <span className="text-gray-500">/</span>
        <span>{formatDate(date)}</span>
      </div>
      <h1 className="text-2xl font-semibold">
        Recording Details (
        {type === "followups" 
          ? "Follow-ups" 
          : type 
            ? type.charAt(0).toUpperCase() + type.slice(1) 
            : "All"}) -{" "}
        {formatDate(date)}
      </h1>
    </div>
  );
}


