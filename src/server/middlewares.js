// Custom middlewares for json-server
module.exports = (req, res, next) => {
  // Log requests
  console.log(`${req.method} ${req.originalUrl}`);
  
  // Save database after write operations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    console.log(`Saved database after ${req.method} operation`);
  }
  
  next();
}