import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Settings, Users, BookOpen, TrendingUp, Home, Gift, Award, Plus, Trash2, Edit, MessageSquare, Upload, MapPin } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";

const settingsSchema = z.object({
  commissionRate: z.number().min(0).max(100),
  securityDeposit: z.number().min(0),
  minApartments: z.number().min(1),
  maxRentalDays: z.number().min(1).max(365),
  extensionFeePerDay: z.number().min(0),
});

const rewardSchema = z.object({
  description: z.string().min(1),
  rewardType: z.enum(["commission_free", "bonus_earning", "badge"]),
  value: z.string().min(1),
  requiredReferrals: z.number().min(1),
  requiredBooksPerReferral: z.number().min(0),
});

const INDIAN_CITIES = [
  "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad",
  "Surat", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal",
  "Visakhapatnam", "Pimpri-Chinchwad", "Patna", "Vadodara", "Ghaziabad", "Ludhiana",
  "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Kalyan-Dombivli", "Vasai-Virar",
  "Varanasi", "Srinagar", "Dhanbad", "Jodhpur", "Amritsar", "Raipur", "Allahabad",
  "Coimbatore", "Jabalpur", "Gwalior", "Vijayawada", "Madurai", "Guwahati", "Chandigarh",
  "Hubli-Dharwad", "Mysore", "Tiruchirappalli", "Bareilly", "Aligarh", "Tiruppur"
];

type SettingsForm = z.infer<typeof settingsSchema>;
type RewardForm = z.infer<typeof rewardSchema>;

