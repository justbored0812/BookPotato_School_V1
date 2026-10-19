import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { validateProfile } from "@shared/profile-validation";
import type { BookWithOwner } from "@shared/schema";
import { useSchoolMembership } from "@/hooks/use-school-membership";
import type { CollectionInfo } from "@shared/book-collection";

const borrowSchema = z.object({ duration: z.string().min(1, "Please select a rental period") });
type BorrowFormData = z.infer<typeof borrowSchema>;
interface Props { book: BookWithOwner | null; open: boolean; onOpenChange: (open: boolean) => void; initialTransactionType?: "borrow" | "buy"; }
const periods = [{ value: "3", label: "3 days" }, { value: "7", label: "1 week" }, { value: "14", label: "2 weeks" }, { value: "30", label: "1 month" }, { value: "60", label: "2 months" }, { value: "90", label: "3 months" }];

export default function BorrowBookModal({ book, open, onOpenChange }: Props) {
  const { toast } = useToast(); const queryClient = useQueryClient();
  const [collectionInfo, setCollectionInfo] = useState<CollectionInfo | null>(null);
  const { data: authData } = useQuery<{ user: any }>({ queryKey: ["/api/auth/me"] });
  const { data: settings } = useQuery({ queryKey: ["/api/platform/settings"] });
  const membership = useSchoolMembership();
  const profile = validateProfile(authData?.user, membership.schools);
  const isOwnBook = !!book && Number(book.ownerId) === Number(authData?.user?.id);
  const form = useForm<BorrowFormData>({ resolver: zodResolver(borrowSchema), defaultValues: { duration: "" } });
  useEffect(() => { if (open) { form.reset({ duration: "" }); setCollectionInfo(null); } }, [open, book?.id, form]);
  const borrow = useMutation({
    mutationFn: async (data: BorrowFormData) => { if (!book) throw new Error("No book selected"); if (!authData?.user) throw new Error("Sign in before borrowing."); if (isOwnBook) throw new Error("You cannot borrow your own book."); if (!book.isAvailable) throw new Error("This book is currently borrowed."); const response = await apiRequest("POST", "/api/rentals/borrow", { bookId: book.id, duration: Number(data.duration), paymentMethod: "free" }); return response.json(); },
    onSuccess: (data: { collectionInfo: CollectionInfo }) => { setCollectionInfo(data.collectionInfo); toast({ title: "Book borrowed", description: data.collectionInfo.message }); for (const path of ["/api/books/my", "/api/books/browse", "/api/books/all", "/api/rentals/borrowed", "/api/rentals/lent", "/api/notifications"]) queryClient.invalidateQueries({ queryKey: [path] }); },
    onError: (error: any) => toast({ title: "Unable to borrow book", description: error.message, variant: "destructive" }),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%_-_2rem)] max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl p-6 sm:p-8 gap-6">
        <DialogHeader className="space-y-3 pr-6 text-left">
          <DialogTitle className="text-xl leading-snug">{collectionInfo ? "Book borrowed successfully" : "Borrow a book"}</DialogTitle>
          <DialogDescription className="text-base leading-relaxed text-slate-600 break-words">
            {book?.title || "Select a book from your school library."}
          </DialogDescription>
        </DialogHeader>

        {collectionInfo ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-relaxed text-blue-950">{collectionInfo.message}</div>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div className="col-span-2 space-y-1"><dt className="text-slate-500">Collect from</dt><dd className="font-semibold text-slate-900">{collectionInfo.ownerName}</dd></div>
              <div className="space-y-1"><dt className="text-slate-500">Grade / Class</dt><dd className="font-medium">{collectionInfo.ownerGrade}</dd></div>
              <div className="space-y-1"><dt className="text-slate-500">Division / Section</dt><dd className="font-medium">{collectionInfo.ownerDivision}</dd></div>
              {collectionInfo.phone && <div className="col-span-2 space-y-1"><dt className="text-slate-500">Contact</dt><dd><a className="text-primary" href={`tel:${collectionInfo.phone}`}>{collectionInfo.phone}</a></dd></div>}
            </dl>
            <p className="text-xs leading-relaxed text-slate-500">These collection details are also saved in your notifications.</p>
            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-5">
              <Button asChild variant="outline" className="h-11 rounded-xl"><Link href="/notifications" onClick={() => onOpenChange(false)}>View Notifications</Link></Button>
              <Button className="h-11 rounded-xl" onClick={() => onOpenChange(false)}>Done</Button>
            </div>
          </div>
        ) : isOwnBook ? (
          <p className="text-sm leading-relaxed text-slate-600">This is your book. You can manage it in My Library, but you cannot borrow it.</p>
        ) : !profile.isComplete ? (
          <div className="space-y-6">
            <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-amber-700" />
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-amber-950">Your profile is incomplete</h3>
                <p className="text-sm leading-relaxed text-amber-900">Complete the details below so your classmates can coordinate book collection with you.</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700">Details to complete</p>
              <ul className="flex flex-wrap gap-2" aria-label="Missing profile details">
                {profile.missingFields.map(field => <li key={field} className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">{field}</li>)}
              </ul>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <Button asChild className="w-full h-11 gap-2 rounded-xl">
                <Link href="/profile" onClick={() => onOpenChange(false)}>Complete Profile<ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(data => borrow.mutate(data))} className="space-y-6">
              <p className="text-sm leading-relaxed text-slate-600">Borrowing is free. Select how long you need the book.</p>
              <FormField control={form.control} name="duration" render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Borrowing period</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger className="h-11"><SelectValue placeholder="Select borrowing period" /></SelectTrigger></FormControl>
                    <SelectContent>{periods.filter(p => Number(p.value) <= Number((settings as any)?.maxRentalDays || 90)).map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="border-t border-slate-100 pt-5"><Button type="submit" className="w-full h-11 rounded-xl" disabled={borrow.isPending}>{borrow.isPending ? "Borrowing…" : "Borrow book — Free"}</Button></div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
