const { initializeDatabase, getQuery } = require('./config/database');

// Initialize the database first
initializeDatabase().then(async () => {
  console.log('Database initialized. Checking schema...');

  try {
    // Check if users table exists and show its structure
    console.log('Checking for users table...');
    const usersTable = await getQuery(
      `SELECT TABLE_NAME as name 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`, 
      [process.env.DB_NAME || 'crossover_helpdesk']
    );
    
    console.log('Users table query result:', usersTable);
    
    // Check if we got a result (could be an object or array)
    const hasUsersTable = usersTable && 
                         ((Array.isArray(usersTable) && usersTable.length > 0) || 
                          (typeof usersTable === 'object' && usersTable.name === 'users'));
    
    if (!hasUsersTable) {
      console.error('Error: users table does not exist');
      process.exit(1);
    }
    
    console.log('✅ Users table exists');
    
    // Show table structure
    console.log('\n🔍 Fetching table structure...');
    const columnsResult = await getQuery(
      `SELECT COLUMN_NAME as name, DATA_TYPE as type, 
              IS_NULLABLE as notnull, COLUMN_DEFAULT as dflt_value 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`,
      [process.env.DB_NAME || 'crossover_helpdesk']
    );
    
    console.log('Table structure query result:', columnsResult);
    
    // Handle different result formats (single object or array of objects)
    let columns = [];
    if (Array.isArray(columnsResult)) {
      columns = columnsResult;
    } else if (columnsResult && typeof columnsResult === 'object') {
      // If it's a single column object, wrap it in an array
      columns = [columnsResult];
    }
    
    console.log('\n📋 Users table structure:');
    if (columns.length > 0) {
      console.table(columns);
    } else {
      console.log('No columns found in users table');
    }
    
    // Check if we have any users
    console.log('\n🔢 Counting users...');
    const userCountResult = await getQuery("SELECT COUNT(*) as count FROM users");
    console.log('User count query result:', userCountResult);
    
    // Handle different result formats
    let userCount = 0;
    if (userCountResult) {
      if (Array.isArray(userCountResult) && userCountResult.length > 0) {
        userCount = userCountResult[0].count || 0;
      } else if (typeof userCountResult === 'object' && 'count' in userCountResult) {
        userCount = userCountResult.count || 0;
      }
    }
    
    if (userCount === 0) {
      console.log('No users found in the database');
    }
    console.log(`\n👥 Total users: ${userCount}`);
    
    if (userCount > 0) {
      console.log('\n👤 First user:');
      const firstUserResult = await getQuery("SELECT id, name, email, role FROM users LIMIT 1");
      
      // Handle different result formats
      if (firstUserResult) {
        if (Array.isArray(firstUserResult) && firstUserResult.length > 0) {
          console.table([firstUserResult[0]]);
        } else if (typeof firstUserResult === 'object') {
          console.table([firstUserResult]);
        } else {
          console.log('Unexpected user data format:', firstUserResult);
        }
      } else {
        console.log('No user data returned');
      }
    } else {
      console.log('No users found in the database.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking database:', error);
    process.exit(1);
  }
}).catch(error => {
  console.error('Failed to initialize database:', error);
  console.error('Uncaught exception:', err);
  process.exit(1);
});
