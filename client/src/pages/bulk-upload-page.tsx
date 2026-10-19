import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Sparkles, Upload, School, CheckCircle2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BulkBookUpload } from "@/components/bulk-book-upload";

export default function BulkUploadPage() {
  const [, setLocation] = useLocation();

  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });
  const user = (authData as any)?.user;

  return (
    <div className="p-4">
      <div className="w-full mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="ghost"
            onClick={() => setLocation("/my-books")}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Books
          </Button>

          <div className="flex items-center gap-2">
            {!user && (
              <Link href="/auth">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs">
                  <LogIn className="h-3.5 w-3.5 mr-1" />
                  Sign In to Upload
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              onClick={() => setLocation("/schools")}
              className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <School className="h-4 w-4" />
              Schools
            </Button>
          </div>
        </div>

        {/* Page Banner */}
        <div className="gradient-primary text-white rounded-lg p-4">
          <div className="flex flex-col items-start gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-xl font-semibold">Bulk Book Upload</h1>
              </div>
              <p className="text-blue-100 max-w-xl text-sm sm:text-base">
                Upload your entire bookshelf in minutes. Snap a photo of book spines or drop a list — our AI detects titles and authors automatically for your school library.
              </p>
            </div>

            <div className="hidden flex-col gap-1 text-xs bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20">
              <span className="flex items-center gap-1.5 font-medium text-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" /> 100% Free Sharing
              </span>
              <span className="flex items-center gap-1.5 text-blue-100">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" /> AI Spine Detection
              </span>
              <span className="flex items-center gap-1.5 text-blue-100">
                <BookOpen className="h-3.5 w-3.5" /> Direct to School
              </span>
            </div>
          </div>
        </div>

        {/* Main Bulk Upload Container */}
        <Card className="shadow-md border-slate-200 overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <BulkBookUpload
              onClose={() => setLocation("/my-books")}
              onBooksAdded={() => {
                setLocation("/my-books");
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
