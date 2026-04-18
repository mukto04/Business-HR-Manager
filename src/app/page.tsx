import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LandingPage } from "@/modules/landing/landing-page";

export default async function IndexPage() {
  const cookieStore = await cookies();
  const hrToken = cookieStore.get("hr_auth_token")?.value;

  if (hrToken) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}
