import express, { Application, Request, Response } from 'express';
import config from './config';
import { Code } from './enum/code';
import { Status } from './enum/status';
import { errorMiddleware } from './middlewares/error';
import rootRouter from './routes';
import { HttpResponse } from './utils/response';
import { ApolloServer, BaseContext } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import cors from 'cors'
import axios from 'axios';

export class App {
    private readonly app: Application;
    private readonly APPLICATION_RUNNING = 'Application is running on: ';
    private readonly ROUTE_NOT_FOUND = 'Route does not exist on the server'
    private readonly WELCOME_MESSAGE = 'Welcome to the ecommerce API v1.0.0'
    private server: ApolloServer<BaseContext>

    constructor(private readonly port: (string | number) = config.PORT) {
        this.app = express()
        this.server = new ApolloServer({
            // resolvers: {}
            typeDefs: `
                type Todo {
                    id: ID!
                    title: String!
                    completed: Boolean
                    userId: ID!
                    user: User
                }

                type User {
                    id: ID!
                    name: String!
                    email: String!
                    phone: String!
                }

                type Query {
                    getTodos: [Todo]
                    getAllUsers: [User]
                    getUser(id: ID!): User
                }
            `,
            resolvers: {
                Todo: {
                    user: async (todo) => (await axios.get(`https://jsonplaceholder.typicode.com/users/${todo.userId}`)).data
                },
                Query: {
                    getAllUsers: async () => (await axios.get("https://jsonplaceholder.typicode.com/users")).data,
                    getUser: async (parent, { id }) => (await axios.get(`https://jsonplaceholder.typicode.com/users/${id}`)).data,
                    getTodos: async () => (await axios.get("https://jsonplaceholder.typicode.com/todos")).data
                }
            }
        })
    }

    async start(): Promise<void> {
        this.startExpressServer()
        await this.startApolloServer()
        this.middleware()
        this.routes()
        this.app.use(errorMiddleware)
    }

    async startApolloServer(): Promise<void> {
        await this.server.start()
        console.info(`
            🚀 GraphQL Server ready at: http://localhost:${config.PORT}/graphql
            🔐 Mode: ${config.NODE_ENV}
            `
        );
    }

    startExpressServer(): void {
        this.app.listen(this.port)
        console.info(
            `
            🚀 RESTful Server ready at: http://localhost:${config.PORT}`
        );
    }

    private middleware(): void {
        this.app.use(express.json())
        this.app.use(cors())
    }

    private routes(): void {
        this.app.use("/api", rootRouter)
        this.app.use("/graphql", expressMiddleware(this.server))
        this.app.get('/', (_req: Request, res: Response) => res.status(Code.OK).send(new HttpResponse(Code.OK, Status.OK, this.WELCOME_MESSAGE)));
        this.app.all('*', (_req: Request, res: Response) => res.status(Code.NOT_FOUND).send(new HttpResponse(Code.NOT_FOUND, Status.NOT_FOUND, this.ROUTE_NOT_FOUND)));
    }
}