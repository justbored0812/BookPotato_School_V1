import { useState } from "react";
import { useSchoolLibrary } from "@/hooks/use-school-library";
import { BookOpen, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BorrowBookModal from "@/components/modals/borrow-book-modal";
import AddBookModal from "@/components/modals/add-book-modal";


import { defaultLibraryFilters, filterLibraryBooks, type LibraryFilters, type LibraryBook } from "@shared/library-filters";
import type { BookWithOwner } from "@shared/schema";

type Book = BookWithOwner & LibraryBook & { schoolNames?: string[] };

export default function SchoolLibrary() {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<LibraryFilters>({ ...defaultLibraryFilters });
  const { membership, books, isLoading, isError, refetch, userId, schoolIds } = useSchoolLibrary();
  const scopedBooks = filterLibraryBooks(books, userId, schoolIds, { ...defaultLibraryFilters, availability: "all" });
  const shown = filterLibraryBooks(books, userId, schoolIds, filters);
  const genres = Array.from(new Set(scopedBooks.map(book => book.genre).filter((value): value is string => !!value))).sort();
  const conditions = Array.from(new Set(scopedBooks.map(book => book.condition).filter(Boolean))).sort();
  const changedFilters = (Object.keys(defaultLibraryFilters) as (keyof LibraryFilters)[]).filter(key => key !== "search" && filters[key] !== defaultLibraryFilters[key]).length;
  const change = (key: keyof LibraryFilters, value: string) => setFilters(current => ({ ...current, [key]: value }));
  const clear = () => setFilters({ ...defaultLibraryFilters });
  const select = (key: keyof LibraryFilters, label: string, options: { value: string; label: string }[]) => <div className="space-y-1.5"><Label htmlFor={`library-${key}`} className="text-xs text-slate-600">{label}</Label><Select value={filters[key]} onValueChange={value => change(key, value)}><SelectTrigger id={`library-${key}`} className="bg-white text-sm"><SelectValue /></SelectTrigger><SelectContent>{options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>;

  return <div className="p-4 sm:p-5 space-y-5">
    <div className="flex items-start justify-between gap-3"><div><h1 className="text-2xl font-bold text-slate-950">School Library</h1><p className="mt-1 text-sm text-slate-500">Discover books shared by your classmates. Every loan is free.</p></div><Button className="shrink-0 gap-1.5" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" />Add book</Button></div>
    <div className="space-y-3">
      <div className="flex items-center gap-2"><div className="relative flex-1"><Search aria-hidden="true" className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input aria-label="Search books by title, author, or ISBN" placeholder="Search title, author, or ISBN…" value={filters.search} onChange={event => change("search", event.target.value)} className="pl-9 pr-9" />{filters.search && <button type="button" aria-label="Clear search" className="absolute right-3 top-3 text-slate-400 hover:text-slate-700" onClick={() => change("search", "")}><X className="h-4 w-4" /></button>}</div><Button variant="outline" aria-expanded={filtersOpen} aria-controls="library-filters" className="gap-1.5" onClick={() => setFiltersOpen(value => !value)}><SlidersHorizontal className="h-4 w-4" />Filters{changedFilters ? ` (${changedFilters})` : ""}</Button></div>
      {filtersOpen && <div id="library-filters" className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3"><div className="grid grid-cols-2 gap-3">
        {select("school", "School", [{ value: "all", label: "All Your Schools" }, ...membership.schools.map(school => ({ value: String(school.id), label: school.name }))])}
        {select("genre", "Genre", [{ value: "all", label: "All Genres" }, ...genres.map(value => ({ value, label: value }))])}
        {select("condition", "Condition", [{ value: "all", label: "All Conditions" }, ...conditions.map(value => ({ value, label: value }))])}
        {select("availability", "Availability", [{ value: "available", label: "Available to Borrow" }, { value: "borrowed", label: "Currently Borrowed" }, { value: "all", label: "All Books" }])}
        {select("sort", "Sort By", [{ value: "newest", label: "Newest First" }, { value: "oldest", label: "Oldest First" }, { value: "title", label: "Title A–Z" }, { value: "author", label: "Author A–Z" }])}
      </div><Button variant="link" size="sm" className="px-0 h-auto" onClick={clear}>Reset filters</Button></div>}
    </div>
    <p aria-live="polite" className="text-xs text-slate-500">{isLoading ? "Loading books…" : `${shown.length} ${shown.length === 1 ? "book" : "books"} found`}</p>
    {isLoading ? <div role="status" className="grid grid-cols-2 gap-3">{[1, 2].map(id => <div key={id} className="h-64 rounded-xl bg-slate-100 animate-pulse" />)}</div> : isError ? <div className="py-8 text-center space-y-3"><p className="text-sm text-slate-500">Could not load the school library.</p><Button variant="outline" onClick={() => refetch()}>Try Again</Button></div> : !shown.length ? <Card><CardContent className="py-10 text-center space-y-3"><BookOpen className="h-10 w-10 mx-auto text-slate-300" /><h2 className="font-medium">{!scopedBooks.length ? "No books shared by classmates yet" : "No books match your search"}</h2><p className="text-sm text-slate-500">{!scopedBooks.length ? "Books added by other members of your school will appear here. Manage your own books in My Library." : "Try a different title, author, or ISBN, or change your filters."}</p>{(filters.search || changedFilters > 0) && <Button variant="outline" onClick={clear}>Clear Search & Filters</Button>}</CardContent></Card> : <div className="grid grid-cols-2 gap-3">{shown.map(book => <Card key={book.id} className="rounded-xl overflow-hidden border-slate-200 shadow-sm"><CardContent className="p-3.5 h-full flex flex-col gap-3">
      <div className="h-32 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden">{book.coverImageUrl || book.imageUrl ? <img loading="lazy" src={book.coverImageUrl || book.imageUrl || undefined} alt={book.title} className="w-full h-full object-contain" /> : <BookOpen className="h-9 w-9 text-blue-200" />}</div>
      <div className="space-y-1.5"><h2 className="font-semibold text-sm text-slate-950 leading-snug break-words">{book.title}</h2><p className="text-xs text-slate-500">{book.author}</p>{book.genre && <p className="text-xs text-slate-500">{book.genre}</p>}<p className="text-xs text-slate-500">Condition: {book.condition || "Good"}</p><p className="text-xs text-slate-500 break-words">Shared by {book.owner?.name || "a classmate"}</p></div>
      <Button className="mt-auto w-full px-2 text-xs" disabled={!book.isAvailable || Number(book.ownerId) === Number(userId)} onClick={() => { if (book.isAvailable && Number(book.ownerId) !== Number(userId)) setSelectedBook(book); }}>{Number(book.ownerId) === Number(userId) ? "Your Book" : book.isAvailable ? "Borrow for free" : "Currently borrowed"}</Button>
    </CardContent></Card>)}</div>}
    {selectedBook && <BorrowBookModal book={selectedBook} open onOpenChange={open => !open && setSelectedBook(null)} />}
    {addOpen && <AddBookModal open onOpenChange={open => { setAddOpen(open); if (!open) refetch(); }} />}
  </div>;
}
