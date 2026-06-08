# Xycrypt Encryption & Decryption Tool

A secure encryption and decryption tool using advanced multi-step algorithms including Matrix Shifting, Affine Matrix Transformation, and Number Transformation.

## Project Structure

```
xycrypt-app/
├── backend/
│   ├── app.py             # Flask server with encryption/decryption logic
│   └── requirements.txt   # Python dependencies
└── frontend/
    ├── package.json       # React dependencies and scripts
    ├── public/
    │   └── index.html     # Base HTML file
    └── src/
        ├── App.jsx        # Main React component
        ├── index.js       # React entry point
        └── styles.css     # Styles for the application
```

## Technologies Used

- **Backend**: Python with Flask
  - Advanced encryption algorithms
  - RESTful API endpoints

- **Frontend**: React
  - Modern, responsive UI
  - Real-time feedback and validation

## Getting Started

### Setting up the Backend

1. Navigate to the backend directory:
   ```
   cd xycrypt-app/backend
   ```

2. Create a virtual environment (optional):
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Run the Flask server:
   ```
   python app.py
   ```
   The server will start on http://localhost:5000

### Setting up the Frontend

1. Navigate to the frontend directory:
   ```
   cd xycrypt-app/frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```
   The app will open in your browser at http://localhost:3000

## How to Use

1. Enter your encryption key (or use the default one)
2. Type or paste the text you want to encrypt
3. Click "Encrypt" to generate the encrypted text
4. The encrypted text can be copied and decrypted using the same key

## Security Notes

- The encryption key is critical for both encryption and decryption
- The same key must be used for both operations
- The tool uses a three-step encryption process:
  1. Modified Substitution with Shift Encryption (MSSE)
  2. Affine Matrix Transformation (AMT)
  3. Number Transformation (NT)

## License

© 2025 Xycrypt