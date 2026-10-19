import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { School, User, MapPin, CheckCircle, AlertCircle, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { validateProfile } from "@shared/profile-validation";
import { resolveProfileSchool } from "@shared/profile-school";
import { useSchoolMembership } from "@/hooks/use-school-membership";
import { Link } from "wouter";

const profileSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid 10-digit phone number"),
  school: z.string(),
  grade: z.string().min(1, "Grade / Class is required"),
  division: z.string().min(1, "Division / Section is required"),
  flatWing: z.string().min(1, "Flat / Wing is required for collection coordination"),
  buildingName: z.string().min(1, "Building name is required"),
  detailedAddress: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(1, "City is required"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function EnhancedProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const membership = useSchoolMembership();

  const { data: authData, isLoading: authLoading } = useQuery<any>({
    queryKey: ["/api/auth/me"],
  });


  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      school: "",
      grade: "",
      division: "",
      flatWing: "",
      buildingName: "",
      detailedAddress: "",
      city: "",
    },
  });

  const user = authData?.user || authData;
  const profileSchool = resolveProfileSchool(membership.schools, user?.school);
  const validation = validateProfile({ ...user, school: profileSchool }, membership.schools);

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone === "0000000000" ? "" : (user.phone || ""),
        school: user.school || "",
        grade: user.grade || "",
        division: user.division || "",
        flatWing: user.flatWing === "Not provided" ? "" : (user.flatWing || ""),
        buildingName: user.buildingName === "Not provided" ? "" : (user.buildingName || ""),
        detailedAddress: user.detailedAddress === "Not provided" ? "" : (user.detailedAddress || ""),
        city: user.city === "Not provided" ? "" : (user.city || ""),
      });

    }
  }, [user, form]);

  useEffect(() => {
    form.setValue("school", profileSchool, { shouldValidate: true });
  }, [profileSchool, user, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/societies"] });
      toast({
        title: "Profile Updated",
        description: "Your school profile has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (authLoading) {
    return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl p-4 space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">School Profile</h1>
        <p className="text-sm text-gray-600 mt-1">
          Complete your profile with verified school and contact details. A complete profile is required to borrow books.
        </p>
      </div>

      {/* Completion status banner */}
      {validation.isComplete ? (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm">
          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-semibold">Profile is complete</p>
            <p className="text-xs text-emerald-700">You are eligible to borrow books from fellow students.</p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Profile incomplete</p>
            <p className="text-xs text-amber-800 mt-0.5">
              Please complete all required fields below before requesting any books.
            </p>
            {validation.missingFields.length > 0 && (
              <p className="text-xs text-amber-700 mt-1">
                Pending: <span className="font-medium">{validation.missingFields.join(", ")}</span>
              </p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))} className="space-y-6">
        {/* Section 1: Student Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              Student Contact Information
            </CardTitle>
            <CardDescription className="text-xs">
              Used by book owners to coordinate handovers and returns.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" {...form.register("name")} className="mt-1" />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-600 mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input id="phone" type="tel" placeholder="10-digit mobile number" {...form.register("phone")} className="mt-1" />
                {form.formState.errors.phone && (
                  <p className="text-xs text-red-600 mt-1">{form.formState.errors.phone.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input id="email" type="email" {...form.register("email")} className="mt-1" />
              {form.formState.errors.email && (
                <p className="text-xs text-red-600 mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 2: School Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <School className="h-4 w-4 text-blue-600" />
              School Details
            </CardTitle>
            <CardDescription className="text-xs">
              Your school is linked automatically to your school membership.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <Label htmlFor="school">School Name</Label>
                <Button variant="link" size="sm" asChild className="h-auto p-0 text-xs">
                  <Link href="/schools">{profileSchool ? "Change School" : "Join a School"}</Link>
                </Button>
              </div>
              <Input id="school" readOnly aria-describedby="school-membership-help" placeholder={membership.isLoading ? "Loading your school…" : "Join a school to autofill"} {...form.register("school")} className="bg-slate-50" />
              <p id="school-membership-help" className="text-xs text-slate-500 mt-2 leading-relaxed">Filled automatically from your joined school. Changes made on the Schools page appear here.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="grade">Grade / Class *</Label>
                <Input id="grade" placeholder="e.g. 8th, 10th, 12th" {...form.register("grade")} className="mt-1" />
                {form.formState.errors.grade && (
                  <p className="text-xs text-red-600 mt-1">{form.formState.errors.grade.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="division">Division / Section *</Label>
                <Input id="division" placeholder="e.g. A, B, Rose" {...form.register("division")} className="mt-1" />
                {form.formState.errors.division && (
                  <p className="text-xs text-red-600 mt-1">{form.formState.errors.division.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Collection / Handover Address */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              Handover Address
            </CardTitle>
            <CardDescription className="text-xs">
              Shared with readers only when a book loan is confirmed so you can coordinate handover.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="flatWing">Flat & Wing *</Label>
                <Input id="flatWing" placeholder="e.g. B-402" {...form.register("flatWing")} className="mt-1" />
                {form.formState.errors.flatWing && (
                  <p className="text-xs text-red-600 mt-1">{form.formState.errors.flatWing.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="buildingName">Building Name *</Label>
                <Input id="buildingName" placeholder="e.g. Sunshine Heights" {...form.register("buildingName")} className="mt-1" />
                {form.formState.errors.buildingName && (
                  <p className="text-xs text-red-600 mt-1">{form.formState.errors.buildingName.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="detailedAddress">Street / Area Address *</Label>
              <Input id="detailedAddress" placeholder="Street, landmark, neighborhood" {...form.register("detailedAddress")} className="mt-1" />
              {form.formState.errors.detailedAddress && (
                <p className="text-xs text-red-600 mt-1">{form.formState.errors.detailedAddress.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="city">City *</Label>
              <Input id="city" placeholder="City name" {...form.register("city")} className="mt-1" />
              {form.formState.errors.city && (
                <p className="text-xs text-red-600 mt-1">{form.formState.errors.city.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? "Saving Profile..." : "Save School Profile"}
        </Button>
      </form>
    </div>
  );
}