export default function AdminPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current user to check admin status
  const { data: userResponse } = useQuery({
    queryKey: ["/api/auth/me"],
  });
  const currentUser = (userResponse as any)?.user;
  const isAdmin = currentUser?.isAdmin || false;

  // Fetch platform settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/admin/settings"],
  });

  // Fetch admin statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  // Fetch referral rewards
  const { data: rewards = [], isLoading: rewardsLoading } = useQuery({
    queryKey: ["/api/admin/rewards"],
  });

  // Fetch society requests
  const { data: societyRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/admin/society-requests"],
  });

  // Fetch Brocks settings
  // Fetch feedback
  const { data: feedback = [], isLoading: feedbackLoading } = useQuery({
    queryKey: ["/api/admin/feedback"],
  });

  // Fetch all approved hubs
  const { data: allHubs = [], isLoading: hubsLoading, refetch: refetchHubs } = useQuery({
    queryKey: ["/api/admin/hubs"],
  });

  //Edit hub state
  const [editingHub, setEditingHub] = useState<any>(null);
  const [editHubName, setEditHubName] = useState("");
  const [editHubLocation, setEditHubLocation] = useState("");
  const [editHubLatitude, setEditHubLatitude] = useState("");
  const [editHubLongitude, setEditHubLongitude] = useState("");

  // Bulk upload state
  const [showBulkUploadDialog, setShowBulkUploadDialog] = useState(false);
  const [bulkHubNames, setBulkHubNames] = useState("");
  const [bulkCity, setBulkCity] = useState("Mumbai");
  const [bulkHubType, setBulkHubType] = useState("society");

  // Form for settings
  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      commissionRate: 5,
      securityDeposit: 100,
      minApartments: 90,
      maxRentalDays: 30,
      extensionFeePerDay: 10,
    },
  });

  // Form for creating rewards
  const rewardForm = useForm<RewardForm>({
    resolver: zodResolver(rewardSchema),
    defaultValues: {
      description: "",
      rewardType: "commission_free",
      value: "",
      requiredReferrals: 1,
      requiredBooksPerReferral: 0,
    },
  });

  // Update form when settings load - use useEffect to prevent infinite re-renders
  useEffect(() => {
    if (settings && typeof settings === 'object' && 'commissionRate' in settings) {
      form.reset({
        commissionRate: (settings as any).commissionRate || 5,
        securityDeposit: (settings as any).securityDeposit || 100,
        minApartments: (settings as any).minApartments || 90,
        maxRentalDays: (settings as any).maxRentalDays || 30,
        extensionFeePerDay: (settings as any).extensionFeePerDay || 10,
      });
    }
  }, [settings]);

  // Mutation to update settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsForm) => {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update settings");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Platform settings have been successfully updated.",
      });
      // Force clear all cached settings
      queryClient.removeQueries({ queryKey: ["/api/admin/settings"] });
      queryClient.removeQueries({ queryKey: ["/api/platform/settings"] });
      // Immediately refetch the updated settings
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/platform/settings"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation to create referral reward
  const createRewardMutation = useMutation({
    mutationFn: async (data: RewardForm) => {
      const response = await fetch("/api/admin/rewards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create reward");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reward Created",
        description: "Referral reward has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rewards"] });
      rewardForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create reward. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation to delete referral reward
  const deleteRewardMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      const response = await fetch(`/api/admin/rewards/${rewardId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete reward");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reward Deleted",
        description: "Referral reward has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rewards"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete reward. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Society review mutation
  const reviewSocietyMutation = useMutation({
    mutationFn: async ({ requestId, approved, reason }: { requestId: number; approved: boolean; reason?: string }) => {
      const response = await fetch("/api/admin/society-requests/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId, approved, reason }),
      });

      if (!response.ok) {
        throw new Error("Failed to review society request");
      }

      return response.json();
    },
    onSuccess: (data, { approved }) => {
      toast({
        title: approved ? "Society Approved" : "Society Rejected",
        description: approved ? "Society request has been approved successfully" : "Society request has been rejected",
      });
      // Refresh the society requests list
      queryClient.invalidateQueries({ queryKey: ["/api/admin/society-requests"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process society request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle society approval
  const handleApproveReject = async (requestId: number, approved: boolean) => {
    await reviewSocietyMutation.mutateAsync({ requestId, approved });
  };

  // Bulk hub upload mutation
  const bulkUploadMutation = useMutation({
    mutationFn: async (data: { hubs: Array<{ name: string; location?: string; latitude?: string; longitude?: string }>; city: string; hubType: string }) => {
      const response = await apiRequest("POST", "/api/societies/bulk", data);
      return response.json();
    },
    onSuccess: (data) => {
      const hubTypeLabel = bulkHubType === 'society' ? 'society' :
        bulkHubType === 'school' ? 'school' : 'office';
      const hubTypePlural = bulkHubType === 'society' ? 'societies' :
        bulkHubType === 'school' ? 'schools' : 'offices';
      toast({
        title: "Bulk Upload Complete",
        description: `Successfully created ${data.created} ${data.created === 1 ? hubTypeLabel : hubTypePlural}. ${data.skipped > 0 ? `Skipped ${data.skipped} duplicates.` : ""}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hubs"] });
      setShowBulkUploadDialog(false);
      setBulkHubNames("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create bulk hubs",
        variant: "destructive",
      });
    },
  });

  const handleBulkUpload = () => {
    const hubs: Array<{ name: string; location?: string; latitude?: string; longitude?: string }> = [];

    const lines = bulkHubNames.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const parts = trimmed.split('|').map(p => p.trim());
      const name = parts[0];
      const location = parts[1];
      const latitude = parts[2];
      const longitude = parts[3];

      if (name && name.length > 0) {
        hubs.push({
          name,
          location: location || undefined,
          latitude: latitude || undefined,
          longitude: longitude || undefined
        });
      }
    }

    if (hubs.length === 0) {
      const hubTypeLabel = bulkHubType === 'society' ? 'society' :
        bulkHubType === 'school' ? 'school' : 'office';
      toast({
        title: `No ${hubTypeLabel}s`,
        description: `Please enter at least one ${hubTypeLabel} name`,
        variant: "destructive",
      });
      return;
    }

    bulkUploadMutation.mutate({
      hubs,
      city: bulkCity,
      hubType: bulkHubType
    });
  };

  // Mutation to update hub
  const updateHubMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const response = await apiRequest("PUT", `/api/societies/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Hub Updated", description: "Hub details updated successfully" });
      refetchHubs();
      setEditingHub(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update hub", variant: "destructive" });
    },
  });

  // Mutation to delete hub
  const deleteHubMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/societies/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Hub Deleted", description: "Hub has been successfully deleted" });
      refetchHubs();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete hub", variant: "destructive" });
    },
  });

  // Mutation to geocode hubs
  const geocodeHubsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/geocode-hubs", {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Geocoding Complete",
        description: `Successfully generated coordinates for ${data.updated} out of ${data.total} hubs${data.errors && data.errors.length > 0 ? `. ${data.errors.length} errors occurred.` : ""}`
      });
      refetchHubs();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to geocode hubs", variant: "destructive" });
    },
  });

  const handleEditHub = (hub: any) => {
    setEditingHub(hub);
    setEditHubName(hub.name);
    setEditHubLocation(hub.location);
    setEditHubLatitude(hub.latitude || "");
    setEditHubLongitude(hub.longitude || "");
  };

  const handleSaveHub = () => {
    if (!editingHub) return;
    updateHubMutation.mutate({
      id: editingHub.id,
      updates: {
        name: editHubName,
        location: editHubLocation,
        latitude: editHubLatitude || null,
        longitude: editHubLongitude || null
      }
    });
  };

  const handleDeleteHub = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      deleteHubMutation.mutate(id);
    }
  };

  const onSubmit = (data: SettingsForm) => {
    updateSettingsMutation.mutate(data);
  };

  const onCreateReward = (data: RewardForm) => {
    createRewardMutation.mutate(data);
  };

  const onDeleteReward = (rewardId: number) => {
    if (confirm("Are you sure you want to delete this reward?")) {
      deleteRewardMutation.mutate(rewardId);
    }
  };

  if (settingsLoading || statsLoading) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <Badge variant="secondary">Administrator</Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-text-secondary">Total Users</p>
                <p className="text-2xl font-bold">{(stats as any)?.totalUsers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-text-secondary">Total Books</p>
                <p className="text-2xl font-bold">{(stats as any)?.totalBooks || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Home className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-text-secondary">Total Schools</p>
                <p className="text-2xl font-bold">{(stats as any)?.totalSocieties || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-text-secondary">Active Rentals</p>
                <p className="text-2xl font-bold">{(stats as any)?.activeRentals || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Panel */}
      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList className="flex flex-wrap justify-start h-auto gap-2 p-2 bg-gray-100">
          <TabsTrigger value="settings" className="whitespace-nowrap">Platform Settings</TabsTrigger>
          <TabsTrigger value="page-content" className="whitespace-nowrap">Page Content</TabsTrigger>
          <TabsTrigger value="manage-hubs" className="whitespace-nowrap">Manage Schools</TabsTrigger>
          <TabsTrigger value="schools" className="whitespace-nowrap">School Requests</TabsTrigger>
          <TabsTrigger value="analytics" className="whitespace-nowrap">Analytics</TabsTrigger>
          <TabsTrigger value="feedback" className="whitespace-nowrap flex items-center">
            <MessageSquare className="h-4 w-4 mr-2" />
            Feedback
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Platform Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                    <Input
                      id="commissionRate"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      {...form.register("commissionRate", { valueAsNumber: true })}
                    />
                    {form.formState.errors.commissionRate && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.commissionRate.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="securityDeposit">Security Deposit (₹)</Label>
                    <Input
                      id="securityDeposit"
                      type="number"
                      min="0"
                      {...form.register("securityDeposit", { valueAsNumber: true })}
                    />
                    {form.formState.errors.securityDeposit && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.securityDeposit.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minApartments">Minimum Apartments for Society</Label>
                    <Input
                      id="minApartments"
                      type="number"
                      min="1"
                      {...form.register("minApartments", { valueAsNumber: true })}
                    />
                    {form.formState.errors.minApartments && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.minApartments.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxRentalDays">Maximum Rental Days</Label>
                    <Input
                      id="maxRentalDays"
                      type="number"
                      min="1"
                      max="365"
                      {...form.register("maxRentalDays", { valueAsNumber: true })}
                    />
                    {form.formState.errors.maxRentalDays && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.maxRentalDays.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="extensionFeePerDay">Extension Fee Per Day (₹)</Label>
                    <Input
                      id="extensionFeePerDay"
                      type="number"
                      step="0.01"
                      min="0"
                      {...form.register("extensionFeePerDay", { valueAsNumber: true })}
                    />
                    {form.formState.errors.extensionFeePerDay && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.extensionFeePerDay.message}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={updateSettingsMutation.isPending}
                  className="w-full md:w-auto"
                >
                  {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schools">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>School Requests</CardTitle>
                {isAdmin && (
                  <Dialog open={showBulkUploadDialog} onOpenChange={setShowBulkUploadDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" data-testid="button-bulk-upload">
                        <Upload className="h-4 w-4 mr-2" />
                        Bulk Upload Schools
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Bulk Upload Schools</DialogTitle>
                        <DialogDescription>
                          Enter school names, one per line, to create multiple school requests at once.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="bulk-city">City</Label>
                          <Select value={bulkCity} onValueChange={setBulkCity}>
                            <SelectTrigger id="bulk-city" data-testid="select-bulk-city">
                              <SelectValue placeholder="Select city" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {INDIAN_CITIES.map((city) => (
                                <SelectItem key={city} value={city}>
                                  {city}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="bulk-hubs">
                            School Names (one per line)
                          </Label>
                          <Textarea
                            id="bulk-hubs"
                            value={bulkHubNames}
                            onChange={(e) => setBulkHubNames(e.target.value)}
                            placeholder="Ryan International School | https://maps.google.com/?q=...&#10;DPS Mumbai&#10;Campion School | https://maps.google.com/?q=..."
                            rows={15}
                            className="font-mono text-sm"
                            data-testid="textarea-bulk-hubs"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {bulkHubNames.split("\n").filter(s => s.trim().length > 0).length} schools entered
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Format: School Name | Location URL (optional) | Latitude (optional) | Longitude (optional)
                          </p>
                        </div>
                        <Button
                          onClick={() => {
                            setBulkHubType('school');
                            handleBulkUpload();
                          }}
                          disabled={bulkUploadMutation.isPending}
                          className="w-full"
                          data-testid="button-submit-bulk"
                        >
                          {bulkUploadMutation.isPending ? "Creating..." : "Create Schools"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(societyRequests as any[]).filter((r: any) => r.hubType === 'school').length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pending school requests</p>
                  </div>
                ) : (
                  (societyRequests as any[]).filter((r: any) => r.hubType === 'school').map((request: any) => (
                    <div key={request.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{request.name}</h3>
                          <p className="text-sm text-gray-600">{request.city} • {request.apartmentCount} students</p>
                          <p className="text-xs text-gray-500 mt-1">{request.description}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            disabled={reviewSocietyMutation.isPending}
                            onClick={() => handleApproveReject(request.id, true)}
                          >
                            {reviewSocietyMutation.isPending ? "Processing..." : "Approve"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            disabled={reviewSocietyMutation.isPending}
                            onClick={() => handleApproveReject(request.id, false)}
                          >
                            {reviewSocietyMutation.isPending ? "Processing..." : "Reject"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage-hubs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Manage All Hubs</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => geocodeHubsMutation.mutate()}
                  disabled={geocodeHubsMutation.isPending}
                  data-testid="button-geocode-hubs"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {geocodeHubsMutation.isPending ? "Geocoding..." : "Generate Missing Coordinates"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {hubsLoading ? (
                  <div className="text-center py-8">Loading hubs...</div>
                ) : allHubs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No approved hubs found</p>
                  </div>
                ) : (
                  allHubs.map((hub: any) => (
                    <div key={hub.id} className="p-4 border rounded-lg">
                      {editingHub?.id === hub.id ? (
                        <div className="space-y-4">
                          <div>
                            <Label>Hub Name</Label>
                            <Input
                              value={editHubName}
                              onChange={(e) => setEditHubName(e.target.value)}
                              placeholder="Hub name"
                            />
                          </div>
                          <div>
                            <Label>Location</Label>
                            <Input
                              value={editHubLocation}
                              onChange={(e) => setEditHubLocation(e.target.value)}
                              placeholder="Location"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Latitude</Label>
                              <Input
                                value={editHubLatitude}
                                onChange={(e) => setEditHubLatitude(e.target.value)}
                                placeholder="Latitude (optional)"
                              />
                            </div>
                            <div>
                              <Label>Longitude</Label>
                              <Input
                                value={editHubLongitude}
                                onChange={(e) => setEditHubLongitude(e.target.value)}
                                placeholder="Longitude (optional)"
                              />
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={handleSaveHub} disabled={updateHubMutation.isPending}>
                              {updateHubMutation.isPending ? "Saving..." : "Save"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingHub(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{hub.name}</h3>
                            <p className="text-sm text-gray-600">
                              {hub.hubType} • {hub.location || hub.city} • {hub.memberCount || 0} members
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Code: {hub.code}</p>
                            {(hub.latitude && hub.longitude) && (
                              <p className="text-xs text-gray-500 mt-1">
                                <MapPin className="h-3 w-3 inline mr-1" />
                                Coordinates: {hub.latitude}, {hub.longitude}
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 border-blue-600 hover:bg-blue-50"
                              onClick={() => handleEditHub(hub)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteHub(hub.id, hub.name)}
                              disabled={deleteHubMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                    <div className="text-sm text-gray-600">Total Users</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <div className="text-2xl font-bold">{stats?.totalBooks || 0}</div>
                    <div className="text-sm text-gray-600">Total Books</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                    <div className="text-2xl font-bold">{stats?.activeRentals || 0}</div>
                    <div className="text-sm text-gray-600">Active Rentals</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Advanced analytics coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="page-content">
          <PageContentManager />
        </TabsContent>

        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>User Feedback</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {feedbackLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-gray-500">Loading feedback...</div>
                </div>
              ) : feedback.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No feedback received yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {feedback.map((item: any) => (
                    <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {item.category}
                          </Badge>
                          <span className="text-sm font-medium">
                            {item.userName} ({item.userEmail})
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          ID: {item.id} • {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                        <p className="text-gray-800 whitespace-pre-wrap">{item.feedback}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Page Content Manager Component
function PageContentManager() {
  const { data: pageContent = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/page-content"],
  });

  const [editingContent, setEditingContent] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const contentForm = useForm({
    defaultValues: {
      pageKey: "",
      title: "",
      subtitle: "",
      description: "",
      ctaText: "",
    },
  });

  const updateContentMutation = useMutation({
    mutationFn: async ({ pageKey, data }: { pageKey: string; data: any }) => {
      const response = await fetch(`/api/admin/page-content/${pageKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update content: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Page content updated successfully",
      });
      refetch();
      setShowAddForm(false);
      setEditingContent(null);
      contentForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update content",
        variant: "destructive",
      });
    },
  });

  const handleSaveContent = () => {
    const formData = contentForm.getValues();

    if (!formData.pageKey || !formData.title) {
      toast({
        title: "Error",
        description: "Page key and title are required",
        variant: "destructive",
      });
      return;
    }

    updateContentMutation.mutate({ pageKey: formData.pageKey, data: formData });
  };

  const startEditing = (content: any) => {
    setEditingContent(content);
    contentForm.reset({
      pageKey: content.pageKey,
      title: content.title || "",
      subtitle: content.subtitle || "",
      description: content.description || "",
      ctaText: content.ctaText || "",
    });
    setShowAddForm(true);
  };

  const startCreating = (pageKey: string, defaultTitle: string) => {
    setEditingContent(null);
    contentForm.reset({
      pageKey,
      title: defaultTitle,
      subtitle: "",
      description: "",
      ctaText: "",
    });
    setShowAddForm(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Define available page configurations
  const pageConfigs = [
    {
      pageKey: "buy-brocks",
      defaultTitle: "Buy Brocks Credits",
      description: "Why buy Brocks credits page",
    },
    {
      pageKey: "welcome-screen",
      defaultTitle: "Welcome to BookShare",
      description: "First screen welcome messages",
    },
    {
      pageKey: "onboarding",
      defaultTitle: "Get Started",
      description: "Onboarding flow content",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Page Content Management</h3>
      </div>

      {/* Page Content Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingContent ? "Edit Page Content" : "Create Page Content"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Page Key</Label>
                  <Input
                    {...contentForm.register("pageKey")}
                    disabled={!!editingContent}
                    placeholder="e.g., buy-brocks"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    {...contentForm.register("title")}
                    placeholder="Main title"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input
                  {...contentForm.register("subtitle")}
                  placeholder="Subtitle (optional)"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  {...contentForm.register("description")}
                  placeholder="Detailed description"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Call-to-Action Text</Label>
                <Input
                  {...contentForm.register("ctaText")}
                  placeholder="Button text (optional)"
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  type="button"
                  disabled={updateContentMutation.isPending}
                  onClick={handleSaveContent}
                >
                  {updateContentMutation.isPending ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  ) : null}
                  {editingContent ? "Update Content" : "Save Content"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingContent(null);
                    contentForm.reset();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pageConfigs.map((config) => {
          const existingContent = pageContent.find((c: any) => c.pageKey === config.pageKey);

          return (
            <Card key={config.pageKey} className="relative">
              <CardHeader>
                <CardTitle className="text-sm">{config.defaultTitle}</CardTitle>
                <p className="text-xs text-gray-500">{config.description}</p>
              </CardHeader>
              <CardContent>
                {existingContent ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{existingContent.title}</p>
                    {existingContent.subtitle && (
                      <p className="text-xs text-gray-600">{existingContent.subtitle}</p>
                    )}
                    {existingContent.description && (
                      <p className="text-xs text-gray-500 line-clamp-2">{existingContent.description}</p>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEditing(existingContent)}
                    >
                      Edit Content
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 mb-2">No content set</p>
                    <Button
                      size="sm"
                      onClick={() => startCreating(config.pageKey, config.defaultTitle)}
                    >
                      Create Content
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Brocks Packages Manager Component
function BrocksPackagesManager() {
  const { data: packages, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/brocks-packages"],
  });

  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const packageForm = useForm({
    mode: "onChange",
    defaultValues: {
      name: "",
      brocks: 0,
      price: 0,
      bonus: 0,
      popular: false,
    },
  });

  const createPackageMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/brocks-packages", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Brocks package created successfully",
      });
      refetch();
      setShowAddForm(false);
      packageForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create package",
        variant: "destructive",
      });
    },
  });

  const updatePackageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      console.log('Mutation executing with:', { id, data });
      const response = await fetch(`/api/admin/brocks-packages/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      console.log('Response status:', response.status, response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update package: ${response.status}`);
      }

      const result = await response.json();
      console.log('API response success:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Update success callback triggered:', data);
      toast({
        title: "Success",
        description: "Brocks package updated successfully",
      });
      // Force refetch the packages list
      refetch();
      // Close the form and reset state
      setShowAddForm(false);
      setEditingPackage(null);
      packageForm.reset({
        name: "",
        brocks: 0,
        price: 0,
        bonus: 0,
        popular: false,
      });
    },
    onError: (error: any) => {
      console.error('Update error callback triggered:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update package",
        variant: "destructive",
      });
    },
  });

  const deletePackageMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/brocks-packages/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Brocks package deleted successfully",
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete package",
        variant: "destructive",
      });
    },
  });

  const onSubmitPackage = (data: any) => {
    console.log('Form submission data:', data);
    console.log('Form errors:', packageForm.formState.errors);

    if (editingPackage) {
      console.log('Updating package:', editingPackage.id);
      updatePackageMutation.mutate({ id: editingPackage.id, data });
    } else {
      console.log('Creating new package');
      createPackageMutation.mutate(data);
    }
  };

  const handleDirectSubmit = () => {
    const formData = packageForm.getValues();
    console.log('Direct submit with data:', formData);

    // Validate required fields manually
    if (!formData.name || !formData.brocks || !formData.price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (editingPackage) {
      console.log('Direct update for package:', editingPackage.id);
      console.log('Update mutation function:', updatePackageMutation.mutate);
      updatePackageMutation.mutate({ id: editingPackage.id, data: formData });
    } else {
      console.log('Direct create new package');
      createPackageMutation.mutate(formData);
    }
  };

  const startEditing = (pkg: any) => {
    setEditingPackage(pkg);
    packageForm.reset({
      name: pkg.name,
      brocks: pkg.brocks,
      price: parseFloat(pkg.price),
      bonus: pkg.bonus,
      popular: pkg.popular,
    });
    setShowAddForm(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Brocks Packages Management</h3>
        <Button
          onClick={() => {
            setShowAddForm(true);
            setEditingPackage(null);
            packageForm.reset();
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Package
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingPackage ? "Edit Package" : "Add New Package"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={packageForm.handleSubmit(onSubmitPackage)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Package Name</Label>
                  <Input
                    id="name"
                    {...packageForm.register("name", { required: "Name is required" })}
                  />
                  {packageForm.formState.errors.name && (
                    <p className="text-red-500 text-sm">{packageForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brocks">Brocks Amount</Label>
                  <Input
                    id="brocks"
                    type="number"
                    min="1"
                    {...packageForm.register("brocks", {
                      required: "Brocks amount is required",
                      valueAsNumber: true
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="1"
                    step="0.01"
                    {...packageForm.register("price", {
                      required: "Price is required",
                      valueAsNumber: true
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bonus">Bonus Brocks</Label>
                  <Input
                    id="bonus"
                    type="number"
                    min="0"
                    {...packageForm.register("bonus", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="popular"
                  {...packageForm.register("popular")}
                  className="rounded"
                />
                <Label htmlFor="popular">Mark as Popular</Label>
              </div>

              <div className="flex space-x-2">
                <Button
                  type="button"
                  disabled={createPackageMutation.isPending || updatePackageMutation.isPending}
                  onClick={handleDirectSubmit}
                >
                  {createPackageMutation.isPending || updatePackageMutation.isPending ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  ) : null}
                  {editingPackage ? "Update Package" : "Create Package"}
                </Button>

                {editingPackage && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      try {
                        console.log('Test API call starting...');
                        const formData = packageForm.getValues();
                        const response = await fetch(`/api/admin/brocks-packages/${editingPackage.id}`, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify(formData),
                        });
                        console.log('Raw response status:', response.status, response.ok);
                        const result = await response.json();
                        console.log('Response data:', result);
                        if (response.ok) {
                          toast({
                            title: "Success",
                            description: "Package updated successfully!",
                          });
                          refetch();
                          setShowAddForm(false);
                          setEditingPackage(null);
                          packageForm.reset();
                        } else {
                          toast({
                            title: "Error",
                            description: result.message || "Direct API call failed",
                            variant: "destructive",
                          });
                        }
                      } catch (error) {
                        console.error('Direct API error:', error);
                        toast({
                          title: "Error",
                          description: "Network error occurred",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    Test Direct API
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingPackage(null);
                    packageForm.reset();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Packages List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(packages as any[])?.map((pkg: any) => (
          <Card key={pkg.id} className={`relative ${pkg.popular ? "border-amber-400" : ""}`}>
            {pkg.popular && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-amber-500">
                Most Popular
              </Badge>
            )}
            <CardContent className="p-4">
              <div className="text-center space-y-3">
                <h4 className="font-semibold text-lg">{pkg.name}</h4>
                <div>
                  <div className="text-2xl font-bold text-amber-600">
                    {pkg.brocks + pkg.bonus}
                  </div>
                  <div className="text-sm text-text-secondary">
                    {pkg.brocks} + {pkg.bonus} bonus
                  </div>
                </div>
                <div className="text-xl font-bold">₹{parseFloat(pkg.price)}</div>
                <div className="text-sm text-text-secondary">
                  ≈ ₹{(parseFloat(pkg.price) / (pkg.brocks + pkg.bonus)).toFixed(2)} per Brock
                </div>
                <div className="flex space-x-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEditing(pkg)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this package?")) {
                        deletePackageMutation.mutate(pkg.id);
                      }
                    }}
                    disabled={deletePackageMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}