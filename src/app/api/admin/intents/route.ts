import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dictionaryPath = path.join(process.cwd(), "src", "data", "intentDictionary.json");

export async function GET() {
  try {
    const fileContents = fs.readFileSync(dictionaryPath, "utf8");
    const dictionary = JSON.parse(fileContents);
    return NextResponse.json(dictionary);
  } catch (error) {
    return NextResponse.json({ error: "Failed to read dictionary" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Ensure all keys exist and are arrays
    if (typeof body !== "object" || !body) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    // Format the JSON nicely before saving
    const jsonString = JSON.stringify(body, null, 2);
    fs.writeFileSync(dictionaryPath, jsonString, "utf8");

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save dictionary" }, { status: 500 });
  }
}
