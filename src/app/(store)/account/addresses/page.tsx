import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountSkeleton } from "@/components/account/account-skeleton";
import { AddressBook } from "@/components/account/address-book";
import { getMyAddresses } from "@/server/account";

export const metadata: Metadata = { title: "Addresses" };

export default function AddressesPage() {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <Addresses />
    </Suspense>
  );
}

async function Addresses() {
  const rows = await getMyAddresses();
  return (
    <AddressBook
      addresses={rows.map(({ id, fullName, line1, line2, city, county, postcode, phone, isDefault }) => ({
        id,
        fullName,
        line1,
        line2,
        city,
        county,
        postcode,
        phone,
        isDefault,
      }))}
    />
  );
}
