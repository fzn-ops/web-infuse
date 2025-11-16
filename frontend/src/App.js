import React, { useState, useEffect } from 'react';
import { Heart, Users, Zap, Gift, Edit3, QrCode, Copy, Check } from 'lucide-react';

// API Base URL - ganti dengan URL backend Anda
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// ========== THEME TEMPLATES ==========
const ThemeTemplates = {
  romantic: {
    bg: 'bg-gradient-to-br from-pink-100 via-rose-50 to-red-100',
    accent: 'text-rose-600',
    icon: Heart,
    pattern: '🌹',
    emojis: ['🌹', '💕', '❤️', '💖', '💝', '💗'],
  },
  friendship: {
    bg: 'bg-gradient-to-br from-yellow-100 via-orange-50 to-amber-100',
    accent: 'text-amber-600',
    icon: Users,
    pattern: '🌟',
    emojis: ['⭐', '🌟', '✨', '💫', '🎉', '🎊'],
  },
  motivation: {
    bg: 'bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100',
    accent: 'text-indigo-600',
    icon: Zap,
    pattern: '⚡',
    emojis: ['⚡', '💪', '🔥', '🚀', '💯', '🏆'],
  },
  general: {
    bg: 'bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100',
    accent: 'text-emerald-600',
    icon: Gift,
    pattern: '🎁',
    emojis: ['🎁', '🎈', '🎉', '🎊', '✨', '💝'],
  },
};

