import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminActivityClient from "@/components/admin-activity-client";

export default async function AdminActivityPage(){
  const user = await getCurrentUser();
  if(!user) redirect("/login");
  if(!isAdminUser(user)) redirect("/menu");
  return <AdminActivityClient />;
}
