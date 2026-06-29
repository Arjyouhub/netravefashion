import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://netrave_db_user:ONtbTuPCCeFRbp1n@cluster0.pkbzxav.mongodb.net/netravestore?retryWrites=true&w=majority&appName=Cluster0";

async function check() {
    try {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected!');

        // Query settings
        const settingsDb = mongoose.connection.db.collection('settings');
        const settingsList = await settingsDb.find({}).toArray();
        console.log('\n--- SETTINGS COLLECTION ---');
        console.log(settingsList);

        // Query login logs
        const logsDb = mongoose.connection.db.collection('loginlogs');
        const logsList = await logsDb.find({}).toArray();
        console.log('\n--- LOGIN LOGS COLLECTION ---');
        console.log('Count:', logsList.length);
        console.log(logsList.slice(0, 10));

        // Query users
        const usersDb = mongoose.connection.db.collection('users');
        const usersList = await usersDb.find({}).toArray();
        console.log('\n--- USERS COLLECTION ---');
        console.log('Count:', usersList.length);
        console.log(usersList);

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}
check();
