"use client";

import { toast } from "sonner";
import { Button } from "./button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "./dialog";

export function FeedbackDemo() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="olive" size="sm" onClick={() => toast.success("Added to your bag", { description: "Palpa Dhaka-Trim Maxi Dress · Terracotta · 10" })}>
        Success toast
      </Button>
      <Button variant="outline" size="sm" onClick={() => toast.error("Payment was declined. No money has been taken.")}>
        Error toast
      </Button>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="dark" size="sm">
            Confirmation dialog
          </Button>
        </DialogTrigger>
        <DialogContent title="Remove this item?" description="Hand-Knit Woollen Cardigan · Natural · M">
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">Keep it</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button onClick={() => toast("Item removed")}>Remove</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
