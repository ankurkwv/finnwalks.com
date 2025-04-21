import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSlotSchema, deleteSlotSchema } from "@shared/schema";
import { sendSmsNotification } from "./twilio";
import { ZodError } from "zod";

/**
 * Get current date in Eastern Time (ET) as YYYY-MM-DD
 */
function getCurrentDateET(): string {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    timeZone: 'America/New_York' // Eastern Time
  };
  
  return new Intl.DateTimeFormat('fr-CA', options).format(new Date());
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get schedule for a week
  app.get("/api/schedule", async (req: Request, res: Response) => {
    try {
      // If no start date is provided, default to today in ET timezone
      let startDate = req.query.start as string || getCurrentDateET();
      
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
  
  // Search walkers by name (partial match)
  app.get("/api/walkers/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string || "";
      const walkers = await storage.searchWalkers(query);
      return res.json(walkers);
    } catch (error) {
      console.error("Walker search error:", error);
      res.status(500).json({ error: "Failed to search walkers" });
    }
  });
  
  // Update walker information (automatically happens when booking, but exposed as API for flexibility)
  app.post("/api/walkers/update", async (req: Request, res: Response) => {
    try {
      const { name, phone } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Walker name is required" });
      }
      
      const walker = await storage.updateWalker(name.trim(), phone);
      return res.json(walker);
    } catch (error) {
      console.error("Walker update error:", error);
      res.status(500).json({ error: "Failed to update walker" });
    }
  });

  // Get the all-time leaderboard
  app.get("/api/leaderboard/all-time", async (_req: Request, res: Response) => {
    try {
      const leaderboard = await storage.getLeaderboardAllTime();
      return res.json(leaderboard);
    } catch (error) {
      console.error("Leaderboard fetch error:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Get the next 7 days leaderboard
  app.get("/api/leaderboard/next-week", async (req: Request, res: Response) => {
    try {
      // If no start date is provided, default to today in ET timezone
      let startDate = req.query.start as string || getCurrentDateET();
      
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
      }

      const leaderboard = await storage.getLeaderboardNextWeek(startDate);
      return res.json(leaderboard);
    } catch (error) {
      console.error("Next week leaderboard fetch error:", error);
      res.status(500).json({ error: "Failed to fetch next week leaderboard" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
