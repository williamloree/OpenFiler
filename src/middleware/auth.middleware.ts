import { Request, Response, NextFunction } from "express";

const HARD_CODED_TOKEN = "admin123";

export const simpleAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.query.token as string;

  if (!token) {
    res.status(401).send(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Accès Protégé</title>
          <style>
              body { 
                  font-family: Arial, sans-serif; 
                  background: #f5f5f5; 
                  display: flex; 
                  justify-content: center; 
                  align-items: center; 
                  height: 100vh; 
                  margin: 0; 
              }
              .container { 
                  background: white; 
                  padding: 40px; 
                  border-radius: 10px; 
                  box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
                  text-align: center; 
                  max-width: 400px; 
              }
              h1 { color: #333; margin-bottom: 20px; }
              p { color: #666; margin-bottom: 20px; }
              input { 
                  padding: 12px; 
                  border: 2px solid #ddd; 
                  border-radius: 5px; 
                  font-size: 16px; 
                  margin-bottom: 15px; 
              }
              button { 
                  width: 100%; 
                  padding: 12px; 
                  background: #007bff; 
                  color: white; 
                  border: none; 
                  border-radius: 5px; 
                  font-size: 16px; 
                  cursor: pointer; 
              }
              button:hover { background: #0056b3; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>🔒 Accès Protégé</h1>
              <p>Veuillez entrer le token d'accès pour continuer</p>
              <form onsubmit="accessWithToken(event)">
                  <input type="text" id="tokenInput" placeholder="Entrez le token d'accès" required>
                  <button type="submit">Accéder</button>
              </form>
          </div>
          <script>
              function accessWithToken(e) {
                  e.preventDefault();
                  const token = document.getElementById('tokenInput').value;
                  window.location.href = '/?token=' + encodeURIComponent(token);
              }
          </script>
      </body>
      </html>
    `);
    return;
  }

  if (token !== HARD_CODED_TOKEN) {
    res.status(403).send(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Accès Refusé</title>
          <style>
              body { 
                  font-family: Arial, sans-serif; 
                  background: #f5f5f5; 
                  display: flex; 
                  justify-content: center; 
                  align-items: center; 
                  height: 100vh; 
                  margin: 0; 
              }
              .container { 
                  background: white; 
                  padding: 40px; 
                  border-radius: 10px; 
                  box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
                  text-align: center; 
                  max-width: 400px; 
              }
              h1 { color: #dc3545; margin-bottom: 20px; }
              p { color: #666; margin-bottom: 20px; }
              a { 
                  display: inline-block; 
                  padding: 12px 24px; 
                  background: #007bff; 
                  color: white; 
                  text-decoration: none; 
                  border-radius: 5px; 
              }
              a:hover { background: #0056b3; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>❌ Accès Refusé</h1>
              <p>Token d'accès invalide</p>
              <a href="/">Réessayer</a>
          </div>
      </body>
      </html>
    `);
    return;
  }
  next();
};