import { NextFunction, Request, Response } from "express"
import { prisma } from "../../prisma"
import { compareSync, hashSync } from 'bcrypt'
import * as jwt from 'jsonwebtoken'
import config from "../config"
import { BadRequestException } from "../exceptions/bad-requests"
import { ErrorCodes } from "../exceptions/root"

export const signup = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, name } = req.body
    console.log(email);
    
    let user = await prisma.user.findFirst({ where: { email } })
    console.log(user);
    
    if (user) {
        return next(new BadRequestException("User already exists!", ErrorCodes.USER_ALREADY_EXIST))
    }
    user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashSync(password, 10)
        }
    })
    res.json(user).status(201).end()
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body

    let user = await prisma.user.findFirst({ where: { email } })

    if (!user) {
        return next(new BadRequestException("User does not exists!", ErrorCodes.USER_NOT_FOUND))
    }
    if (!compareSync(password, user.password)) {
        return next(new BadRequestException("Incorrect password!", ErrorCodes.INCORRECT_PASSWORD))
    }

    const token = jwt.sign({
        userId: user.id
    }, config.JWT_SECRET)

    res.json({ user, token }).status(200)
}