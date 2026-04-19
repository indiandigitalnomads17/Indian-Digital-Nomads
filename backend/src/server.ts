import dotenv from "dotenv"
import {app} from '../src/app'
import prisma from '../src/config/prisma'
dotenv.config({
    path: './.env'
})

prisma.$connect()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
    console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    })
}).catch((err:any) => {
    console.log("db connection failed !!! ", err);
})










