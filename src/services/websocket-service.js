// services/websocket-service.js
class WebSocketService {
    constructor() {
        this.io = null;
        this.userConnections = new Map(); 
        this.socketToUser = new Map(); 
    }

    initialize(io) {
        this.io = io;
        this.setupEventHandlers();
        console.log('[WebSocketService] ✓ WebSocket service initialized');
    }

    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`[WebSocketService] New connection: ${socket.id}`);

            socket.on('register', (userId) => {
                if (!userId) {
                    console.warn(`[WebSocketService] Attempted to register without userId`);
                    return;
                }

                const normalizedUserId = String(userId).trim();
                this.registerUser(normalizedUserId, socket);
                console.log(`[WebSocketService] User ${normalizedUserId} registered (socket: ${socket.id})`);
                socket.emit('registered', { userId: normalizedUserId, success: true });
            });

            socket.on('disconnect', () => {
                this.unregisterUser(socket);
                console.log(`[WebSocketService] Socket ${socket.id} disconnected`);
            });

            socket.on('error', (error) => {
                console.error(`[WebSocketService] Socket error for ${socket.id}:`, error);
            });
        });
    }

    registerUser(userId, socket) {
        if (!this.userConnections.has(userId)) {
            this.userConnections.set(userId, new Set());
        }
        this.userConnections.get(userId).add(socket.id);
        this.socketToUser.set(socket.id, userId);
    }

    unregisterUser(socket) {
        const userId = this.socketToUser.get(socket.id);
        
        if (userId) {
            const userSockets = this.userConnections.get(userId);
            if (userSockets) {
                userSockets.delete(socket.id);

                if (userSockets.size === 0) {
                    this.userConnections.delete(userId);
                }
            }
        }
        
        this.socketToUser.delete(socket.id);
    }

    /**
     * @param {string} userId 
     * @param {string} event 
     * @param {object} data 
     */
    emitToUser(userId, event, data) {
        if (!this.io) {
            console.warn('[WebSocketService] Socket.IO not initialized, cannot emit');
            return false;
        }

        const normalizedUserId = String(userId).trim();
        const userSockets = this.userConnections.get(normalizedUserId);

        if (!userSockets || userSockets.size === 0) {
            console.log(`[WebSocketService] User ${normalizedUserId} not connected, notification will be available on next connection`);
            return false;
        }

        let emittedCount = 0;
        userSockets.forEach(socketId => {
            const socket = this.io.sockets.sockets.get(socketId);
            if (socket && socket.connected) {
                socket.emit(event, data);
                emittedCount++;
            } else {
                userSockets.delete(socketId);
                this.socketToUser.delete(socketId);
            }
        });

        if (emittedCount > 0) {
            console.log(`[WebSocketService] ✓ Emitted '${event}' to user ${normalizedUserId} (${emittedCount} connection(s))`);
        }

        return emittedCount > 0;
    }

    getUserConnectionCount(userId) {
        const normalizedUserId = String(userId).trim();
        const userSockets = this.userConnections.get(normalizedUserId);
        return userSockets ? userSockets.size : 0;
    }

    getTotalConnectedUsers() {
        return this.userConnections.size;
    }

    getTotalConnections() {
        let total = 0;
        this.userConnections.forEach(sockets => {
            total += sockets.size;
        });
        return total;
    }
}

export default new WebSocketService();


