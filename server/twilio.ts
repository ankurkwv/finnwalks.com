import { WalkingSlot } from "@shared/schema";
import { formatTime } from "../client/src/lib/utils";
import twilio from 'twilio';

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
    // Create Twilio client
    const twilioClient = twilio(twilioSid, twilioToken);
    
    // Format date and time
    const formattedDate = formatDate(slot.date);
    const formattedTime = formatTime(slot.time);
    
    // Prepare message based on action
    let ownerMessage = '';
    if (action === 'book') {
      ownerMessage = `${slot.name} booked ${formattedDate} at ${formattedTime}. Notes: ${slot.notes || '—'}`;
    } else {
      ownerMessage = `${slot.name} canceled ${formattedDate} at ${formattedTime}.`;
    }

    // Log notification details (without exposing actual phone numbers)
    console.log(`Sending SMS notification: Action=${action}, Message="${ownerMessage}"`);
    
    // Send to all owner recipients (comma-separated)
    const ownerRecipients = alertTo.split(',').map(num => num.trim());
    console.log(`Owner recipients count: ${ownerRecipients.length}`);
    
    // Send messages to owners
    const ownerResults = await Promise.all(
      ownerRecipients.map(to => 
        twilioClient.messages.create({
          body: ownerMessage,
          from: twilioFrom,
          to
        })
      )
    );
    
    // Send confirmation to walker if phone number is provided
    if (slot.phone && action === 'book') {
      const walkerMessage = `Your walk with Finn is confirmed for ${formattedDate} at ${formattedTime}. Thanks for helping walk Finn! 🐕`;
      
      try {
        const walkerResult = await twilioClient.messages.create({
          body: walkerMessage,
          from: twilioFrom,
          to: slot.phone
        });
        
        console.log(`Confirmation SMS sent to walker! SID: ${walkerResult.sid}`);
      } catch (walkerError) {
        // Log but don't fail if walker notification fails
        console.error('Failed to send confirmation to walker:', walkerError);
      }
    }
    
    // Log success
    console.log(`SMS notifications sent successfully! SID: ${ownerResults[0]?.sid || 'unknown'}`);
    return true;
  } catch (err) {
    const error = err as Error & { code?: string; };
    console.error('Error sending SMS notification:', error);
    if (error.code) {
      console.error(`Twilio Error Code: ${error.code}`);
      console.error(`Twilio Error Message: ${error.message}`);
    }
    return false;
  }
}
