import type { RequestHandler } from "express";

interface ReturnStorage {
  getRental(id: number): Promise<any>;
  getUser(id: number): Promise<any>;
  updateRental(id: number, updates: any): Promise<any>;
  updateBook(id: number, updates: any): Promise<any>;
}
type Notify = (data: { userId: number; title: string; message: string; type: string; data?: string }) => Promise<unknown>;

export function createFreeBookReturns(storage: ReturnStorage, notify: Notify) {
  const requestReturn: RequestHandler = async (req, res) => {
    try {
      const rental = await storage.getRental(Number(req.params.id));
      if (!rental || rental.borrowerId !== req.session.userId) return res.status(403).json({ message: "Unauthorized" });
      if (!["active", "overdue"].includes(rental.status) || rental.actualReturnDate) return res.status(400).json({ message: rental.status === "return_requested" ? "Return request already sent" : "This loan is no longer active" });
      const borrower = await storage.getUser(rental.borrowerId);
      const lender = await storage.getUser(rental.lenderId);
      const notes = typeof req.body?.notes === "string" ? req.body.notes.trim().slice(0, 2000) : "";
      await storage.updateRental(rental.id, { status: "return_requested" });
      await notify({
        userId: rental.lenderId,
        title: "Book Return Request",
        message: `${borrower?.name || "Your classmate"} wants to return "${rental.book.title}". Please coordinate the handover and confirm once you receive the book.${notes ? ` Message: ${notes}` : ""}`,
        type: "return_request",
        data: JSON.stringify({ rentalId: rental.id, borrowerName: borrower?.name, borrowerPhone: borrower?.phone, lenderPhone: lender?.phone, bookTitle: rental.book.title, notes: notes || null }),
      });
      res.json({ message: "Return request sent successfully", requiresPayment: false });
    } catch (error) {
      console.error("Request return error:", error);
      res.status(500).json({ message: "Failed to request return" });
    }
  };
  const confirmReturn: RequestHandler = async (req, res) => {
    try {
      const rental = await storage.getRental(Number(req.params.id));
      if (!rental || rental.lenderId !== req.session.userId) return res.status(403).json({ message: "Unauthorized" });
      if (rental.status !== "return_requested" || rental.actualReturnDate) return res.status(400).json({ message: "This loan has no pending return request" });
      await storage.updateRental(rental.id, { status: "returned", actualReturnDate: new Date(), paymentStatus: "completed" });
      await storage.updateBook(rental.bookId, { isAvailable: true });
      await notify({ userId: rental.borrowerId, title: "Book Return Confirmed", message: `The lender confirmed the return of "${rental.book.title}". Thank you for returning it!`, type: "return_confirmed", data: JSON.stringify({ rentalId: rental.id, bookTitle: rental.book.title }) });
      res.json({ message: "Return confirmed successfully" });
    } catch (error) {
      console.error("Confirm return error:", error);
      res.status(500).json({ message: "Failed to confirm return" });
    }
  };
  return { requestReturn, confirmReturn };
}
