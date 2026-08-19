require('dotenv').config({ path: './config/config.env' });
const app = require('./config/app');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('✅ Connected to MongoDB');
});

