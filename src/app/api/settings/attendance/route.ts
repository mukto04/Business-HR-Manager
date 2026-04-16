import { NextRequest, NextResponse } from "next/server";
import { getTenantPrisma } from "@/lib/prisma";

export async function GET() {
  try {
    const prisma = await getTenantPrisma();
    // Since this is a global setting for the tenant, we just fetch the first record
    let settings = await prisma.tenantSettings.findFirst();

    // If no settings exist yet, return defaults
    if (!settings) {
      settings = await prisma.tenantSettings.create({
        data: {
          defaultInTime: "09:00 AM",
          defaultOutTime: "06:00 PM",
          avgRequestTime: "09:00 AM"
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("Fetch Settings Error:", error.message);
    return NextResponse.json({ message: "Failed to fetch attendance settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { defaultInTime, defaultOutTime, avgRequestTime } = await request.json();
    const prisma = await getTenantPrisma();

    if (!defaultInTime || !defaultOutTime || !avgRequestTime) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    // Upsert equivalent since we only want one settings record per tenant
    let settings = await prisma.tenantSettings.findFirst();

    if (settings) {
      settings = await prisma.tenantSettings.update({
        where: { id: settings.id },
        data: { defaultInTime, defaultOutTime, avgRequestTime }
      });
    } else {
      settings = await prisma.tenantSettings.create({
        data: { defaultInTime, defaultOutTime, avgRequestTime }
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("Update Settings Error:", error.message);
    return NextResponse.json({ message: "Failed to update attendance settings" }, { status: 500 });
  }
}
