import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export async function GET() {
  try {
    const { stdout } = await execAsync('pm2 jlist');
    const processes = JSON.parse(stdout);
    
    // Find worker
    const worker = processes.find((p: any) => p.name === 'worker');
    
    if (!worker) {
      return NextResponse.json({ status: 'offline', details: 'Process not found' });
    }
    
    return NextResponse.json({
      status: worker.pm2_env.status,
      memory: worker.monit.memory,
      cpu: worker.monit.cpu,
      uptime: worker.pm2_env.pm_uptime,
      restarts: worker.pm2_env.restart_time
    });
  } catch (error: any) {
    console.error('Error fetching PM2 status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { action } = await req.json();
    
    if (action === 'restart') {
      const { stdout } = await execAsync('pm2 restart worker');
      return NextResponse.json({ success: true, stdout });
    }
    
    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error: any) {
    console.error('Error executing PM2 action:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
