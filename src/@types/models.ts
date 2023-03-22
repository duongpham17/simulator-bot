import { Request } from 'express';
import { IUsers } from '../model/users'

export interface InjectUserToRequest extends Request {
    user: IUsers // or any other type
}