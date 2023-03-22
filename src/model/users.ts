import {Schema, model, Types, Document} from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface IUsers extends Document {
    email: string,
    role: "user" | "admin",
    verified: boolean,
    code: string,
    confirmation: string,
    confirmation_expiration: number,
    createdAt: Date,
    correctPassword: (candidatePassword: string, userPassword: string) => Promise<boolean>,
    createVerifyToken: () => {hashToken: string, code: string}
};

const usersSchema = new Schema<IUsers>({
    email:{
        type: String,
        trim: true,
        lowercase: true,
        unique: true
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: "user",
    },
    verified: {
        type: Boolean
    },
    code: {
        type: String,
        select: false,
    },
    confirmation: {
        type: String
    },
    confirmation_expiration:{
        type: Number,
        default: Date.now() + (1 * 60 * 60 * 1000),
    },
    createdAt: {
        type: Date,
        default: new Date
    },
});

//hashing the code
usersSchema.pre('save', async function(next){
    //only run this when password has been modified
    if(!this.code) return next();

    //hash password
    this.code = await bcrypt.hash(this.code, 12);

    next();
});

//check if confirm code matches the encrypted code.
usersSchema.methods.correctPassword = async function(candidateCode: string, userCode: string): Promise<boolean>{
    return bcrypt.compare(candidateCode, userCode)
};

//generate a random token to verify users email
usersSchema.methods.createVerifyToken = function(){
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const hashToken = crypto.createHash('sha256').update(verifyToken).digest('hex');

    const code = Math.floor(100000 + Math.random() * 900000);

    //given to user to verify account
    this.code = code;
    this.confirmation = hashToken;
    
    //link will expire timer in 5min
    this.confirmation_expiration = Date.now() + ( 5 * 60 * 1000);

    this.save();

    return {hashToken, code};

};

export default model<IUsers>('Users', usersSchema);