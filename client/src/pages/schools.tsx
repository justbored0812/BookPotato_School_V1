import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  School, 
  Search, 
  Users, 
  BookOpen, 
  Plus, 
  CheckCircle2, 
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SchoolHub {
  id: number;
  name: string;
  city?: string;
  description?: string;
  memberCount: number;
  bookCount: number;
  isJoined?: boolean;
}

export default function SchoolsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("to-join");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // New school request form state
  const [newSchoolName, setNewSchoolName] = useState("");
  const [newSchoolCity, setNewSchoolCity] = useState("Mumbai");
  const [newSchoolStudents, setNewSchoolStudents] = useState(100);
  const [newSchoolDesc, setNewSchoolDesc] = useState("");

  // Fetch current user
  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });
  const user = (authData as any)?.user;

  // Fetch my joined schools
  const { data: mySchools = [], isLoading: myLoading } = useQuery<SchoolHub[]>({
    queryKey: ["/api/societies/my"],
    queryFn: async () => {
      const res = await fetch("/api/societies/my");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });

  // Fetch all available schools
  const { data: availableSchools = [], isLoading: availableLoading } = useQuery<SchoolHub[]>({
    queryKey: ["/api/societies/available"],
    queryFn: async () => {
      const res = await fetch("/api/societies/available");
      if (!res.ok) return [];
      return res.json();
    }
  });

  // Join school mutation
  const joinMutation = useMutation({
    mutationFn: async (schoolId: number) => {
      const res = await apiRequest("POST", `/api/societies/${schoolId}/join`, {});
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/societies/my"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/societies/available"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books/browse"] });
      setActiveTab("your-school");
      toast({
        title: "Joined School! 🎒",
        description: "You are now part of this school community.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Could not join school",
        description: err.message || "Please try again later.",
        variant: "destructive"
      });
    }
  });

  const handleJoin = (schoolId: number) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in or create an account to join a school.",
      });
      setLocation("/auth");
      return;
    }
    joinMutation.mutate(schoolId);
  };

  // Request new school creation
  const createSchoolMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: newSchoolName.trim(),
        city: newSchoolCity.trim(),
        apartmentCount: Number(newSchoolStudents) || 100,
        description: newSchoolDesc.trim() || `School community for ${newSchoolName}`,
        hubType: "school",
      };
      const res = await apiRequest("POST", "/api/societies", payload);
      return res.json();
    },
    onSuccess: () => {
      setShowCreateDialog(false);
      setNewSchoolName("");
      setNewSchoolDesc("");
      toast({
        title: "School Request Submitted! 🏫",
        description: "Your school registration has been submitted for approval.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Request Failed",
        description: err.message || "Failed to submit school request.",
        variant: "destructive"
      });
    }
  });

  const filteredAvailable = availableSchools.filter((school: SchoolHub) => {
    const matchesSearch = !searchQuery || 
      school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (school.city && school.city.toLowerCase().includes(searchQuery.toLowerCase()));
    const alreadyJoined = mySchools.some(m => m.id === school.id);
    return matchesSearch && !alreadyJoined;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header Banner */}
      <div className="gradient-primary text-white p-4">
        <div className="w-full mx-auto space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <School className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Schools</h1>
                <p className="text-blue-100 text-sm sm:text-base">
                  Connect, share, and borrow books with students in your school
                </p>
              </div>
            </div>

            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="shadow-sm hidden sm:flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add New School
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <School className="h-5 w-5 text-primary" />
                    Register Your School
                  </DialogTitle>
                  <DialogDescription>
                    Can't find your school? Submit your school name to open a new school book-sharing hub.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <Label htmlFor="school-name">School Name</Label>
                    <Input
                      id="school-name"
                      placeholder="e.g., Ryan International School, Malad"
                      value={newSchoolName}
                      onChange={(e) => setNewSchoolName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="school-city">City</Label>
                    <Input
                      id="school-city"
                      placeholder="e.g., Mumbai"
                      value={newSchoolCity}
                      onChange={(e) => setNewSchoolCity(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="school-students">Estimated Students</Label>
                    <Input
                      id="school-students"
                      type="number"
                      min={10}
                      value={newSchoolStudents}
                      onChange={(e) => setNewSchoolStudents(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="school-desc">Description (Optional)</Label>
                    <Input
                      id="school-desc"
                      placeholder="e.g., ICSE branch campus"
                      value={newSchoolDesc}
                      onChange={(e) => setNewSchoolDesc(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full mt-2"
                    disabled={!newSchoolName.trim() || createSchoolMutation.isPending}
                    onClick={() => createSchoolMutation.mutate()}
                  >
                    {createSchoolMutation.isPending ? "Submitting..." : "Submit School Request"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="w-full mx-auto px-4 py-6 space-y-8">
<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="to-join">Schools To Join</TabsTrigger>
            <TabsTrigger value="your-school">Your School</TabsTrigger>
          </TabsList>
          <TabsContent value="to-join">
        {/* Section 2: Discover & Join School Communities */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Schools To Join</h2>
              <p className="text-xs text-slate-500">Find and join your school community</p>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search school or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>

          {availableLoading ? (
            <div className="text-center py-8 text-slate-400">Loading school directory...</div>
          ) : filteredAvailable.length === 0 ? (
            <Card className="bg-white">
              <CardContent className="p-8 text-center text-slate-500 space-y-2">
                <p>No schools found matching "{searchQuery}"</p>
                <Button variant="link" onClick={() => setShowCreateDialog(true)}>
                  + Add this school to BookPotato
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredAvailable.map((school: SchoolHub) => (
                <Card key={school.id} className="border border-slate-200 hover:border-blue-200 hover:shadow-sm transition-all bg-white">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700 shrink-0">
                        {school.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <h4 className="font-semibold text-slate-900 text-sm truncate">{school.name}</h4>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                          {school.city && <span>{school.city}</span>}
                          <span>{school.memberCount || 0} students</span>
                          <span>{school.bookCount || 0} books</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      disabled={joinMutation.isPending}
                      onClick={() => handleJoin(school.id)}
                      className="shrink-0"
                    >
                      Join
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
          </TabsContent>
          <TabsContent value="your-school">
        {/* Section 1: My Schools */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <h2 className="text-xl font-bold text-slate-900">Your School</h2>
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              {mySchools.length} Joined
            </Badge>
          </div>

          {myLoading ? (
            <div className="text-center py-8 text-slate-400">Loading your schools...</div>
          ) : mySchools.length === 0 ? (
            <Card className="border-dashed border-2 border-slate-200 bg-white">
              <CardContent className="p-8 text-center space-y-3">
                <School className="h-12 w-12 text-slate-300 mx-auto" />
                <h3 className="font-medium text-slate-700 text-lg">No School Joined Yet</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  Choose your school from Schools To Join to start sharing books with classmates.
                </p>
                <Button onClick={() => setActiveTab("to-join")}>Join a School</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {mySchools.map((school: SchoolHub) => (
                <Card key={school.id} className="border border-slate-200 hover:shadow-md transition-shadow bg-white">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-700 text-lg">
                          {school.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <CardTitle className="text-base font-bold text-slate-900 line-clamp-1">
                            {school.name}
                          </CardTitle>
                          {school.city && (
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" />
                              {school.city}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge className="bg-emerald-500 text-white text-xs">
                        Enrolled
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    <div className="flex items-center gap-4 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                      <span className="flex items-center gap-1 font-medium">
                        <Users className="h-3.5 w-3.5 text-blue-600" />
                        {school.memberCount || 0} Students
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium">
                        <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                        {school.bookCount || 0} Books Available
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setLocation(`/browse`)}
                        className="text-xs"
                      >
                        <BookOpen className="h-3.5 w-3.5 mr-1" />
                        View Books
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>


          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
