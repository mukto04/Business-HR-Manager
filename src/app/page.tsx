import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LandingPage } from "@/modules/landing/landing-page";

export default async function IndexPage() {
  return <LandingPage />;
}
