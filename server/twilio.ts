import { WalkingSlot, smsAuditLog, InsertSmsAudit } from "@shared/schema";
import { formatTime } from "../client/src/lib/utils";
import twilio from 'twilio';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from './db';

// Format date to a more readable format
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Generate a hash for SMS message to uniquely identify it
 * @param recipient The phone number receiving the SMS
 * @param messageContent The content of the SMS
 * @returns A hash string that uniquely identifies this message to this recipient
 */
function generateMessageHash(recipient: string, messageContent: string): string {
  return crypto
    .createHash('sha256')
    .update(`${recipient}:${messageContent}`)
    .digest('hex');
}

/**
 * Check if an identical SMS has already been sent to the recipient
 * @param recipient The phone number to check
 * @param messageContent The message content to check
 * @returns True if the message was previously sent, false otherwise
 */
async function isMessageDuplicate(recipient: string, messageContent: string): Promise<boolean> {
  const hash = generateMessageHash(recipient, messageContent);
  
  // Check if this message hash exists in our database
  const existingMessages = await db
    .select()
    .from(smsAuditLog)
    .where(eq(smsAuditLog.messageHash, hash))
    .limit(1);
  
  return existingMessages.length > 0;
}

/**
 * Record a sent SMS in the audit log
 * @param messageType Type of message (booking or cancellation)
 * @param recipient The phone number that received the SMS
 * @param messageContent The content of the SMS message
 * @param slot The related walking slot
 */
async function recordSentMessage(
  messageType: string,
  recipient: string, 
  messageContent: string,
  slot: WalkingSlot
): Promise<void> {
  const hash = generateMessageHash(recipient, messageContent);
  
  // Create audit record
  const auditRecord: InsertSmsAudit = {
    messageHash: hash,
    recipient,
    messageType,
    messageContent,
    slotDate: slot.date,
    slotTime: slot.time
  };
  
  // Insert record
  await db.insert(smsAuditLog).values(auditRecord);
  console.log(`SMS audit record created: ${messageType} to ${recipient.substring(0, 3)}****${recipient.substring(recipient.length - 4)}`);
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
    
    // Send messages to owners with duplicate checking
    const ownerResults = await Promise.all(
      ownerRecipients.map(async (to) => {
        // Check if this exact message was already sent to this recipient
        const isDuplicate = await isMessageDuplicate(to, ownerMessage);
        
        if (isDuplicate) {
          console.log(`Skipping duplicate SMS to owner ${to.substring(0, 3)}****${to.substring(to.length - 4)}`);
          return null; // Skip sending
        }
        
        // Send the message
        const result = await twilioClient.messages.create({
          body: ownerMessage,
          from: twilioFrom,
          to
        });
        
        // Record this message in the audit log
        await recordSentMessage(
          action, // 'book' or 'cancel'
          to,
          ownerMessage,
          slot
        );
        
        return result;
      })
    ).then(results => results.filter(Boolean)); // Filter out null values (skipped duplicates)
    
    // Send confirmation to walker if phone number is provided
    if (slot.phone && action === 'book') {
      const walkerMessage = `Your walk with Finn is confirmed for ${formattedDate} at ${formattedTime}. Thanks for helping walk Finn! 🐕`;
      
      try {
        // Check if this exact message was already sent to this walker
        const isDuplicate = await isMessageDuplicate(slot.phone, walkerMessage);
        
        if (isDuplicate) {
          console.log(`Skipping duplicate SMS to walker ${slot.phone.substring(0, 3)}****${slot.phone.substring(slot.phone.length - 4)}`);
        } else {
          // Send the message
          const walkerResult = await twilioClient.messages.create({
            body: walkerMessage,
            from: twilioFrom,
            to: slot.phone
          });
          
          // Record this message in the audit log
          await recordSentMessage(
            'walker_confirmation',
            slot.phone,
            walkerMessage,
            slot
          );
          
          console.log(`Confirmation SMS sent to walker! SID: ${walkerResult.sid}`);
        }
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
