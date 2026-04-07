"use client"

import { signOut } from "@/lib/auth-client";
import { redirect } from "next/navigation";

export default function SignOutButton() {
  const onSignOutClick = async () => {
    await signOut();
    redirect("/sign-in");
  }

  return (
    <button
      className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
      onClick={onSignOutClick}
    >
      Sign out
    </button>
  )
};