import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Bell, 
  BookOpen, 
  Home, 
  Search, 
  Bookmark, 
  Plus, 
  LogOut, 
  User, 
  Settings, 
  History, 
  Heart, 
  School,
  Upload,
  LogIn
} from "lucide-react";
import logoImage from "@assets/WhatsApp Image 2025-10-05 at 17.24.19_1759671721044.jpeg";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCurrentUser, logout } from "@/lib/auth";
import { getInitials } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import AddBookModal from "@/components/modals/add-book-modal";
import { BulkBookUpload } from "@/components/bulk-book-upload";
import LenderDetailsModal from "@/components/modals/lender-details-modal";
import { validateProfile } from "@shared/profile-validation";
import { useSchoolMembership } from "@/hooks/use-school-membership";
import JoinSchool from "@/components/join-school";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location, setLocation] = useLocation();
  const membership = useSchoolMembership();
  const publicPages = ["/schools", "/hubs", "/profile", "/notifications", "/how-it-works", "/downloads", "/referrals", "/brand-ambassador"];
  const needsSchool = !publicPages.includes(location);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [dismissedRentals, setDismissedRentals] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => getCurrentUser(),
  });

  const isAdmin = (authData?.user as any)?.isAdmin || authData?.user?.email === 'abhinic@gmail.com';

  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: !!authData?.user,
  });

  const { data: lentBooks } = useQuery({
    queryKey: ["/api/rentals/lent"],
    enabled: membership.hasSchool,
  });

  const isProfileIncomplete = !!authData?.user && !validateProfile(authData.user, membership.schools).isComplete;

  const eligibleRental = membership.hasSchool && Array.isArray(lentBooks) && isProfileIncomplete && location !== "/profile"
    ? (lentBooks as any[]).find((rental: any) => 
        !dismissedRentals.includes(rental.id) && 
        !localStorage.getItem(`lender_dismissed_popup_${rental.id}`)
      )
    : null;

  const handleCloseLenderModal = (rentalId: number) => {
    localStorage.setItem(`lender_dismissed_popup_${rentalId}`, "true");
    setDismissedRentals((prev) => [...prev, rentalId]);
  };

  const unreadCount = (notifications as any[])?.filter((n: any) => !n.isRead).length || 0;

  const handleLogout = async () => {
    try {
      await logout();
      queryClient.clear();
      window.location.href = "/";
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const mobileNav = [
    { name: "Home", icon: Home, path: "/" },
    { name: "Browse", icon: Search, path: "/browse" },
    { name: "Schools", icon: School, path: "/schools" },
    { name: "My Books", icon: Bookmark, path: "/my-books" },
  ];

  const isActiveTab = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white min-h-screen relative flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-30">
        <div className="flex items-center justify-between gap-2">
          <Link href="/">
            <div className="flex items-center space-x-2.5 cursor-pointer">
              <img src={logoImage} alt="BookPotato" className="h-8 w-8 object-contain rounded-full shadow-xs" />
              <h1 className="text-lg font-semibold text-text-primary">BookPotato</h1>
            </div>
          </Link>

          

          {/* Right Action Icons */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            {authData?.user && (
              <Link href="/notifications">
                <Button variant="ghost" size="sm" className="relative p-2 shrink-0 text-slate-600">
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs bg-red-500">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}

            {authData?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-1 shrink-0 rounded-full">
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                      <AvatarFallback className="bg-blue-600 text-white text-xs sm:text-sm font-semibold">
                        {getInitials(authData.user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {authData.user.name || "Student"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {authData.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>School Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/schools">
                      <School className="mr-2 h-4 w-4" />
                      <span>Schools</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-books">
                      <Bookmark className="mr-2 h-4 w-4" />
                      <span>My Shared Books</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/bulk-upload">
                      <Upload className="mr-2 h-4 w-4" />
                      <span>Bulk Book Upload</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/history">
                      <History className="mr-2 h-4 w-4" />
                      <span>Book History</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-wishlist">
                      <Heart className="mr-2 h-4 w-4" />
                      <span>My Wishlist</span>
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm">
                  <LogIn className="h-3.5 w-3.5 mr-1" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-24">
        {needsSchool && membership.isLoading ? (
          <p role="status" className="p-8 text-center text-sm text-text-secondary">Loading your school…</p>
        ) : needsSchool && membership.error ? (
          <div className="p-8 text-center space-y-3"><p>Could not load your school membership.</p><Button onClick={() => membership.retry()}>Try Again</Button></div>
        ) : needsSchool && !membership.hasSchool ? <JoinSchool /> : children}
      </main>

      {/* Floating book actions */}
      {membership.hasSchool && (
        <div className="fixed bottom-20 right-4 sm:right-[max(1rem,calc((100vw-32rem)/2+1rem))] flex flex-col gap-2 z-40">
          <Button
            onClick={() => setShowBulkUploadModal(true)}
            className="h-11 w-11 rounded-full shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center p-0"
            size="icon"
            title="Bulk Upload Books"
          >
            <Upload className="h-5 w-5" />
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            className="h-12 w-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center p-0"
            size="icon"
            title="Add Single Book"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Bottom Navigation (Mobile only) */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-gray-200 z-30">
        <div className="max-w-lg mx-auto px-2 py-1.5">
          <div className="flex justify-around items-center">
            {mobileNav.map((item) => (
              <Link key={item.name} href={!membership.hasSchool && !["/", "/schools"].includes(item.path) ? "/schools" : item.path}>
                <Button
                  variant="ghost"
                  className={`flex flex-col items-center py-1.5 px-2.5 h-auto ${
                    isActiveTab(item.path)
                      ? "text-blue-600 font-semibold"
                      : "text-slate-500"
                  }`}
                >
                  <item.icon className="h-5 w-5 mb-0.5" />
                  <span className="text-[11px]">{item.name}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Add Book Modal */}
      <AddBookModal 
        open={showAddModal && membership.hasSchool}
        onOpenChange={setShowAddModal}
        onOpenBulkUpload={() => setShowBulkUploadModal(true)}
      />

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && membership.hasSchool && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-auto">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-auto bg-white rounded-lg shadow-xl">
            <BulkBookUpload
              onClose={() => setShowBulkUploadModal(false)}
              onBooksAdded={() => {
                setShowBulkUploadModal(false);
                // Refresh data after bulk upload
                window.location.reload();
              }}
            />
          </div>
        </div>
      )}

      {/* Lender Details Modal */}
      {eligibleRental && (
        <LenderDetailsModal
          isOpen={!!eligibleRental}
          onClose={() => handleCloseLenderModal(eligibleRental.id)}
          bookTitle={eligibleRental.book?.title || ""}
        />
      )}
    </div>
  );
}
