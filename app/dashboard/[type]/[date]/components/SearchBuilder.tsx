"use client";

import { X, ChevronRight, Plus, ChevronLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type SearchCondition = {
  id: string;
  field: string;
  operator: string;
  value: string;
  children: SearchCondition[];
  logic: "AND" | "OR";
};

const FIELDS = [
  { id: "call_time", label: "Call Time", type: "datetime" },
  {
    id: "call_direction",
    label: "Call Direction",
    type: "select",
    options: ["inbound", "outbound"],
  },
  { id: "phone_number", label: "Phone Number", type: "text" },
  { id: "agent_name", label: "Agent Name", type: "text" },
  { id: "duration", label: "Duration (in Seconds)", type: "number" },
  { id: "confusion_flag", label: "Confusion Flag", type: "boolean" },
  { id: "complaint_flag", label: "Complaint Flag", type: "boolean" },
];

const OPERATORS = {
  text: [
    "equals",
    "not",
    "starts_with",
    "ends_with",
    "contains",
    "empty",
    "not_empty",
  ],
  number: ["equals", "not", "greater_than", "less_than", "between"],
  datetime: ["equals", "not", "before", "after", "between"],
  select: ["equals", "not"],
  boolean: ["equals", "not"],
};

export default function SearchBuilder({
  onChange,
}: {
  onChange?: (conditions: SearchCondition[]) => void;
}) {
  const [conditions, setConditions] = useState<SearchCondition[]>([]);

  useEffect(() => {
    onChange?.(conditions);
  }, [conditions, onChange]);

  const addMainCondition = () => {
    const newCondition: SearchCondition = {
      id: Math.random().toString(36).substring(2),
      field: "",
      operator: "",
      value: "",
      children: [],
      logic: "AND",
    };
    setConditions((prev) => [...prev, newCondition]);
  };

  const addCondition = (parentId?: string) => {
    const newCondition: SearchCondition = {
      id: Math.random().toString(36).substring(2),
      field: "",
      operator: "",
      value: "",
      children: [],
      logic: "AND",
    };

    setConditions((prev) => {
      if (!parentId) {
        return [...prev, newCondition];
      }

      return prev.map((item) => {
        if (item.id === parentId) {
          return {
            ...item,
            children: [...item.children, newCondition],
          };
        }
        return item;
      });
    });
  };

  const removeCondition = (id: string, parentId?: string) => {
    if (parentId) {
      setConditions((prev) =>
        prev.map((item) => {
          if (item.id === parentId) {
            return {
              ...item,
              children: item.children.filter((child) => child.id !== id),
            };
          }
          return item;
        })
      );
    } else {
      setConditions((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const updateCondition = (id: string, updates: Partial<SearchCondition>) => {
    const updateInArray = (items: SearchCondition[]): SearchCondition[] => {
      return items.map((item) => {
        if (item.id === id) {
          return { ...item, ...updates };
        }
        if (item.children.length > 0) {
          return {
            ...item,
            children: updateInArray(item.children),
          };
        }
        return item;
      });
    };

    setConditions((prev) => updateInArray(prev));
  };

  // const toggleLogic = (id: string) => {
  //   updateCondition(id, {
  //     logic:
  //       conditions.find((c) => c.id === id)?.logic === "AND" ? "OR" : "AND",
  //   });
  // };

  const renderCondition = (condition: SearchCondition, parentId?: string) => {
    const field = FIELDS.find((f) => f.id === condition.field);
    const operators = field ? OPERATORS[field.type as keyof typeof OPERATORS] : [];
    return (
      <div key={condition.id} className="space-y-2">
        <div className="flex items-center gap-2">
          {parentId && (
            <Select
              value={condition.logic}
              onValueChange={(value) =>
                updateCondition(condition.id, { logic: value as "AND" | "OR" })
              }
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-50">
                <SelectItem value="AND">AND</SelectItem>
                <SelectItem value="OR">OR</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Select
            value={condition.field}
            onValueChange={(value) =>
              updateCondition(condition.id, { field: value })
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Field" />
            </SelectTrigger>
            <SelectContent className="bg-gray-50">
              {FIELDS.map((field) => (
                <SelectItem key={field.id} value={field.id}>
                  {field.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={condition.operator}
            onValueChange={(value) =>
              updateCondition(condition.id, { operator: value })
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Operator" />
            </SelectTrigger>
            <SelectContent className="bg-gray-50">
              {operators.map((op: string) => (
                <SelectItem key={op} value={op}>
                  {op.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {field?.type === "select" ? (
            <Select
              value={condition.value}
              onValueChange={(value) =>
                updateCondition(condition.id, { value })
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Value" />
              </SelectTrigger>
              <SelectContent className="bg-gray-50">
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type={field?.type === "number" ? "number" : "text"}
              value={condition.value}
              onChange={(e) =>
                updateCondition(condition.id, { value: e.target.value })
              }
              className="w-[200px]"
              placeholder="Enter value..."
            />
          )}

          {!parentId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => addCondition(condition.id)}
              className="px-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}

          {parentId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeCondition(condition.id, parentId)}
              className="px-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeCondition(condition.id, parentId)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {condition.children.length > 0 && (
          <div className="space-y-2 border-l-2 border-gray-200 pl-6">
            {condition.children.map((child) =>
              renderCondition(child, condition.id)
            )}
          </div>
        )}

        {!parentId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addCondition(condition.id)}
            className="ml-[80px] text-muted-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Condition
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Custom Search Builder</h2>
        <Button variant="ghost" onClick={() => setConditions([])}>
          Clear All
        </Button>
      </div>

      <div className="space-y-4">
        {conditions.map((condition) => renderCondition(condition))}

        <Button variant="outline" size="sm" onClick={addMainCondition}>
          <Plus className="h-4 w-4 mr-2" />
          Add Main Condition
        </Button>
      </div>
    </div>
  );
}
