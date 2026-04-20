import { NextRequest, NextResponse } from "next/server";
import { getTenantPrisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json({ message: "API Key is required" }, { status: 401 });
    }

    const { machineStatus, error } = await request.json();

    const prisma = await getTenantPrisma();

    // Find the device
    const device = await prisma.attendanceDevice.findUnique({
      where: { apiKey }
    });

    if (!device) {
      return NextResponse.json({ message: "Invalid API Key" }, { status: 401 });
    }

    // Update lastSeen and potentially status
    // If machineStatus is provided, we can use it to distinguish between agent status and machine status
    await prisma.attendanceDevice.update({
      where: { id: device.id },
      data: {
        lastSeen: new Date(),
        status: machineStatus === "CONNECTED" ? "ACTIVE" : "DISCONNECTED"
      }
    });

    return NextResponse.json({ 
      message: "Heartbeat received",
      agentStatus: "ONLINE",
      machineStatus: machineStatus || "UNKNOWN"
    });

  } catch (error: any) {
    console.error("Heartbeat Error:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
