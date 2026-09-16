import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminUsersClient from "@/components/admin-users-client";

export default async function AdminUsersPage(){
  const user = await getCurrentUser();
  if(!user) redirect("/login");
  if(!isAdminUser(user)) redirect("/menu");
  return <AdminUsersClient />;
}
