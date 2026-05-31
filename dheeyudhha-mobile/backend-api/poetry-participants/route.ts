import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'poetry-participants.json');

export async function GET() {
  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json([]);
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading participants:', error);
    return NextResponse.json({ error: 'Failed to read participants' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newParticipant = await request.json();
    
    let participants = [];
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      participants = JSON.parse(data);
    }
    
    participants.push(newParticipant);
    
    fs.writeFileSync(filePath, JSON.stringify(participants, null, 2));
    
    return NextResponse.json(participants);
  } catch (error) {
    console.error('Error writing participant:', error);
    return NextResponse.json({ error: 'Failed to add participant' }, { status: 500 });
  }
}
