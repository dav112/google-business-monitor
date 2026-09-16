import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import MenuClient from "@/components/menu-client";

export default async function MenuPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <MenuClient avatar={user.avatar} name={user.name} posX={user.avatarPosX} posY={user.avatarPosY} zoom={user.avatarZoom} />;
}
