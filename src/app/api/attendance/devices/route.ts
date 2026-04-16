import { NextRequest, NextResponse } from "next/server";
import { getTenantPrisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function GET(request: NextRequest) {
  try {
    console.log("API: Fetching devices...");
    const prisma = await getTenantPrisma();
    console.log("API: Prisma resolved");
    const devices = await prisma.attendanceDevice.findMany({
      orderBy: { createdAt: "desc" }
    });
    console.log(`API: Found ${devices.length} devices`);
    return NextResponse.json(devices);
  } catch (error: any) {
    console.error("API GET Devices Error:", error);
    return NextResponse.json({ 
      message: "Failed to fetch devices", 
      error: error.message || "Unknown error" 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const prisma = await getTenantPrisma();

    const device = await prisma.attendanceDevice.create({
      data: {
        deviceName: data.deviceName,
        ipAddress: data.ipAddress,
        port: parseInt(data.port) || 4370,
        description: data.description,
        apiKey: randomUUID(),
        status: "DISCONNECTED"
      }
    });

    return NextResponse.json(device, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to create device", error }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const prisma = await getTenantPrisma();

    const device = await prisma.attendanceDevice.update({
      where: { id: data.id },
      data: {
        deviceName: data.deviceName,
        ipAddress: data.ipAddress,
        port: parseInt(data.port) || 4370,
        description: data.description,
        status: data.status
      }
    });

    return NextResponse.json(device);
  } catch (error) {
    return NextResponse.json({ message: "Failed to update device", error }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) return NextResponse.json({ message: "ID is required" }, { status: 400 });

    const prisma = await getTenantPrisma();
    await prisma.attendanceDevice.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Device deleted" });
  } catch (error) {
    return NextResponse.json({ message: "Failed to delete device", error }, { status: 400 });
  }
}
