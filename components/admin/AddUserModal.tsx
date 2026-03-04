"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AtSign, User, Phone } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth/store";
import { cn } from "@/lib/utils";

type ModalSize =
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "full";

interface FormErrors {
  email?: string;
  name?: string;
  extension?: string;
}

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated?: () => void;
  size?: ModalSize;
}

const modalSizes: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  full: "max-w-full",
};

export default function AddUserModal({
  isOpen,
  onClose,
  onUserCreated,
  size = "md",
}: AddUserModalProps) {
  const { user: currentUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    extension: "",
    role: "agent" as "agent" | "admin",
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState({
    email: false,
    name: false,
    extension: false,
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name) {
      newErrors.name = `"name" is not allowed to be empty`;
    } else if (formData.name.length < 2) {
      newErrors.name = `"name" must be at least 2 characters`;
    }

    // Extension validation
    if (!formData.extension) {
      newErrors.extension = `"extension" is not allowed to be empty`;
    } else if (!/^\d+$/.test(formData.extension)) {
      newErrors.extension = `"extension" must be a valid number`;
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = `"email" is not allowed to be empty`;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = `"email" must be a valid email`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));

    // Clear error when user starts typing
    if (errors[id as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [id]: undefined,
      }));
    }
  };

  const handleRoleChange = (value: "agent" | "admin") => {
    setFormData((prev) => ({
      ...prev,
      role: value,
    }));
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
    validateForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      
      const response = await fetch("/api/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser?.id}`,
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          extension: formData.extension,
          role: formData.role,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`User ${data.user.name} created successfully. Welcome email sent to ${data.user.email}`);
        
        // Reset form
        setFormData({
          email: "",
          name: "",
          extension: "",
          role: "agent",
        });
        setErrors({});
        setTouched({
          email: false,
          name: false,
          extension: false,
        });
        
        onClose();
        
        // Call callback to refresh user list
        if (onUserCreated) {
          onUserCreated();
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to create user");
      }
    } catch (error) {
      console.error("Create user failed:", error);
      toast.error("Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      email: "",
      name: "",
      extension: "",
      role: "agent",
    });
    setErrors({});
    setTouched({
      email: false,
      name: false,
      extension: false,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          "h-[85vh] lg:h-[75vh] xl:h-[70vh] 2xl:h-[65vh] p-0 overflow-hidden flex flex-col bg-white",
          modalSizes[size]
        )}
      >
        {/* Fixed Header */}
        <div className="p-4 border-b border-gray-200">
          <DialogTitle className="text-xl font-semibold flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Add New User</span>
          </DialogTitle>
        </div>

        {/* Main scrollable container */}
        <div className="flex-1 overflow-y-auto">
          {/* White card container with padding */}
          <div className="bg-white m-4 rounded-lg border border-gray-200">
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={() => handleBlur("name")}
                      className={`bg-[#f0f7ff] pl-10 ${
                        touched.name && errors.name ? "border-red-500" : ""
                      }`}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  {touched.name && errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="extension">Extension</Label>
                  <div className="relative">
                    <Phone
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <Input
                      id="extension"
                      type="text"
                      value={formData.extension}
                      onChange={handleChange}
                      onBlur={() => handleBlur("extension")}
                      className={`bg-[#f0f7ff] pl-10 ${
                        touched.extension && errors.extension ? "border-red-500" : ""
                      }`}
                      placeholder="Enter extension number"
                      required
                    />
                  </div>
                  {touched.extension && errors.extension && (
                    <p className="text-sm text-red-500 mt-1">{errors.extension}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <AtSign
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={() => handleBlur("email")}
                      className={`bg-[#f0f7ff] pl-10 ${
                        touched.email && errors.email ? "border-red-500" : ""
                      }`}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  {touched.email && errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={handleRoleChange}>
                    <SelectTrigger className="bg-[#f0f7ff]">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-50">
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

              </form>
            </div>
          </div>
        </div>

        {/* Fixed Action Buttons at bottom */}
        <div className="p-4 border-t border-gray-200 flex justify-end space-x-2 bg-white">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            className="bg-[#00BFA5] hover:bg-[#00BFA5]/90"
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create User"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
