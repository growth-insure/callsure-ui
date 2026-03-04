"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { useCallDetailsStore } from "./store/store";
import Navbar from "../../components/Navbar";
import Breadcrumbs from "./components/Breadcrumbs";
import CallMetrics from "./components/CallMetrics";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

const CallCharts = dynamic(() => import("./components/CallCharts"), {
  ssr: false,
  loading: () => <div>Loading charts...</div>,
});

const CallTable = dynamic(() => import("./components/CallTable"), {
  ssr: false,
  loading: () => <div>Loading table...</div>,
});

dayjs.extend(utc);

export default function CallDetailsPage() {
  const params = useParams();
  const { type = "", date = "" } = params as { type: string; date: string };
  // const parsedDate = dayjs.utc(date).local();
  const { fetchCallDetails, isLoading, error } = useCallDetailsStore();

  useEffect(() => {
    // const formattedDate = parsedDate.format("YYYY-MM-DD");
    // Only fetch if we have valid parameters
    if (type && date) {
      // console.log("date in page.tsx ",date)
      fetchCallDetails(type, date);
    }
  }, [type, date, fetchCallDetails]);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            Loading...
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <main className="max-w-7xl mx-auto p-6">
          <div className="text-red-500">Error: {error}</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto p-6">
        <Breadcrumbs type={type} date={date} />
        <CallMetrics />
        <Suspense fallback={<div>Loading charts...</div>}>
          <CallCharts />
        </Suspense>
        <Suspense fallback={<div>Loading table...</div>}>
          <CallTable />
        </Suspense>
      </main>
    </>
  );
}
