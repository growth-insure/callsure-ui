// "use client";

// import { useState } from "react";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   FileSpreadsheet,
//   Printer,
//   X,
//   ChevronLeft,
//   ChevronRight,
// } from "lucide-react";
// import CallDetailsModal from "../[type]/[date]/components/CallDetailsModal";

// interface CallRecord {
//   time: string;
//   direction: "inbound" | "outbound";
//   phoneNumber: string;
//   agentName: string;
//   duration: number;
//   confusionFlag: boolean;
//   complaintFlag: boolean;
// }

// interface CallModalData {
//   agentName: string;
//   callTime: string;
//   phone: string;
//   area: string;
//   duration: string;
//   issueResolved: boolean;
//   coverages: string[];
//   executiveSummary: string;
//   disposition: string;
//   confusion: string;
//   highlights: string[];
//   mainIssues: string[];
//   actionItems: string[];
//   calldirection: string;
//   complaint?: string;
// }

// export default function Component() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedAgent, setSelectedAgent] = useState("");
//   const [selectedOperator, setSelectedOperator] = useState("equals");
//   const [selectedValue, setSelectedValue] = useState("");
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [selectedCall, setSelectedCall] = useState<CallModalData | null>(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage] = useState(10);

//   const callData: CallRecord[] = [
//     {
//       time: "09:35:00",
//       direction: "inbound",
//       phoneNumber: "3364352000",
//       agentName: "Archana",
//       duration: 70,
//       confusionFlag: true,
//       complaintFlag: false,
//     },
//     {
//       time: "10:02:00",
//       direction: "inbound",
//       phoneNumber: "3163056743",
//       agentName: "Archana",
//       duration: 130,
//       confusionFlag: true,
//       complaintFlag: false,
//     },
//     {
//       time: "10:36:00",
//       direction: "outbound",
//       phoneNumber: "4693580734",
//       agentName: "Mandeep",
//       duration: 57,
//       confusionFlag: true,
//       complaintFlag: false,
//     },
//     {
//       time: "10:36:00",
//       direction: "outbound",
//       phoneNumber: "4693580734",
//       agentName: "Mandeep",
//       duration: 57,
//       confusionFlag: true,
//       complaintFlag: false,
//     },
//     {
//       time: "10:36:00",
//       direction: "outbound",
//       phoneNumber: "4693580734",
//       agentName: "Mandeep",
//       duration: 57,
//       confusionFlag: true,
//       complaintFlag: false,
//     },
//     {
//       time: "10:36:00",
//       direction: "outbound",
//       phoneNumber: "4693580734",
//       agentName: "Mandeep",
//       duration: 57,
//       confusionFlag: true,
//       complaintFlag: false,
//     },
//     {
//       time: "10:36:00",
//       direction: "outbound",
//       phoneNumber: "4693580734",
//       agentName: "Mandeep",
//       duration: 57,
//       confusionFlag: true,
//       complaintFlag: false,
//     },
//     {
//       time: "10:36:00",
//       direction: "outbound",
//       phoneNumber: "4693580734",
//       agentName: "Mandeep",
//       duration: 57,
//       confusionFlag: true,
//       complaintFlag: false,
//     },
//     {
//       time: "10:36:00",
//       direction: "outbound",
//       phoneNumber: "4693580734",
//       agentName: "Mandeep",
//       duration: 57,
//       confusionFlag: true,
//       complaintFlag: false,
//     },
//     {
//       time: "10:36:00",
//       direction: "outbound",
//       phoneNumber: "4693580734",
//       agentName: "Mandeep",
//       duration: 57,
//       confusionFlag: true,
//       complaintFlag: false,
//     },
//     {
//       time: "10:36:00",
//       direction: "outbound",
//       phoneNumber: "4693580734",
//       agentName: "Mandeep",
//       duration: 57,
//       confusionFlag: true,
//       complaintFlag: false,
//     },
//     {
//       time: "10:36:00",
//       direction: "outbound",
//       phoneNumber: "4693580734",
//       agentName: "Mandeep",
//       duration: 57,
//       confusionFlag: true,
//       complaintFlag: false,
//     },
//     {
//       time: "10:36:00",
//       direction: "outbound",
//       phoneNumber: "4693580734",
//       agentName: "Mandeep",
//       duration: 57,
//       confusionFlag: true,
//       complaintFlag: false,
//     },
//     {
//       time: "10:36:00",
//       direction: "outbound",
//       phoneNumber: "4693580734",
//       agentName: "Mandeep",
//       duration: 57,
//       confusionFlag: true,
//       complaintFlag: false,
//     },
//     {
//       time: "10:36:00",
//       direction: "outbound",
//       phoneNumber: "4693580734",
//       agentName: "Mandeep",
//       duration: 57,
//       confusionFlag: true,
//       complaintFlag: false
//     },
//     // Add more sample data as needed
//   ];

//   const handleDetailsClick = (call: CallRecord) => {
//     setSelectedCall({
//       agentName: call.agentName,
//       callTime: call.time,
//       phone: call.phoneNumber,
//       area: "N/A",
//       duration: call.duration.toString(),
//       issueResolved: false,
//       coverages: [],
//       executiveSummary: "",
//       disposition: "",
//       confusion: call.confusionFlag ? "Confusion detected in call" : "",
//       highlights: [],
//       mainIssues: [],
//       actionItems: [],
//       calldirection:""
//     });
//     setIsModalOpen(true);
//   };

//   const filteredData = callData.filter((call) => {
//     const matchesSearch = Object.values(call).some((value) =>
//       value.toString().toLowerCase().includes(searchTerm.toLowerCase())
//     );

