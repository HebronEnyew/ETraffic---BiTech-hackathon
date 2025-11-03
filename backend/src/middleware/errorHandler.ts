import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);
  console.error('Error stack:', err.stack);
  console.error('Request URL:', req.url);
  console.error('Request method:', req.method);

  // Get status code - check multiple sources
  let statusCode = (err as any).statusCode || (err as any).status || 500;
  let message = err.message || 'Internal server error';

  // Provide more detailed error messages for common database errors
  if ((err as any).code === 'ER_DUP_ENTRY') {
    message = 'Duplicate entry. This email or username may already be registered.';
    statusCode = 400;
  } else if ((err as any).code === 'ER_NO_SUCH_TABLE' || (err as any).code === 'ER_BAD_FIELD_ERROR') {
    message = 'Database schema error. Please contact support.';
    console.error('Database schema error details:', (err as any).code, (err as any).sqlMessage);
  } else if ((err as any).code === 'ECONNREFUSED' || (err as any).code === 'ETIMEDOUT') {
    message = 'Database connection error. Please try again later.';
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: {
        code: (err as any).code,
        sqlMessage: (err as any).sqlMessage,
      }
    }),
  });
};

