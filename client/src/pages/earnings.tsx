import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  BookOpen, 
  UserRound, 
  Calendar, 
  Phone, 
  Mail, 
  School, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RentalPerson {
  id?: number;
  name?: string;
  phone?: string;
  email?: string;
  school?: string;
  grade?: string;
  division?: string;
  flatWing?: string;
  buildingName?: string;
  detailedAddress?: string;
  city?: string;
}

interface RentalBook {
  id?: number;
  title?: string;
  author?: string;
  genre?: string;
  condition?: string;
  imageUrl?: string | null;
  coverImageUrl?: string | null;
}

interface RentalItem {
  id: number;
  bookId: number;
  borrowerId: number;
  lenderId: number;
  startDate: string;
  endDate: string;
  actualReturnDate?: string | null;
  status: "active" | "returned" | "overdue" | string;
  totalAmount?: string;
  book?: RentalBook;
  borrower?: RentalPerson;
  lender?: RentalPerson;
  borrowerName?: string;
  lenderName?: string;
}

function RentalHistoryCard({ 
  rental, 
  kind 
}: { 
  rental: RentalItem; 
  kind: "borrowed" | "lent";
}) {

  const person = kind === "borrowed" ? rental.lender : rental.borrower;
  const personName = person?.name || (kind === "borrowed" ? rental.lenderName : rental.borrowerName) || "School Member";
  
  const isReturned = rental.status === "returned" || !!rental.actualReturnDate;
  const isOverdue = !isReturned && new Date(rental.endDate) < new Date();
  const statusLabel = isReturned ? "Returned" : isOverdue ? "Overdue" : "Active Loan";
  const statusVariant = isReturned ? "secondary" : isOverdue ? "destructive" : "default";


  return (
    <Card className="overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl shrink-0 ${kind === "borrowed" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"}`}>
              {kind === "borrowed" ? (
                <ArrowDownLeft className="h-6 w-6" />
              ) : (
                <ArrowUpRight className="h-6 w-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-gray-900">
                  {rental.book?.title || "Book Title"}
                </h3>
                <Badge variant={statusVariant as any} className="text-xs">
                  {statusLabel}
                </Badge>
                <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700">
                  Free Borrow
                </Badge>
              </div>
              <p className="text-sm font-medium text-gray-600">
                by {rental.book?.author || "Unknown Author"}
              </p>

              {rental.book?.genre && (
                <span className="inline-block mt-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {rental.book.genre}
                </span>
              )}
            </div>
          </div>

        </div>

        {/* Counterparty details */}
        <div className="mt-5 rounded-lg bg-gray-50/80 p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-900">
            <UserRound className="h-4 w-4 text-blue-600" />
            <span>{kind === "borrowed" ? "Borrowed from:" : "Lent out to:"}</span>
            <span className="text-blue-700 font-bold">{personName}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
            {(person?.school || person?.grade) && (
              <div className="flex items-center gap-1.5">
                <School className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span>
                  {person.school || "School"}{person.grade ? ` • Grade ${person.grade}` : ""}{person.division ? ` (${person.division})` : ""}
                </span>
              </div>
            )}

            {person?.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <a href={`tel:${person.phone}`} className="text-blue-600 hover:underline">
                  {person.phone}
                </a>
              </div>
            )}

            {person?.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className="truncate">{person.email}</span>
              </div>
            )}

            {(person?.flatWing || person?.buildingName || person?.city) && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className="truncate">
                  {[person.flatWing, person.buildingName, person.city].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Rental Timeline */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between text-xs text-gray-500 gap-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            <span>Started: {rental.startDate ? new Date(rental.startDate).toLocaleDateString() : "—"}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            <span>Due: {rental.endDate ? new Date(rental.endDate).toLocaleDateString() : "—"}</span>
          </div>

          {rental.actualReturnDate && (
            <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Returned on: {new Date(rental.actualReturnDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function EarningsPage() {
  const [activeTab, setActiveTab] = useState<"borrowed" | "lent">("borrowed");

  const { data: borrowed = [], isLoading: borrowedLoading } = useQuery<RentalItem[]>({ 
    queryKey: ["/api/rentals/borrowed"] 
  });
  
  const { data: lent = [], isLoading: lentLoading } = useQuery<RentalItem[]>({ 
    queryKey: ["/api/rentals/lent"] 
  });

  const isLoading = borrowedLoading || lentLoading;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 pb-20">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Book History</h1>
        <p className="text-sm text-gray-600 mt-1">
          Complete record of books you have borrowed and lent within your school community.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="borrowed" className="flex items-center gap-2">
            <ArrowDownLeft className="h-4 w-4" />
            <span>Borrowed Books</span>
            <Badge variant="secondary" className="ml-1 text-xs">
              {borrowed.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="lent" className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4" />
            <span>Lent Books</span>
            <Badge variant="secondary" className="ml-1 text-xs">
              {lent.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="borrowed" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Loading borrowed books history...
              </CardContent>
            </Card>
          ) : borrowed.length > 0 ? (
            <div className="space-y-3">
              {borrowed.map((rental) => (
                <RentalHistoryCard key={rental.id} rental={rental} kind="borrowed" />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-10 text-center space-y-3">
                <BookOpen className="h-10 w-10 text-gray-400 mx-auto" />
                <CardTitle className="text-base font-semibold">No borrowed books yet</CardTitle>
                <CardDescription>
                  When you borrow a book from a classmate or school peer, details and due dates will appear here.
                </CardDescription>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="lent" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Loading lent books history...
              </CardContent>
            </Card>
          ) : lent.length > 0 ? (
            <div className="space-y-3">
              {lent.map((rental) => (
                <RentalHistoryCard key={rental.id} rental={rental} kind="lent" />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-10 text-center space-y-3">
                <BookOpen className="h-10 w-10 text-gray-400 mx-auto" />
                <CardTitle className="text-base font-semibold">No books lent out yet</CardTitle>
                <CardDescription>
                  When another student borrows one of your shared books, you can track who borrowed it and its return date here.
                </CardDescription>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
