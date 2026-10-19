export interface CollectionInfo {
  bookTitle: string;
  ownerName: string;
  ownerGrade: string;
  ownerDivision: string;
  phone: string | null;
  message: string;
}

export function buildCollectionInfo(bookTitle: string, lender: { name?: string | null; grade?: string | null; division?: string | null; phone?: string | null }): CollectionInfo {
  const clean = (value?: string | null) => value?.trim() && value.trim() !== "Not provided" ? value.trim() : null;
  const ownerName = clean(lender.name) || "the book owner";
  const grade = clean(lender.grade);
  const division = clean(lender.division);
  const classroom = grade && division ? ` in Grade ${grade}, Division ${division}` : grade ? ` in Grade ${grade}` : division ? ` in Division ${division}` : "";
  const missingDetails = !grade || !division ? " Contact them to confirm their classroom and arrange collection." : " Please coordinate a time to collect it.";
  return {
    bookTitle,
    ownerName,
    ownerGrade: grade || "Not provided",
    ownerDivision: division || "Not provided",
    phone: clean(lender.phone) === "0000000000" ? null : clean(lender.phone),
    message: `Collect "${bookTitle}" from ${ownerName}${classroom}.${missingDetails}`,
  };
}
