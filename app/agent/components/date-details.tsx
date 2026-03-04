"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function DateDetails() {
  // const params = useParams();
  const router = useRouter();

  // Sample data for records (you would typically fetch this data based on the date)

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Button variant="outline" onClick={handleBack} className="mb-4">
        <ChevronLeft className="h-4 w-4 mr-2" />
        Back to Calendar
      </Button>
    </div>
  );
}
