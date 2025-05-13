// authUtils.js
export const checkTokenExpiration = (token) => {
    if (!token) return false;
    
    try {
      // Decode the token
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Check if token has an expiration date and is expired
      if (payload.exp) {
        const expirationDate = new Date(payload.exp * 1000);
        return expirationDate > new Date();
      }
      
      // If no expiration in token, it's still valid
      return true;
    } catch (err) {
      console.error('Error checking token expiration:', err);
      return false;
    }
  };