// ========== FALLING ICON COMPONENT ==========
const FallingIcon = ({ emoji, delay, duration, left }) => {
  return (
    <div
      className="absolute text-4xl pointer-events-none animate-fall"
      style={{
        left: `${left}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        top: '-50px',
      }}
    >
      {emoji}
    </div>
  );
};

// ========== INTERACTIVE MESSAGE VIEW ==========
const MessageView = ({ messageData }) => {
  const theme = ThemeTemplates[messageData.theme] || ThemeTemplates.general;
  const IconComponent = theme.icon;
  
  const [clickCount, setClickCount] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shake, setShake] = useState(false);
  const [fallingIcons, setFallingIcons] = useState([]);

  // Sound effects
  const playClickSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKXh8LRgGgU2j9XwyHgrBSh+zPLaizsKGGS56+mjUhELTKXh8LViFQU5kNXwyHcsB');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  };

  const playUnlockSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKXh8LRgGgU2j9XwyHgrBSh+zPLaizsKGGS56+mjUhELTKXh8LViFQU5kNXwyHcsB');
    audio.volume = 0.5;
    audio.play().catch(() => {});
  };

  // Handle click
  const handleClick = () => {
    if (isUnlocked) return;

    playClickSound();
    setShake(true);
    setTimeout(() => setShake(false), 500);

    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount >= 3) {
      // Unlock!
      playUnlockSound();
      setIsUnlocked(true);
      setShowConfetti(true);
      
      // Generate 20 falling icons
      const icons = [];
      for (let i = 0; i < 20; i++) {
        icons.push({
          id: i,
          emoji: theme.emojis[Math.floor(Math.random() * theme.emojis.length)],
          delay: Math.random() * 0.5,
          duration: 2 + Math.random() * 2,
          left: Math.random() * 100,
        });
      }
      setFallingIcons(icons);

      // Increment scan count
      fetch(`${API_URL}/messages/${messageData.id}/scan`, { method: 'PATCH' })
        .catch(err => console.error('Failed to update scan count:', err));

      // Stop confetti after animation
      setTimeout(() => setShowConfetti(false), 4000);
    }
  };

  const remainingClicks = Math.max(0, 3 - clickCount);

  // Locked State
  if (!isUnlocked) {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center p-4 relative overflow-hidden`}>
        <div className="max-w-md w-full text-center">
          {/* Lock Icon with Animation */}
          <div
            onClick={handleClick}
            className={`inline-flex items-center justify-center w-40 h-40 ${theme.bg} rounded-full mb-8 cursor-pointer transition-all duration-300 hover:scale-110 shadow-2xl ${
              shake ? 'animate-shake' : ''
            } ${clickCount > 0 ? 'animate-pulse' : ''}`}
          >
            <IconComponent className={`w-20 h-20 ${theme.accent}`} />
          </div>

          {/* Instructions */}
          <h1 className={`text-4xl font-bold ${theme.accent} mb-4`}>
            Secret Message
          </h1>
          
          {clickCount === 0 ? (
            <p className="text-gray-700 text-lg mb-2">
              Click the icon to reveal your message
            </p>
          ) : (
            <div className="space-y-2">
              <p className={`text-2xl font-bold ${theme.accent} animate-bounce`}>
                {remainingClicks === 0 ? 'Unlocking...' : `${remainingClicks} more click${remainingClicks > 1 ? 's' : ''}!`}
              </p>
              <div className="flex justify-center gap-2 mt-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full transition-all duration-300 ${
                      i < clickCount ? `${theme.accent.replace('text-', 'bg-')}` : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          <p className="text-gray-500 text-sm mt-6">
            Tap the {theme.pattern} icon above
          </p>
        </div>

        {/* Falling Icons */}
        {showConfetti && fallingIcons.map(icon => (
          <FallingIcon
            key={icon.id}
            emoji={icon.emoji}
            delay={icon.delay}
            duration={icon.duration}
            left={icon.left}
          />
        ))}
      </div>
    );
  }

  // Unlocked State - Show Message
  return (
    <div className={`min-h-screen ${theme.bg} flex items-center justify-center p-4 relative overflow-hidden`}>
      {/* Falling Icons Background */}
      {showConfetti && fallingIcons.map(icon => (
        <FallingIcon
          key={icon.id}
          emoji={icon.emoji}
          delay={icon.delay}
          duration={icon.duration}
          left={icon.left}
        />
      ))}

      <div className="max-w-2xl w-full bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12 animate-fadeIn relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-20 h-20 ${theme.bg} rounded-full mb-4 animate-bounce-slow`}>
            <IconComponent className={`w-10 h-10 ${theme.accent}`} />
          </div>
          <h1 className={`text-4xl font-bold ${theme.accent} mb-2`}>
            Secret Message Unlocked!
          </h1>
          <p className="text-gray-600">From someone special</p>
        </div>

        {/* Photo (if exists) */}
        {messageData.photo_url && (
          <div className="mb-6 rounded-2xl overflow-hidden animate-slideUp">
            <img 
              src={messageData.photo_url} 
              alt="Message attachment" 
              className="w-full h-64 object-cover"
            />
          </div>
        )}

        {/* Main Message */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg animate-slideUp" style={{ animationDelay: '0.1s' }}>
          <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
            {messageData.message}
          </p>
        </div>

        {/* Quote (if exists) */}
        {messageData.quote && (
          <div className={`${theme.bg} rounded-2xl p-6 border-l-4 ${theme.accent} border-current animate-slideUp`} style={{ animationDelay: '0.2s' }}>
            <p className={`${theme.accent} italic font-medium`}>
              "{messageData.quote}"
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p className="flex items-center justify-center gap-2">
            <span className="text-2xl">{theme.pattern}</span>
            Made with InfuseSecret
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-10px) rotate(-5deg); }
          75% { transform: translateX(10px) rotate(5deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes bounceSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .animate-fall {
          animation: fall linear forwards;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.5s ease-out forwards;
          opacity: 0;
        }

        .animate-bounce-slow {
          animation: bounceSlow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

// ========== CREATE MESSAGE FORM ==========
const CreateMessageForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    message: '',
    theme: 'romantic',
    photo_url: '',
    quote: '',
  });
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);

  const handleSubmit = async () => {
    if (!formData.message.trim()) {
      alert('Please enter a message');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (response.ok) {
        onSuccess(data);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Failed to create message. Is the backend running?');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selectedTheme = ThemeTemplates[formData.theme];
  const IconComponent = selectedTheme.icon;

  if (preview) {
    return (
      <div className="relative">
        <button
          onClick={() => setPreview(false)}
          className="absolute top-4 right-4 z-10 bg-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-100"
        >
          Back to Edit
        </button>
        <MessageView messageData={{ ...formData, id: 'preview' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Create Secret Message</h1>
          <p className="text-gray-600">Design your personalized message for InfuseSecret</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Theme Selection */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-3">Choose Theme</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(ThemeTemplates).map(([key, theme]) => {
                const ThemeIcon = theme.icon;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData({ ...formData, theme: key })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.theme === key
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <ThemeIcon className={`w-8 h-8 mx-auto mb-2 ${theme.accent}`} />
                    <p className="text-sm font-medium capitalize">{key}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message Input */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Your Secret Message *
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Write your heartfelt message here..."
              className="w-full h-40 p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
            />
            <p className="text-sm text-gray-500 mt-2">{formData.message.length} characters</p>
          </div>

          {/* Photo URL */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Photo URL (Optional)
            </label>
            <input
              type="url"
              value={formData.photo_url}
              onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
              placeholder="https://example.com/photo.jpg"
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Quote */}
          <div className="mb-8">
            <label className="block text-gray-700 font-semibold mb-2">
              Quote (Optional)
            </label>
            <input
              type="text"
              value={formData.quote}
              onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
              placeholder="A meaningful quote..."
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setPreview(true)}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
            >
              Preview
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate QR Code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ========== QR CODE RESULT ==========
const QRResult = ({ result, onCreateNew }) => {
  const [copied, setCopied] = useState({ url: false, key: false });

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [type]: true });
    setTimeout(() => setCopied({ ...copied, [type]: false }), 2000);
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(result.viewUrl)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">QR Code Generated!</h1>
          <p className="text-gray-600">Your secret message is ready</p>
        </div>

        {/* QR Code */}
        <div className="bg-gray-50 rounded-2xl p-8 mb-6 flex justify-center">
          <img src={qrUrl} alt="QR Code" className="w-64 h-64" />
        </div>

        {/* View URL */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">View URL</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={result.viewUrl}
              readOnly
              className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
            />
            <button
              onClick={() => copyToClipboard(result.viewUrl, 'url')}
              className="px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              {copied.url ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Edit Key */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Edit Key (Save this!)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={result.editKey}
              readOnly
              className="flex-1 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm font-mono"
            />
            <button
              onClick={() => copyToClipboard(result.editKey, 'key')}
              className="px-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
            >
              {copied.key ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-sm text-yellow-700 mt-2">⚠️ Keep this safe! You need it to edit the message.</p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <a
            href={qrUrl}
            download="infusesecret-qr.png"
            className="block w-full bg-purple-600 text-white text-center py-3 rounded-xl font-semibold hover:bg-purple-700 transition"
          >
            Download QR Code
          </a>
          <button
            onClick={onCreateNew}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
          >
            Create Another Message
          </button>
        </div>
      </div>
    </div>
  );
};

// ========== EDIT MESSAGE ==========
const EditMessage = () => {
  const [editKey, setEditKey] = useState('');
  const [messageData, setMessageData] = useState(null);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchMessage = async () => {
    if (!editKey.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/messages/edit/${editKey}`);
      const data = await response.json();
      
      if (response.ok) {
        setMessageData(data);
        setFormData({
          message: data.message,
          photo_url: data.photo_url || '',
          quote: data.quote || '',
        });
      } else {
        alert('Invalid edit key');
      }
    } catch (error) {
      alert('Failed to fetch message');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!formData.message.trim()) {
      alert('Message cannot be empty');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/messages/${messageData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, editKey }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert('Failed to update message');
      }
    } catch (error) {
      alert('Update failed');
    } finally {
      setLoading(false);
    }
  };

  if (!messageData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center mb-6">
            <Edit3 className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Edit Message</h1>
            <p className="text-gray-600">Enter your edit key to modify your message</p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              value={editKey}
              onChange={(e) => setEditKey(e.target.value)}
              placeholder="Enter your edit key"
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={fetchMessage}
              disabled={loading || !editKey.trim()}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load Message'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Your Message</h2>
          
          {success && (
            <div className="mb-6 p-4 bg-green-100 border border-green-200 rounded-xl text-green-700">
              ✓ Message updated successfully!
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Message *</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full h-40 p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Photo URL</label>
              <input
                type="url"
                value={formData.photo_url}
                onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Quote</label>
              <input
                type="text"
                value={formData.quote}
                onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setMessageData(null);
                  setFormData(null);
                  setEditKey('');
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ========== MAIN APP ==========
export default function App() {
  const [page, setPage] = useState('home');
  const [messageId, setMessageId] = useState(null);
  const [qrResult, setQrResult] = useState(null);
  const [messageData, setMessageData] = useState(null);

  // Detect if viewing a message (simulate routing)
  useEffect(() => {
    const path = window.location.hash.slice(1);
    if (path.startsWith('/view/')) {
      const id = path.split('/')[2];
      setMessageId(id);
      setPage('view');
    } else if (path === '/create') {
      setPage('create');
    } else if (path === '/edit') {
      setPage('edit');
    } else {
      setPage('home');
    }
  }, []);

  // Fetch message data for view page
  useEffect(() => {
    if (page === 'view' && messageId) {
      fetch(`${API_URL}/messages/${messageId}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            alert('Message not found');
            setPage('home');
          } else {
            setMessageData(data);
          }
        })
        .catch(() => {
          alert('Failed to load message');
          setPage('home');
        });
    }
  }, [page, messageId]);

  // PAGES
  if (page === 'view' && messageData) {
    return <MessageView messageData={messageData} />;
  }

  if (page === 'view' && !messageData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading message...</p>
        </div>
      </div>
    );
  }

  if (page === 'create' && !qrResult) {
    return (
      <CreateMessageForm 
        onSuccess={(result) => setQrResult(result)} 
      />
    );
  }

  if (page === 'create' && qrResult) {
    return (
      <QRResult 
        result={qrResult} 
        onCreateNew={() => {
          setQrResult(null);
          window.location.hash = '#/create';
        }} 
      />
    );
  }

  if (page === 'edit') {
    return <EditMessage />;
  }

  // HOME PAGE
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-800 mb-4">
            Infuse<span className="text-purple-600">Secret</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Healthy drink with a touch of digital magic ✨
          </p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Send personalized secret messages through QR codes on premium infused water bottles
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <button
            onClick={() => {
              window.location.hash = '#/create';
              setPage('create');
              setQrResult(null);
            }}
            className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
          >
            <QrCode className="w-12 h-12 text-purple-600 mb-4 mx-auto" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Create Message</h3>
            <p className="text-gray-600">Generate a QR code with your secret message</p>
          </button>

          <button
            onClick={() => {
              const id = prompt('Enter message ID from QR code:');
              if (id) {
                window.location.hash = `#/view/${id}`;
                setMessageId(id);
                setPage('view');
              }
            }}
            className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
          >
            <Heart className="w-12 h-12 text-pink-600 mb-4 mx-auto" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">View Message</h3>
            <p className="text-gray-600">Scan QR or enter ID to reveal the secret</p>
          </button>

          <button
            onClick={() => {
              window.location.hash = '#/edit';
              setPage('edit');
            }}
            className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
          >
            <Edit3 className="w-12 h-12 text-blue-600 mb-4 mx-auto" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Edit Message</h3>
            <p className="text-gray-600">Update your message anytime with edit key</p>
          </button>
        </div>

        {/* Features */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Why InfuseSecret?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { icon: '💝', title: 'Personalized', desc: 'Custom messages for every occasion' },
              { icon: '🎨', title: '4 Themes', desc: 'Romantic, Friendship, Motivation, General' },
              { icon: '📱', title: 'Digital', desc: 'Scan QR code anytime, anywhere' },
              { icon: '✏️', title: 'Editable', desc: 'Update your message even after sending' },
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-4 bg-white/60 backdrop-blur-sm rounded-xl p-6">
                <div className="text-4xl">{feature.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">{feature.title}</h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-gray-600">
        <p>© 2024 InfuseSecret • Healthy Drink + Digital Magic</p>
      </div>
    </div>
  );
}