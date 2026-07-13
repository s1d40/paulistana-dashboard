import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

// Server definitions
const SERVERS = [
  {
    name: 'cocreator-helsinki',
    host: 'localhost', // This is the server running the dashboard
    label: 'Frontend / n8n',
    specs: { vcpu: 4, ram: '8 GB', disk: '160 GB', plan: 'CPX32' },
    isLocal: true,
  },
  {
    name: 'ubuntu-32gb-hel1-1',
    host: '204.168.142.231',
    label: 'Worker Dedicado',
    specs: { vcpu: 16, ram: '32 GB', disk: '320 GB', plan: 'CX53' },
    isLocal: false,
  },
];

async function fetchLocalPM2(): Promise<any[]> {
  try {
    const { stdout } = await execAsync('pm2 jlist');
    return JSON.parse(stdout);
  } catch {
    return [];
  }
}

async function fetchRemotePM2(host: string): Promise<any[]> {
  try {
    const { stdout } = await execAsync(
      `ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@${host} "pm2 jlist"`,
      { timeout: 10000 }
    );
    return JSON.parse(stdout);
  } catch {
    return [];
  }
}

function mapProcesses(rawProcesses: any[], serverName: string) {
  return rawProcesses.map((p: any) => ({
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
    server: serverName,
  }));
}

export async function GET() {
  try {
    // Fetch from all servers in parallel
    const results = await Promise.all(
      SERVERS.map(async (server) => {
        const rawProcesses = server.isLocal
          ? await fetchLocalPM2()
          : await fetchRemotePM2(server.host);
        
        const processes = mapProcesses(rawProcesses, server.name);
        
        return {
          ...server,
          processes,
          online: processes.filter(p => p.status === 'online').length,
          total: processes.length,
          totalMemory: processes.reduce((sum, p) => sum + p.memory, 0),
          totalCpu: processes.reduce((sum, p) => sum + p.cpu, 0),
          reachable: rawProcesses.length > 0 || server.isLocal,
        };
      })
    );

    // Flatten all processes for legacy compat
    const allProcesses = results.flatMap(r => r.processes);
    const worker = allProcesses.find(p => p.name === 'worker' || p.name === 'video_worker_cx53');

    return NextResponse.json({
      // Legacy single-process fields (backwards compat)
      status: worker?.status || 'offline',
      memory: worker?.memory || 0,
      cpu: worker?.cpu || 0,
      uptime: worker?.uptime || 0,
      restarts: worker?.restarts || 0,
      // New: multi-server
      servers: results,
      processes: allProcesses,
    });
  } catch (error: any) {
    console.error('Error fetching PM2 status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { action, processName, serverHost } = await req.json();
    const target = processName || 'worker';
    
    // Determine if action is local or remote
    const isRemote = serverHost && serverHost !== 'localhost';
    
    const buildCmd = (cmd: string) => {
      if (isRemote) {
        return `ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@${serverHost} "${cmd}"`;
      }
      return cmd;
    };

    if (action === 'restart') {
      const { stdout } = await execAsync(buildCmd(`pm2 restart ${target}`), { timeout: 15000 });
      return NextResponse.json({ success: true, stdout });
    }

    if (action === 'stop') {
      const { stdout } = await execAsync(buildCmd(`pm2 stop ${target}`), { timeout: 15000 });
      return NextResponse.json({ success: true, stdout });
    }

    if (action === 'start') {
      const { stdout } = await execAsync(buildCmd(`pm2 start ${target}`), { timeout: 15000 });
      return NextResponse.json({ success: true, stdout });
    }

    if (action === 'logs') {
      const { stdout } = await execAsync(buildCmd(`pm2 logs ${target} --lines 50 --nostream`), { timeout: 10000 });
      return NextResponse.json({ success: true, logs: stdout });
    }
    
    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error: any) {
    console.error('Error executing PM2 action:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
