import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, UserCheck } from "lucide-react";
import { useLocation } from "wouter";

interface LenderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookTitle: string;
}

export default function LenderDetailsModal({
  isOpen,
  onClose,
  bookTitle,
}: LenderDetailsModalProps) {
  const [, navigate] = useLocation();

  const handleAddDetails = () => {
    onClose();
    navigate("/profile");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white border border-gray-100 shadow-2xl rounded-2xl p-6 overflow-hidden">
        <DialogHeader className="flex flex-col items-center text-center space-y-3 pb-2">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 animate-pulse">
            <UserCheck className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900 tracking-tight">
            Payment Details Needed
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Detailed Alert Message Box */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 text-center">
            <p className="text-gray-700 leading-relaxed text-sm">
              <span className="font-semibold text-blue-700">"{bookTitle}"</span> has been borrowed from you, to recive the payment please add you phone no., upi_id, and address
            </p>
          </div>

          <div className="flex items-start space-x-2 text-xs text-gray-500 bg-amber-50/60 border border-amber-100 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="text-amber-800 leading-tight">
              To ensure secure and hassle-free payment settlements, your mobile number, UPI ID, and apartment address are mandatory.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2">
            <Button
              onClick={handleAddDetails}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium py-5 flex items-center justify-center space-x-1.5 shadow-md shadow-blue-200 transition-all duration-200 hover:translate-y-[-1px]"
            >
              <span>Add Details</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
