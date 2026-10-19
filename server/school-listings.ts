import { sql } from "drizzle-orm";
import { books, bookHubs, societies, societyMembers } from "@shared/schema";

// School upload routes always write zero rental fee and no selling price.
// Keep the legacy paid catalogue out of this free school-sharing application.
export function schoolListingConditions() {
  return sql`${societies.hubType} = 'school'
    AND ${societyMembers.isActive} = true
    AND ${books.dailyFee} = 0
    AND ${books.sellingPrice} IS NULL`;
}
