import * as dotenv from 'dotenv';
dotenv.config({path: process.cwd() + '/config.env'});

import database from './database';
import bot from './bot';

database();

bot();