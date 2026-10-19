import { useQuery } from "@tanstack/react-query";
import { useSchoolMembership } from "@/hooks/use-school-membership";
import { getCurrentUser } from "@/lib/auth";
import { defaultLibraryFilters, filterLibraryBooks } from "@shared/library-filters";
import type { BookWithOwner } from "@shared/schema";

export type SchoolLibraryBook = BookWithOwner & { schoolIds: number[]; schoolNames: string[] };

export function useSchoolLibrary() {
  const membership = useSchoolMembership();
  const { data: auth } = useQuery({ queryKey: ["/api/auth/me"], queryFn: getCurrentUser });
  const schoolIds = membership.schools.map(school => Number(school.id)).sort((a, b) => a - b);
  const query = useQuery<SchoolLibraryBook[]>({
    queryKey: ["/api/books/browse", "free-school-library-v2", auth?.user?.id, schoolIds.join(",")],
    enabled: membership.hasSchool,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
    queryFn: async ({ signal }) => {
      const response = await fetch("/api/books/browse", { credentials: "include", signal, cache: "no-store" });
      if (!response.ok) throw new Error("Could not load the school library.");
      const data = await response.json();
      if (!Array.isArray(data) || !data.every(book => Array.isArray(book.schoolIds) && book.ownerId && Number(book.dailyFee) === 0 && book.sellingPrice == null)) {
        throw new Error("The library could not be loaded. Please refresh and try again.");
      }
      return data;
    },
  });
  const books = filterLibraryBooks(query.data ?? [], auth?.user?.id, schoolIds, { ...defaultLibraryFilters, availability: "all" });
  const availableBooks = filterLibraryBooks(books, auth?.user?.id, schoolIds, defaultLibraryFilters);
  return { ...query, books, availableBooks, membership, userId: auth?.user?.id, schoolIds };
}
