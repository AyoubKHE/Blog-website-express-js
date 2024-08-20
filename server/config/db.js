const mongoose = require("mongoose");

module.exports = {

    connectDB: async () => {
        try {
            mongoose.set('strictQuery', false);
            const conn = await mongoose.connect(process.env.MONGODB_URI);
            console.log(`Database connected: ${conn.connection.host}`);
        } catch (error) {
            throw error;
        }
    },

    withTransaction: async (fn) => {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            await fn(session);
            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
}