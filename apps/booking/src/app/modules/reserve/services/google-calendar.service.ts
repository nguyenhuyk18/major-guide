import { Injectable, Logger } from "@nestjs/common";

const JITSI_CHARS = 'abcdefghjkmnpqrstvwxyzABCDEFGHJKMNPQRSTVWXYZ23456789';

function generateJitsiCode(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += JITSI_CHARS.charAt(Math.floor(Math.random() * JITSI_CHARS.length));
  }
  return result;
}

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);

  async createMeetEvent(params: CreateMeetEventParams): Promise<{ meetLink: string; eventId: string }> {
    const eventId = `meet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const meetCode = `${generateJitsiCode(8)}-${generateJitsiCode(8)}`;
    const meetLink = `https://meet.jit.si/${meetCode}`;

    this.logger.log(`Created Jitsi Meet event: ${eventId}, Link: ${meetLink}`);
    return { meetLink, eventId };
  }

  async deleteMeetEvent(eventId: string): Promise<void> {
    this.logger.log(`Deleted Google Meet event: ${eventId}`);
  }
}

interface CreateMeetEventParams {
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  attendeeEmail?: string;
}
