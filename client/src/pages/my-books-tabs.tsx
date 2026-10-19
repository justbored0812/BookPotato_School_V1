import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Camera, Plus, SquarePen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AddBookModal from "@/components/modals/add-book-modal";
import { BulkBookUpload } from "@/components/bulk-book-upload";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Book = { id: number; title: string; author: string; imageUrl?: string; coverImageUrl?: string; isAvailable: boolean };
type Person = { name?: string; phone?: string; email?: string; school?: string; grade?: string; division?: string };
type Rental = { id: number; status: string; startDate: string; endDate: string; actualReturnDate?: string; book: Book; lender?: Person; borrower?: Person; lenderName?: string; borrowerName?: string };
type Action = { type: "return" | "extend" | "details"; rental: Rental };

function Cover({ book, lent = false }: { book: Book; lent?: boolean }) {
  const image = book.coverImageUrl || book.imageUrl;
  return image ? <img src={image} alt={book.title} className="h-20 w-[60px] shrink-0 rounded object-cover" /> : (
    <div aria-label={`${book.title} cover unavailable`} className={`h-20 w-[60px] shrink-0 rounded flex items-center justify-center text-xs font-medium ${lent ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-600"}`}>{book.title?.slice(0, 3) || <BookOpen className="h-5 w-5" />}</div>
  );
}

