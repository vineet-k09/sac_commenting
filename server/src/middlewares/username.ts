import { Request, Response, NextFunction } from 'express';

export const gcpAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // GCP Cloud Run/IAP injects this header. Format: 'accounts.google.com:user@example.com'
  const gcpUserHeader = req.headers['x-goog-authenticated-user-email'] as string;

  if (gcpUserHeader) {
    req.body.username = gcpUserHeader.split(':').pop(); // Automatically feeds the email into the payload
  }
  next();
};