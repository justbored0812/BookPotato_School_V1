import { useState } from "react";
import { useLocation } from "wouter";
import { useSchoolLibrary } from "@/hooks/use-school-library";
import { 
  BookOpen, 
  School, 
  Upload, 
  Search, 
  History, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Bookmark, 
  Users, 
  GraduationCap, 
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BorrowBookModal from "@/components/modals/borrow-book-modal";

export default function Home() {
  const [, navigate] = useLocation();
  const [selectedBookForBorrow, setSelectedBookForBorrow] = useState<any>(null);

  const { books, availableBooks: allAvailableBooks, membership, isLoading: booksLoading, isError: booksError, refetch } = useSchoolLibrary();
  const mySchools = membership.schools;
  const availableBooks = allAvailableBooks.slice(0, 8);

  return (
    <div className="space-y-6 pb-6">

      <section className="gradient-primary p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">My Schools</h2>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white" onClick={() => navigate("/schools")}>Manage</Button>
        </div>
        {mySchools.length ? <div className="flex flex-wrap gap-2">{mySchools.map(school => (
          <button key={school.id} onClick={() => navigate("/schools")} className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2 text-left hover:bg-white/30">
            <School className="h-4 w-4" />
            <span className="flex flex-col"><span className="text-sm font-medium">{school.name}</span><span className="text-xs opacity-80">{school.memberCount || 0} members</span></span>
          </button>
        ))}</div> : <div className="space-y-3"><p className="text-sm text-white/90">Join your school to start sharing books with classmates.</p><Button size="sm" className="bg-white text-primary hover:bg-blue-50" onClick={() => navigate("/schools")}>Find Your School</Button></div>}
      </section>
      <div className="px-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/browse")}><CardContent className="pt-6 text-center"><div className="text-2xl font-bold text-primary">{booksLoading || booksError ? "—" : allAvailableBooks.length}</div><div className="text-sm text-text-secondary">Available Books</div></CardContent></Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-r from-green-50 to-emerald-50 border-green-200" onClick={() => navigate("/how-it-works")}><CardContent className="py-4 flex flex-col items-center gap-1"><BookOpen className="h-6 w-6 text-green-600" /><div className="text-sm font-semibold text-green-700">How It Works</div><div className="text-xs text-green-600">View Video</div></CardContent></Card>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200" onClick={() => navigate("/bulk-upload")}><CardContent className="py-4 flex flex-col items-center gap-1 text-center"><Upload className="h-6 w-6 text-purple-600" /><div className="text-sm font-semibold text-purple-700">Add Books In Bulk</div><div className="text-xs text-purple-600">Photo Recognition</div></CardContent></Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200" onClick={() => navigate("/my-books")}><CardContent className="py-4 flex flex-col items-center gap-1 text-center"><Bookmark className="h-6 w-6 text-blue-600" /><div className="text-sm font-semibold text-blue-700">My Books</div><div className="text-xs text-blue-600">Share Your Library</div></CardContent></Card>
        </div>
        <Button variant="outline" className="w-full justify-between" onClick={() => navigate("/history")}><span className="flex items-center gap-2"><History className="h-4 w-4" />Book History & Returns</span><ArrowRight className="h-4 w-4" /></Button>
      </div>

      {/* Available School Books Shelf */}
      <div className="space-y-4 px-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Available Books</h2>
            <p className="text-xs text-slate-500">Books shared by classmates in your schools</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/browse")}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View All ({booksLoading || booksError ? "—" : allAvailableBooks.length}) <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {booksError ? (<div className="text-center p-6 space-y-3"><p className="text-sm text-slate-500">Could not load the school library.</p><Button variant="outline" onClick={() => refetch()}>Try Again</Button></div>) : booksLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : availableBooks.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-200">
            <CardContent className="p-8 text-center space-y-3">
              <BookOpen className="h-10 w-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-semibold text-slate-700">No books listed yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Be the first in your school to share a book! Upload your textbooks or novels to get your school library started.
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <Button size="sm" onClick={() => navigate("/bulk-upload")} className="bg-indigo-600 hover:bg-indigo-700">
                  <Upload className="h-4 w-4 mr-1.5" /> Bulk Upload Books
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {availableBooks.map((book) => (
              <Card 
                key={book.id} 
                className="overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow border-slate-200 group"
              >
                <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden">
                  {book.imageUrl ? (
                    <img
                      src={book.imageUrl}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-blue-50 to-slate-100">
                      <BookOpen className="h-8 w-8 text-blue-400 mb-2" />
                      <span className="text-xs font-semibold text-slate-700 line-clamp-2">{book.title}</span>
                    </div>
                  )}
                  <Badge className="absolute top-2 right-2 bg-emerald-600 text-white font-medium text-[10px] shadow-xs">
                    Free
                  </Badge>
                </div>

                <CardContent className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-900 line-clamp-1" title={book.title}>
                      {book.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-1">{book.author}</p>
                    {book.genre && (
                      <Badge variant="outline" className="text-[10px] text-slate-600 px-1.5 py-0">
                        {book.genre}
                      </Badge>
                    )}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => setSelectedBookForBorrow(book)}
                    className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium h-8"
                  >
                    Borrow (Free)
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Borrow Book Modal */}
      {selectedBookForBorrow && (
        <BorrowBookModal
          book={selectedBookForBorrow}
          open={!!selectedBookForBorrow}
          onOpenChange={(open) => !open && setSelectedBookForBorrow(null)}
        />
      )}
    </div>
  );
}
