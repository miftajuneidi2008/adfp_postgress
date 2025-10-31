"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppNav } from "@/components/layout/app-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthContext } from "@/components/auth/auth-provider";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/notifications/toast-provider";
import { Textarea } from "@/components/ui/textarea";
import { getProductName } from "@/lib/data/Product";
import {
  createApplication,
  createApplicationStatusHistory,
  createNewApplication,
  createNotifications,
  findRelevantApproverIds,
  getApplicationNumberById,
  loadDraftApplications,
  submitDraftApplication,
  updateDraftApplication,
} from "@/lib/data/Application";
import { SessionPayload } from "@/lib/auth/hooks";
import { getProductsAction } from "@/lib/action";

interface Product {
  id: string;
  name: string;
  description: string | null;
}

export default function NewApplication({
  user,
  product,
}: {
  user: SessionPayload | null;
  product: any;
}) {
  //const { user } = useAuthContext();

  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const editId = searchParams.get("edit");
  const isEditing = !!editId;
  const profile = user;

  const [products, setProducts] = useState<Product[]>(product);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (isEditing) {
      loadDraftApplication();
    }
  }, []);

  async function loadDraftApplication() {
    if (!editId || !profile) return;
    const userId = profile.id;
    const apiUrl = `/api/draftApplication?editId=${encodeURIComponent(
      editId
    )}&userId=${encodeURIComponent(userId)}`;
    try {
      const datas = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await datas.json();
      if (datas.ok) {
        setSelectedProduct(data.product_id);
        setCustomerName(data.customer_name);
        setCustomerId(data.customer_id || "");
        setPhoneNumber(data.phone_number);
        setRemarks(data.remarks || "");
      }

      console.log(datas.json());
    } catch (error) {
      console.log(error);
      showToast({
        title: "Error",
        message: "Could not load draft application",
        type: "error",
      });
      router.push("/applications");
      return;
    }
  }

  function handleCustomerNameChange(value: string) {
    setCustomerName(value);

    // Check if value contains only letters and spaces
    const nameRegex = /^[a-zA-Z\s]*$/;
    if (value && !nameRegex.test(value)) {
      setNameError("Customer name should only contain letters and spaces");
    } else {
      setNameError("");
    }
  }

  async function handleSaveAsDraft() {
    if (!profile || !selectedProduct || !customerName || nameError) return;

    setLoading(true);

    try {
      const applicationData = {
        customer_name: customerName,
        customer_id: customerId || null,
        phone_number: phoneNumber,
        product_id: selectedProduct,
        branch_id: profile.branch_id,
        remarks: remarks || null,
        status: "draft",
        submitted_by: profile.id,
      };

      if (isEditing) {
        // Update existing draft
        const apiUrl = `/api/draftApplication/${editId}`;
        const response = await fetch(apiUrl, {
          method: "PATCH", // Specify the method
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(applicationData),
        });
        const updatedApplication = await response.json();

        if (!updatedApplication)
          throw new Error("Failed to update draft application");

        showToast({
          title: "Draft Saved",
          message: "Your draft has been updated successfully.",
          type: "success",
        });
      } else {
        // Create new draft

        const apiUrls = `/api/draftApplication`;
        const response = await fetch(apiUrls, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(applicationData),
        });
        const newApplication = await response.json();
        if (!newApplication)
          throw new Error("Failed to create new application");
        else {
          showToast({
            title: "Draft Saved",
            message: "Your application has been saved as a draft.",
            type: "success",
          });
        }
      }

      router.push("/applications");
    } catch (error: any) {
      console.error("[v0] Error saving draft:", error);
      showToast({
        title: "Save Failed",
        message: error.message || "Failed to save draft. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !selectedProduct || nameError) return;

    setLoading(true);

    try {
      let applicationId = editId;

      if (isEditing) {
        const submitDraftAPUIurl = `/api/submitDraft/${editId}}`;

        const response = await fetch(submitDraftAPUIurl, {
          method: "PATCH", // Specify the method
          headers: {
            "Content-Type": "application/json",
          },
        });
        const submittedApplication = await response.json();
        if (!submittedApplication)
          throw new Error("Failed to create new application");
      } else {
        // Create new application
        const NewApplicationData = {
          customer_name: customerName,
          customer_id: customerId || null,
          phone_number: phoneNumber,
          product_id: selectedProduct,
          branch_id: profile.branch_id,
          remarks: remarks || null,
          status: "pending",
          submitted_by: profile.id,
        };

        const application_API = `/api/application`;
        const response = await fetch(application_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(NewApplicationData),
        });
        const newlyCreatedApplication = await response.json();

        if (!newlyCreatedApplication) {
          throw new Error("Failed to create new application");
        }
        applicationId = newlyCreatedApplication.id;
      }
      const response = await fetch(`/api/application/${applicationId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const appData = await response.json();

      const applicationStatusHistory = {
        application_id: applicationId,
        from_status: isEditing ? "draft" : null,
        to_status: "pending",
        action_by: profile.id,
        action_by_role: profile.role,
      };

      const responses = await fetch(`/api/appHistory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(applicationStatusHistory),
      });
      const submittedApplication = await responses.json();

      const query = new URLSearchParams({
        applicationId: applicationId || "",
        productId: selectedProduct,
      }).toString();

      const apiUrl = `/api/approver-assignment?${query}`;

      const approver_response = await fetch(apiUrl);
      const approverAssignments = await approver_response.json();

      // 3. Handle potential errors returned from the API
      if (!approver_response.ok) {
        throw new Error(
          approverAssignments.message || "Failed to fetch approvers"
        );
      }

      if (approverAssignments) {
        const notifications = approverAssignments.map((assignment: any) => {
          console.log(assignment.approver_id,"approver")
          return {
            user_id: assignment.approver_id,
            title: "New Application Assigned",
            message: `Application ${appData?.application_number} (${
              products.find((p) => p.id === selectedProduct)?.name
            }) has been assigned to your queue.`,
            type: "application_submitted",
            related_application_id: applicationId,
          };
        });

        if (notifications.length > 0) {
          // await createNotifications(notifications);
          console.log(notifications)
          try {
            const notification_response = await fetch(`/api/notification`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ notifications }),
            });

            await notification_response.json();
          } catch (error) {
            console.log(error);
            throw new Error("Failed to create notifications");
          }
        }
      }

      showToast({
        title: "Application Submitted",
        message: `Application ${appData?.application_number} has been submitted successfully.`,
        type: "success",
        action: {
          label: "View Application",
          onClick: () => router.push(`/applications/${applicationId}`),
        },
      });

      router.push("/applications");
    } catch (error: any) {
      console.error("[v0] Error submitting application:", error);
      showToast({
        title: "Submission Failed",
        message:
          error.message || "Failed to submit application. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  if (profile?.role !== "branch_user") {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <AppNav />
        <div className="p-6">
          <p className="text-slate-600">Access denied. Branch Users only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <AppNav />

      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">
            {isEditing ? "Edit Draft Application" : "New Application"}
          </h1>
          <p className="text-slate-600 mt-1">
            {isEditing
              ? "Update your draft and submit when ready."
              : "Submit a new financing application for a customer."}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Product Selection</CardTitle>
              <CardDescription className="text-red-500">*</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => setSelectedProduct(product.id)}
                    className={`p-4 border-2 rounded-lg text-left transition-all cursor-pointer ${
                      selectedProduct === product.id
                        ? "border-teal-500 bg-teal-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedProduct === product.id
                            ? "border-teal-500"
                            : "border-slate-300"
                        }`}
                      >
                        {selectedProduct === product.id && (
                          <div className="w-3 h-3 rounded-full bg-teal-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {product.name}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer-name">
                  Customer Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customer-name"
                  placeholder="Enter customer's full name"
                  value={customerName}
                  onChange={(e) => handleCustomerNameChange(e.target.value)}
                  required
                  className={nameError ? "border-red-500" : ""}
                />
                {nameError && (
                  <p className="text-sm text-red-500">{nameError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-id">Customer ID</Label>
                <Input
                  id="customer-id"
                  placeholder="Enter customer ID (optional)"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone-number">
                  Contact Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone-number"
                  placeholder="+251 911 234 567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks (Optional)</Label>
                <Textarea
                  id="remarks"
                  placeholder="Enter any additional notes or remarks about this application..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveAsDraft}
              disabled={
                loading || !selectedProduct || !customerName || !!nameError
              }
              className="cursor-pointer"
            >
              {loading ? "Saving..." : "Save as Draft"}
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedProduct || !!nameError}
              className="cursor-pointer"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
