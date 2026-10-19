import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const schema = z.object({ title: z.string().min(1, "Title is required"), author: z.string().min(1, "Author is required"), isbn: z.string().min(1, "ISBN is required"), genre: z.string().min(1, "Genre is required"), condition: z.string().min(1, "Condition is required"), description: z.string().optional() });
type FormData = z.infer<typeof schema>;
interface Props { open: boolean; onOpenChange: (open: boolean) => void; editBook?: any; onOpenBulkUpload?: () => void; }

export default function AddBookModal({ open, onOpenChange, editBook, onOpenBulkUpload }: Props) {
  const { toast } = useToast(); const queryClient = useQueryClient();
  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { title: editBook?.title || "", author: editBook?.author || "", isbn: editBook?.isbn || "", genre: editBook?.genre || "", condition: editBook?.condition || "Good", description: editBook?.description || "" } });
  const save = useMutation({ mutationFn: async (data: FormData) => { const response = await apiRequest(editBook ? "PATCH" : "POST", editBook ? `/api/books/${editBook.id}` : "/api/books", { ...data, dailyFee: "0", sellingPrice: null }); return response.json(); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/books/my"] }); queryClient.invalidateQueries({ queryKey: ["/api/books"] }); queryClient.invalidateQueries({ queryKey: ["/api/books/browse"] }); toast({ title: editBook ? "Book updated" : "Book added" }); onOpenChange(false); }, onError: (error: Error) => toast({ title: "Unable to save book", description: error.message, variant: "destructive" }) });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle>{editBook ? "Edit book" : "Add a book to share"}</DialogTitle>
            {!editBook && onOpenBulkUpload && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onOpenBulkUpload();
                }}
                className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 flex items-center gap-1 font-semibold"
              >
                📚 Bulk Upload
              </Button>
            )}
          </div>
        </DialogHeader>
        <form className="space-y-3" onSubmit={form.handleSubmit(data => save.mutate(data))}>
          {([['title','Title'],['author','Author'],['isbn','ISBN'],['genre','Genre'],['condition','Condition']] as const).map(([field,label]) => (
            <div key={field}>
              <Label>{label}</Label>
              <Input {...form.register(field)} />
            </div>
          ))}
          <div>
            <Label>Description (optional)</Label>
            <Textarea {...form.register('description')} />
          </div>
          <p className="text-xs text-gray-500 bg-blue-50/70 p-2 rounded border border-blue-100">
            ✨ Free school book sharing: Books on BookPotato are loaned 100% free with no borrowing costs.
          </p>
          <Button type="submit" className="w-full" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Add Book"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
