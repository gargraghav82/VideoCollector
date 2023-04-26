import mongoose from "mongoose";

export const connectdb = async () => {
    const {connection} = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Mongo DB Connected with ${connection.host}`);
}