//     if (selectedAgent && selectedValue) {
//       const agentMatch =
//         selectedOperator === "equals"
//           ? call.agentName === selectedValue
//           : call.agentName !== selectedValue;
//       return matchesSearch && agentMatch;
//     }

//     return matchesSearch;
//   });

//   const pageCount = Math.ceil(filteredData.length / itemsPerPage);
//   const paginatedData = filteredData.slice(
//     (currentPage - 1) * itemsPerPage,
//     currentPage * itemsPerPage
//   );

//   return (
//     <div className="p-6 space-y-6">
//       <div className="space-y-4">
//         <h2 className="text-2xl font-bold">Call Details</h2>
//         <div className="flex items-center justify-between mb-4">
//           <div className="text-sm">Custom Search Builder (1)</div>
//           <Button
//             variant="ghost"
//             size="sm"
//             onClick={() => {
//               setSearchTerm("");
//               setSelectedAgent("");
//               setSelectedOperator("equals");
//               setSelectedValue("");
//               setCurrentPage(1);
//             }}
//           >
//             Clear All
//           </Button>
//         </div>
//         <div className="flex flex-col gap-4">
//           <div className="flex items-center gap-2 flex-wrap">
//             <div className="flex items-center gap-2">
//               <Select value={selectedAgent} onValueChange={setSelectedAgent}>
//                 <SelectTrigger className="w-[200px]">
//                   <SelectValue placeholder="Agent Name" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="agent_name">Agent Name</SelectItem>
//                   <SelectItem value="call_direction">Call Direction</SelectItem>
//                   <SelectItem value="duration">Duration</SelectItem>
//                 </SelectContent>
//               </Select>

//               <Select
//                 value={selectedOperator}
//                 onValueChange={setSelectedOperator}
//               >
//                 <SelectTrigger className="w-[200px]">
//                   <SelectValue placeholder="Equals" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="equals">Equals</SelectItem>
//                   <SelectItem value="not_equals">Not Equals</SelectItem>
//                 </SelectContent>
//               </Select>

//               <Select value={selectedValue} onValueChange={setSelectedValue}>
//                 <SelectTrigger className="w-[200px]">
//                   <SelectValue placeholder="Value" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="Archana">Archana</SelectItem>
//                   <SelectItem value="Mandeep">Mandeep</SelectItem>
//                 </SelectContent>
//               </Select>

//               <Button
//                 variant="ghost"
//                 size="icon"
//                 onClick={() => {
//                   setSelectedAgent("");
//                   setSelectedOperator("equals");
//                   setSelectedValue("");
//                 }}
//               >
//                 <X className="h-4 w-4" />
//               </Button>
//             </div>

//             <Button variant="outline">Add Condition</Button>
//           </div>

//           <div className="flex items-center justify-between">
//             <div className="flex gap-2">
//               <Button variant="outline" size="sm">
//                 <FileSpreadsheet className="h-4 w-4 mr-2" />
//                 Excel
//               </Button>
//               <Button variant="outline" size="sm">
//                 <Printer className="h-4 w-4 mr-2" />
//                 Print
//               </Button>
//             </div>

//             <div className="flex items-center gap-2">
//               <span className="text-sm text-muted-foreground">Search:</span>
//               <Input
//                 type="search"
//                 placeholder="Search..."
//                 value={searchTerm}
//                 onChange={(e) => {
//                   setSearchTerm(e.target.value);
//                   setCurrentPage(1);
//                 }}
//                 className="w-[300px]"
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="border rounded-lg">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>Call Time</TableHead>
//               <TableHead>Call Direction</TableHead>
//               <TableHead>Phone Numbersssss</TableHead>
//               <TableHead>Agent Name</TableHead>
//               <TableHead>Duration (in Seconds)</TableHead>
//               <TableHead>Confusion Flag</TableHead>
//               <TableHead>Complaint Flag</TableHead>
//               <TableHead>Actions</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {paginatedData.map((call, index) => (
//               <TableRow key={index}>
//                 <TableCell>{call.time}</TableCell>
//                 <TableCell>{call.direction}</TableCell>
//                 <TableCell>{call.phoneNumber}</TableCell>
//                 <TableCell>{call.agentName}</TableCell>
//                 <TableCell>{call.duration}</TableCell>
//                 <TableCell>{call.confusionFlag ? "Yes" : "No"}</TableCell>
//                 <TableCell>{call.complaintFlag ? "Yes" : "No"}</TableCell>
//                 <TableCell>
//                   <Button
//                     variant="default"
//                     size="sm"
//                     onClick={() => handleDetailsClick(call)}
//                   >
//                     Details
//                   </Button>
//                 </TableCell>
//               </TableRow>
//             ))}
//           </TableBody>
//         </Table>
//       </div>

//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-2">
//           <span className="text-sm text-muted-foreground">
//             Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
//             {Math.min(currentPage * itemsPerPage, filteredData.length)} of{" "}
//             {filteredData.length} entries
//           </span>
//         </div>
//         <div className="flex items-center gap-2">
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//             disabled={currentPage === 1}
//           >
//             <ChevronLeft className="h-4 w-4" />
//             Previous
//           </Button>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() =>
//               setCurrentPage((prev) => Math.min(prev + 1, pageCount))
//             }
//             disabled={currentPage === pageCount}
//           >
//             Next
//             <ChevronRight className="h-4 w-4" />
//           </Button>
//         </div>
//       </div>

//       <CallDetailsModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         data={selectedCall}
//       />
//     </div>
//   );
// }
