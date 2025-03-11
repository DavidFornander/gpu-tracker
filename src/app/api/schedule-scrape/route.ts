import { NextRequest, NextResponse } from 'next/server';
import { scrapeUrl } from '@/lib/url-scraper';
import { createScrapeConfig } from '@/lib/db-service';
import prisma from '@/lib/db';

// Type for a scheduled task
interface ScheduledTask {
  id: string;
  retailer: string;
  sourceUrl: string;
  divSelector: string;
  updateFrequency: number; // in minutes
  lastRun?: string;
  isActive: boolean;
}

// In-memory storage for scheduled tasks (would be database in production)
let scheduledTasks: ScheduledTask[] = [];

// Create a new scheduled task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { retailer, sourceUrl, divSelector, updateFrequency } = body;
    
    if (!retailer || !sourceUrl || !divSelector || !updateFrequency) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create a new task
    const newTask: ScheduledTask = {
      id: crypto.randomUUID(),
      retailer,
      sourceUrl,
      divSelector,
      updateFrequency,
      isActive: true,
      lastRun: new Date().toISOString()
    };
    
    // Add to the list of tasks
    scheduledTasks.push(newTask);
    
    // Save to database (for demonstration we're using Prisma)
    await createScrapeConfig({
      name: `Scheduled: ${retailer}`,
      url: sourceUrl,
      selectors: {
        itemContainer: divSelector,
        brand: "", // These will be filled by AI analysis
        model: "",
        price: "",
        stockStatus: ""
      },
      updateFrequency,
      isActive: true
    });
    
    return NextResponse.json({
      message: 'Task scheduled successfully',
      task: newTask
    });
    
  } catch (error) {
    console.error('Error scheduling task:', error);
    return NextResponse.json(
      {
        error: 'Failed to schedule task',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Get all scheduled tasks
export async function GET() {
  try {
    // In a real app, fetch from database
    const dbTasks = await prisma.scrapeConfig.findMany({
      where: {
        name: {
          startsWith: 'Scheduled:'
        }
      }
    });
    
    // Map DB tasks to our format
    const mappedTasks = dbTasks.map(task => ({
      id: task.id,
      retailer: task.name.replace('Scheduled: ', ''),
      sourceUrl: task.url || '',
      divSelector: (task.selectors as any)?.itemContainer || '',
      updateFrequency: task.updateFrequency,
      lastRun: task.lastRun?.toISOString(),
      isActive: task.isActive
    }));
    
    return NextResponse.json({
      tasks: mappedTasks
    });
    
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch scheduled tasks',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Run a specific task immediately
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId } = body;
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'Missing task ID' },
        { status: 400 }
      );
    }
    
    // Find the task in database
    const task = await prisma.scrapeConfig.findUnique({
      where: { id: taskId }
    });
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    
    // Run the scraper
    const autoSelectors = { 
      itemContainer: (task.selectors as any)?.itemContainer || '',
      brand: "", 
      model: "", 
      price: "", 
      stockStatus: "" 
    };
    
    const result = await scrapeUrl(task.url || '', autoSelectors, task.name.replace('Scheduled: ', ''));
    
    // Update last run time
    await prisma.scrapeConfig.update({
      where: { id: taskId },
      data: { lastRun: new Date() }
    });
    
    return NextResponse.json({
      message: 'Task executed successfully',
      products: result.products.length
    });
    
  } catch (error) {
    console.error('Error running task:', error);
    return NextResponse.json(
      {
        error: 'Failed to run task',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Delete a scheduled task
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('id');
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'Missing task ID' },
        { status: 400 }
      );
    }
    
    // Delete from database
    await prisma.scrapeConfig.delete({
      where: { id: taskId }
    });
    
    return NextResponse.json({
      message: 'Task deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete task',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
