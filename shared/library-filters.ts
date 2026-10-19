export interface LibraryBook {
  id: number;
  title: string;
  author: string;
  ownerId: number;
  genre?: string | null;
  condition?: string;
  isbn?: string | null;
  isAvailable: boolean;
  createdAt?: string | Date;
  schoolIds?: number[];
}
export interface LibraryFilters {
  search: string;
  school: string;
  genre: string;
  condition: string;
  availability: string;
  sort: string;
}
export const defaultLibraryFilters: LibraryFilters = { search: "", school: "all", genre: "all", condition: "all", availability: "available", sort: "newest" };

export function filterLibraryBooks<T extends LibraryBook>(books: T[], userId: number | undefined, schoolIds: number[], filters: LibraryFilters): T[] {
  if (!userId || !schoolIds.length) return [];
  const terms = filters.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const result = books.filter(book => {
    if (!book.ownerId || Number(book.ownerId) === Number(userId)) return false;
    if (!book.schoolIds?.some(id => schoolIds.includes(id))) return false;
    if (filters.school !== "all" && !book.schoolIds.includes(Number(filters.school))) return false;
    const text = [book.title, book.author, book.isbn].filter(Boolean).join(" ").toLowerCase();
    return terms.every(term => text.includes(term)) &&
      (filters.genre === "all" || book.genre === filters.genre) &&
      (filters.condition === "all" || book.condition === filters.condition) &&
      (filters.availability === "all" || (filters.availability === "available" ? book.isAvailable : !book.isAvailable));
  });
  return result.sort((a, b) => {
    if (filters.sort === "title") return a.title.localeCompare(b.title);
    if (filters.sort === "author") return a.author.localeCompare(b.author);
    const time = (book: T) => new Date(book.createdAt || 0).getTime() || 0;
    return filters.sort === "oldest" ? time(a) - time(b) : time(b) - time(a);
  });
}
