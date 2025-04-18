import { WalkingSlot } from "@shared/schema";
import { formatTime } from "../client/src/lib/utils";

// Format date to a more readable format
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

// Send SMS notification via Twilio
export async function sendSmsNotification(action: 'book' | 'cancel', slot: WalkingSlot): Promise<boolean> {
  // Check for required environment variables
  const twilioSid = process.env.TWILIO_SID;
  const twilioToken = process.env.TWILIO_TOKEN;
  const twilioFrom = process.env.TWILIO_FROM;
  const alertTo = process.env.ALERT_TO;

  if (!twilioSid || !twilioToken || !twilioFrom || !alertTo) {
    console.error('Missing Twilio configuration');
    return false;
  }

  try {
    // Import Twilio
    const twilio = require('twilio')(twilioSid, twilioToken);
    
    // Format date and time
    const formattedDate = formatDate(slot.date);
    const formattedTime = formatTime(slot.time);
    
    // Prepare message based on action
    let message = '';
    if (action === 'book') {
      message = `${slot.name} booked ${formattedDate} at ${formattedTime}. Notes: ${slot.notes || '—'}`;
    } else {
      message = `${slot.name} canceled ${formattedDate} at ${formattedTime}.`;
    }

    // Send to all recipients (comma-separated)
    const recipients = alertTo.split(',').map(num => num.trim());
    
    // Send messages
    await Promise.all(
      recipients.map(to => 
        twilio.messages.create({
          body: message,
          from: twilioFrom,
          to
        })
      )
    );
    
    return true;
  } catch (error) {
    console.error('Error sending SMS notification:', error);
    return false;
  }
}
