import type { RequestHandler } from "express";

interface SchoolStorage {
  getSocietiesByUser(userId: number, hubType?: string): Promise<{ id: number }[]>;
  getBook(id: number): Promise<{ ownerId: number } | undefined>;
  getBookHubsByBook(bookId: number): Promise<{ societyId: number }[]>;
  isMemberOfSociety(schoolId: number, userId: number): Promise<boolean>;
}

// Apply before feature routes, including routes that otherwise expose public data.
export function createSchoolAccess(storage: SchoolStorage): RequestHandler {
  return async (req, res, next) => {
    const path = req.originalUrl.split("?")[0];
    const schoolResource = path.match(/^\/api\/societies\/(\d+)\/(?:messages|chat|chat-rooms|members)(?:\/|$)/);
    const feature = /^\/api\/(?:books|rentals|wishlist|direct-messages)(?:\/|$)/.test(path);
    if (!feature && !schoolResource) return next();
    const userId = req.session?.userId ?? (req.user as { id?: number } | undefined)?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    req.session.userId = userId;
    try {
      const schools = await storage.getSocietiesByUser(userId, "school");
      if (!schools.length) return res.status(403).json({ code: "SCHOOL_REQUIRED", message: "Join a school to use this feature." });
      const schoolIds = new Set(schools.map(school => school.id));
      const requestedSchool = schoolResource?.[1] ?? path.match(/^\/api\/books\/society\/(\d+)/)?.[1] ?? req.body?.societyId;
      if (requestedSchool != null && Number(requestedSchool) !== 0 && !schoolIds.has(Number(requestedSchool))) {
        return res.status(403).json({ message: "You can only access schools you have joined." });
      }
      const bookId = req.body?.bookId ?? path.match(/^\/api\/books\/(\d+)(?:\/|$)/)?.[1] ?? path.match(/^\/api\/wishlist\/check\/(\d+)/)?.[1];
      if (bookId != null) {
        const book = await storage.getBook(Number(bookId));
        if (!book) return res.status(404).json({ message: "Book not found" });
        if (path === "/api/rentals/borrow" && book.ownerId === userId) {
          return res.status(403).json({ message: "You cannot borrow your own book." });
        }
        if (book.ownerId !== userId) {
          const hubs = await storage.getBookHubsByBook(Number(bookId));
          let sharedSchool = false;
          for (const hub of hubs) {
            if (schoolIds.has(hub.societyId) &&
                (requestedSchool == null || Number(requestedSchool) === hub.societyId) &&
                await storage.isMemberOfSociety(hub.societyId, book.ownerId)) {
              sharedSchool = true;
              break;
            }
          }
          if (!sharedSchool) return res.status(403).json({ message: "This book is not shared in your school." });
        }
      }
      const contactId = req.body?.receiverId ?? path.match(/^\/api\/direct-messages\/(\d+)(?:\/|$)/)?.[1];
      if (contactId != null) {
        const contactSchools = await storage.getSocietiesByUser(Number(contactId), "school");
        if (!contactSchools.some(school => schoolIds.has(school.id))) {
          return res.status(403).json({ message: "You can only chat with members of your school." });
        }
      }
      next();
    } catch (error) {
      console.error("School access check failed:", error);
      res.status(500).json({ message: "Could not verify school membership." });
    }
  };
}
