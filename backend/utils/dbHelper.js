// Helper function to handle database operations with error handling
const handleDbOperation = async (operation, res, errorMessage = 'Server error') => {
  try {
    // Check if mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      console.warn('MongoDB is not connected. Operation may fail.');
    }
    
    // Wrap the operation in a timeout to prevent hanging requests
    const result = await Promise.race([
      operation(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database operation timed out')), 5000)
      )
    ]);
    
    return { success: true, data: result };
  } catch (err) {
    console.error(`${errorMessage}:`, err);
    res.status(500).json({ error: errorMessage });
    return { success: false };
  }
};

// Export the helper function
module.exports = { handleDbOperation };
