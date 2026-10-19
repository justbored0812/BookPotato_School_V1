import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getBookStatusColor, getBookStatusText } from "@/lib/utils";
import type { BookWithOwner } from "@shared/schema";
import ShareButton from "@/components/social/share-button";
import WishlistButton from "@/components/social/wishlist-button";
import AvailabilityAlertButton from "@/components/availability-alert-button";
import { School } from "lucide-react";

interface BookCardProps {
  book: BookWithOwner;
  onBorrow?: (book: BookWithOwner) => void;
  onEdit?: (book: BookWithOwner) => void;
  onClick?: (book: BookWithOwner) => void;
  showOwner?: boolean;
  variant?: "grid" | "list";
}

export default function BookCard({ 
  book, 
  onBorrow,
  onEdit,
  onClick, 
  showOwner = true, 
  variant = "list" 
}: BookCardProps) {
  const statusColor = getBookStatusColor(book.isAvailable);
  const statusText = getBookStatusText(book.isAvailable);

  if (variant === "grid") {
    return (
      <Card 
        className="book-card h-full flex flex-col cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
        onClick={() => onClick?.(book)}
      >
        <CardContent className="p-0 flex flex-col h-full">
          <div className="w-full h-48 relative overflow-hidden rounded-t-lg bg-surface">
            {book.coverImageUrl || book.imageUrl ? (
              <img 
                src={(book.coverImageUrl || book.imageUrl)!} 
                alt={book.title}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex flex-col items-center justify-center p-4">
                <h3 className="text-lg font-bold text-blue-800 text-center mb-2 line-clamp-3">
                  {book.title}
                </h3>
              </div>
            )}
            
            {/* Free Borrow Badge */}
            <div className="absolute bottom-3 right-3 bg-white/95 rounded-full px-3 py-1 shadow-md">
              <span className="text-xs font-semibold text-blue-700">
                Free Borrow
              </span>
            </div>
            
            {/* Status badge */}
            <div className="absolute top-3 left-3">
              <Badge className={`text-xs ${statusColor}`}>
                {statusText}
              </Badge>
            </div>
            
            {/* School Icon */}
            <div className="absolute top-3 right-3 bg-blue-600 text-white rounded-full p-2 shadow-md">
              <School className="w-4 h-4" />
            </div>
          </div>
          
          {/* Book details below cover */}
          <div className="p-3 flex-1 flex flex-col">
            <h3 className="font-semibold text-sm mb-1 line-clamp-2">
              {book.title}
            </h3>
            <p className="text-xs text-text-secondary mb-1">
              by {book.author}
            </p>
            {showOwner && (
              <p className="text-xs text-text-secondary mb-2">
                Owner: {book.owner.name}
              </p>
            )}
            
            {/* Action Buttons for Grid View */}
            <div className="mt-auto flex gap-2">
              {onBorrow ? (
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onBorrow(book);
                  }}
                  size="sm"
                  className="w-full"
                  disabled={!book.isAvailable}
                  data-testid={`button-borrow-${book.id}`}
                >
                  Borrow for Free
                </Button>
              ) : onEdit ? (
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(book);
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full"
                  data-testid={`button-edit-${book.id}`}
                >
                  Edit
                </Button>
              ) : (
                <AvailabilityAlertButton
                  bookId={book.id}
                  bookTitle={book.title}
                  isAvailable={book.isAvailable}
                  className="w-full"
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="book-card cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick?.(book)}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="w-12 h-16 bg-surface rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
            {book.coverImageUrl || book.imageUrl ? (
              <img 
                src={(book.coverImageUrl || book.imageUrl)!} 
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs text-blue-600 font-medium text-center px-1">
                {book.title.substring(0, 3)}
              </span>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-text-primary mb-1">{book.title}</h4>
            <p className="text-sm text-text-secondary mb-1">{book.author}</p>
            {showOwner && (
              <p className="text-sm text-text-secondary mb-2">
                Owner: {book.owner.name}
              </p>
            )}
            
            <div className="flex items-center justify-between mb-2">
              <Badge className={`text-xs ${statusColor}`}>
                {statusText}
              </Badge>
              <span className="text-xs text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                Free to Borrow
              </span>
            </div>
            
            {/* Social Actions */}
            <div className="flex items-center space-x-2">
              <WishlistButton 
                bookId={book.id} 
                size="sm"
                showText={false}
                className="h-6 w-6 p-0"
              />
              <ShareButton
                bookId={book.id}
                bookTitle={book.title}
                bookAuthor={book.author}
                dailyFee={"0"}
                size="sm"
                showText={false}
                className="h-6 w-6 p-0"
              />
            </div>
          </div>
          
          <div className="flex-shrink-0 ml-2 flex gap-2">
            {onBorrow ? (
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  onBorrow(book);
                }}
                size="sm"
                disabled={!book.isAvailable}
                data-testid={`button-borrow-${book.id}`}
              >
                Borrow
              </Button>
            ) : onEdit ? (
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(book);
                }}
                variant="outline"
                size="sm"
                data-testid={`button-edit-${book.id}`}
              >
                Edit
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
