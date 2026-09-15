import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  actorEmail: {
    type: String,
    required: false
  },
  actorRole: {
    type: String,
    required: false
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  targetResource: {
    type: String,
    required: true
  },
  targetId: {
    type: String,
    required: false,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

AuditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

export const logAuditEvent = async ({
  req,
  action,
  targetResource,
  targetId,
  metadata = {}
}) => {
  try {
    const actorId = req?.user?._id || req?.user?.id || null;
    const actorEmail = req?.user?.email || 'unauthenticated';
    const actorRole = req?.user?.role || 'anonymous';
    const ipAddress = req?.ip || req?.connection?.remoteAddress || '';

    // Sanitize metadata to never record sensitive fields
    const sanitizedMeta = { ...metadata };
    delete sanitizedMeta.password;
    delete sanitizedMeta.otp;
    delete sanitizedMeta.token;
    delete sanitizedMeta.verificationToken;

    await AuditLog.create({
      actorId,
      actorEmail,
      actorRole,
      action,
      targetResource,
      targetId: targetId ? targetId.toString() : null,
      metadata: sanitizedMeta,
      ipAddress
    });
  } catch (err) {
    // Non-blocking log failure
    console.warn('Failed to record audit event:', err.message);
  }
};

export default AuditLog;