function dueStatus(rental: Rental) {
  if (rental.actualReturnDate || rental.status === "returned") return { label: "Returned", style: "bg-slate-100 text-slate-600" };
  if (rental.status === "return_requested") return { label: "Return Requested", style: "bg-amber-100 text-amber-700" };
  const due = new Date(rental.endDate);
  if (!Number.isFinite(due.getTime())) return { label: "Active Loan", style: "bg-blue-50 text-blue-700" };
  const days = Math.ceil((due.getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: `${Math.abs(days)} ${days === -1 ? "day" : "days"} overdue`, style: "bg-red-100 text-red-600" };
  if (due.getTime() < Date.now()) return { label: "Overdue", style: "bg-red-100 text-red-600" };
  return { label: days === 0 ? "Due today" : `Due in ${days} ${days === 1 ? "day" : "days"}`, style: "bg-blue-50 text-blue-700" };
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-slate-200 py-12 px-5 text-center text-sm text-slate-500"><BookOpen className="h-9 w-9 mx-auto mb-3 text-slate-300" />{children}</div>;
}

export default function MyBooks() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState("borrowed");
  const [editor, setEditor] = useState<{ book?: Book } | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [action, setAction] = useState<Action | null>(null);
  const [extensionDays, setExtensionDays] = useState("7");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const library = useQuery<Book[]>({ queryKey: ["/api/books/my"] });
  const borrowed = useQuery<Rental[]>({ queryKey: ["/api/rentals/borrowed"] });
  const lent = useQuery<Rental[]>({ queryKey: ["/api/rentals/lent"] });

  const refresh = () => {
    for (const path of ["/api/books/my", "/api/books/browse", "/api/books/all", "/api/rentals/borrowed", "/api/rentals/lent", "/api/notifications"]) queryClient.invalidateQueries({ queryKey: [path] });
  };
  const mutate = useMutation({
    mutationFn: async ({ path, data, method = "POST" }: { path: string; data?: unknown; method?: string; message: string }) => (await apiRequest(method, path, data)).json(),
    onSuccess: (_, variables) => { refresh(); setAction(null); toast({ title: variables.message }); },
    onError: (error: Error) => toast({ title: "Unable to complete action", description: error.message, variant: "destructive" }),
  });
  const openAction = (type: Action["type"], rental: Rental) => { setAction({ type, rental }); setExtensionDays("7"); setReason(""); setNotes(""); };
  const active = (rental: Rental) => !rental.actualReturnDate && ["active", "overdue", "return_requested"].includes(rental.status);

  const rentalList = (query: typeof borrowed, kind: "borrowed" | "lent") => {
    if (query.isLoading) return <p role="status" className="py-10 text-center text-sm text-slate-500">Loading your books…</p>;
    if (query.isError) return <div className="text-center py-8 space-y-3"><p className="text-sm text-slate-500">Could not load your books.</p><Button variant="outline" onClick={() => query.refetch()}>Try Again</Button></div>;
    const rentals = (query.data || []).filter(active);
    if (!rentals.length) return <Empty>{kind === "borrowed" ? "You haven't borrowed any books yet." : "You haven't lent out any books yet."}</Empty>;
    return <div className="space-y-4">{rentals.map(rental => {
      const status = dueStatus(rental);
      const person = kind === "borrowed" ? rental.lender : rental.borrower;
      const name = person?.name || (kind === "borrowed" ? rental.lenderName : rental.borrowerName) || "School Member";
      const requested = rental.status === "return_requested";
      return <Card key={rental.id} className="rounded-xl border-slate-200 shadow-sm"><CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3"><Cover book={rental.book} lent={kind === "lent"} /><div className="min-w-0 flex-1 space-y-1.5">
          <h2 className="font-semibold text-base leading-snug text-slate-950 break-words">{rental.book.title}</h2>
          <p className="text-sm text-slate-500">{rental.book.author}</p>
          <p className="text-sm text-slate-500">{kind === "borrowed" ? "Lender" : "Borrower"}: {name}</p>
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${status.style}`}>{status.label}</span>
        </div></div>
        <div className="mt-6 grid grid-cols-2 gap-2">
          {kind === "borrowed" ? <>
            <Button className="rounded-lg" disabled={requested || mutate.isPending} onClick={() => openAction("return", rental)}>{requested ? "Return Requested" : "Request Return"}</Button>
            <Button variant="outline" className="rounded-lg" disabled={requested || mutate.isPending} onClick={() => openAction("extend", rental)}>Extend</Button>
          </> : <>
            <Button variant={requested ? "default" : "outline"} className="rounded-lg" disabled={mutate.isPending} onClick={() => requested ? mutate.mutate({ path: `/api/rentals/${rental.id}/confirm-return`, data: {}, message: "Return confirmed" }) : mutate.mutate({ path: `/api/rentals/${rental.id}/send-reminder`, data: {}, message: "Reminder sent" })}>{requested ? "Confirm Return" : "Send Reminder"}</Button>
            <Button variant="outline" className="rounded-lg" onClick={() => openAction("details", rental)}>Details</Button>
          </>}
        </div>
      </CardContent></Card>;
    })}</div>;
  };

  const person = action?.rental.borrower;
  return <div className="p-4 sm:p-5 space-y-6">
    <div className="flex items-center justify-between gap-3"><h1 className="text-2xl font-bold text-slate-950">My Books</h1><Button variant="outline" className="gap-2 rounded-lg text-xs sm:text-sm" onClick={() => setBulkOpen(true)}><Camera className="h-4 w-4" />Add Books In Bulk</Button></div>
    <Tabs value={tab} onValueChange={setTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-3 h-11 rounded-xl bg-slate-50 p-1"><TabsTrigger value="borrowed" className="rounded-lg">Borrowed</TabsTrigger><TabsTrigger value="lent" className="rounded-lg">Lent Out</TabsTrigger><TabsTrigger value="library" className="rounded-lg">My Library</TabsTrigger></TabsList>
      <TabsContent value="borrowed">{rentalList(borrowed, "borrowed")}</TabsContent>
      <TabsContent value="lent">{rentalList(lent, "lent")}</TabsContent>
      <TabsContent value="library" className="space-y-4">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">My Library</h2><Button className="gap-2 rounded-lg" onClick={() => setEditor({})}><Plus className="h-4 w-4" />Add Book</Button></div>
        {library.isLoading ? <p role="status" className="py-10 text-center text-sm text-slate-500">Loading your library…</p> : library.isError ? <div className="text-center space-y-3"><p>Could not load your library.</p><Button variant="outline" onClick={() => library.refetch()}>Try Again</Button></div> : !library.data?.length ? <Empty>Add your first book to share it with classmates.</Empty> : <div className="space-y-4">{library.data.map(book => <Card key={book.id} className="rounded-xl border-slate-200 shadow-sm"><CardContent className="p-4 sm:p-5 flex items-start gap-3"><Cover book={book} /><div className="flex-1 min-w-0 space-y-2"><h3 className="text-base font-semibold leading-snug text-slate-950 break-words">{book.title}</h3><p className="text-sm text-slate-500">{book.author}</p><span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${book.isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{book.isAvailable ? "Available" : "Borrowed"}</span></div><div className="flex flex-col gap-1"><Button size="icon" variant="ghost" className="h-8 w-8 text-slate-700" aria-label={`Edit ${book.title}`} onClick={() => setEditor({ book })}><SquarePen className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-600" aria-label={`Remove ${book.title}`} disabled={!book.isAvailable || mutate.isPending} onClick={() => { if (window.confirm(`Remove "${book.title}" from your library?`)) mutate.mutate({ path: `/api/books/${book.id}`, method: "DELETE", message: "Book removed" }); }}><Trash2 className="h-4 w-4" /></Button></div></CardContent></Card>)}</div>}
      </TabsContent>
    </Tabs>

    {editor && <AddBookModal key={editor.book?.id ?? "new"} open onOpenChange={open => { if (!open) { setEditor(null); refresh(); } }} editBook={editor.book} onOpenBulkUpload={() => { setEditor(null); setBulkOpen(true); }} />}
    <Dialog open={bulkOpen} onOpenChange={setBulkOpen}><DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Add Books In Bulk</DialogTitle><DialogDescription>Add books to your school library from a bookshelf photo or book list.</DialogDescription></DialogHeader>{bulkOpen && <BulkBookUpload onClose={() => setBulkOpen(false)} onBooksAdded={() => { setBulkOpen(false); setTab("library"); refresh(); }} />}</DialogContent></Dialog>

    <Dialog open={!!action} onOpenChange={open => !open && setAction(null)}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>{action?.type === "return" ? "Request Return" : action?.type === "extend" ? "Extend Borrowing" : "Loan Details"}</DialogTitle><DialogDescription>{action?.rental.book.title}</DialogDescription></DialogHeader>
      {action?.type === "return" && <div className="space-y-4"><p className="text-sm text-slate-500">Let the lender know you're ready to return this book. They will confirm once they receive it.</p><Label htmlFor="return-notes">Message to the lender (optional)</Label><Textarea id="return-notes" value={notes} onChange={e => setNotes(e.target.value)} /><Button className="w-full" disabled={mutate.isPending} onClick={() => mutate.mutate({ path: `/api/rentals/${action.rental.id}/request-return`, data: { notes }, message: "Return request sent" })}>{mutate.isPending ? "Sending…" : "Send Return Request"}</Button></div>}
      {action?.type === "extend" && <form className="space-y-4" onSubmit={e => { e.preventDefault(); mutate.mutate({ path: `/api/rentals/${action.rental.id}/request-extension`, data: { extensionDays: Number(extensionDays), reason: reason.trim() }, message: "Extension request sent to the lender" }); }}><div className="space-y-2"><Label htmlFor="extension-days">Additional days</Label><Input id="extension-days" type="number" min={1} max={30} step={1} required value={extensionDays} onChange={e => setExtensionDays(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="extension-reason">Reason</Label><Textarea id="extension-reason" minLength={10} required placeholder="Tell the lender why you need more time." value={reason} onChange={e => setReason(e.target.value)} /></div><Button className="w-full" disabled={mutate.isPending || !Number.isInteger(Number(extensionDays)) || Number(extensionDays) < 1 || Number(extensionDays) > 30 || reason.trim().length < 10}>{mutate.isPending ? "Sending…" : "Request Extension"}</Button></form>}
      {action?.type === "details" && <dl className="space-y-3 text-sm"><div><dt className="text-slate-500">Borrower</dt><dd className="font-medium">{person?.name || action.rental.borrowerName || "School Member"}</dd></div>{person?.phone && <div><dt className="text-slate-500">Phone</dt><dd><a className="text-primary" href={`tel:${person.phone}`}>{person.phone}</a></dd></div>}{person?.email && <div><dt className="text-slate-500">Email</dt><dd><a className="text-primary break-all" href={`mailto:${person.email}`}>{person.email}</a></dd></div>}{person?.school && <div><dt className="text-slate-500">School</dt><dd>{person.school}</dd></div>}{person?.grade && <div><dt className="text-slate-500">Grade / Division</dt><dd>{person.grade}{person.division ? ` / ${person.division}` : ""}</dd></div>}<div><dt className="text-slate-500">Borrowed on</dt><dd>{new Date(action.rental.startDate).toLocaleDateString("en-IN")}</dd></div><div><dt className="text-slate-500">Return by</dt><dd>{new Date(action.rental.endDate).toLocaleDateString("en-IN")}</dd></div><div><dt className="text-slate-500">Status</dt><dd>{dueStatus(action.rental).label}</dd></div></dl>}
    </DialogContent></Dialog>
  </div>;
}
