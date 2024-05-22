import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const config = {
    PORT: process.env.PORT!,
    JWT_SECRET: process.env.JWT_SECRET!,
    NODE_ENV: process.env.NODE_ENV
}

export default config