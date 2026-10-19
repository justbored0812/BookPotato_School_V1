import { buildCollectionInfo } from "./book-collection";

export interface CollectionLoan {
  id: number;
  bookId: number;
  bookTitle: string;
  createdAt: Date | string;
  lender: { name?: string | null; grade?: string | null; division?: string | null; phone?: string | null };
}

export function isLegacyCollectionNotification(notification: { title: string; message: string }): boolean {
  return notification.title === "Book Borrowed Successfully" && notification.message.includes("Collect from:");
}

// Older notifications stored home addresses in their message. Project them into
// school collection instructions when read, without rewriting shared DB records.
export function schoolCollectionNotification<T extends { title: string; message: string; data: string | null; createdAt: Date | string }>(notification: T, loans: CollectionLoan[]): T {
  if (!isLegacyCollectionNotification(notification)) return notification;
  const parsed = notification.message.match(/^You have borrowed "([\s\S]+)" from ([\s\S]+)\. Collect from:/);
  if (!parsed) return { ...notification, title: "Book Ready for Collection", message: "Collect your borrowed book from the lender at school. Check My Books for their name, grade, and division.", data: null };
  const [, title, lenderName] = parsed;
  const notificationTime = new Date(notification.createdAt).getTime();
  const candidates = loans.filter(loan => loan.bookTitle === title && new Date(loan.createdAt).getTime() <= notificationTime + 60000)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const loan = candidates.find(loan => loan.lender.name === lenderName) || candidates[0];
  const info = buildCollectionInfo(title, loan?.lender || { name: lenderName });
  return { ...notification, title: "Book Ready for Collection", message: info.message, data: JSON.stringify({ rentalId: loan?.id, bookId: loan?.bookId, ...info }) };
}
