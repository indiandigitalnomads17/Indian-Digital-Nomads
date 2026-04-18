import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export const validate = (schema: ZodSchema) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          errors: error.issues.map((issue) => ({
            // This safely gets the field name (e.g., 'email')
            field: issue.path[1] || issue.path[0], 
            message: issue.message,
          })),
        });
      }

      return res.status(500).json({ 
        success: false, 
        message: "Internal Server Error" 
      });
    }
  };