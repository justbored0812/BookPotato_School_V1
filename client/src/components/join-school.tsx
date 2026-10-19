import { useLocation } from "wouter";
import { School } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function JoinSchool() {
  const [, navigate] = useLocation();
  return (
    <div className="px-6 py-16 text-center space-y-4">
      <div className="w-16 h-16 mx-auto rounded-full bg-blue-50 flex items-center justify-center"><School className="w-8 h-8 text-primary" /></div>
      <h1 className="text-2xl font-semibold text-text-primary">Join a school to get started</h1>
      <p className="text-sm text-text-secondary leading-relaxed">Join your school to browse available books and share your own books with classmates.</p>
      <Button onClick={() => navigate("/schools")}>Join a School</Button>
    </div>
  );
}
