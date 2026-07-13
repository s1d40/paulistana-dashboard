import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export async function GET() {
  try {
    const { stdout } = await execAsync('pm2 jlist');
    const processes = JSON.parse(stdout);
    
    // Return all processes with their metrics
    const allProcesses = processes.map((p: any) => ({
      name: p.name,
      id: p.pm_id,
      status: p.pm2_env?.status || 'unknown',
      memory: p.monit?.memory || 0,
      cpu: p.monit?.cpu || 0,
      uptime: p.pm2_env?.pm_uptime || 0,
      restarts: p.pm2_env?.restart_time || 0,
      pid: p.pid || 0,
      version: p.pm2_env?.version || 'N/A',
      mode: p.pm2_env?.exec_mode || 'fork',
    }));

    // Also find worker specifically for backwards compatibility
    const worker = allProcesses.find((p: any) => p.name === 'worker');
    
    return NextResponse.json({
      // Legacy single-process fields (backwards compat)
      status: worker?.status || 'offline',
      memory: worker?.memory || 0,
      cpu: worker?.cpu || 0,
      uptime: worker?.uptime || 0,
      restarts: worker?.restarts || 0,
      // New: all processes
      processes: allProcesses,
    });
  } catch (error: any) {
    console.error('Error fetching PM2 status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { action, processName } = await req.json();
    const target = processName || 'worker';
    
    if (action === 'restart') {
      const { stdout } = await execAsync(`pm2 restart ${target}`);
      return NextResponse.json({ success: true, stdout });
    }

    if (action === 'stop') {
      const { stdout } = await execAsync(`pm2 stop ${target}`);
      return NextResponse.json({ success: true, stdout });
    }

    if (action === 'start') {
      const { stdout } = await execAsync(`pm2 start ${target}`);
      return NextResponse.json({ success: true, stdout });
    }

    if (action === 'logs') {
      const { stdout } = await execAsync(`pm2 logs ${target} --lines 30 --nostream`);
      return NextResponse.json({ success: true, logs: stdout });
    }
    
    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error: any) {
    console.error('Error executing PM2 action:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
