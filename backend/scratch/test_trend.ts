import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const fromDate = '2026-04-01';
  const toDate = '2026-05-18'; // maybe the user didn't select dates, or selected up to today?
  
  // Let's just fetch all job cards
  const allJobCards = await prisma.serviceJobCard.findMany();
  
  const dailyStatsMap = new Map();
  
  allJobCards.forEach(jc => {
    const receivedDate = jc.createdAt.toLocaleDateString('en-GB').replace(/\//g, '-');
    const closedDate = jc.closedDate ? jc.closedDate.toLocaleDateString('en-GB').replace(/\//g, '-') : null;
    
    if (!dailyStatsMap.has(receivedDate)) {
      dailyStatsMap.set(receivedDate, { date: receivedDate, received: 0, pending: 0, invoiced: 0 });
    }
    
    const stats = dailyStatsMap.get(receivedDate);
    stats.received++;
    if (jc.status === 'Pending') {
      stats.pending++;
    }
    
    if (closedDate) {
      if (!dailyStatsMap.has(closedDate)) {
        dailyStatsMap.set(closedDate, { date: closedDate, received: 0, pending: 0, invoiced: 0 });
      }
      dailyStatsMap.get(closedDate).invoiced++;
    }
  });

  const dailyTrend = Array.from(dailyStatsMap.values()).sort((a: any, b: any) => {
    const [dayA, monthA, yearA] = a.date.split('-').map(Number);
    const [dayB, monthB, yearB] = b.date.split('-').map(Number);
    return new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime();
  });
  
  console.log(dailyTrend.filter(t => t.invoiced > 10 || t.received > 10 || t.date.includes('05-2026')));
}

main().catch(console.error).finally(() => prisma.$disconnect());
