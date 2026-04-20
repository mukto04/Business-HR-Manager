import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { mkdir } from "fs/promises";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Ensure filename is safe
    const originalName = file.name || "unnamed";
    const filename = `${Date.now()}-${originalName.replace(/\s+/g, "_")}`;
    const uploadDir = join(process.cwd(), "public", "uploads");

    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true });

    const path = join(uploadDir, filename);
    await writeFile(path, buffer);

    const fileUrl = `/uploads/${filename}`;
    console.log(`[Upload API] File saved to: ${fileUrl}`);

    return NextResponse.json({ 
      message: "File uploaded successfully", 
      url: fileUrl 
    });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json({ 
      message: "Failed to upload file", 
      error: error.message 
    }, { status: 500 });
  }
}
