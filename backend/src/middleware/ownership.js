import mongoose from 'mongoose';

/**
 * Reusable Hospital Scoping Middleware
 * Enforces that hospital_admin / admin users can only access or modify resources
 * belonging to their assigned hospitalId (from authenticated req.user).
 * Superadmins are permitted global access.
 *
 * @param {Object} options
 * @param {'params'|'body'|'query'|'custom'} options.source - Where to find the target hospitalId
 * @param {string} options.key - The parameter name (default: 'id' or 'hospitalId')
 * @param {Function} [options.resolver] - Async custom function (req) => Promise<hospitalId>
 */
export const requireHospitalScope = (options = {}) => {
  const { source = 'params', key = 'id', resolver = null } = options;

  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Superadmin has unrestricted global operational privileges
      if (req.user.role === 'superadmin') {
        return next();
      }

      const userHospitalId = req.user.hospitalId?.toString();
      if (!userHospitalId) {
        return res.status(403).json({ error: 'Access denied. User has no assigned hospital.' });
      }

      let targetHospitalId = null;

      if (resolver && typeof resolver === 'function') {
        targetHospitalId = await resolver(req);
      } else if (source === 'params') {
        targetHospitalId = req.params[key];
      } else if (source === 'body') {
        targetHospitalId = req.body[key];
      } else if (source === 'query') {
        targetHospitalId = req.query[key];
      }

      if (!targetHospitalId) {
        return res.status(400).json({ error: 'Hospital identifier is required for this operation' });
      }

      // If targetHospitalId is an ObjectId or string, normalize and compare
      const normalizedTarget = targetHospitalId.toString();

      if (normalizedTarget !== userHospitalId) {
        return res.status(403).json({
          error: 'Forbidden: You do not have permission to access or modify resources for this hospital.'
        });
      }

      next();
    } catch (error) {
      console.error('Error in requireHospitalScope:', error);
      res.status(500).json({ error: 'Authorization validation failed' });
    }
  };
};
