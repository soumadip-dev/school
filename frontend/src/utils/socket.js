import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token) {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    this.socket = io(BACKEND_URL, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to discussion server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from discussion server');
      this.isConnected = false;
    });

    this.socket.on('error', error => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Socket event handlers for discussion
  onPostCreated(callback) {
    if (this.socket) {
      this.socket.on('post-created', callback);
    }
  }

  onReplyAdded(callback) {
    if (this.socket) {
      this.socket.on('reply-added', callback);
    }
  }

  onReactionUpdated(callback) {
    if (this.socket) {
      this.socket.on('reaction-updated', callback);
    }
  }

  onError(callback) {
    if (this.socket) {
      this.socket.on('error', callback);
    }
  }

  // Socket event emitters
  emitNewPost(postData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('new-post', postData);
    }
  }

  emitNewReply(replyData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('new-reply', replyData);
    }
  }

  emitReaction(reactionData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('reaction', reactionData);
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners('post-created');
      this.socket.removeAllListeners('reply-added');
      this.socket.removeAllListeners('reaction-updated');
      this.socket.removeAllListeners('error');
    }
  }
}

export default new SocketService();
