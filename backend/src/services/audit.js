import { prisma } from '../config/prisma.js';

export function audit(tx, req, { action, entity, entityId = null, oldValue = null, newValue = null }) {
  return tx.auditLog.create({
    data: {
      userId: req.user?.id || null,
      action,
      entity,
      entityId: entityId == null ? null : String(entityId),
      oldValue: oldValue == null ? undefined : oldValue,
      newValue: newValue == null ? undefined : newValue,
      requestInfo: `${req.ip || ''} ${typeof req.get === 'function' ? req.get('user-agent') : req.headers?.['user-agent'] || ''}`.trim().slice(0, 1000) || null,
    },
  });
}

export async function writeAudit(req, entry) {
  return audit(prisma, req, entry);
}
