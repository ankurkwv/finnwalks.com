import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSlotSchema, deleteSlotSchema } from "@shared/schema";
import { sendSmsNotification } from "./twilio";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get schedule for a week
  app.get("/api/schedule", async (req: Request, res: Response) => {
    try {
      const startDate = req.query.start as string || new Date().toISOString().split('T')[0];
      
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
      }
      
      const schedule = await storage.getSchedule(startDate);
      res.json(schedule);
    } catch (error) {
      console.error("Schedule fetch error:", error);
      res.status(500).json({ error: "Failed to fetch schedule" });
    }
  });

  // Add a new slot
  app.post("/api/slot", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = insertSlotSchema.parse(req.body);
      
      // Check if slot already exists
      const existingSlot = await storage.getSlot(validatedData.date, validatedData.time);
      if (existingSlot) {
        return res.status(400).json({ error: "Slot already booked" });
      }

      // Add the slot
      const newSlot = await storage.addSlot(validatedData);
      
      // Send SMS notification
      sendSmsNotification('book', newSlot)
        .catch(err => console.error('SMS notification error:', err));
      
      return res.status(201).json(newSlot);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Slot booking error:", error);
      res.status(500).json({ error: "Failed to book slot" });
    }
  });

  // Delete a slot
  app.delete("/api/slot", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = deleteSlotSchema.parse(req.body);
      const { date, time, name } = validatedData;
      
      // Get the slot to check if it exists and for notification
      const slot = await storage.getSlot(date, time);
      
      if (!slot) {
        return res.status(404).json({ error: "Slot not found" });
      }

      // Remove the slot
      await storage.removeSlot(date, time);
      
      // Send SMS notification
      // Include name from request in the notification
      const notificationSlot = { ...slot, name };
      sendSmsNotification('cancel', notificationSlot)
        .catch(err => console.error('SMS notification error:', err));
      
      return res.status(200).json({ success: true });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Slot deletion error:", error);
      res.status(500).json({ error: "Failed to delete slot" });
    }
  });

  // Get color index for a walker's name
  app.get("/api/walker-color/:name", async (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      if (!name) {
        return res.status(400).json({ error: "Name parameter is required" });
      }
      
      const colorIndex = await storage.getWalkerColorIndex(name);
      return res.status(200).json({ colorIndex });
    } catch (error) {
      console.error("Error getting walker color:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
