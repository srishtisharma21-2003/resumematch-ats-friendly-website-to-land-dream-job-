import React, { useState } from 'react';
import axios from 'axios';

export default function BulletRewriter() {
  const [original, setOriginal] = useState('');
  const [rewritten, setRewritten] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRewrite = async () => {
    if (!original.trim()) return;
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/resume/rewrite-bullet', 
        { bullet: original },
        { headers: { 'x-auth-token': token } }
      );
      setRewritten(res.data.rewritten);
    } catch (err) {
      setError(err.response?.data?.error || 'Rewrite failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border mt-4">
      <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
        ✍️ AI Bullet Point Rewriter
      </h2>
      <textarea
        className="w-full p-3 border rounded-lg mb-3"
        rows="3"
        placeholder="Paste a weak resume bullet point here…"
        value={original}
        onChange={(e) => setOriginal(e.target.value)}
      />
      <button
        onClick={handleRewrite}
        disabled={loading || !original.trim()}
        className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? 'Rewriting...' : 'Rewrite with AI'}
      </button>
      {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      {rewritten && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="font-semibold">Improved version:</p>
          <p className="italic">{rewritten}</p>
          <button
            onClick={() => navigator.clipboard.writeText(rewritten)}
            className="mt-2 text-sm text-brand-600 underline"
          >
            Copy to clipboard
          </button>
        </div>
      )}
    </div>
  );
}