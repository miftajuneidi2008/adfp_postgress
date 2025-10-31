// app/product/[id]/ApplicationDetailsClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Import your UI components
import { AppHeader } from "@/components/layout/app-header";
import { AppNav } from "@/components/layout/app-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/components/notifications/toast-provider";
import { SessionPayload } from "@/lib/auth/hooks"; // Your auth hook's profile type

// Import the server action to perform mutations
import {
  updateApplicationStatusAndNotify,
  StatusHistory,
  ApplicationStatus,
  Application,
} from "@/lib/data/applicationDetail";

interface ApplicationDetailsClientProps {
  initialApplication: Application;
  initialHistory: StatusHistory[];
  profile: SessionPayload; // Assuming SessionPayload is the type for your user profile
  applicationId: string;
}

export default function ApplicationDetailsClient({
  initialApplication,
  initialHistory,
  profile,
  applicationId,
}: ApplicationDetailsClientProps) {
  const router = useRouter();
  const { showToast } = useToast();

  // Initialize state with data from server component
  const [application, setApplication] =
    useState<Application>(initialApplication);
  const [history, setHistory] = useState<StatusHistory[]>(initialHistory);

  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [approverComments, setApproverComments] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Re-fetch data if initialApplication or initialHistory props change (e.g., from a router.refresh())
  useEffect(() => {
    setApplication(initialApplication);
    setHistory(initialHistory);
  }, [initialApplication, initialHistory]);

  // Helper function to handle status updates via Server Action
  const performStatusUpdate = async (
    newStatus: ApplicationStatus,
    reason: string | null = null,
    comments: string | null = null
  ) => {
    if (!profile || !application) return;

    setActionLoading(true);
    try {
     
      const respose = await fetch(`/api/updateApplicationandNotify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({  applicationId: application.id,
        newStatus: newStatus,
        profileId: profile.id,
        profileRole: profile.role,
        fromStatus: application.status,
        reason: reason,
        comments: comments,
        submittedBy: application.submitted_by,
        applicationNumber: application.application_number,
        customerName: application.customer_name,
        productName: application.product.name, }),
      });

      if (respose.ok) {
        showToast({
          title: `Application ${
            newStatus.charAt(0).toUpperCase() + newStatus.slice(1)
          }`,
          message: `Application ${application.application_number} has been ${newStatus} successfully.`,
          type: "success",
        });

        router.push("/dashboard");
        router.refresh();
      }
      else {
        throw new Error("Request failed")
      }
    } catch (error: any) {
      console.error(`[v0] Error ${newStatus}ing application:`, error);
      showToast({
        title: `${
          newStatus.charAt(0).toUpperCase() + newStatus.slice(1)
        } Failed`,
        message:
          error.message ||
          `Failed to ${newStatus} application. Please try again.`,
        type: "error",
      });
    } finally {
      setActionLoading(false);
      setReturnReason(""); // Clear dialog state
      setApproverComments(""); // Clear comments
    }
  };

  const handleApprove = () =>
    performStatusUpdate("approved", null, approverComments);
  const handleReject = () => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;
    performStatusUpdate("rejected", reason, approverComments);
  };
  const handleReturn = () => {
    if (!returnReason.trim()) {
      showToast({
        title: "Missing Information",
        message: "Please provide a reason for returning the application.",
        type: "warning",
      });
      return;
    }
    performStatusUpdate("returned", returnReason, approverComments);
    setShowReturnDialog(false); // Close dialog after confirming return
  };

  const getStatusBadge = (status: string) => {
    /* ... (same as your original) */
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-cyan-100 text-cyan-700">Pending Approval</Badge>
        );
      case "approved":
        return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
      case "returned":
        return <Badge className="bg-amber-100 text-amber-700">Returned</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    /* ... (same as your original) */
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-cyan-600" />;
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "returned":
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-slate-600" />;
    }
  };

  const returnedEntry = history.find((h) => h.to_status === "returned");
  const canTakeAction =
    profile?.role === "head_office_approver" &&
    application.status === "pending";

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <AppNav />

      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Application Details
              </h1>
              <p className="text-slate-600 mt-1">
                Application ID: {application.application_number}
              </p>
            </div>
            <div>{getStatusBadge(application.status)}</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Customer Name</p>
                    <p className="font-medium text-slate-900">
                      {application.customer_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Customer ID</p>
                    <p className="font-medium text-slate-900">
                      {application.customer_id || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Phone Number</p>
                    <p className="font-medium text-slate-900">
                      {application.phone_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Branch</p>
                    <p className="font-medium text-slate-900">
                      {application.branch.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">
                      Application Date
                    </p>
                    <p className="font-medium text-slate-900">
                      {new Date(application.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Application Details */}
            <Card>
              <CardHeader>
                <CardTitle>Application Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Product Type</p>
                    <p className="font-medium text-slate-900">
                      {application.product.name}
                    </p>
                  </div>
                  {application.remarks && (
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Remarks</p>
                      <p className="font-medium text-slate-900">
                        {application.remarks}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Returned Application Alert */}
            {returnedEntry && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription>
                  <p className="font-semibold text-amber-900 mb-1">
                    Returned Application
                  </p>
                  <p className="text-amber-800">
                    <span className="font-medium">Reason:</span>{" "}
                    {returnedEntry.reason || "No reason provided"}
                  </p>
                  {returnedEntry.comments && (
                    <p className="text-amber-800 mt-1">
                      <span className="font-medium">Comments:</span>{" "}
                      {returnedEntry.comments}
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Immutable Audit Trail */}
            <Card>
              <CardHeader>
                <CardTitle>Immutable Audit Trail</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {history.map((entry, index) => (
                    <div key={entry.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                          {getStatusIcon(entry.to_status)}
                        </div>
                        {index < history.length - 1 && (
                          <div className="w-0.5 flex-1 bg-slate-200 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="font-semibold text-slate-900 capitalize">
                          Application {entry.to_status.replace("_", " ")}
                        </p>
                        <p className="text-sm text-slate-600">
                          {entry.user?.full_name || "Unknown User"} -{" "}
                          {new Date(entry.created_at).toLocaleString()}
                        </p>
                        {entry.reason && (
                          <p className="text-sm text-slate-700 mt-1">
                            <span className="font-medium">Reason:</span>{" "}
                            {entry.reason}
                          </p>
                        )}
                        {entry.comments && (
                          <p className="text-sm text-slate-700 mt-1">
                            <span className="font-medium">Comments:</span>{" "}
                            {entry.comments}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {profile?.role === "head_office_approver" && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {canTakeAction ? (
                    <>
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={handleApprove}
                        disabled={actionLoading}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={handleReject}
                        disabled={actionLoading}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        onClick={() => setShowReturnDialog(true)}
                        disabled={actionLoading}
                      >
                        Return
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-slate-600 text-center py-4">
                      {application.status === "pending"
                        ? "You don't have permission to act on this application"
                        : "This application has already been processed"}
                    </p>
                  )}
                </CardContent>

                {canTakeAction && (
                  <>
                    <CardHeader className="pt-6">
                      <CardTitle>Approver Comments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="Enter comments here..."
                        value={approverComments}
                        onChange={(e) => setApproverComments(e.target.value)}
                        rows={4}
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        Mandatory if returning or rejecting the application.
                      </p>
                    </CardContent>
                  </>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mandatory Note for Returning Application</DialogTitle>
            <DialogDescription>
              Please provide a clear reason for returning this application to
              the previous stage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="return-reason">
                Reason / Note <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="return-reason"
                placeholder="Enter reason for returning application..."
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                rows={5}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReturnDialog(false);
                  setReturnReason("");
                }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReturn}
                disabled={actionLoading || !returnReason.trim()}
              >
                {actionLoading ? "Returning..." : "Confirm Return"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
