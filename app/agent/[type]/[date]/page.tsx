"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { useAgentCallDetailsStore } from "./store/store";
import Navbar from "../../../dashboard/components/Navbar";
import Breadcrumbs from "./components/Breadcrumbs";
import CallMetrics from "./components/CallMetrics";
import { useAuthStore } from "@/store/auth/store";
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

function AgentCallDetailsContent() {
  const params = useParams();
  const { type = "", date = "" } = params as { type: string; date: string };
  const { fetchCallDetails, isLoading, error } = useAgentCallDetailsStore();
  const { user } = useAuthStore();

  useEffect(() => {
    // Only fetch if we have valid parameters and user extension
    if (type && date && user?.user_metadata?.extension) {
      fetchCallDetails(type, date, user.user_metadata.extension);
    }
  }, [type, date, fetchCallDetails, user?.user_metadata?.extension]);

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

export default function AgentCallDetailsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <AgentCallDetailsContent />
    </Suspense>
  );
}


