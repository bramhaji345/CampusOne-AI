const clients = new Set();

export function subscribeEvents(req, res) {
  res.status(200).set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();
  res.write(`event: ready\ndata: ${JSON.stringify({ role: req.user.role })}\n\n`);
  const client = { res, role: req.user.role, userId: req.user.id };
  clients.add(client);
  const heartbeat = setInterval(() => res.write(': keepalive\n\n'), 25000);
  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(client);
  });
}

export function publishEvent(event) {
  const payload = JSON.stringify({ ...event, occurredAt: new Date().toISOString() });
  for (const client of clients) {
    const roleMatch = !event.roles || event.roles.includes(client.role);
    const userMatch = event.userIds?.includes(client.userId) || false;
    if (event.roles || event.userIds) {
      if (!roleMatch && !userMatch) continue;
    }
    client.res.write(`event: campus\ndata: ${payload}\n\n`);
  }
}

export function connectedClients() {
  return clients.size;
}
