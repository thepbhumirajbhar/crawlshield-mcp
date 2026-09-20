import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { crawlQueue } = await import('../../../src/queue/crawlQueue');

    const waiting = await crawlQueue.getWaitingCount();
    const active = await crawlQueue.getActiveCount();
    const completed = await crawlQueue.getCompletedCount();
    const failed = await crawlQueue.getFailedCount();

    return NextResponse.json({
      success: true,
      waiting,
      active,
      completed,
      failed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      error: 'Redis offline',
    });
  }
}
