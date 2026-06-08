# app.py - Flask server to handle Xycrypt operations
from flask import Flask, request, jsonify
from flask_cors import CORS
import hashlib
import math
import numpy as np
import sympy
from typing import List, Dict, Tuple
import time
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

class Xycrypt:
    def __init__(self, key: str):
        self.key = key
        self.perm_cache = {}
        self.matrix_cache = {}

    def expand_key(self, length: int) -> List[int]:
        return [
            int.from_bytes(hashlib.sha256((self.key + str(i+1)).encode()).digest(), 'big') % 256
            for i in range(length)
        ]

    def generate_shift_vector(self, length: int) -> List[int]:
        key_int = int.from_bytes(self.key.encode(), 'big') % 256
        return [(key_int + (i+1)) % 256 for i in range(length)]

    def generate_mappings(self, length: int, K: List[int]) -> List[Dict[int, int]]:
        mappings = []
        for i in range(length):
            mapping = {}
            for x in range(256):
                y = (x + K[i]) % 256
                mapping[x] = y
            mappings.append(mapping)
        return mappings

    def msse_encrypt(self, plaintext: str, K: List[int], S: List[int], mappings: List[Dict[int, int]]) -> List[int]:
        return [(mappings[j][ord(ch)] + S[j]) % 256 for j, ch in enumerate(plaintext)]

    def msse_decrypt(self, P1: List[int], K: List[int], S: List[int], mappings: List[Dict[int, int]]) -> List[int]:
        inverse_mappings = [{v: k for k, v in mapping.items()} for mapping in mappings]
        return [inverse_mappings[j][(ch - S[j]) % 256] for j, ch in enumerate(P1)]

    def _generate_invertible_matrix(self, size: int) -> np.ndarray:
        while True:
            matrix = np.random.randint(1, 256, (size, size), dtype=np.int64)
            try:
                if sympy.Matrix(matrix.tolist()).inv_mod(256):
                    return matrix
            except:
                continue

    def amt_encrypt(self, P1: List[int], n: int, K: List[int]) -> Tuple[List[int], np.ndarray]:
        MK = self._generate_invertible_matrix(n)
        T = np.dot(np.array(P1, dtype=np.int64), MK) % 256
        return T.tolist(), MK

    def amt_decrypt(self, P2: List[int], n: int, MK: np.ndarray) -> List[int]:
        MK_inv = sympy.Matrix(MK.tolist()).inv_mod(256)
        return (np.dot(P2, np.array(MK_inv.tolist(), dtype=np.int64)) % 256).tolist()

    def nt_encrypt(self, P2: List[int], K: List[int]) -> List[int]:
        return [(ch + K[j % len(K)]) % 256 for j, ch in enumerate(P2)]

    def nt_decrypt(self, C: List[int], K: List[int]) -> List[int]:
        return [(ch - K[j % len(K)]) % 256 for j, ch in enumerate(C)]

    def encrypt(self, plaintext: str) -> Tuple[str, int, list]:
        length = len(plaintext)
        K = self.expand_key(length)
        S = self.generate_shift_vector(length)
        mappings = self.generate_mappings(length, K)
        P1 = self.msse_encrypt(plaintext, K, S, mappings)
        P2, MK = self.amt_encrypt(P1, length, K)
        ciphertext = self.nt_encrypt(P2, K)
        return ''.join(chr(num) for num in ciphertext), length, MK.tolist()

    def decrypt(self, ciphertext: str, original_len: int, MK: list) -> str:
        MK = np.array(MK)
        K = self.expand_key(original_len)
        S = self.generate_shift_vector(original_len)
        mappings = self.generate_mappings(original_len, K)
        P2 = self.nt_decrypt([ord(ch) for ch in ciphertext], K)
        P1 = self.amt_decrypt(P2, original_len, MK)
        plaintext_nums = self.msse_decrypt(P1, K, S, mappings)
        return ''.join(chr(num) for num in plaintext_nums)

# Encryption endpoint
@app.route('/encrypt', methods=['POST'])
def encrypt():
    try:
        data = request.get_json()
        key = data.get('key', '')
        plaintext = data.get('plaintext', '')
        
        # Add artificial delay for longer texts to simulate computation time
        if len(plaintext) > 5:
            time.sleep(1)  # Simulating longer computation for demonstration
        
        # Initialize Xycrypt with the provided key
        xy = Xycrypt(key)
        
        # Perform encryption
        ciphertext, length, MK = xy.encrypt(plaintext)
        
        return jsonify({
            'status': 'success',
            'ciphertext': ciphertext,
            'length': length,
            'MK': MK
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400

# Decryption endpoint
@app.route('/decrypt', methods=['POST'])
def decrypt():
    try:
        data = request.get_json()
        key = data.get('key', '')
        ciphertext = data.get('ciphertext', '')
        length = data.get('length', len(ciphertext))
        MK = data.get('MK', [])
        
        # Add artificial delay for longer texts to simulate computation time
        if len(ciphertext) > 5:
            time.sleep(1)  # Simulating longer computation for demonstration
        
        # Initialize Xycrypt with the provided key
        xy = Xycrypt(key)
        
        # Perform decryption
        plaintext = xy.decrypt(ciphertext, length, MK)
        
        return jsonify({
            'status': 'success',
            'plaintext': plaintext
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)