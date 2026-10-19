import { BookOpen, CheckCircle, Clock, School, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";

interface StepItem {
  title: string;
  description: string;
  icon: any;
}

const steps: StepItem[] = [
  { title: "Create a complete profile", description: "Add your contact details and school information so other readers can coordinate book collection safely.", icon: Users },
  { title: "Add books you can share", description: "List the books you own and want to lend. There is no borrowing price or selling option—BookPotato is for sharing.", icon: BookOpen },
  { title: "Find a school book", description: "Browse available books shared by readers in your school community and open a book to see its details.", icon: School },
  { title: "Choose a rental period", description: "Select the period you need. Borrowing is free; only the rental period is recorded so the book can be returned on time.", icon: Clock },
  { title: "Coordinate and return", description: "After approval, contact the lender using the collection details. Return the book by the agreed end date.", icon: CheckCircle },
];

export default function HowItWorks() {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="text-center">
          <BookOpen className="mx-auto h-12 w-12 text-blue-600" />
          <h1 className="mt-3 text-3xl font-bold">How BookPotato works</h1>
          <p className="mt-2 text-gray-600">A simple, free school book-sharing library.</p>
        </div>
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          return (
            <Card key={step.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm">
                    {index + 1}
                  </span>
                  <StepIcon className="h-5 w-5 text-blue-600" />
                  <span>{step.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pl-16 text-gray-600">
                {step.description}
              </CardContent>
            </Card>
          );
        })}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="space-y-3 p-6">
            <h2 className="text-xl font-semibold">A few important rules</h2>
            <p className="text-gray-700">
              Profiles must be complete before a member can borrow a book. Books can only be borrowed, never purchased. Borrowing has no cost, and school details are used to keep the community relevant.
            </p>
            <Button onClick={() => navigate("/browse")}>Browse books</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
