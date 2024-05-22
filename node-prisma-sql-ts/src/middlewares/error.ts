import { HttpException } from "../exceptions/root";
import { NextFunction, Response, Request } from "express";

export const errorMiddleware = (error: HttpException, req: Request, res: Response, next:NextFunction) => {
    res.status(error.statusCode).json({
        message: error.message,
        errorCode: error.errorCode,
        errors: error.errors
    })
}